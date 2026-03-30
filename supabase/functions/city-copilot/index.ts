import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const startTime = Date.now();
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Trim to last 6 messages (3 pairs) to control context size
    const trimmedMessages = messages?.slice(-6) || [];

    // Fetch and aggregate city data
    const [incidentsRes, tasksRes, projectsRes, contractsRes, escalationsRes] = await Promise.all([
      supabase.from("incidents").select("*").in("status", ["new", "in_progress"]).limit(50),
      supabase.from("tasks").select("*").neq("status", "completed").limit(50),
      supabase.from("projects").select("*").limit(30),
      supabase.from("contracts").select("*").limit(30),
      supabase.from("escalations").select("*").eq("status", "active").limit(20),
    ]);

    const incidents = incidentsRes.data || [];
    const tasks = tasksRes.data || [];
    const projects = projectsRes.data || [];
    const contracts = contractsRes.data || [];
    const escalations = escalationsRes.data || [];

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

    const systemPrompt = `Ты — City Copilot, AI-ассистент мэра города. Ты работаешь в интерактивном режиме.

АГРЕГИРОВАННЫЕ ДАННЫЕ:
${JSON.stringify(aggregatedData, null, 2)}

${detailContext.length > 0 ? "ДЕТАЛИ:\n" + detailContext.join("\n") : ""}

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

    // Log to ai_logs (async, don't block stream)
    const lastUserMsg = trimmedMessages.filter((m: any) => m.role === "user").pop();
    supabase.from("ai_logs").insert({
      module: "copilot",
      input_summary: lastUserMsg?.content?.slice(0, 300) || "stream request",
      output_summary: "streaming response",
      error_flag: false,
      risk_index: riskIndex,
      duration_ms: Date.now() - startTime,
    }).then(() => {}).catch(() => {});

    return new Response(response.body, {
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
