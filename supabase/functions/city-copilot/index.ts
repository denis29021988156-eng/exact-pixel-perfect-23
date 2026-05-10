import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ШПАРГАЛКА — отраслевые показатели г. Реутов.
// Эти цифры синхронизированы со страницей /app/cheatsheet (staticBlocks).
// При обновлении цифр обнови version и lastUpdated, а также src/pages/CheatsheetPage.tsx.
const CHEATSHEET = {
  version: "2026-05-10",
  lastUpdated: "2026-05-10",
  city: "Реутов",
  sectors: [
    {
      name: "Строительство объектов",
      metrics: {
        "Объектов в стройке": 14,
        "Жилых домов": 6,
        "Соцобъектов (школы, сады, поликлиники)": 5,
        "Коммерческих объектов": 3,
        "Завершено в 2026": 3,
        "С отставанием от графика": 4,
        "Общая площадь в стройке (м²)": 128500,
      },
    },
    {
      name: "Дорожное хозяйство",
      metrics: {
        "Отремонтировано дорог 2026 (км)": 12.4,
        "План на год (км)": 28,
        "Выполнение плана (%)": 44,
        "Ямочный ремонт (м²)": 2380,
        "Новых дорог построено (км)": 1.8,
        "Светофоров установлено/заменено": 7,
        "Тротуаров обновлено (км)": 4.2,
        "Активных контрактов на дороги": 8,
      },
    },
    {
      name: "Образование",
      metrics: {
        "Школ в городе": 42,
        "Школ на капремонте": 3,
        "Школ построено / введено": 1,
        "Детских садов": 58,
        "Новых мест в садах 2026": 240,
        "Спортзалов отремонтировано": 5,
      },
    },
    {
      name: "Благоустройство дворов",
      metrics: {
        "Дворов благоустроено 2026": 34,
        "План на год": 60,
        "Детских площадок": 18,
        "Лавочек и урн": 420,
        "Освещение обновлено (дворов)": 22,
        "Жалоб на дворы (в работе)": 12,
      },
    },
    {
      name: "Общественные пространства и парки",
      metrics: {
        "Парков и скверов": 15,
        "Благоустроено 2026": 3,
        "В реконструкции": 2,
        "Набережная Пехорки (% готовности)": 45,
        "Высажено деревьев 2026": 1200,
        "Площадь озеленения (га)": 8.5,
      },
    },
    {
      name: "ЖКХ и коммуникации",
      metrics: {
        "Замена труб водоснабжения (км)": 4.8,
        "Замена теплотрасс (км)": 2.1,
        "Аварий на сетях (за месяц)": 7,
        "Среднее время устранения аварии (ч)": 4.2,
        "Домов после капремонта 2026": 12,
        "Лифтов заменено": 28,
        "Подъездов отремонтировано": 156,
      },
    },
  ],
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const startTime = Date.now();
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { messages, session_id } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Identify user from JWT (if present)
    let userId: string | null = null;
    const authHeader = req.headers.get("Authorization") || "";
    const jwt = authHeader.replace("Bearer ", "");
    if (jwt) {
      const { data: userData } = await supabase.auth.getUser(jwt);
      userId = userData?.user?.id || null;
    }

    // Trim to last 6 messages (3 pairs) for short-term context
    const trimmedMessages = messages?.slice(-6) || [];

    // Long-term memory + conversation history (only when user identified)
    let memoryBlock = "";
    let historyMessages: Array<{ role: string; content: string }> = [];
    if (userId) {
      const [memRes, histRes] = await Promise.all([
        supabase
          .from("ai_memory")
          .select("kind, key, value, created_at, expires_at")
          .eq("user_id", userId)
          .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
          .order("created_at", { ascending: false })
          .limit(50),
        supabase
          .from("ai_conversations")
          .select("role, content, created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(20),
      ]);
      const mem = memRes.data || [];
      if (mem.length > 0) {
        const decisions = mem.filter((m: any) => m.kind === "decision");
        const prefs = mem.filter((m: any) => m.kind === "preference");
        const notes = mem.filter((m: any) => m.kind === "context_note");
        const lines: string[] = ["ДОЛГОСРОЧНАЯ ПАМЯТЬ:"];
        if (decisions.length) {
          lines.push("Решения:");
          decisions.forEach((d: any) => lines.push(`  - [${new Date(d.created_at).toLocaleDateString("ru-RU")}] ${d.key}: ${d.value}`));
        }
        if (prefs.length) {
          lines.push("Предпочтения:");
          prefs.forEach((p: any) => lines.push(`  - ${p.key}: ${p.value}`));
        }
        if (notes.length) {
          lines.push("Заметки контекста:");
          notes.forEach((n: any) => lines.push(`  - ${n.key}: ${n.value}`));
        }
        memoryBlock = lines.join("\n");
      }
      // Older history (excluding the current turn already in messages)
      const hist = (histRes.data || []).reverse();
      historyMessages = hist
        .filter((h: any) => h.role === "user" || h.role === "assistant")
        .slice(0, 20)
        .map((h: any) => ({ role: h.role, content: h.content }));
    }

    // Fetch and aggregate city data
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const [incidentsRes, tasksRes, projectsRes, contractsRes, escalationsRes, mentionsRes] = await Promise.all([
      supabase.from("incidents").select("*").in("status", ["new", "in_progress"]).limit(50),
      supabase.from("tasks").select("*").neq("status", "completed").limit(50),
      supabase.from("projects").select("*").limit(30),
      supabase.from("contracts").select("*").limit(30),
      supabase.from("escalations").select("*").eq("status", "active").limit(20),
      supabase.from("media_mentions").select("topic, sentiment, title, published_at").gte("published_at", since).limit(50),
    ]);

    const incidents = incidentsRes.data || [];
    const tasks = tasksRes.data || [];
    const projects = projectsRes.data || [];
    const contracts = contractsRes.data || [];
    const escalations = escalationsRes.data || [];
    const mentions = mentionsRes.data || [];

    // Deterministic Risk Index
    const criticalIncidents = incidents.filter((i: any) => i.severity === "high").length;
    const overdueIncidents = incidents.filter((i: any) => i.sla_overdue).length;
    const overdueTasks = tasks.filter((t: any) => t.overdue).length;
    const highRiskProjects = projects.filter((p: any) => p.status === "risk" || p.status === "overdue").length;
    const overdueRatio = incidents.length > 0 ? overdueIncidents / incidents.length : 0;
    const trendFactor = overdueRatio > 0.3 ? 1 : overdueRatio > 0.1 ? 0.5 : 0;
    const riskIndex = Math.min(Math.round(
      (criticalIncidents * 0.4) + (overdueTasks * 0.3) + (highRiskProjects * 0.2) + (trendFactor * 10 * 0.1)
    ), 100);

    const deptSet = new Set<string>();
    incidents.forEach((i: any) => {
      if ((i.severity === "high" || i.sla_overdue) && i.department) deptSet.add(i.department);
    });

    // Aggregated context for LLM
    const highSensitivityIncidents = incidents.filter((i: any) => i.political_sensitivity === "high").length;
    const highSensitivityProjects = projects.filter((p: any) => p.political_sensitivity === "high").length;
    const highSensitivityContracts = contracts.filter((c: any) => c.political_sensitivity === "high").length;

    const negativeMentions = mentions.filter((m: any) => m.sentiment === "negative").length;
    const positiveMentions = mentions.filter((m: any) => m.sentiment === "positive").length;
    const repTopicCounts: Record<string, number> = {};
    mentions.forEach((m: any) => { if (m.topic) repTopicCounts[m.topic] = (repTopicCounts[m.topic] || 0) + 1; });
    const topReputationTopics = Object.entries(repTopicCounts).sort(([, a], [, b]) => (b as number) - (a as number)).slice(0, 3).map(([t]) => t);

    const aggregatedData = {
      date: new Date().toLocaleDateString("ru-RU"),
      cityRiskIndex: riskIndex,
      activeIncidents: incidents.length,
      criticalIncidents,
      overdueIncidents,
      activeTasks: tasks.length,
      overdueTasks,
      totalProjects: projects.length,
      highRiskProjects,
      activeContracts: contracts.length,
      highRiskContracts: contracts.filter((c: any) => c.risk_level === "high").length,
      departmentsAtRisk: Array.from(deptSet),
      activeEscalations: escalations.length,
      highSensitivityItems: highSensitivityIncidents + highSensitivityProjects + highSensitivityContracts,
      mentionsCount: mentions.length,
      negativeMentions,
      positiveMentions,
      topReputationTopics,
    };

    // Detailed context for copilot (more info than briefing but still structured)
    const detailContext: string[] = [];
    if (criticalIncidents > 0) {
      detailContext.push("КРИТИЧЕСКИЕ ИНЦИДЕНТЫ:");
      incidents.filter((i: any) => i.severity === "high").slice(0, 10).forEach((i: any) => {
        detailContext.push(`- [${i.status}] ${i.title} | ${i.department || "—"} | ${i.responsible || "—"} | SLA просрочен: ${i.sla_overdue ? "ДА" : "нет"}`);
      });
    }
    if (overdueTasks > 0) {
      detailContext.push("\nПРОСРОЧЕННЫЕ ПОРУЧЕНИЯ:");
      tasks.filter((t: any) => t.overdue).slice(0, 10).forEach((t: any) => {
        detailContext.push(`- ${t.title} | ${t.responsible || "—"} | Срок: ${t.deadline || "—"}`);
      });
    }
    if (highRiskProjects > 0) {
      detailContext.push("\nПРОЕКТЫ С РИСКАМИ:");
      projects.filter((p: any) => p.status === "risk" || p.status === "overdue").slice(0, 10).forEach((p: any) => {
        detailContext.push(`- [${p.status}] ${p.name} | ${p.progress}% | Блокер: ${p.blocker || "нет"}`);
      });
    }

    // Escalations context
    if (escalations.length > 0) {
      detailContext.push("\nАКТИВНЫЕ ЭСКАЛАЦИИ:");
      escalations.slice(0, 10).forEach((e: any) => {
        detailContext.push(`- [${e.type}] ${e.message} | Severity: ${e.severity}`);
      });
    }

    // High sensitivity items
    const sensitiveIncidents = incidents.filter((i: any) => i.political_sensitivity === "high");
    const sensitiveProjects = projects.filter((p: any) => p.political_sensitivity === "high");
    if (sensitiveIncidents.length > 0 || sensitiveProjects.length > 0) {
      detailContext.push("\n⚠️ ПОЛИТИЧЕСКИ ЧУВСТВИТЕЛЬНЫЕ ОБЪЕКТЫ:");
      sensitiveIncidents.forEach((i: any) => {
        detailContext.push(`- [ИНЦИДЕНТ] ${i.title} | ${i.department || "—"}`);
      });
      sensitiveProjects.forEach((p: any) => {
        detailContext.push(`- [ПРОЕКТ] ${p.name} | ${p.department || "—"}`);
      });
    }

    const systemPrompt = `Ты — City Copilot, AI-ассистент мэра города. Ты работаешь в интерактивном режиме.

АГРЕГИРОВАННЫЕ ДАННЫЕ:
${JSON.stringify(aggregatedData, null, 2)}

${detailContext.length > 0 ? "ДЕТАЛИ:\n" + detailContext.join("\n") : ""}

${memoryBlock ? memoryBlock + "\n" : ""}
ПРАВИЛА:
- Отвечай на русском языке, кратко и по делу.
- Используй ТОЛЬКО данные из контекста.
- ЗАПРЕЩЕНО выдумывать данные, цифры, имена.
- Если данных нет — ответь: "Недостаточно данных для анализа."
- Можешь задавать уточняющие вопросы.
- Форматируй ответы с помощью markdown.
- При запросе "доклад" или "сводка" — формируй структурированный отчёт.
- Поддерживай команды: "что критично", "риски", "просроченные", "статус проекта X", "подготовь доклад".
- City Risk Index: ${riskIndex}/100 — это детерминированный показатель, интерпретируй его.

ДОЛГОСРОЧНАЯ ПАМЯТЬ — ПРАВИЛА:
- Учитывай записи из блока "ДОЛГОСРОЧНАЯ ПАМЯТЬ" (решения, предпочтения пользователя).
- Если пользователь сказал "запомни", "сохрани", "учти на будущее" — в КОНЦЕ ответа добавь строку:
  MEMORY_SAVE: kind=preference|decision|context_note; key=<короткий_id>; value=<суть>
  Можно несколько таких строк подряд. Не показывай эти строки как часть основного ответа — это служебный маркер.
- Если пользователь сказал "забудь X" — добавь строку: MEMORY_DELETE: key=<id>

ПОЛИТИЧЕСКАЯ ЧУВСТВИТЕЛЬНОСТЬ:
- Для объектов с political_sensitivity=high ЗАПРЕЩЕНО предлагать автоматические действия.
- Только рекомендуй мэру рассмотреть лично. Формулировка: "Требуется личное решение мэра."
- Не упоминай слово "чувствительность" напрямую, используй: "требует особого внимания руководства".
- При наличии эскалаций — обязательно упомяни их в начале ответа.

ФОРМАТ ОТВЕТА — когда уместно, включай в конец блок с рекомендуемыми действиями:
При рекомендации действий используй формат:
**Рекомендуемые действия:**
1. [действие] — приоритет: высокий/средний/низкий`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        temperature: 0.3,
        top_p: 0.8,
        max_tokens: 2048,
        messages: [
          { role: "system", content: systemPrompt },
          ...historyMessages,
          ...trimmedMessages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Превышен лимит запросов, попробуйте позже." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Необходимо пополнить баланс AI." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    // Log to ai_logs (async)
    const lastUserMsg = trimmedMessages.filter((m: any) => m.role === "user").pop();
    supabase.from("ai_logs").insert({
      module: "copilot",
      input_summary: lastUserMsg?.content?.slice(0, 300) || "stream request",
      output_summary: "streaming response",
      error_flag: false,
      risk_index: riskIndex,
      duration_ms: Date.now() - startTime,
    }).then(() => {}).catch(() => {});

    // Tee the stream: one branch returned to client, one captured for persistence
    const [clientStream, captureStream] = response.body!.tee();

    // Background: capture full assistant text and persist memory
    const persist = async () => {
      try {
        if (!userId) return;
        const reader = captureStream.getReader();
        const decoder = new TextDecoder();
        let buf = "";
        let assistantText = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          let nl: number;
          while ((nl = buf.indexOf("\n")) !== -1) {
            let line = buf.slice(0, nl);
            buf = buf.slice(nl + 1);
            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (!line.startsWith("data: ")) continue;
            const j = line.slice(6).trim();
            if (j === "[DONE]") continue;
            try {
              const parsed = JSON.parse(j);
              const c = parsed.choices?.[0]?.delta?.content;
              if (c) assistantText += c;
            } catch { /* partial */ }
          }
        }

        // Save user + assistant messages
        const userMsg = trimmedMessages.filter((m: any) => m.role === "user").pop();
        const rows: any[] = [];
        if (userMsg?.content) {
          rows.push({ user_id: userId, session_id: session_id || null, role: "user", content: String(userMsg.content).slice(0, 4000) });
        }
        if (assistantText) {
          rows.push({ user_id: userId, session_id: session_id || null, role: "assistant", content: assistantText.slice(0, 8000) });
        }
        if (rows.length) await supabase.from("ai_conversations").insert(rows);

        // Extract MEMORY_SAVE / MEMORY_DELETE markers
        const saveRe = /MEMORY_SAVE:\s*kind=(decision|preference|context_note);\s*key=([^;\n]+);\s*value=([^\n]+)/g;
        const delRe = /MEMORY_DELETE:\s*key=([^\n]+)/g;
        let m: RegExpExecArray | null;
        const ups: any[] = [];
        while ((m = saveRe.exec(assistantText)) !== null) {
          ups.push({
            user_id: userId,
            kind: m[1].trim(),
            key: m[2].trim().slice(0, 80),
            value: m[3].trim().slice(0, 1000),
            source: "extracted",
          });
        }
        if (ups.length) {
          await supabase.from("ai_memory").upsert(ups, { onConflict: "user_id,kind,key" });
        }
        const dels: string[] = [];
        while ((m = delRe.exec(assistantText)) !== null) dels.push(m[1].trim());
        if (dels.length) {
          await supabase.from("ai_memory").delete().eq("user_id", userId).in("key", dels);
        }
      } catch (e) {
        console.error("persist error:", e);
      }
    };
    // @ts-ignore — Deno Deploy
    if (typeof EdgeRuntime !== "undefined" && (EdgeRuntime as any).waitUntil) {
      // @ts-ignore
      EdgeRuntime.waitUntil(persist());
    } else {
      persist();
    }

    return new Response(clientStream, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    const durationMs = Date.now() - startTime;
    console.error("city-copilot error:", e);

    supabase.from("ai_logs").insert({
      module: "copilot",
      input_summary: "error",
      output_summary: e instanceof Error ? e.message : "Unknown error",
      error_flag: true,
      duration_ms: durationMs,
    }).then(() => {}).catch(() => {});

    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
