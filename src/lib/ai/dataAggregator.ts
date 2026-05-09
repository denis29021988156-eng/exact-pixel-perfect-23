/**
 * Data Aggregation Layer — единый JSON-контекст для LLM.
 * LLM получает ТОЛЬКО агрегированные данные, никаких сырых SQL-результатов.
 */

import { supabase } from '@/integrations/supabase/client';
import { calculateCityRiskIndex, type RiskResult } from '@/lib/risk/cityRiskEngine';

export interface CityAIContext {
  timestamp: string;
  cityRiskIndex: number;
  riskLevel: string;
  riskLabel: string;
  criticalIncidents: number;
  activeIncidents: number;
  overdueIncidents: number;
  overdueTasks: number;
  activeTasks: number;
  highRiskProjects: number;
  totalProjects: number;
  departmentsAtRisk: string[];
  trend: {
    incidentsDelta: number;
    overdueDelta: number;
  };
  // Phase 1
  activeEscalations: number;
  // Phase 2
  complaintsCount: number;
  topComplaintTopics: string[];
  complaintDivergence: number;
  budgetRiskContracts: number;
  // Phase 3 — reputation
  mentionsCount: number;
  negativeMentions: number;
  positiveMentions: number;
  topReputationTopics: string[];
}

export async function aggregateCityData(opts?: { departmentScope?: string | null }): Promise<CityAIContext> {
  const dept = opts?.departmentScope || null;
  const incQ = supabase.from('incidents').select('*').neq('status', 'closed');
  const taskQ = supabase.from('tasks').select('*').neq('status', 'completed');
  const projQ = supabase.from('projects').select('*');
  const budgetQ = supabase.from('contracts').select('id, risk_of_non_execution, department').gt('risk_of_non_execution', 50);
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const [incRes, taskRes, projRes, escRes, compRes, budgetRes, mentionsRes] = await Promise.all([
    dept ? incQ.eq('department', dept) : incQ,
    dept ? taskQ.eq('department', dept) : taskQ,
    dept ? projQ.eq('department', dept) : projQ,
    supabase.from('escalations').select('id').eq('status', 'active' as any),
    supabase.from('public_complaints').select('topic'),
    dept ? budgetQ.eq('department', dept) : budgetQ,
    supabase.from('media_mentions').select('topic, sentiment').gte('published_at', since),
  ]);

  const incidents = incRes.data || [];
  const tasks = taskRes.data || [];
  const projects = projRes.data || [];

  const criticalIncidents = incidents.filter(i => i.severity === 'high').length;
  const overdueIncidents = incidents.filter(i => i.sla_overdue).length;
  const overdueTasks = tasks.filter(t => t.overdue).length;
  const highRiskProjects = projects.filter(p => p.status === 'risk' || p.status === 'overdue').length;

  // Trend: simple heuristic based on ratio of overdue to total
  const overdueRatio = incidents.length > 0 ? overdueIncidents / incidents.length : 0;
  const trendFactor = overdueRatio > 0.3 ? 1 : overdueRatio > 0.1 ? 0.5 : 0;

  const risk: RiskResult = calculateCityRiskIndex({
    criticalIncidents,
    overdueTasks,
    highRiskProjects,
    trendFactor,
  });

  // Departments with critical/overdue incidents
  const deptSet = new Set<string>();
  incidents.forEach(i => {
    if ((i.severity === 'high' || i.sla_overdue) && i.department) {
      deptSet.add(i.department);
    }
  });

  // Complaint topics
  const topicCounts: Record<string, number> = {};
  (compRes.data || []).forEach((c: any) => {
    topicCounts[c.topic] = (topicCounts[c.topic] || 0) + 1;
  });
  const topTopics = Object.entries(topicCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([t]) => t);

  const complaintsCount = compRes.data?.length || 0;
  const complaintDivergence = complaintsCount > 0 && incidents.length > 0
    ? Math.round(Math.abs(complaintsCount - incidents.length) / Math.max(complaintsCount, incidents.length) * 100)
    : 0;

  const mentions = mentionsRes.data || [];
  const negativeMentions = mentions.filter((m: any) => m.sentiment === 'negative').length;
  const positiveMentions = mentions.filter((m: any) => m.sentiment === 'positive').length;
  const reputationTopicCounts: Record<string, number> = {};
  mentions.forEach((m: any) => {
    if (m.topic) reputationTopicCounts[m.topic] = (reputationTopicCounts[m.topic] || 0) + 1;
  });
  const topReputationTopics = Object.entries(reputationTopicCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([t]) => t);

  return {
    timestamp: new Date().toISOString(),
    cityRiskIndex: risk.index,
    riskLevel: risk.level,
    riskLabel: risk.label,
    criticalIncidents,
    activeIncidents: incidents.length,
    overdueIncidents,
    overdueTasks,
    activeTasks: tasks.length,
    highRiskProjects,
    totalProjects: projects.length,
    departmentsAtRisk: Array.from(deptSet),
    trend: {
      incidentsDelta: trendFactor > 0.5 ? 1 : 0,
      overdueDelta: overdueTasks > 5 ? 1 : 0,
    },
    activeEscalations: escRes.data?.length || 0,
    complaintsCount,
    topComplaintTopics: topTopics,
    complaintDivergence,
    budgetRiskContracts: budgetRes.data?.length || 0,
    mentionsCount: mentions.length,
    negativeMentions,
    positiveMentions,
    topReputationTopics,
  };
}
