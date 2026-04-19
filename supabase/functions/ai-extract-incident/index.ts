// AI Data Structuring — извлечение структурированных полей из сырого текста
// (Phase C, Lovable AI Gateway, gemini-3-flash-preview)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Ты — система структурирования городских обращений в г. Реутов (Московская область).
На входе — сырой текст письма / сообщения / жалобы. Извлеки структурированные поля.

ПРАВИЛА:
- type: один из [housing, road, social, ecology, transport, other]
  * housing — ЖКХ: вода, тепло, канализация, электричество, лифты, кровля
  * road — дороги, ямы, асфальт, тротуары, разметка
  * social — школы, детсады, больницы, соцобъекты
  * ecology — мусор, свалки, запахи, загрязнения, деревья
  * transport — светофоры, автобусы, парковки
  * other — всё остальное
- severity: один из [low, medium, high]
  * high — авария, без воды/тепла/света, угроза безопасности, соцобъект
  * medium — серьёзно, но локально, не угрожает жизни
  * low — мелкий ремонт, неудобство, эстетика
- address: чистый адрес в формате "г. Реутов, ул. <название>, <номер>". Если не указан — null.
- department: один из [
  "Управление ЖКХ и энергетики",
  "Управление дорожного хозяйства",
  "Управление благоустройства",
  "Управление образования",
  "Другое"
]
- suggested_title: краткий заголовок (до 80 символов), деловой стиль, без эмоций
- political_sensitivity: low | medium | high (high = школы/больницы/массовые жалобы)
- confidence: 0-100, твоя уверенность в извлечении

ВЕРНИ ТОЛЬКО JSON через tool call. Без объяснений.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const { raw_text, source_id } = await req.json();

    if (!raw_text || typeof raw_text !== "string" || raw_text.length < 5) {
      return new Response(
        JSON.stringify({ error: "raw_text required (min 5 chars)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    const aiResp = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: raw_text },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "extract_incident",
                description: "Извлечь структурированные поля инцидента",
                parameters: {
                  type: "object",
                  properties: {
                    type: {
                      type: "string",
                      enum: ["housing", "road", "social", "ecology", "transport", "other"],
                    },
                    severity: {
                      type: "string",
                      enum: ["low", "medium", "high"],
                    },
                    address: { type: ["string", "null"] },
                    department: { type: "string" },
                    suggested_title: { type: "string" },
                    political_sensitivity: {
                      type: "string",
                      enum: ["low", "medium", "high"],
                    },
                    confidence: { type: "number" },
                    reasoning: { type: "string" },
                  },
                  required: [
                    "type",
                    "severity",
                    "department",
                    "suggested_title",
                    "political_sensitivity",
                    "confidence",
                  ],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "extract_incident" },
          },
          temperature: 0.2,
          top_p: 0.8,
        }),
      },
    );

    if (aiResp.status === 429) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded, попробуйте позже" }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (aiResp.status === 402) {
      return new Response(
        JSON.stringify({ error: "Лимит AI исчерпан, пополните workspace" }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (!aiResp.ok) {
      const t = await aiResp.text();
      console.error("AI gateway error:", aiResp.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResp.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(
        JSON.stringify({ error: "AI did not return structured output" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const extracted = JSON.parse(toolCall.function.arguments);

    // Логируем в ai_logs
    try {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      );
      await supabase.from("ai_logs").insert({
        module: "ai-extract-incident",
        input_summary: raw_text.slice(0, 200),
        output_summary: JSON.stringify(extracted).slice(0, 500),
        error_flag: false,
      });

      // Опционально: записываем в staging_raw
      if (source_id) {
        await supabase.from("staging_raw").insert({
          source_id,
          raw_payload: { raw_text },
          parsed_payload: extracted,
          status: "parsed",
          confidence: extracted.confidence ?? 70,
          target_table: "incidents",
        });
      }
    } catch (e) {
      console.error("Logging error (non-fatal):", e);
    }

    return new Response(JSON.stringify({ extracted }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-extract-incident error:", e);
    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
