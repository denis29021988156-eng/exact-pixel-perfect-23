// Telegram Connector — long-polling getUpdates через connector gateway
// Запускается по расписанию (pg_cron или вручную из UI).
// Сохраняет входящие сообщения в telegram_messages, обновляет offset,
// затем для каждого нового сообщения вызывает ai-extract-incident
// и кладёт результат в staging_raw.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const GATEWAY_URL = "https://connector-gateway.lovable.dev/telegram";
const MAX_RUNTIME_MS = 25_000; // короче — для on-demand вызова из UI
const MIN_REMAINING_MS = 4_000;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const startTime = Date.now();
  const startedAt = new Date().toISOString();

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const TELEGRAM_API_KEY = Deno.env.get("TELEGRAM_API_KEY");
    if (!TELEGRAM_API_KEY) throw new Error("TELEGRAM_API_KEY is not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase env not configured");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Получаем data_source id для Telegram
    const { data: ds } = await supabase
      .from("data_sources")
      .select("id")
      .eq("type", "telegram")
      .limit(1)
      .maybeSingle();
    const sourceId = ds?.id ?? null;

    // Текущий offset
    const { data: state, error: stateErr } = await supabase
      .from("telegram_bot_state")
      .select("update_offset")
      .eq("id", 1)
      .single();
    if (stateErr) throw new Error(`bot_state read: ${stateErr.message}`);

    let currentOffset: number = state.update_offset;
    let totalProcessed = 0;
    let totalExtracted = 0;
    let totalErrors = 0;
    const messages: any[] = [];

    while (true) {
      const elapsed = Date.now() - startTime;
      const remainingMs = MAX_RUNTIME_MS - elapsed;
      if (remainingMs < MIN_REMAINING_MS) break;

      const timeout = Math.min(20, Math.floor(remainingMs / 1000) - 3);
      if (timeout < 1) break;

      const tgResp = await fetch(`${GATEWAY_URL}/getUpdates`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "X-Connection-Api-Key": TELEGRAM_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          offset: currentOffset,
          timeout,
          allowed_updates: ["message"],
        }),
      });

      const tgData = await tgResp.json();
      if (!tgResp.ok) {
        throw new Error(
          `Telegram getUpdates failed [${tgResp.status}]: ${JSON.stringify(tgData)}`,
        );
      }

      const updates = tgData.result ?? [];
      if (updates.length === 0) {
        // Нет новых — выходим (long-poll уже подождал timeout)
        break;
      }

      const rows = updates
        .filter((u: any) => u.message)
        .map((u: any) => ({
          update_id: u.update_id,
          chat_id: u.message.chat.id,
          chat_title: u.message.chat.title ?? u.message.chat.username ?? null,
          from_username:
            u.message.from?.username ?? u.message.from?.first_name ?? null,
          text: u.message.text ?? u.message.caption ?? null,
          raw_update: u,
        }));

      if (rows.length > 0) {
        const { error: insertErr } = await supabase
          .from("telegram_messages")
          .upsert(rows, { onConflict: "update_id" });
        if (insertErr) throw new Error(`upsert: ${insertErr.message}`);
        totalProcessed += rows.length;
        messages.push(...rows);
      }

      // Сдвигаем offset
      const newOffset = Math.max(...updates.map((u: any) => u.update_id)) + 1;
      const { error: offErr } = await supabase
        .from("telegram_bot_state")
        .update({ update_offset: newOffset, updated_at: new Date().toISOString() })
        .eq("id", 1);
      if (offErr) throw new Error(`offset update: ${offErr.message}`);
      currentOffset = newOffset;
    }

    // Для каждого нового сообщения — AI extraction (последовательно, чтобы не словить rate-limit)
    for (const msg of messages) {
      if (!msg.text || msg.text.length < 5) continue;
      try {
        const aiResp = await fetch(
          `${SUPABASE_URL}/functions/v1/ai-extract-incident`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              raw_text: `Telegram (${msg.from_username ?? "unknown"}): ${msg.text}`,
              source_id: sourceId,
            }),
          },
        );
        const aiData = await aiResp.json();
        if (!aiResp.ok) {
          totalErrors++;
          await supabase
            .from("telegram_messages")
            .update({
              processed: true,
              error_message: aiData.error ?? "ai-extract failed",
            })
            .eq("update_id", msg.update_id);
          continue;
        }
        const extracted = aiData.extracted ?? {};
        const confidence = Number(extracted.confidence ?? 0);

        // Найдём последний staging_raw, созданный ai-extract для этого источника
        const { data: lastStaging } = await supabase
          .from("staging_raw")
          .select("id")
          .eq("source_id", sourceId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        await supabase
          .from("telegram_messages")
          .update({
            processed: true,
            extracted_payload: extracted,
            confidence,
            staging_raw_id: lastStaging?.id ?? null,
          })
          .eq("update_id", msg.update_id);
        totalExtracted++;
      } catch (e) {
        totalErrors++;
        await supabase
          .from("telegram_messages")
          .update({
            processed: true,
            error_message: e instanceof Error ? e.message : "Unknown error",
          })
          .eq("update_id", msg.update_id);
      }
    }

    // Лог в ingestion_log
    if (sourceId) {
      await supabase.from("ingestion_log").insert({
        source_id: sourceId,
        status: totalErrors > 0 ? "partial" : "success",
        records_in: totalProcessed,
        records_normalized: totalExtracted,
        records_failed: totalErrors,
        duration_ms: Date.now() - startTime,
      });
      await supabase
        .from("data_sources")
        .update({ last_sync_at: new Date().toISOString() })
        .eq("id", sourceId);
    }

    return new Response(
      JSON.stringify({
        ok: true,
        startedAt,
        processed: totalProcessed,
        extracted: totalExtracted,
        errors: totalErrors,
        finalOffset: currentOffset,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("telegram-poll error:", e);
    // лог в ingestion_log
    try {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      );
      const { data: ds } = await supabase
        .from("data_sources")
        .select("id")
        .eq("type", "telegram")
        .limit(1)
        .maybeSingle();
      if (ds?.id) {
        await supabase.from("ingestion_log").insert({
          source_id: ds.id,
          status: "error",
          records_in: 0,
          records_normalized: 0,
          records_failed: 0,
          error_message: e instanceof Error ? e.message : "Unknown error",
          duration_ms: Date.now() - startTime,
        });
      }
    } catch (_) { /* ignore */ }

    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
