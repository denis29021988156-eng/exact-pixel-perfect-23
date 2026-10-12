// Данные, которые возвращают функции базы (gov_today, gov_signals и др.).
// Даты без времени приходят строкой 'YYYY-MM-DD', моменты времени — ISO-строкой.

export type Role = "admin" | "governor" | "team";

export type Severity = "critical" | "high" | "medium";
export type SignalKind = "incident" | "negative" | "deadline" | "complaints" | "media";
export type SignalStatus = "new" | "assigned" | "watch" | "dismissed" | "resolved";
export type InstructionStatus = "new" | "in_progress" | "done" | "cancelled";
export type InstructionSource = "signal" | "promise" | "agenda" | "ask" | "manual";
export type AgendaChannel = "media" | "pr" | "gr" | "event";
export type AgendaStatus = "proposed" | "approved" | "returned" | "done";
export type PromiseState = "kept" | "at_risk" | "in_progress" | "no_instruction";
export type TrustEventKind = "event" | "project" | "pr" | "media" | "incident";

export interface Ref {
  id: string;
  name: string;
}

export interface ExecutorRef {
  id: string;
  name: string;
  short_name: string;
}

export interface Executor extends ExecutorRef {
  kind?: "ministry" | "municipality" | "service";
}

export interface Signal {
  id: string;
  kind: SignalKind;
  severity: Severity;
  title: string;
  summary: string | null;
  municipality: Ref | null;
  source: string | null;
  mentions: number | null;
  detected_at: string;
  ai_cause: string | null;
  ai_forecast: string | null;
  ai_recommendation: string | null;
  suggested_title: string | null;
  suggested_executor: ExecutorRef | null;
  suggested_due: string | null;
  status: SignalStatus;
  status_note: string | null;
  updated_at: string;
  instruction: {
    id: string;
    title: string;
    status: InstructionStatus;
    due_date: string;
    executor: string | null;
  } | null;
}

export interface InstructionEvent {
  at: string;
  kind: "created" | "reminded" | "postponed" | "status" | "called" | "comment";
  note: string | null;
}

export interface Instruction {
  id: string;
  title: string;
  details: string | null;
  executor: ExecutorRef | null;
  municipality: Ref | null;
  due_date: string;
  status: InstructionStatus;
  source: InstructionSource;
  overdue_days: number;
  days_left: number | null;
  late: boolean | null;
  effect: string | null;
  effect_positive: boolean | null;
  reminders: number;
  last_reminded_at: string | null;
  postponed: number;
  created_at: string;
  done_at: string | null;
  signal: { id: string; title: string } | null;
  promise: { id: string; text: string; occasion: string; said_on: string } | null;
  events: InstructionEvent[];
}

export interface PromiseItem {
  id: string;
  said_on: string;
  occasion: string;
  text: string;
  due_date: string | null;
  municipality: Ref | null;
  state: PromiseState;
  instruction: {
    id: string;
    title: string;
    status: InstructionStatus;
    due_date: string;
    executor: string | null;
    overdue_days: number;
    effect: string | null;
  } | null;
}

export interface ExecutorStats extends ExecutorRef {
  active: number;
  overdue: number;
  done_on_time: number;
  done_late: number;
  on_time_rate: number | null;
}

export interface TrustPoint {
  day: string;
  value: number;
  event_label: string | null;
  event_kind: TrustEventKind | null;
}

export interface TrustComponents {
  media_tone: number | null;
  appeals_resolved: number | null;
  response_speed: number | null;
  survey: number | null;
}

export interface TrustSummary {
  day: string;
  value: number;
  delta_day: number | null;
  delta_week: number | null;
  components: TrustComponents;
  series?: TrustPoint[];
}

export interface Brief {
  day: string;
  headline: string;
  summary: string;
  source: "ai" | "rules" | "seed";
  generated_at: string;
  items: { signal_id?: string; text: string }[];
}

export type Decision =
  | {
      type: "signal";
      id: string;
      title: string;
      severity: Severity;
      subtitle: string;
      recommendation: string | null;
      suggested_title: string | null;
      executor: ExecutorRef | null;
      due: string | null;
    }
  | {
      type: "agenda";
      id: string;
      title: string;
      channel: AgendaChannel;
      day: string;
      subtitle: string;
      expected_effect: string | null;
    };

export interface TodayCounts {
  signals_open: number;
  signals_new: number;
  signals_critical: number;
  instructions_overdue: number;
  instructions_active: number;
  instructions_done_week: number;
  agenda_pending: number;
  promises_at_risk: number;
}

export interface TodayPayload {
  date: string;
  region: string | null;
  demo: boolean;
  brief: Brief | null;
  trust: TrustSummary | null;
  top: Signal[];
  decisions: Decision[];
  counts: TodayCounts;
}

export interface SignalsPayload {
  items: Signal[];
  executors: Executor[];
}

export interface InstructionsPayload {
  items: Instruction[];
  executors: ExecutorStats[];
  promises: PromiseItem[];
  executor_options: ExecutorRef[];
}

export interface AgendaItem {
  id: string;
  day: string;
  channel: AgendaChannel;
  title: string;
  description: string | null;
  municipality: Ref | null;
  expected_effect: string | null;
  status: AgendaStatus;
  decision_note: string | null;
  decided_at: string | null;
}

export interface AgendaPayload {
  today: string;
  items: AgendaItem[];
  tone: { tone: string[]; avoid: string[] } | null;
  trust: TrustPoint[];
  trust_summary: TrustSummary | null;
}

// Ответ ИИ на вопрос («Спросить»).
export interface AskRef {
  type: "signal" | "instruction" | "promise" | "agenda";
  id: string;
  title: string;
}

export interface AskAction {
  title: string;
  executor: ExecutorRef;
  due: string;
  municipality_id: string | null;
  details: string | null;
}

export interface AskAnswer {
  answer: string;
  refs: AskRef[];
  action: AskAction | null;
  mode: "ai" | "rules";
}

export interface AdminUser {
  id: string;
  email: string | null;
  full_name: string | null;
  role: Role | null;
  last_sign_in_at: string | null;
  created_at: string;
}
