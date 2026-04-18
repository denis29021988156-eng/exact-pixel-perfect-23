/**
 * Normalization Engine — детерминированный слой между сырыми данными и БД.
 * Никакого AI: только словари, regex и эвристики.
 */

export type IncidentType = 'housing' | 'road' | 'social' | 'ecology' | 'transport' | 'other';
export type IncidentSeverity = 'low' | 'medium' | 'high';

const TYPE_DICT: Record<IncidentType, string[]> = {
  housing: ['жкх', 'труб', 'отопл', 'вода', 'канализац', 'подъезд', 'крыш', 'лифт', 'дом', 'квартир'],
  road: ['дорог', 'ям', 'асфальт', 'тротуар', 'разметк', 'светофор', 'знак'],
  social: ['школ', 'сад', 'больниц', 'поликлин', 'соцзащ', 'пенсион'],
  ecology: ['мусор', 'свалк', 'воздух', 'дым', 'запах', 'вода', 'река', 'парк'],
  transport: ['автобус', 'трамвай', 'маршрут', 'остановк', 'пробк', 'парковк'],
  other: [],
};

const SEVERITY_KEYWORDS: Record<IncidentSeverity, string[]> = {
  high: ['авари', 'прорыв', 'утечк', 'пожар', 'смерт', 'обруш', 'критич', 'срочн', 'опасн'],
  medium: ['жалоб', 'проблем', 'неисправ', 'сломал'],
  low: ['вопрос', 'предлож', 'улучш'],
};

export function normalizeIncidentType(raw: string): { type: IncidentType; confidence: number } {
  const text = raw.toLowerCase();
  let best: IncidentType = 'other';
  let bestScore = 0;
  for (const [type, keywords] of Object.entries(TYPE_DICT) as [IncidentType, string[]][]) {
    const score = keywords.filter((k) => text.includes(k)).length;
    if (score > bestScore) {
      bestScore = score;
      best = type;
    }
  }
  return { type: best, confidence: bestScore > 0 ? Math.min(100, 50 + bestScore * 20) : 30 };
}

export function normalizeSeverity(raw: string): { severity: IncidentSeverity; confidence: number } {
  const text = raw.toLowerCase();
  for (const sev of ['high', 'medium', 'low'] as IncidentSeverity[]) {
    if (SEVERITY_KEYWORDS[sev].some((k) => text.includes(k))) {
      return { severity: sev, confidence: 80 };
    }
  }
  return { severity: 'medium', confidence: 40 };
}

export function normalizeAddress(raw: string): { normalized: string; district: string | null; confidence: number } {
  const cleaned = raw
    .replace(/\s+/g, ' ')
    .replace(/ул\.?/gi, 'ул.')
    .replace(/просп\.?/gi, 'пр-т')
    .replace(/д\.?\s*(\d)/gi, 'д. $1')
    .trim();
  const district = /реутов/i.test(cleaned) ? 'Реутов' : null;
  return {
    normalized: cleaned,
    district,
    confidence: cleaned.length > 5 ? 70 : 30,
  };
}

export interface ConfidenceInputs {
  completeness: number; // 0-100: % заполненных обязательных полей
  freshness: number;    // 0-100: 100 = только что, 0 = старше суток
  sourceReliability: number; // 0-100: статичная константа коннектора
  parseConfidence: number;   // 0-100: уверенность парсера/AI
}

/** Детерминированная формула confidence (без AI). */
export function calculateRecordConfidence(inputs: ConfidenceInputs): number {
  const { completeness, freshness, sourceReliability, parseConfidence } = inputs;
  const score =
    completeness * 0.4 +
    freshness * 0.3 +
    sourceReliability * 0.2 +
    parseConfidence * 0.1;
  return Math.round(Math.max(0, Math.min(100, score)));
}

export function freshnessFromDate(d: Date | string): number {
  const ageMs = Date.now() - new Date(d).getTime();
  const ageHours = ageMs / 36e5;
  if (ageHours < 0.25) return 100;
  if (ageHours > 24) return 0;
  return Math.round(100 - (ageHours / 24) * 100);
}

export const SOURCE_RELIABILITY: Record<string, number> = {
  manual: 100,
  db: 95,
  excel: 85,
  api: 80,
  email: 70,
  telegram: 50,
};
