// Данные для ИИ: то, что возвращает функция базы gov_context().

export interface CtxSignal {
  id: string;
  title: string;
  kind: string;
  severity: "critical" | "high" | "medium";
  status: string;
  where: string | null;
  summary: string | null;
  cause: string | null;
  forecast: string | null;
  recommendation: string | null;
  mentions: number | null;
  detected: string;
  suggested_executor_id: string | null;
  suggested_title: string | null;
  suggested_due: string | null;
  municipality_id: string | null;
}

export interface CtxInstruction {
  id: string;
  title: string;
  executor: string;
  executor_id: string;
  where: string | null;
  due: string;
  status: string;
  overdue_days: number;
  reminders: number;
  effect: string | null;
}

export interface CtxAgenda {
  id: string;
  day: string;
  channel: string;
  title: string;
  status: string;
  where: string | null;
}

export interface CtxPromise {
  id: string;
  said_on: string;
  occasion: string;
  text: string;
  state: string;
}

export interface GovContext {
  today: string;
  region: string | null;
  trust: {
    value: number;
    delta_day: number | null;
    delta_week: number | null;
    components: Record<string, number | null>;
    last14: { day: string; value: number; event: string | null }[];
  } | null;
  signals: CtxSignal[];
  instructions: CtxInstruction[];
  agenda: CtxAgenda[];
  promises: CtxPromise[];
  executors: { id: string; name: string; short_name?: string }[];
  municipalities: { id: string; name: string }[];
  tone: string[] | null;
}

export const severityRank = (s: string) => (s === "critical" ? 3 : s === "high" ? 2 : 1);

export const isOpenSignal = (s: CtxSignal) => s.status === "new" || s.status === "watch";
export const isActiveInstruction = (i: CtxInstruction) => i.status === "new" || i.status === "in_progress";

export function topSignals(ctx: GovContext, n = 3): CtxSignal[] {
  return ctx.signals
    .filter(isOpenSignal)
    .sort((a, b) => severityRank(b.severity) - severityRank(a.severity))
    .slice(0, n);
}
