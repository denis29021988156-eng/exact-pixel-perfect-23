import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Fetch city context
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const [incidentsRes, tasksRes, projectsRes, contractsRes] = await Promise.all([
      supabase.from("incidents").select("*").in("status", ["new", "in_progress"]).limit(50),
      supabase.from("tasks").select("*").neq("status", "completed").limit(50),
      supabase.from("projects").select("*").limit(30),
      supabase.from("contracts").select("*").limit(30),
    ]);

    const today = new Date().toLocaleDateString("ru-RU");
    const contextParts: string[] = [`Сегодня: ${today}`];

    if (incidentsRes.data?.length) {
      const critical = incidentsRes.data.filter(i => i.severity === "high");
      const overdue = incidentsRes.data.filter(i => i.sla_overdue);
      contextParts.push(`ИНЦИДЕНТЫ (${incidentsRes.data.length} активных, ${critical.length} критических, ${overdue.length} просроченных):`);
      incidentsRes.data.slice(0, 20).forEach(i => {
        contextParts.push(`- [${i.severity}/${i.status}] ${i.title} | ${i.department || "—"} | ${i.responsible || "—"} | SLA просрочен: ${i.sla_overdue ? "ДА" : "нет"}`);
      });
    }

    if (tasksRes.data?.length) {
      const overdue = tasksRes.data.filter(t => t.overdue);
      contextParts.push(`\nПОРУЧЕНИЯ (${tasksRes.data.length} активных, ${overdue.length} просроченных):`);
      tasksRes.data.slice(0, 15).forEach(t => {
        contextParts.push(`- [${t.status}] ${t.title} | ${t.responsible || "—"} | Срок: ${t.deadline || "—"} | Просрочено: ${t.overdue ? "ДА" : "нет"}`);
      });
    }

    if (projectsRes.data?.length) {
      const risky = projectsRes.data.filter(p => p.status === "risk" || p.status === "overdue");
      contextParts.push(`\nПРОЕКТЫ (${projectsRes.data.length} всего, ${risky.length} с рисками):`);
      projectsRes.data.slice(0, 15).forEach(p => {
        contextParts.push(`- [${p.status}] ${p.name} | ${p.progress}% | ${p.department || "—"} | Блокер: ${p.blocker || "нет"}`);
      });
    }

    if (contractsRes.data?.length) {
      contextParts.push(`\nКОНТРАКТЫ (${contractsRes.data.length}):`);
      contractsRes.data.slice(0, 10).forEach(c => {
        contextParts.push(`- [${c.status}/${c.risk_level}] ${c.name} | ${c.contractor || "—"} | ${c.amount ? c.amount.toLocaleString() + " ₽" : "—"}`);
      });
    }

    const systemPrompt = `Ты — City Copilot, AI-ассистент мэра города. Ты имеешь доступ к актуальным данным ситуационного центра.

ТВОИ ДАННЫЕ:
${contextParts.join("\n")}

ПРАВИЛА:
- Отвечай на русском языке, кратко и по делу.
- Используй данные из контекста для ответов.
- Можешь анализировать ситуацию, находить риски, давать рекомендации.
- При запросе "доклад" или "сводка" — формируй структурированный отчёт.
- Поддерживай команды: "что критично", "риски", "просроченные", "статус проекта X", "подготовь доклад".
- Форматируй ответы с помощью markdown.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
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

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("city-copilot error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
