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
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Fetch current data
    const [incidentsRes, tasksRes, projectsRes] = await Promise.all([
      supabase.from("incidents").select("*").neq("status", "closed").limit(50),
      supabase.from("tasks").select("*").neq("status", "completed").limit(50),
      supabase.from("projects").select("*").limit(20),
    ]);

    const incidents = incidentsRes.data || [];
    const tasks = tasksRes.data || [];
    const projects = projectsRes.data || [];

    // Deterministic Risk Index (computed before AI)
    const criticalIncidents = incidents.filter((i: any) => i.severity === "high").length;
    const overdueIncidents = incidents.filter((i: any) => i.sla_overdue).length;
    const overdueTasks = tasks.filter((t: any) => t.overdue).length;
    const highRiskProjects = projects.filter((p: any) => p.status === "risk" || p.status === "overdue").length;

    const overdueRatio = incidents.length > 0 ? overdueIncidents / incidents.length : 0;
    const trendFactor = overdueRatio > 0.3 ? 1 : overdueRatio > 0.1 ? 0.5 : 0;
    const riskIndex = Math.min(Math.round(
      (criticalIncidents * 0.4) +
      (overdueTasks * 0.3) +
      (highRiskProjects * 0.2) +
      (trendFactor * 10 * 0.1)
    ), 100);

    const deptSet = new Set<string>();
    incidents.forEach((i: any) => {
      if ((i.severity === "high" || i.sla_overdue) && i.department) deptSet.add(i.department);
    });

    // Aggregated context (no raw SQL)
    const aggregatedContext = JSON.stringify({
      date: new Date().toISOString().split("T")[0],
      cityRiskIndex: riskIndex,
      activeIncidents: incidents.length,
      criticalIncidents,
      overdueIncidents,
      activeTasks: tasks.length,
      overdueTasks,
      totalProjects: projects.length,
      highRiskProjects,
      departmentsAtRisk: Array.from(deptSet),
      incidentsByType: {
        housing: incidents.filter((i: any) => i.type === "housing").length,
        road: incidents.filter((i: any) => i.type === "road").length,
        social: incidents.filter((i: any) => i.type === "social").length,
        ecology: incidents.filter((i: any) => i.type === "ecology").length,
        transport: incidents.filter((i: any) => i.type === "transport").length,
        other: incidents.filter((i: any) => i.type === "other").length,
      },
    }, null, 2);

    const systemPrompt = `Ты — аналитический AI-модуль ситуационного центра города. Ты интерпретируешь агрегированные данные.

ПРАВИЛА:
- Без эмоций, без предположений, без выдумок.
- Только интерпретация входных данных.
- Если данных недостаточно — указывай это.
- Не используй эмодзи.
- Отвечай на русском языке.

ФОРМАТ ОТВЕТА — строго JSON:
{
  "summary": "Краткий обзор ситуации (2-3 предложения)",
  "riskLevelInterpretation": "Интерпретация City Risk Index",
  "keyRisks": ["Конкретный риск 1", "Конкретный риск 2"],
  "recommendedActions": ["Действие 1", "Действие 2"]
}

Верни ТОЛЬКО валидный JSON, без markdown, без комментариев.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        temperature: 0.2,
        top_p: 0.8,
        max_tokens: 1024,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Проанализируй текущие агрегированные данные города:\n${aggregatedContext}` },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Превышен лимит запросов. Попробуйте позже." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Необходимо пополнить баланс AI." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const aiResponse = await response.json();
    let rawContent = aiResponse.choices?.[0]?.message?.content || "";

    // Parse structured JSON response with fallback
    let structured: any = null;
    try {
      // Strip markdown code fences if present
      const cleaned = rawContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      structured = JSON.parse(cleaned);
    } catch {
      // Fallback: retry request asking for valid JSON
      console.warn("Briefing JSON parse failed, using raw text fallback");
      structured = {
        summary: rawContent,
        riskLevelInterpretation: `City Risk Index: ${riskIndex}`,
        keyRisks: [],
        recommendedActions: [],
      };
    }

    const durationMs = Date.now() - startTime;

    // Format briefing text for display
    const briefingText = [
      `**Обзор ситуации**\n${structured.summary}`,
      `**Оценка Risk Index: ${riskIndex}/100**\n${structured.riskLevelInterpretation}`,
      structured.keyRisks?.length ? `**Ключевые риски**\n${structured.keyRisks.map((r: string) => `- ${r}`).join('\n')}` : '',
      structured.recommendedActions?.length ? `**Рекомендуемые действия**\n${structured.recommendedActions.map((a: string, i: number) => `${i + 1}. ${a}`).join('\n')}` : '',
    ].filter(Boolean).join('\n\n');

    // Log to ai_logs
    await supabase.from("ai_logs").insert({
      module: "briefing",
      input_summary: `incidents:${incidents.length} tasks:${tasks.length} projects:${projects.length} risk:${riskIndex}`,
      output_summary: structured.summary?.slice(0, 500),
      error_flag: false,
      risk_index: riskIndex,
      duration_ms: durationMs,
    });

    return new Response(JSON.stringify({
      briefing: briefingText,
      structured,
      riskIndex,
      stats: {
        activeIncidents: incidents.length,
        criticalIncidents,
        overdueIncidents,
        overdueTasks,
        riskyProjects: highRiskProjects,
      },
      generatedAt: new Date().toISOString(),
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const durationMs = Date.now() - startTime;
    console.error("city-briefing error:", e);

    // Log error
    await supabase.from("ai_logs").insert({
      module: "briefing",
      input_summary: "error during generation",
      output_summary: e instanceof Error ? e.message : "Unknown error",
      error_flag: true,
      duration_ms: durationMs,
    }).catch(() => {});

    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
