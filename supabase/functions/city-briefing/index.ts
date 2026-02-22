import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch current data for AI context
    const [incidentsRes, tasksRes, projectsRes] = await Promise.all([
      supabase.from("incidents").select("*").neq("status", "closed").limit(50),
      supabase.from("tasks").select("*").neq("status", "completed").limit(50),
      supabase.from("projects").select("*").limit(20),
    ]);

    const incidents = incidentsRes.data || [];
    const tasks = tasksRes.data || [];
    const projects = projectsRes.data || [];

    const today = new Date().toISOString().split("T")[0];

    const dataContext = `
Текущая дата: ${today}

ИНЦИДЕНТЫ В РАБОТЕ (${incidents.length}):
${incidents.map(i => `- [${i.severity}] ${i.title} | Статус: ${i.status} | Ответственный: ${i.responsible || 'не назначен'} | SLA просрочен: ${i.sla_overdue ? 'ДА' : 'нет'} | Соцобъект: ${i.social_object ? 'ДА' : 'нет'}`).join("\n")}

ЗАДАЧИ НЕ ЗАВЕРШЕНЫ (${tasks.length}):
${tasks.map(t => `- ${t.title} | Статус: ${t.status} | Дедлайн: ${t.deadline || 'не указан'} | Просрочено: ${t.overdue ? 'ДА' : 'нет'} | Ответственный: ${t.responsible || 'не назначен'}`).join("\n")}

ПРОЕКТЫ (${projects.length}):
${projects.map(p => `- ${p.name} | Статус: ${p.status} | Прогресс: ${p.progress}% | Блокер: ${p.blocker || 'нет'}`).join("\n")}
`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `Ты — аналитический AI-ассистент мэра города. Ты анализируешь данные ситуационного центра и даёшь краткую, структурированную сводку дня.

Формат ответа (СТРОГО):
1. **Обзор ситуации** (2-3 предложения об общем состоянии города)
2. **Критические точки** (список ключевых проблем с конкретикой)
3. **Рекомендуемые действия** (конкретные шаги для руководства, пронумерованные)
4. **Прогноз рисков** (что может ухудшиться в ближайшие дни)

Пиши кратко, по-деловому, на русском языке. Не используй эмодзи. Используй конкретные цифры из данных.`,
          },
          {
            role: "user",
            content: `Подготовь утреннюю сводку для мэра на основе текущих данных:\n${dataContext}`,
          },
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
    const briefing = aiResponse.choices?.[0]?.message?.content || "Не удалось сгенерировать сводку.";

    return new Response(JSON.stringify({
      briefing,
      stats: {
        activeIncidents: incidents.length,
        criticalIncidents: incidents.filter(i => i.severity === "high").length,
        overdueIncidents: incidents.filter(i => i.sla_overdue).length,
        overdueTasks: tasks.filter(t => t.overdue).length,
        riskyProjects: projects.filter(p => p.status === "risk" || p.status === "overdue").length,
      },
      generatedAt: new Date().toISOString(),
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("city-briefing error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
