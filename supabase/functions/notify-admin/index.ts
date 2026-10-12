import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Sends an admin alert to Telegram (if TELEGRAM_API_KEY + TELEGRAM_ADMIN_CHAT_ID configured).
// Always logs the alert to ai_logs as a record, regardless of Telegram availability.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  // --- Authentication check ---
  const _authHeader = req.headers.get("Authorization");
  if (!_authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  {
    const _supaAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!
    );
    const { data: _claims, error: _authErr } = await _supaAuth.auth.getClaims(
      _authHeader.replace("Bearer ", "")
    );
    if (_authErr || !_claims?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  try {
    const { kind, message } = await req.json();
    if (!message || typeof message !== 'string') {
      return new Response(JSON.stringify({ ok: false, error: 'message required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Always record the admin alert as ai_log entry (audit trail)
    await supabase.from('ai_logs').insert({
      module: 'admin-alert',
      input_summary: kind ?? 'unknown',
      output_summary: message.slice(0, 500),
      error_flag: false,
    }).catch(() => {});

    // Best-effort Telegram delivery (no hard fail if not configured)
    const tgKey = Deno.env.get('TELEGRAM_API_KEY');
    const adminChat = Deno.env.get('TELEGRAM_ADMIN_CHAT_ID');
    let delivered = false;

    if (tgKey && adminChat) {
      try {
        const r = await fetch(`https://api.telegram.org/bot${tgKey}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: adminChat, text: message, parse_mode: 'Markdown' }),
        });
        delivered = r.ok;
      } catch (e) {
        console.error('telegram send failed:', e);
      }
    }

    return new Response(JSON.stringify({ ok: true, delivered }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    console.error('notify-admin error:', e);
    return new Response(JSON.stringify({ ok: false, error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});