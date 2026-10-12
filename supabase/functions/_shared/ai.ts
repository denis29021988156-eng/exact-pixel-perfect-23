// Вызов ИИ через шлюз Lovable с ответом в заданной структуре (вызов «инструмента»).

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
// Основная модель и запасная, если основная недоступна.
const MODELS = ["google/gemini-3-flash-preview", "google/gemini-2.5-flash"];

export class AIUnavailable extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.status = status;
  }
}

export interface ToolSpec {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

type Message = { role: "system" | "user" | "assistant"; content: string };

function parseJsonLoose(text: string): unknown {
  const cleaned = text
    .replace(/```json\s*/gi, "")
    .replace(/```/g, "")
    .trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end <= start) throw new Error("Нет JSON в ответе");
  return JSON.parse(cleaned.slice(start, end + 1));
}

/** Возвращает аргументы, которые модель передала в инструмент. */
export async function callTool<T>(messages: Message[], tool: ToolSpec, timeoutMs = 25_000): Promise<T> {
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) throw new AIUnavailable("LOVABLE_API_KEY не задан");

  let lastError: unknown = null;
  for (const model of MODELS) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(GATEWAY, {
        method: "POST",
        signal: ctrl.signal,
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          temperature: 0.3,
          messages,
          tools: [{ type: "function", function: tool }],
          tool_choice: { type: "function", function: { name: tool.name } },
        }),
      });
      if (res.status === 429 || res.status === 402) {
        // Лимит или оплата: другая модель не поможет.
        throw new AIUnavailable(`AI gateway ${res.status}`, res.status);
      }
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        lastError = new AIUnavailable(`AI gateway ${res.status}: ${text.slice(0, 200)}`, res.status);
        continue;
      }
      const data = await res.json();
      const msg = data?.choices?.[0]?.message;
      const args = msg?.tool_calls?.[0]?.function?.arguments;
      if (args) return (typeof args === "string" ? JSON.parse(args) : args) as T;
      if (typeof msg?.content === "string" && msg.content.trim()) return parseJsonLoose(msg.content) as T;
      lastError = new AIUnavailable("Пустой ответ модели");
    } catch (err) {
      if (err instanceof AIUnavailable && (err.status === 429 || err.status === 402)) throw err;
      lastError = err;
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastError instanceof Error ? lastError : new AIUnavailable("ИИ недоступен");
}

// ── Форматирование для текстов по правилам ──────────────────────────────────

export function num(v: number | null | undefined): string {
  if (v === null || v === undefined || Number.isNaN(Number(v))) return "—";
  return Number(v).toFixed(1).replace(".", ",");
}

export function delta(v: number | null | undefined): string {
  if (v === null || v === undefined || Number.isNaN(Number(v))) return "—";
  const n = Number(v);
  const abs = Math.abs(n).toFixed(1).replace(".", ",");
  return n > 0 ? `+${abs}` : n < 0 ? `−${abs}` : abs;
}

export function plural(n: number, one: string, few: string, many: string): string {
  const a = Math.abs(n) % 100;
  const b = a % 10;
  if (a > 10 && a < 20) return many;
  if (b > 1 && b < 5) return few;
  if (b === 1) return one;
  return many;
}

const MONTHS = [
  "января",
  "февраля",
  "марта",
  "апреля",
  "мая",
  "июня",
  "июля",
  "августа",
  "сентября",
  "октября",
  "ноября",
  "декабря",
];

export function dayText(iso: string): string {
  const [, m, d] = iso.slice(0, 10).split("-").map(Number);
  return `${d} ${MONTHS[(m || 1) - 1]}`;
}

export function addDays(iso: string, n: number): string {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d) + n * 86_400_000).toISOString().slice(0, 10);
}

export function clip(s: unknown, max: number): string {
  const t = typeof s === "string" ? s.replace(/\s+/g, " ").trim() : "";
  return t.length > max ? `${t.slice(0, max - 1).trimEnd()}…` : t;
}
