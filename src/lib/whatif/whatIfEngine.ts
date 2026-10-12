/**
 * Deterministic What-If Engine
 * Pure functions — no AI, no side effects.
 * Predicts impact of proposed actions based on historical ratios.
 */

export interface WhatIfInput {
  actionType: 'allocate_budget' | 'add_staff' | 'close_road' | 'launch_program';
  params: {
    amount?: number;       // budget in millions
    staffCount?: number;
    targetDepartment?: string;
    duration?: number;     // days
  };
  currentStats: {
    activeIncidents: number;
    overdueIncidents: number;
    overdueTasks: number;
    highRiskProjects: number;
    complaintsCount: number;
  };
}

export interface WhatIfOutput {
  predictedIncidentDelta: number;
  predictedComplaintDelta: number;
  predictedRiskDelta: number;
  predictedResolutionTimeDelta: number; // hours
  confidenceLevel: 'low' | 'medium' | 'high';
  explanation: string;
}

const ACTION_COEFFICIENTS = {
  allocate_budget: {
    incidentReduction: -0.15,   // per 1M allocated
    complaintReduction: -0.40,
    riskReduction: -0.10,
    resolutionSpeedup: -4,      // hours per 1M
  },
  add_staff: {
    incidentReduction: -0.08,   // per person
    complaintReduction: -0.05,
    riskReduction: -0.05,
    resolutionSpeedup: -2,
  },
  close_road: {
    incidentReduction: -0.30,   // road incidents
    complaintReduction: 0.20,   // complaints increase
    riskReduction: -0.15,
    resolutionSpeedup: 0,
  },
  launch_program: {
    incidentReduction: -0.05,
    complaintReduction: -0.25,
    riskReduction: -0.20,
    resolutionSpeedup: -1,
  },
};

export function calculateWhatIf(input: WhatIfInput): WhatIfOutput {
  const coeff = ACTION_COEFFICIENTS[input.actionType];
  const multiplier = input.params.amount ?? input.params.staffCount ?? 1;
  const stats = input.currentStats;

  const incidentDelta = Math.round(stats.activeIncidents * coeff.incidentReduction * multiplier);
  const complaintDelta = Math.round(stats.complaintsCount * coeff.complaintReduction * multiplier);
  const riskDelta = Math.round(stats.highRiskProjects * coeff.riskReduction * multiplier);
  const resolutionDelta = Math.round(coeff.resolutionSpeedup * multiplier);

  // Confidence based on data availability
  const dataPoints = [stats.activeIncidents, stats.overdueTasks, stats.complaintsCount].filter(v => v > 0).length;
  const confidence: 'low' | 'medium' | 'high' = dataPoints >= 3 ? 'high' : dataPoints >= 2 ? 'medium' : 'low';

  const actionLabels: Record<string, string> = {
    allocate_budget: `выделении ${multiplier} млн ₽`,
    add_staff: `добавлении ${multiplier} сотрудников`,
    close_road: 'закрытии дорожного участка',
    launch_program: 'запуске программы',
  };

  const parts: string[] = [];
  if (incidentDelta !== 0) parts.push(`инциденты: ${incidentDelta > 0 ? '+' : ''}${incidentDelta}`);
  if (complaintDelta !== 0) parts.push(`жалобы: ${complaintDelta > 0 ? '+' : ''}${complaintDelta}`);
  if (riskDelta !== 0) parts.push(`проекты в зоне риска: ${riskDelta > 0 ? '+' : ''}${riskDelta}`);
  if (resolutionDelta !== 0) parts.push(`время решения: ${resolutionDelta > 0 ? '+' : ''}${resolutionDelta}ч`);

  return {
    predictedIncidentDelta: incidentDelta,
    predictedComplaintDelta: complaintDelta,
    predictedRiskDelta: riskDelta,
    predictedResolutionTimeDelta: resolutionDelta,
    confidenceLevel: confidence,
    explanation: `При ${actionLabels[input.actionType]}: ${parts.join(', ')}.`,
  };
}
