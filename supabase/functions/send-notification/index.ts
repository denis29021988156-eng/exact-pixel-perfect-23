import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {

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
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { escalation_id } = await req.json();
    if (!escalation_id) {
      return new Response(JSON.stringify({ error: 'escalation_id required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { data: escalation, error } = await supabase
      .from('escalations')
      .select('*')
      .eq('id', escalation_id)
      .single();

    if (error || !escalation) {
      return new Response(JSON.stringify({ error: 'Escalation not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const channels: string[] = escalation.channels || ['in_app'];
    const results: Record<string, string> = {};

    // In-app notification is handled by realtime subscription
    if (channels.includes('in_app')) {
      results.in_app = 'delivered_via_realtime';
    }

    // Telegram channel — try if connector is configured
    if (channels.includes('telegram')) {
      const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
      const TELEGRAM_API_KEY = Deno.env.get('TELEGRAM_API_KEY');
      const TELEGRAM_CHAT_ID = Deno.env.get('TELEGRAM_CHAT_ID');

      if (LOVABLE_API_KEY && TELEGRAM_API_KEY && TELEGRAM_CHAT_ID) {
        const GATEWAY_URL = 'https://connector-gateway.lovable.dev/telegram';
        const msgText = `🚨 *Эскалация*\n\n${escalation.message}\n\n💡 ${escalation.suggested_action || 'Требуется действие'}`;

        const tgResponse = await fetch(`${GATEWAY_URL}/sendMessage`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'X-Connection-Api-Key': TELEGRAM_API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chat_id: TELEGRAM_CHAT_ID,
            text: msgText,
            parse_mode: 'Markdown',
          }),
        });

        results.telegram = tgResponse.ok ? 'sent' : 'failed';
      } else {
        results.telegram = 'not_configured';
      }
    }

    // Log to ai_logs
    await supabase.from('ai_logs').insert({
      module: 'send-notification',
      input_summary: `escalation_id=${escalation_id}`,
      output_summary: JSON.stringify(results),
      error_flag: Object.values(results).includes('failed'),
    });

    return new Response(JSON.stringify({ ok: true, results }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('send-notification error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
