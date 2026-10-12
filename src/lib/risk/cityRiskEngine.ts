/**
 * City Risk Engine — deterministic risk index calculation.
 * Risk is computed BEFORE AI, AI only interprets it.
 *
 * Normalized formula (v2): each component is a saturated share of its total,
 * weighted, and combined into a 0–100 index.
 */

export interface RiskInput {
  criticalIncidents: number;
  overdueTasks: number;
  highRiskProjects: number;
  trendFactor: number; // -1..1 (negative = improving, positive = worsening)
  totalIncidents: number;
  totalTasks: number;
  totalProjects: number;
}

export type RiskLevel = 'low' | 'moderate' | 'elevated' | 'critical';

export interface RiskResult {
  index: number;         // 0–100
  level: RiskLevel;
  label: string;
}

// Saturation targets — share of total at which the component is fully "hot" (=100).
const TARGET_CRITICAL = 0.30;
const TARGET_OVERDUE_TASKS = 0.40;
const TARGET_RISK_PROJECTS = 0.30;

function component(part: number, total: number, target: number): number {
  if (!total || total <= 0) return 0;
  const ratio = part / total;
  return Math.min(ratio / target, 1) * 100;
}

export function riskLevel(index: number): { level: RiskLevel; label: string } {
  if (index <= 15) return { level: 'low', label: 'Низкий риск' };
  if (index <= 40) return { level: 'moderate', label: 'Умеренный риск' };
  if (index <= 70) return { level: 'elevated', label: 'Повышенный риск' };
  return { level: 'critical', label: 'Критический риск' };
}

export function calculateCityRiskIndex(input: RiskInput): RiskResult {
  const critComp = component(input.criticalIncidents, input.totalIncidents, TARGET_CRITICAL);
  const taskComp = component(input.overdueTasks, input.totalTasks, TARGET_OVERDUE_TASKS);
  const projComp = component(input.highRiskProjects, input.totalProjects, TARGET_RISK_PROJECTS);
  const trendComp = Math.max(0, input.trendFactor) * 100;

  const raw = critComp * 0.4 + taskComp * 0.3 + projComp * 0.2 + trendComp * 0.1;
  const index = Math.max(0, Math.min(100, Math.round(raw)));

  const { level, label } = riskLevel(index);
  return { index, level, label };
}
