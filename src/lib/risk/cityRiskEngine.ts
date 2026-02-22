/**
 * City Risk Engine — deterministic risk index calculation.
 * Risk is computed BEFORE AI, AI only interprets it.
 */

export interface RiskInput {
  criticalIncidents: number;
  overdueTasks: number;
  highRiskProjects: number;
  trendFactor: number; // -1..1 (negative = improving, positive = worsening)
}

export interface RiskResult {
  index: number;         // 0–100
  level: 'low' | 'moderate' | 'elevated' | 'critical';
  label: string;
}

export function calculateCityRiskIndex(input: RiskInput): RiskResult {
  const raw =
    (input.criticalIncidents * 0.4) +
    (input.overdueTasks * 0.3) +
    (input.highRiskProjects * 0.2) +
    (input.trendFactor * 10 * 0.1); // normalize trend to ~0-10 range

  const index = Math.min(Math.round(Math.max(raw, 0)), 100);

  let level: RiskResult['level'];
  let label: string;

  if (index <= 15) {
    level = 'low';
    label = 'Низкий риск';
  } else if (index <= 40) {
    level = 'moderate';
    label = 'Умеренный риск';
  } else if (index <= 70) {
    level = 'elevated';
    label = 'Повышенный риск';
  } else {
    level = 'critical';
    label = 'Критический риск';
  }

  return { index, level, label };
}
