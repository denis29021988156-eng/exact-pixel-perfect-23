import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Deterministic fallback briefing — used when AI Gateway is unavailable.
// Always returns something useful so the mayor never sees an empty screen.
function buildDeterministicBriefing(stats: {
  riskIndex: number;
  activeIncidents: number;
  criticalIncidents: number;
  overdueIncidents: number;
  overdueTasks: number;
  highRiskProjects: number;
  departmentsAtRisk: string[];
}) {
  const level =
    stats.riskIndex <= 15 ? 'низкий'
    : stats.riskIndex <= 40 ? 'умеренный'
    : stats.riskIndex <= 70 ? 'повышенный'
    : 'критический';

  const summary = `Технический режим (AI недоступен). City Risk Index: ${stats.riskIndex}/100 — уровень ${level}. ` +
    `Активных инцидентов: ${stats.activeIncidents}, из них критических: ${stats.criticalIncidents}, ` +
    `с нарушением SLA: ${stats.overdueIncidents}. Просроченных задач: ${stats.overdueTasks}.`;

  const keyRisks: string[] = [];
  if (stats.criticalIncidents > 0) keyRisks.push(`${stats.criticalIncidents} критических инцидентов требуют внимания`);
  if (stats.overdueIncidents > 0) keyRisks.push(`${stats.overdueIncidents} инцидентов с нарушением SLA`);
  if (stats.overdueTasks > 0) keyRisks.push(`${stats.overdueTasks} просроченных задач у ответственных`);
  if (stats.highRiskProjects > 0) keyRisks.push(`${stats.highRiskProjects} проектов в зоне риска`);
  if (stats.departmentsAtRisk.length > 0) keyRisks.push(`Департаменты в зоне риска: ${stats.departmentsAtRisk.join(', ')}`);

  const recommendedActions: string[] = [];
  if (stats.criticalIncidents > 0) recommendedActions.push('Проверить статус критических инцидентов и ответственных');
  if (stats.overdueIncidents > 0) recommendedActions.push('Запросить отчёт по нарушениям SLA');
  if (recommendedActions.length === 0) recommendedActions.push('Дождаться восстановления аналитического модуля для подробной интерпретации');

  return {
    summary,
    riskLevelInterpretation: `Уровень риска ${level} (${stats.riskIndex}/100). Расчёт детерминированный, без AI-интерпретации.`,
    keyRisks,
    recommendedActions,
  };
}

// Update AI status state and trigger admin alert with deduplication.
// Sends one alert when AI goes down (after 2 consecutive failures), one when it recovers.
async function updateAiStatus(supabase: any, ok: boolean, errorMessage?: string) {
  try {
    const { data: state } = await supabase
      .from('ai_status_state')
      .select('*')
      .eq('id', 1)
      .maybeSingle();

    if (!state) return;

    const wasDown = state.current_state === 'down';
    let nextState = state.current_state;
    let nextFailures = state.consecutive_failures;
    let shouldAlert = false;
    let alertText = '';

    if (ok) {
      nextFailures = 0;
      if (wasDown) {
        nextState = 'active';
        shouldAlert = true;
        alertText = '✅ AI восстановлен. Аналитический модуль снова работает.';
      } else {
        nextState = 'active';
      }
    } else {
      nextFailures = state.consecutive_failures + 1;
      if (nextFailures >= 2 && !wasDown) {
        nextState = 'down';
        shouldAlert = true;
        alertText = `🚨 AI недоступен (${nextFailures} подряд). Брифинги переведены в технический режим. Ошибка: ${errorMessage ?? 'unknown'}`;
      } else if (nextFailures === 1) {
        nextState = 'degraded';
      }
    }

    await supabase
      .from('ai_status_state')
      .update({
        current_state: nextState,
        last_changed_at: nextState !== state.current_state ? new Date().toISOString() : state.last_changed_at,
        consecutive_failures: nextFailures,
        last_alert_at: shouldAlert ? new Date().toISOString() : state.last_alert_at,
      })
      .eq('id', 1);

    if (shouldAlert) {
      // Fire-and-forget admin notification
      supabase.functions.invoke('notify-admin', {
        body: { kind: 'ai_status', message: alertText },
      }).catch((e: any) => console.error('notify-admin failed:', e));
    }
  } catch (e) {
    console.error('updateAiStatus failed:', e);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const startTime = Date.now();
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Compute deterministic stats up-front so we can always fallback
  let stats = { riskIndex: 0, activeIncidents: 0, criticalIncidents: 0, overdueIncidents: 0, overdueTasks: 0, highRiskProjects: 0, departmentsAtRisk: [] as string[] };
  let aggregatedContext = '';
  let incidents: any[] = [], tasks: any[] = [], projects: any[] = [];
  let riskIndex = 0;

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Fetch current data
    const [incidentsRes, tasksRes, projectsRes] = await Promise.all([
      supabase.from("incidents").select("*").neq("status", "closed").limit(50),
      supabase.from("tasks").select("*").neq("status", "completed").limit(50),
      supabase.from("projects").select("*").limit(20),
    ]);

    incidents = incidentsRes.data || [];
    tasks = tasksRes.data || [];
    projects = projectsRes.data || [];

    // Deterministic Risk Index (computed before AI)
    const criticalIncidents = incidents.filter((i: any) => i.severity === "high").length;
    const overdueIncidents = incidents.filter((i: any) => i.sla_overdue).length;
    const overdueTasks = tasks.filter((t: any) => t.overdue).length;
    const highRiskProjects = projects.filter((p: any) => p.status === "risk" || p.status === "overdue").length;

    const overdueRatio = incidents.length > 0 ? overdueIncidents / incidents.length : 0;
    const trendFactor = overdueRatio > 0.3 ? 1 : overdueRatio > 0.1 ? 0.5 : 0;
    riskIndex = Math.min(Math.round(
      (criticalIncidents * 0.4) +
      (overdueTasks * 0.3) +
      (highRiskProjects * 0.2) +
      (trendFactor * 10 * 0.1)
    ), 100);

    const deptSet = new Set<string>();
    incidents.forEach((i: any) => {
      if ((i.severity === "high" || i.sla_overdue) && i.department) deptSet.add(i.department);
    });
    stats = {
      riskIndex,
      activeIncidents: incidents.length,
      criticalIncidents,
      overdueIncidents,
      overdueTasks,
      highRiskProjects,
      departmentsAtRisk: Array.from(deptSet),
    };

    // Aggregated context (no raw SQL)
    aggregatedContext = JSON.stringify({
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

    const systemPrompt = `Ты — аналитический AI-модуль ситуационного центра города. Ты готовишь сводку для мэра в управленческом тоне.

ШКАЛА City Risk Index:
- 0–30 — низкий ("город работает в штатном режиме")
- 31–60 — умеренный ("точечные риски, контроль на месте")
- 61–80 — повышенный ("требуется усиление контроля")
- 81–100 — критический ("необходимо личное вмешательство руководства")

ПРАВИЛА ТОНА:
- Деловой, спокойный, управленческий.
- ЗАПРЕЩЕНЫ слова и обороты: "чрезвычайная ситуация", "кризисное управление", "мобилизация резерва", "дестабилизация", "максимальная угроза", "потеря управления".
- Не нагнетать. При низком/умеренном Risk Index формулировки уверенные: "Город работает в штатном режиме", "Ситуация под контролем".
- Используй конкретику: имена ответственных, департаменты, адреса из данных. Не абстрактные отрасли.
- summary должен начинаться с того, что ПОД КОНТРОЛЕМ (закрытые инциденты, % выполнения проектов), затем 1 предложение про точки внимания.
- keyRisks — не более 3 пунктов и только если они реально есть. Если рисков нет — пустой массив.
- recommendedActions — конкретные шаги в формате: "Поручить [департамент/ФИО] — [что сделать] — срок [когда]". Не общие лозунги.
- Без эмодзи. Без выдумок. Только данные из контекста.

ФОРМАТ ОТВЕТА — строго JSON:
{
  "summary": "...",
  "riskLevelInterpretation": "...",
  "keyRisks": ["..."],
  "recommendedActions": ["..."]
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
      const errorText = await response.text().catch(() => '');
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway ${response.status}`);
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

    // Mark AI healthy
    await updateAiStatus(supabase, true);

    return new Response(JSON.stringify({
      briefing: briefingText,
      structured,
      riskIndex,
      mode: 'ai',
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
    const errMsg = e instanceof Error ? e.message : 'Unknown error';

    // Log error
    await supabase.from("ai_logs").insert({
      module: "briefing",
      input_summary: "error during generation",
      output_summary: errMsg,
      error_flag: true,
      duration_ms: durationMs,
    }).catch(() => {});

    // Update AI status (might trigger dedup'd admin alert)
    await updateAiStatus(supabase, false, errMsg);

    // ETAP 5: Deterministic fallback — never return empty
    const structured = buildDeterministicBriefing(stats);
    const briefingText = [
      `**Обзор ситуации (технический режим)**\n${structured.summary}`,
      `**Оценка Risk Index: ${stats.riskIndex}/100**\n${structured.riskLevelInterpretation}`,
      structured.keyRisks.length ? `**Ключевые риски**\n${structured.keyRisks.map((r) => `- ${r}`).join('\n')}` : '',
      structured.recommendedActions.length ? `**Рекомендуемые действия**\n${structured.recommendedActions.map((a, i) => `${i + 1}. ${a}`).join('\n')}` : '',
    ].filter(Boolean).join('\n\n');

    return new Response(JSON.stringify({
      briefing: briefingText,
      structured,
      riskIndex: stats.riskIndex,
      mode: 'fallback',
      fallbackReason: errMsg,
      stats: {
        activeIncidents: stats.activeIncidents,
        criticalIncidents: stats.criticalIncidents,
        overdueIncidents: stats.overdueIncidents,
        overdueTasks: stats.overdueTasks,
        riskyProjects: stats.highRiskProjects,
      },
      generatedAt: new Date().toISOString(),
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
