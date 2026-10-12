// Русские даты, числа и подписи. Время показываем по Москве, как в регионе.

import type {
  AgendaChannel,
  AgendaStatus,
  InstructionStatus,
  PromiseState,
  Severity,
  SignalKind,
  SignalStatus,
  TrustEventKind,
} from "./types";

const TZ = "Europe/Moscow";
const DAY_MS = 86_400_000;

export function plural(n: number, one: string, few: string, many: string): string {
  const a = Math.abs(n) % 100;
  const b = a % 10;
  if (a > 10 && a < 20) return many;
  if (b > 1 && b < 5) return few;
  if (b === 1) return one;
  return many;
}

export const days = (n: number) => `${n} ${plural(n, "день", "дня", "дней")}`;

/** Сегодняшняя дата по Москве: 'YYYY-MM-DD'. */
export function mskToday(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

function dayToUtc(day: string): number {
  const [y, m, d] = day.slice(0, 10).split("-").map(Number);
  return Date.UTC(y, (m || 1) - 1, d || 1);
}

/** Сколько дней от a до b (b − a). */
export function diffDays(a: string, b: string): number {
  return Math.round((dayToUtc(b) - dayToUtc(a)) / DAY_MS);
}

export function addDays(day: string, n: number): string {
  return new Date(dayToUtc(day) + n * DAY_MS).toISOString().slice(0, 10);
}

const fmtCache = new Map<string, Intl.DateTimeFormat>();
function dtf(key: string, opts: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  let f = fmtCache.get(key);
  if (!f) {
    f = new Intl.DateTimeFormat("ru-RU", opts);
    fmtCache.set(key, f);
  }
  return f;
}

/** «13 октября» (с годом, если год не текущий). */
export function fmtDay(day: string, today: string = mskToday()): string {
  const sameYear = day.slice(0, 4) === today.slice(0, 4);
  const f = sameYear
    ? dtf("day", { timeZone: "UTC", day: "numeric", month: "long" })
    : dtf("day-y", { timeZone: "UTC", day: "numeric", month: "long", year: "numeric" });
  return f.format(new Date(dayToUtc(day))).replace(" г.", "");
}

/** «13 окт» */
export function fmtDayShort(day: string): string {
  return dtf("day-short", { timeZone: "UTC", day: "numeric", month: "short" })
    .format(new Date(dayToUtc(day)))
    .replace(".", "");
}

/** «понедельник» */
export function fmtWeekday(day: string): string {
  return dtf("weekday", { timeZone: "UTC", weekday: "long" }).format(new Date(dayToUtc(day)));
}

/** «пн» */
export function fmtWeekdayShort(day: string): string {
  return dtf("weekday-short", { timeZone: "UTC", weekday: "short" }).format(new Date(dayToUtc(day)));
}

/** «понедельник, 12 октября» */
export function fmtLongDate(day: string, today: string = mskToday()): string {
  return `${fmtWeekday(day)}, ${fmtDay(day, today)}`;
}

/** «сегодня», «завтра», «вчера» или «13 октября». */
export function fmtRelDay(day: string, today: string = mskToday()): string {
  const d = diffDays(today, day);
  if (d === 0) return "сегодня";
  if (d === 1) return "завтра";
  if (d === 2) return "послезавтра";
  if (d === -1) return "вчера";
  return fmtDay(day, today);
}

/** Срок поручения в одну строку и его тон. */
export function fmtDue(
  due: string,
  today: string = mskToday(),
): { text: string; tone: "critical" | "warning" | "normal" } {
  const d = diffDays(today, due);
  if (d < 0) return { text: `просрочено на ${days(-d)}`, tone: "critical" };
  if (d === 0) return { text: "срок сегодня", tone: "warning" };
  if (d === 1) return { text: "срок завтра", tone: "warning" };
  if (d <= 6) return { text: `через ${days(d)}`, tone: "normal" };
  return { text: `до ${fmtDay(due, today)}`, tone: "normal" };
}

/** «до 13 окт» — коротко для кнопок. */
export function fmtDueShort(due: string, today: string = mskToday()): string {
  const d = diffDays(today, due);
  if (d === 0) return "сегодня";
  if (d === 1) return "до завтра";
  return `до ${fmtDayShort(due)}`;
}

/** «08:34» по Москве. */
export function fmtTime(iso: string): string {
  return dtf("time", { timeZone: TZ, hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
}

/** Дата момента времени по Москве: 'YYYY-MM-DD'. */
export function mskDay(iso: string): string {
  return mskToday(new Date(iso));
}

/** «сегодня в 02:40», «вчера в 21:34», «10 октября в 11:34». */
export function fmtWhen(iso: string, today: string = mskToday()): string {
  const day = mskDay(iso);
  const d = diffDays(today, day);
  const time = fmtTime(iso);
  if (d === 0) return `сегодня в ${time}`;
  if (d === -1) return `вчера в ${time}`;
  return `${fmtDay(day, today)} в ${time}`;
}

/** «12 мин назад», «3 ч назад», «вчера», «4 дня назад». */
export function fmtAgo(iso: string, now: Date = new Date()): string {
  const ms = now.getTime() - new Date(iso).getTime();
  const min = Math.floor(ms / 60_000);
  if (min < 1) return "только что";
  if (min < 60) return `${min} мин назад`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} ч назад`;
  const today = mskToday(now);
  const d = diffDays(mskDay(iso), today);
  if (d <= 1) return "вчера";
  return `${days(d)} назад`;
}

const num1 = new Intl.NumberFormat("ru-RU", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const num0 = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 });

/** «61,3» */
export function fmtNum(v: number | null | undefined, digits: 0 | 1 = 1): string {
  if (v === null || v === undefined || Number.isNaN(v)) return "—";
  return (digits === 1 ? num1 : num0).format(v).replace(/[\u00a0\u202f]/g, "\u00a0");
}

/** «+1,9», «−0,4», «0,0» */
export function fmtDelta(v: number | null | undefined): string {
  if (v === null || v === undefined || Number.isNaN(v)) return "—";
  const abs = fmtNum(Math.abs(v));
  if (v > 0) return `+${abs}`;
  if (v < 0) return `−${abs}`;
  return abs;
}

// ── Подписи ────────────────────────────────────────────────────────────────

export const severityLabel: Record<Severity, string> = {
  critical: "Критично",
  high: "Важно",
  medium: "Внимание",
};

export const signalKindLabel: Record<SignalKind, string> = {
  incident: "Происшествие",
  negative: "Негатив в соцсетях",
  deadline: "Срыв срока",
  complaints: "Рост обращений",
  media: "Публикация в СМИ",
};

export const signalStatusLabel: Record<SignalStatus, string> = {
  new: "Ждёт решения",
  watch: "На наблюдении",
  assigned: "Поручено",
  dismissed: "Снят с контроля",
  resolved: "Решено",
};

export const instructionStatusLabel: Record<InstructionStatus, string> = {
  new: "Поручено",
  in_progress: "В работе",
  done: "Выполнено",
  cancelled: "Отменено",
};

export const channelLabel: Record<AgendaChannel, string> = {
  media: "СМИ",
  pr: "PR",
  gr: "GR",
  event: "Мероприятие",
};

export const agendaStatusLabel: Record<AgendaStatus, string> = {
  proposed: "Ждёт решения",
  approved: "Согласовано",
  returned: "Возвращено",
  done: "Прошло",
};

export const promiseStateLabel: Record<PromiseState, string> = {
  kept: "Выполнено",
  at_risk: "Под риском",
  in_progress: "В работе",
  no_instruction: "Нет поручения",
};

export const trustEventLabel: Record<TrustEventKind, string> = {
  event: "Мероприятие",
  project: "Проект",
  pr: "PR",
  media: "СМИ",
  incident: "Происшествие",
};

export const trustComponentLabel = {
  media_tone: "Тон СМИ и соцсетей",
  appeals_resolved: "Решённые обращения",
  response_speed: "Скорость ответа",
  survey: "Опросы",
} as const;

/** Первая буква заглавная. */
export function capitalize(s: string): string {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}
