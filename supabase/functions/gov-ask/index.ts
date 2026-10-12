// «Спросить»: ответ на вопрос губернатора по данным планшета и, если уместно, готовое поручение.
// Если ИИ недоступен — короткий ответ по правилам. Доступ и лимит проверяет база.

import { addDays, callTool, clip, dayText, delta, num, plural } from "../_shared/ai.ts";
import {
  isActiveInstruction,
  isOpenSignal,
  severityRank,
  topSignals,
  type CtxSignal,
  type GovContext,
} from "../_shared/context.ts";
import { dbErrorResponse, json, preflight, userClient } from "../_shared/http.ts";

type RefType = "signal" | "instruction" | "promise" | "agenda";

interface RawAnswer {
  answer?: string;
  refs?: { type?: string; id?: string }[];
  action?: {
    title?: string;
    executor_id?: string;
    due?: string;
    municipality_id?: string | null;
    details?: string | null;
  } | null;
}

interface Answer {
  answer: string;
  refs: { type: RefType; id: string; title: string }[];
  action: {
    title: string;
    executor: { id: string; name: string; short_name: string };
    due: string;
    municipality_id: string | null;
    details: string | null;
  } | null;
  mode: "ai" | "rules";
}

const ANSWER_TOOL = {
  name: "answer",
  description: "Ответ губернатору",
  parameters: {
    type: "object",
    properties: {
      answer: {
        type: "string",
        description: "2–5 коротких предложений простым языком. Без списков, разметки и эмодзи.",
      },
      refs: {
        type: "array",
        description: "До четырёх записей из данных, на которые опирается ответ",
        items: {
          type: "object",
          properties: {
            type: { type: "string", enum: ["signal", "instruction", "promise", "agenda"] },
            id: { type: "string" },
          },
          required: ["type", "id"],
        },
      },
      action: {
        type: "object",
        description:
          "Поручение, если его уместно дать прямо сейчас. Не заполняй, если поручение не нужно или уже дано.",
        properties: {
          title: { type: "string", description: "Что сделать, с результатом, до 120 знаков" },
          executor_id: { type: "string", description: "id исполнителя из executors" },
          due: { type: "string", description: "Срок, YYYY-MM-DD, не раньше сегодняшнего дня" },
          municipality_id: {
            type: "string",
            description: "id округа из municipalities, если поручение про конкретное место",
          },
          details: { type: "string", description: "Пояснение для исполнителя, одно-два предложения" },
        },
        required: ["title", "executor_id", "due"],
      },
    },
    required: ["answer", "refs"],
  },
};

function systemPrompt(ctx: GovContext): string {
  const tone = ctx.tone?.length ? ctx.tone.map((t) => `— ${t}`).join("\n") : "";
  return [
    `Ты — ИИ-помощник губернатора (${ctx.region ?? "регион"}) в приложении «Планшет губернатора». Сегодня ${dayText(ctx.today)} (${ctx.today}).`,
    "Отвечай на вопросы по данным ниже: сигналы (signals), поручения (instructions), обещания (promises), повестка (agenda), индекс доверия (trust).",
    "Правила:",
    "— только факты из данных; если в данных ответа нет, так и скажи и предложи, что уточнить;",
    "— не говори, что поручение дано или вопрос решён, если этого нет в instructions и signals (у сигнала status new поручения ещё нет);",
    "— обращайся к губернатору на «вы» и коротко советуй, без просьб и оценок;",
    "— никаких имён людей, только должности и ведомства;",
    "— 2–5 коротких предложений, чтобы ответ было удобно слушать; без списков, разметки и эмодзи;",
    "— даты словами («до 14 октября»), числа с запятой, как в данных;",
    "— «что горит», «что срочно», «что главное» — это вопрос о том, что требует решения сегодня (не о пожарах): начни с самого важного сигнала;",
    "— если просят текст для жителей или СМИ — дай короткий текст в тоне коммуникаций;",
    "— action заполняй, только если по вопросу нужно новое поручение и его ещё нет среди активных поручений; исполнитель — из executors;",
    "— если речь о новом сигнале (status new) с готовым поручением (suggested_title, suggested_executor_id, suggested_due), предлагай в action именно его.",
    tone ? `Тон коммуникаций:\n${tone}` : "",
    "",
    "Данные (JSON):",
    JSON.stringify(ctx),
  ]
    .filter(Boolean)
    .join("\n");
}

// ── Проверка ответа ИИ: только то, что есть в данных ─────────────────────────

function titleOf(ctx: GovContext, type: RefType, id: string): string | null {
  if (type === "signal") return ctx.signals.find((s) => s.id === id)?.title ?? null;
  if (type === "instruction") return ctx.instructions.find((i) => i.id === id)?.title ?? null;
  if (type === "promise") {
    const p = ctx.promises.find((x) => x.id === id);
    return p ? `«${p.text}»` : null;
  }
  return ctx.agenda.find((a) => a.id === id)?.title ?? null;
}

function cleanRefs(ctx: GovContext, refs: RawAnswer["refs"]): Answer["refs"] {
  const out: Answer["refs"] = [];
  const seen = new Set<string>();
  for (const r of Array.isArray(refs) ? refs : []) {
    const type = r?.type as RefType;
    const id = typeof r?.id === "string" ? r.id : "";
    if (!["signal", "instruction", "promise", "agenda"].includes(type) || !id || seen.has(id)) continue;
    const title = titleOf(ctx, type, id);
    if (!title) continue;
    seen.add(id);
    out.push({ type, id, title: clip(title, 80) });
    if (out.length >= 4) break;
  }
  return out;
}

function executorRef(ctx: GovContext, id: string | null | undefined) {
  const e = ctx.executors.find((x) => x.id === id);
  return e ? { id: e.id, name: e.name, short_name: e.short_name || e.name } : null;
}

function cleanAction(ctx: GovContext, a: RawAnswer["action"]): Answer["action"] {
  if (!a || typeof a !== "object") return null;
  const executor = executorRef(ctx, a.executor_id);
  const title = clip(a.title, 200);
  if (!executor || !title) return null;
  const valid = typeof a.due === "string" && /^\d{4}-\d{2}-\d{2}$/.test(a.due);
  const maxDue = addDays(ctx.today, 90);
  const due = valid && a.due! >= ctx.today && a.due! <= maxDue ? a.due! : addDays(ctx.today, 3);
  const municipality_id = ctx.municipalities.some((m) => m.id === a.municipality_id)
    ? (a.municipality_id as string)
    : null;
  return { title, executor, due, municipality_id, details: clip(a.details, 500) || null };
}

function cleanText(s: unknown): string {
  if (typeof s !== "string") return "";
  return s
    .replace(/[*_#`>]+/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, 1500);
}

// ── Ответ по правилам, если ИИ недоступен ────────────────────────────────────

const lower = (s: string) => s.toLowerCase().replace(/ё/g, "е");

function placeSignals(ctx: GovContext, q: string): CtxSignal[] {
  // «Тверская область» — это регион целиком, а не город Тверь.
  const ql = lower(q).replace(/тверск\S*/g, "");
  const stems = ctx.municipalities
    .map((m) => ({ id: m.id, stem: lower(m.name.split(/\s+/)[0]).slice(0, 4) }))
    .filter((m) => m.stem.length === 4 && ql.includes(m.stem));
  if (!stems.length) return [];
  const ids = new Set(stems.map((s) => s.id));
  return ctx.signals.filter((s) => s.municipality_id && ids.has(s.municipality_id));
}

function proposeFromSignal(ctx: GovContext, s: CtxSignal | undefined): Answer["action"] {
  if (!s || s.status !== "new" || !s.suggested_executor_id) return null;
  return cleanAction(ctx, {
    title: s.suggested_title ?? `Принять меры: ${s.title}`,
    executor_id: s.suggested_executor_id,
    due: s.suggested_due ?? undefined,
    municipality_id: s.municipality_id,
    details: s.recommendation,
  });
}

function firstSentence(s: string | null): string {
  if (!s) return "";
  const m = s.match(/^.*?[.!?](\s|$)/);
  return (m ? m[0] : s).trim();
}

function rulesAnswer(ctx: GovContext, question: string): Omit<Answer, "mode"> {
  const q = lower(question);
  const open = ctx.signals.filter(isOpenSignal).sort((a, b) => severityRank(b.severity) - severityRank(a.severity));
  const overdue = ctx.instructions
    .filter((i) => isActiveInstruction(i) && i.overdue_days > 0)
    .sort((a, b) => b.overdue_days - a.overdue_days);

  if (/срок|просроч|сорва|срыва|исполнит|дисциплин|кто (не|тян)/.test(q)) {
    if (!overdue.length) {
      return { answer: "Просроченных поручений нет. Все активные поручения идут в срок.", refs: [], action: null };
    }
    const top = overdue.slice(0, 3);
    const head = `Просрочено ${overdue.length} ${plural(overdue.length, "поручение", "поручения", "поручений")}.`;
    const worst = `Дольше всех — «${top[0].title}»: ${top[0].executor}, ${top[0].overdue_days} ${plural(top[0].overdue_days, "день", "дня", "дней")}${top[0].reminders ? `, напоминаний ${top[0].reminders}` : ""}.`;
    const rest =
      top.length > 1
        ? `Также: ${top
            .slice(1)
            .map((i) => `${i.executor} — «${i.title}»`)
            .join("; ")}.`
        : "";
    return {
      answer: [head, worst, rest, "Можно вызвать исполнителя на доклад из карточки поручения."]
        .filter(Boolean)
        .join(" "),
      refs: top.map((i) => ({ type: "instruction" as const, id: i.id, title: clip(i.title, 80) })),
      action: null,
    };
  }

  if (/обещан|прямой лини|прямая лини/.test(q)) {
    const risky = ctx.promises.filter((p) => p.state === "at_risk" || p.state === "no_instruction");
    const kept = ctx.promises.filter((p) => p.state === "kept").length;
    if (!risky.length) {
      return { answer: `Все обещания в работе, выполнено ${kept}.`, refs: [], action: null };
    }
    const parts = risky
      .slice(0, 3)
      .map((p) =>
        p.state === "no_instruction" ? `«${p.text}» — поручения нет` : `«${p.text}» — поручение просрочено`,
      );
    return {
      answer: `Под риском ${risky.length} ${plural(risky.length, "обещание", "обещания", "обещаний")}: ${parts.join("; ")}. Выполнено ${kept}.`,
      refs: risky.slice(0, 3).map((p) => ({ type: "promise" as const, id: p.id, title: clip(`«${p.text}»`, 80) })),
      action: null,
    };
  }

  if (/индекс|довери|рейтинг|настроени/.test(q) && ctx.trust) {
    const events = (ctx.trust.last14 ?? []).filter((p) => p.event).slice(-3);
    return {
      answer: [
        `Индекс доверия ${num(ctx.trust.value)}: за сутки ${delta(ctx.trust.delta_day)}, за неделю ${delta(ctx.trust.delta_week)}.`,
        events.length ? `Последние события: ${events.map((e) => `${dayText(e.day)} — ${e.event}`).join("; ")}.` : "",
      ]
        .filter(Boolean)
        .join(" "),
      refs: [],
      action: null,
    };
  }

  if (/повестк|недел|выезд|мероприят|интервью|сми\b|пресс/.test(q)) {
    const next = ctx.agenda.filter((a) => a.day >= ctx.today).slice(0, 3);
    if (!next.length) return { answer: "Ближайших пунктов повестки нет.", refs: [], action: null };
    const pending = ctx.agenda.filter((a) => a.day >= ctx.today && a.status === "proposed").length;
    return {
      answer: `Ближайшее: ${next.map((a) => `${dayText(a.day)} — ${a.title}`).join("; ")}. Ждут согласования ${pending} ${plural(pending, "пункт", "пункта", "пунктов")}.`,
      refs: next.map((a) => ({ type: "agenda" as const, id: a.id, title: clip(a.title, 80) })),
      action: null,
    };
  }

  // Конкретное место: «Что в Удомле?», «Что сказать жителям Ржева?»
  const local = placeSignals(ctx, question);
  if (local.length) {
    const s = [...local].sort((a, b) => severityRank(b.severity) - severityRank(a.severity))[0];
    const text = [
      `${s.title}.`,
      firstSentence(s.summary),
      s.recommendation ? `Что советую: ${s.recommendation}` : "",
      /жител|сказать|написать|обращени/.test(q)
        ? "Жителям стоит сказать прямо: что случилось, кто отвечает и к какому сроку всё исправят."
        : "",
    ]
      .filter(Boolean)
      .join(" ");
    return {
      answer: text,
      refs: local.slice(0, 3).map((x) => ({ type: "signal" as const, id: x.id, title: clip(x.title, 80) })),
      action: proposeFromSignal(ctx, s),
    };
  }

  // По умолчанию — что горит.
  const top = topSignals(ctx, 3);
  if (!top.length) {
    return {
      answer: "Острых сигналов сейчас нет. Просроченных поручений: " + overdue.length + ".",
      refs: [],
      action: null,
    };
  }
  const s = top[0];
  return {
    answer: [
      `Главное сейчас — ${s.title}.`,
      firstSentence(s.summary),
      top.length > 1
        ? `Ещё ${top.length - 1}: ${top
            .slice(1)
            .map((x) => x.title)
            .join("; ")}.`
        : "",
      overdue.length ? `Просрочено поручений: ${overdue.length}.` : "",
    ]
      .filter(Boolean)
      .join(" "),
    refs: top.map((x) => ({ type: "signal" as const, id: x.id, title: clip(x.title, 80) })),
    action: proposeFromSignal(ctx, s),
  };
}

Deno.serve(async (req) => {
  const early = preflight(req);
  if (early) return early;

  const db = userClient(req);
  if (!db) return json({ error: "Войдите, чтобы задать вопрос" }, 401);

  try {
    const body = await req.json().catch(() => ({}));
    const question = typeof body?.question === "string" ? body.question.trim().slice(0, 500) : "";
    if (!question) return json({ error: "Задайте вопрос" }, 400);
    const history = (Array.isArray(body?.history) ? body.history : [])
      .slice(-3)
      .filter(
        (h: unknown) =>
          h && typeof (h as { q?: unknown }).q === "string" && typeof (h as { a?: unknown }).a === "string",
      )
      .map((h: { q: string; a: string }) => ({ q: h.q.slice(0, 500), a: h.a.slice(0, 1500) }));

    const quota = await db.rpc("gov_ai_quota", { _kind: "ask", _limit: 30 });
    if (quota.error) return dbErrorResponse(quota.error);
    if (quota.data !== true) return json({ error: "Слишком много вопросов подряд. Подождите немного." }, 429);

    const ctxRes = await db.rpc("gov_context");
    if (ctxRes.error) return dbErrorResponse(ctxRes.error);
    const ctx = ctxRes.data as GovContext;

    let result: Answer | null = null;
    try {
      const messages = [
        { role: "system" as const, content: systemPrompt(ctx) },
        ...history.flatMap((h: { q: string; a: string }) => [
          { role: "user" as const, content: h.q },
          { role: "assistant" as const, content: h.a },
        ]),
        { role: "user" as const, content: question },
      ];
      const raw = await callTool<RawAnswer>(messages, ANSWER_TOOL);
      const answer = cleanText(raw?.answer);
      if (answer) {
        result = { answer, refs: cleanRefs(ctx, raw.refs), action: cleanAction(ctx, raw.action), mode: "ai" };
      }
    } catch (err) {
      console.error("ask ai", err);
    }
    if (!result) result = { ...rulesAnswer(ctx, question), mode: "rules" };

    // Журнал вопросов: ошибка записи не должна мешать ответу.
    const log = await db.rpc("gov_log_ask", { _question: question, _answer: result, _ok: result.mode === "ai" });
    if (log.error) console.error("ask log", log.error);

    return json(result);
  } catch (err) {
    console.error("gov-ask", err);
    return json({ error: "Не удалось ответить. Попробуйте ещё раз." }, 500);
  }
});
