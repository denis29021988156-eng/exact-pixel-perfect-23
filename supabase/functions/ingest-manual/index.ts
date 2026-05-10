import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ManualPayload {
  target: 'incident' | 'task' | 'complaint';
  title?: string;
  description?: string;
  raw_text?: string;
  type?: string;
  severity?: string;
  address?: string;
  district?: string;
  topic?: string;
  source_id?: string;
}

const TYPE_DICT: Record<string, string[]> = {
  housing: ['жкх', 'труб', 'отопл', 'вода', 'канализац', 'подъезд', 'крыш', 'лифт'],
  road: ['дорог', 'ям', 'асфальт', 'тротуар'],
  social: ['школ', 'сад', 'больниц', 'поликлин'],
  ecology: ['мусор', 'свалк', 'воздух', 'дым'],
  transport: ['автобус', 'маршрут', 'остановк', 'пробк'],
};

const SEVERITY_KW: Record<string, string[]> = {
  high: ['авари', 'прорыв', 'пожар', 'обруш', 'критич', 'срочн'],
  low: ['вопрос', 'предлож'],
};

function normalizeType(text: string): { type: string; conf: number } {
  const t = text.toLowerCase();
  let best = 'other', score = 0;
  for (const [k, kws] of Object.entries(TYPE_DICT)) {
    const s = kws.filter(w => t.includes(w)).length;
    if (s > score) { score = s; best = k; }
  }
  return { type: best, conf: score > 0 ? Math.min(100, 50 + score * 20) : 30 };
}

function normalizeSeverity(text: string): { sev: string; conf: number } {
  const t = text.toLowerCase();
  if (SEVERITY_KW.high.some(w => t.includes(w))) return { sev: 'high', conf: 80 };
  if (SEVERITY_KW.low.some(w => t.includes(w))) return { sev: 'low', conf: 70 };
  return { sev: 'medium', conf: 40 };
}

function calcConfidence(completeness: number, sourceReliability: number, parseConf: number): number {
  // freshness=100 (только что)
  const score = completeness * 0.4 + 100 * 0.3 + sourceReliability * 0.2 + parseConf * 0.1;
  return Math.round(Math.max(0, Math.min(100, score)));
}

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

  const startedAt = Date.now();
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  try {
    const body: ManualPayload = await req.json();
    if (!body.target) throw new Error('target required');

    // Find or default the manual source
    let sourceId = body.source_id;
    let reliability = 100;
    if (!sourceId) {
      const { data: src } = await supabase
        .from('data_sources')
        .select('id, reliability')
        .eq('type', 'manual')
        .limit(1).maybeSingle();
      sourceId = src?.id;
      reliability = Number(src?.reliability ?? 100);
    }

    const text = `${body.title ?? ''} ${body.description ?? ''} ${body.raw_text ?? ''} ${body.topic ?? ''}`.trim();
    const { type, conf: typeConf } = body.type ? { type: body.type, conf: 100 } : normalizeType(text);
    const { sev, conf: sevConf } = body.severity ? { sev: body.severity, conf: 100 } : normalizeSeverity(text);

    // 1) Write to staging
    const { data: staging, error: stagingErr } = await supabase
      .from('staging_raw')
      .insert({
        source_id: sourceId,
        raw_payload: body,
        parsed_payload: { type, severity: sev },
        status: 'parsed',
        target_table: body.target === 'incident' ? 'incidents' : body.target === 'task' ? 'tasks' : 'public_complaints',
      })
      .select().single();
    if (stagingErr) throw stagingErr;

    // 2) Compute confidence (manual = high)
    const requiredFilled =
      body.target === 'incident' ? [body.title, body.address || body.description].filter(Boolean).length / 2 :
      body.target === 'task' ? (body.title ? 1 : 0) :
      (body.topic ? 1 : 0);
    const completeness = Math.round(requiredFilled * 100);
    const parseConf = Math.round((typeConf + sevConf) / 2);
    const confidence = calcConfidence(completeness, reliability, parseConf);

    // 3) Promote to target table
    let inserted: { id: string } | null = null;
    if (body.target === 'incident') {
      const { data, error } = await supabase.from('incidents').insert({
        title: body.title || text.slice(0, 80) || 'Без названия',
        description: body.description || body.raw_text || null,
        type: type as 'housing' | 'road' | 'social' | 'ecology' | 'transport' | 'other',
        severity: sev as 'low' | 'medium' | 'high',
        address: body.address || null,
        confidence_score: confidence,
        source_id: sourceId,
        raw_source_id: staging.id,
      }).select('id').single();
      if (error) throw error;
      inserted = data;
    } else if (body.target === 'task') {
      const { data, error } = await supabase.from('tasks').insert({
        title: body.title || text.slice(0, 80) || 'Без названия',
        description: body.description || null,
        confidence_score: confidence,
        source_id: sourceId,
        raw_source_id: staging.id,
      }).select('id').single();
      if (error) throw error;
      inserted = data;
    } else {
      const { data, error } = await supabase.from('public_complaints').insert({
        topic: body.topic || text.slice(0, 80) || 'Без темы',
        complaint_text: body.raw_text || body.description || null,
        district: body.district || null,
        source: 'manual',
        confidence_score: confidence,
        source_id: sourceId,
        raw_source_id: staging.id,
      }).select('id').single();
      if (error) throw error;
      inserted = data;
    }

    // 4) Mark staging promoted
    await supabase.from('staging_raw').update({
      status: 'promoted',
      confidence,
      target_id: inserted!.id,
    }).eq('id', staging.id);

    // 5) Log ingestion
    if (sourceId) {
      await supabase.from('ingestion_log').insert({
        source_id: sourceId,
        status: 'success',
        records_in: 1,
        records_normalized: 1,
        records_failed: 0,
        duration_ms: Date.now() - startedAt,
      });
      await supabase.from('data_sources').update({
        last_sync_at: new Date().toISOString(),
        status: 'active',
      }).eq('id', sourceId);
    }

    return new Response(JSON.stringify({ ok: true, id: inserted!.id, confidence, type, severity: sev }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('ingest-manual error', message);
    return new Response(JSON.stringify({ ok: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
