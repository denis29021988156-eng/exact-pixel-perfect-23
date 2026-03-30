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
}

export async function aggregateCityData(): Promise<CityAIContext> {
  const [incRes, taskRes, projRes, escRes, compRes, budgetRes] = await Promise.all([
    supabase.from('incidents').select('*').neq('status', 'closed'),
    supabase.from('tasks').select('*').neq('status', 'completed'),
    supabase.from('projects').select('*'),
    supabase.from('escalations').select('id').eq('status', 'active' as any),
    supabase.from('public_complaints').select('topic'),
    supabase.from('contracts').select('id, risk_of_non_execution').gt('risk_of_non_execution', 50),
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
  };
}
