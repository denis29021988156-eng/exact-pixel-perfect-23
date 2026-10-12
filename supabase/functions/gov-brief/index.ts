// Сводка дня: ИИ пишет главное по данным планшета. Если ИИ недоступен — сводка по правилам.
// Доступ и лимит проверяет база (gov_ai_quota) по токену пользователя.

import { callTool, clip, dayText, delta, num, plural } from "../_shared/ai.ts";
import { isActiveInstruction, isOpenSignal, topSignals, type GovContext } from "../_shared/context.ts";
import { dbErrorResponse, json, preflight, userClient } from "../_shared/http.ts";

interface BriefDraft {
  headline: string;
  summary: string;
  items: { signal_id?: string; text: string }[];
}

const BRIEF_TOOL = {
  name: "save_brief",
  description: "Сохранить сводку дня для губернатора",
  parameters: {
    type: "object",
    properties: {
      headline: { type: "string", description: "Главное за день, до 90 знаков. Начинается с «Главное сегодня — »." },
      summary: {
        type: "string",
        description: "2–4 предложения: индекс доверия и его причина, главные проблемы, что ждёт решения.",
      },
      items: {
        type: "array",
        description: "Три самых важных сигнала",
        items: {
          type: "object",
          properties: {
            signal_id: { type: "string", description: "id сигнала из данных" },
            text: { type: "string", description: "Место и суть, до 70 знаков" },
          },
          required: ["signal_id", "text"],
        },
      },
    },
    required: ["headline", "summary", "items"],
  },
};

function systemPrompt(ctx: GovContext): string {
  const tone = ctx.tone?.length ? ctx.tone.map((t) => `— ${t}`).join("\n") : "";
  return [
    `Ты — помощник губернатора (${ctx.region ?? "регион"}). Сегодня ${dayText(ctx.today)}.`,
    "Напиши утреннюю сводку дня по данным ниже. Её прочтут или прослушают за минуту.",
    "Правила:",
    "— только факты из данных, ничего не придумывай;",
    "— никаких имён людей, только должности и ведомства;",
    "— просто и по делу, без канцелярита и оценочных слов;",
    "— числа как в данных, десятичная запятая; даты словами («14 октября»);",
    "— в summary упомяни индекс доверия (значение, изменение за сутки и неделю и событие, которое его сдвинуло), главные проблемы и что ждёт решения.",
    tone ? `Тон коммуникаций:\n${tone}` : "",
    "",
    "Данные (JSON):",
    JSON.stringify(ctx),
  ]
    .filter(Boolean)
    .join("\n");
}

function rulesBrief(ctx: GovContext): BriefDraft {
  const open = ctx.signals.filter(isOpenSignal);
  const top = topSignals(ctx, 3);
  const critical = open.filter((s) => s.severity === "critical").length;
  const overdue = ctx.instructions
    .filter((i) => isActiveInstruction(i) && i.overdue_days > 0)
    .sort((a, b) => b.overdue_days - a.overdue_days);
  const pendingAgenda = ctx.agenda.filter((a) => a.status === "proposed" && a.day >= ctx.today);

  const parts: string[] = [];
  if (ctx.trust) {
    const lastEvent = [...(ctx.trust.last14 ?? [])].reverse().find((p) => p.event);
    parts.push(
      `Индекс доверия ${num(ctx.trust.value)}: за сутки ${delta(ctx.trust.delta_day)}, за неделю ${delta(ctx.trust.delta_week)}` +
        (lastEvent ? `; последнее событие — «${lastEvent.event}».` : "."),
    );
  }
  parts.push(
    open.length
      ? `Открытых сигналов ${open.length}${critical ? `, из них критичных ${critical}` : ""}.`
      : "Открытых сигналов нет.",
  );
  if (overdue.length) {
    const w = overdue[0];
    parts.push(
      `Просрочено ${overdue.length} ${plural(overdue.length, "поручение", "поручения", "поручений")}, дольше всех — «${w.title}» (${w.executor}, ${w.overdue_days} ${plural(w.overdue_days, "день", "дня", "дней")}).`,
    );
  }
  if (pendingAgenda.length) {
    parts.push(
      `В повестке ждут согласования ${pendingAgenda.length} ${plural(pendingAgenda.length, "пункт", "пункта", "пунктов")}.`,
    );
  }

  return {
    headline: top[0] ? clip(`Главное сегодня — ${top[0].title}`, 120) : "Сегодня без острых сигналов",
    summary: parts.join(" "),
    items: top.map((s) => ({ signal_id: s.id, text: clip(s.title, 90) })),
  };
}

function sanitize(draft: BriefDraft, ctx: GovContext): BriefDraft | null {
  const ids = new Set(ctx.signals.map((s) => s.id));
  const headline = clip(draft?.headline, 140);
  const summary = typeof draft?.summary === "string" ? draft.summary.trim().slice(0, 1200) : "";
  if (!headline || !summary) return null;
  const items = (Array.isArray(draft.items) ? draft.items : [])
    .map((it) => ({
      signal_id: typeof it?.signal_id === "string" && ids.has(it.signal_id) ? it.signal_id : undefined,
      text: clip(it?.text, 100),
    }))
    .filter((it) => it.text)
    .slice(0, 4);
  return { headline, summary, items };
}

Deno.serve(async (req) => {
  const early = preflight(req);
  if (early) return early;

  const db = userClient(req);
  if (!db) return json({ error: "Войдите, чтобы обновить сводку" }, 401);

  try {
    const quota = await db.rpc("gov_ai_quota", { _kind: "brief", _limit: 6 });
    if (quota.error) return dbErrorResponse(quota.error);
    if (quota.data !== true) return json({ error: "Сводку можно обновлять не чаще шести раз в час" }, 429);

    const ctxRes = await db.rpc("gov_context");
    if (ctxRes.error) return dbErrorResponse(ctxRes.error);
    const ctx = ctxRes.data as GovContext;

    let draft: BriefDraft | null = null;
    let mode: "ai" | "rules" = "ai";
    try {
      const raw = await callTool<BriefDraft>(
        [
          { role: "system", content: systemPrompt(ctx) },
          { role: "user", content: "Собери сводку дня." },
        ],
        BRIEF_TOOL,
      );
      draft = sanitize(raw, ctx);
    } catch (err) {
      console.error("brief ai", err);
    }
    if (!draft) {
      draft = rulesBrief(ctx);
      mode = "rules";
    }

    const stored = await db.rpc("gov_store_brief", {
      _headline: draft.headline,
      _summary: draft.summary,
      _items: draft.items,
      _source: mode,
    });
    if (stored.error) return dbErrorResponse(stored.error);
    return json({ brief: stored.data, mode });
  } catch (err) {
    console.error("gov-brief", err);
    return json({ error: "Не удалось собрать сводку. Попробуйте ещё раз." }, 500);
  }
});
