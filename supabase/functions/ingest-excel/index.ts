// Edge function: ingest-excel
// Принимает массив строк (после парсинга .xlsx на клиенте) + маппинг колонок,
// нормализует, считает confidence и кладёт в staging_raw + целевую таблицу.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type Target = 'incident' | 'task' | 'complaint';

interface RowMapping {
  title?: string;
  description?: string;
  type?: string;
  severity?: string;
  address?: string;
  district?: string;
  topic?: string;
  responsible?: string;
  department?: string;
  deadline?: string;
}

interface IngestExcelPayload {
  target: Target;
  fileName: string;
  rows: Record<string, unknown>[];
  mapping: RowMapping; // mapping[fieldName] = excelColumnHeader
  source_id?: string;
}

function normalizeType(text: string): { type: string; conf: number } {
  const t = text.toLowerCase();
  const dict: Record<string, string[]> = {
    housing: ['жкх', 'труб', 'отопл', 'вода', 'канализац', 'подъезд', 'крыш', 'лифт'],
    road: ['дорог', 'ям', 'асфальт', 'тротуар', 'разметк', 'светофор'],
    social: ['школ', 'сад', 'больниц', 'поликлин', 'соцзащ'],
    ecology: ['мусор', 'свалк', 'воздух', 'дым', 'запах', 'парк'],
    transport: ['автобус', 'трамвай', 'маршрут', 'остановк', 'пробк', 'парковк'],
  };
  for (const [type, kws] of Object.entries(dict)) {
    if (kws.some((k) => t.includes(k))) return { type, conf: 80 };
  }
  return { type: 'other', conf: 30 };
}

function normalizeSeverity(text: string): { sev: string; conf: number } {
  const t = text.toLowerCase();
  if (/авари|прорыв|пожар|критич|срочн|опасн|обруш/i.test(t)) return { sev: 'high', conf: 85 };
  if (/вопрос|предлож|улучш/i.test(t)) return { sev: 'low', conf: 70 };
  return { sev: 'medium', conf: 50 };
}

function calcConfidence(completeness: number, sourceReliability: number, parseConf: number): number {
  // freshness=100 (только что загружено)
  return Math.round(completeness * 0.4 + 100 * 0.3 + sourceReliability * 0.2 + parseConf * 0.1);
}

function pickField(row: Record<string, unknown>, key: string | undefined): string {
  if (!key) return '';
  const v = row[key];
  return v == null ? '' : String(v).trim();
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

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
    const payload = (await req.json()) as IngestExcelPayload;
    if (!payload?.target || !Array.isArray(payload.rows)) {
      return new Response(JSON.stringify({ error: 'invalid payload' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // источник: excel
    let sourceId = payload.source_id ?? null;
    if (!sourceId) {
      const { data: src } = await supabase
        .from('data_sources')
        .select('id')
        .eq('type', 'excel')
        .limit(1)
        .maybeSingle();
      if (!src) {
        const { data: created } = await supabase
          .from('data_sources')
          .insert({
            name: `Excel: ${payload.fileName}`,
            type: 'excel',
            status: 'active',
            reliability: 85,
            latency_minutes: 0,
          })
          .select('id')
          .single();
        sourceId = created?.id ?? null;
      } else {
        sourceId = src.id;
      }
    }

    const t0 = Date.now();
    const results = { ok: 0, failed: 0, items: [] as Array<{ id: string; confidence: number }> };

    for (const row of payload.rows) {
      try {
        const m = payload.mapping;
        const title = pickField(row, m.title);
        const description = pickField(row, m.description);
        const rawType = pickField(row, m.type) || title + ' ' + description;
        const rawSev = pickField(row, m.severity) || description || title;
        const address = pickField(row, m.address);
        const district = pickField(row, m.district);
        const topic = pickField(row, m.topic) || title;
        const responsible = pickField(row, m.responsible);
        const department = pickField(row, m.department);
        const deadline = pickField(row, m.deadline);

        if (!title && !description && !topic) {
          results.failed++;
          continue;
        }

        const { type, conf: typeConf } = normalizeType(rawType);
        const { sev, conf: sevConf } = normalizeSeverity(rawSev);

        const required =
          payload.target === 'complaint'
            ? [topic]
            : [title, description || rawType, address || department];
        const filled = required.filter(Boolean).length;
        const completeness = (filled / required.length) * 100;
        const parseConf = (typeConf + sevConf) / 2;
        const confidence = calcConfidence(completeness, 85, parseConf);

        const targetTable =
          payload.target === 'incident'
            ? 'incidents'
            : payload.target === 'task'
              ? 'tasks'
              : 'public_complaints';

        const { data: stage } = await supabase
          .from('staging_raw')
          .insert({
            source_id: sourceId,
            raw_payload: row,
            parsed_payload: { type, sev, address, district, title, description, topic },
            status: 'normalized',
            confidence,
            target_table: targetTable,
          })
          .select('id')
          .single();

        let insertedId: string | null = null;

        if (payload.target === 'incident') {
          const { data: inc } = await supabase
            .from('incidents')
            .insert({
              title: title || (description?.slice(0, 80) ?? 'Без названия'),
              description: description || null,
              type: type as 'housing' | 'road' | 'social' | 'ecology' | 'transport' | 'other',
              severity: sev as 'high' | 'medium' | 'low',
              status: 'new',
              address: address || null,
              department: department || null,
              responsible: responsible || null,
              source_id: sourceId,
              raw_source_id: stage?.id ?? null,
              confidence_score: confidence,
            })
            .select('id')
            .single();
          insertedId = inc?.id ?? null;
        } else if (payload.target === 'task') {
          const { data: tk } = await supabase
            .from('tasks')
            .insert({
              title: title || 'Задача из Excel',
              description: description || null,
              status: 'new',
              department: department || null,
              responsible: responsible || null,
              deadline: deadline || null,
              source_id: sourceId,
              raw_source_id: stage?.id ?? null,
              confidence_score: confidence,
            })
            .select('id')
            .single();
          insertedId = tk?.id ?? null;
        } else {
          const { data: cp } = await supabase
            .from('public_complaints')
            .insert({
              topic: topic || title || 'Жалоба',
              complaint_text: description || title || null,
              district: district || null,
              source: 'excel',
              source_id: sourceId,
              raw_source_id: stage?.id ?? null,
              confidence_score: confidence,
            })
            .select('id')
            .single();
          insertedId = cp?.id ?? null;
        }

        if (stage?.id && insertedId) {
          await supabase
            .from('staging_raw')
            .update({ status: 'promoted', target_id: insertedId })
            .eq('id', stage.id);
        }

        results.ok++;
        if (insertedId) results.items.push({ id: insertedId, confidence });
      } catch (e) {
        console.error('row error', e);
        results.failed++;
      }
    }

    await supabase.from('ingestion_log').insert({
      source_id: sourceId,
      status: results.failed === 0 ? 'success' : results.ok === 0 ? 'error' : 'partial',
      records_in: payload.rows.length,
      records_normalized: results.ok,
      records_failed: results.failed,
      duration_ms: Date.now() - t0,
    });

    if (sourceId) {
      await supabase
        .from('data_sources')
        .update({
          last_sync_at: new Date().toISOString(),
          status: results.failed > 0 && results.ok === 0 ? 'error' : 'active',
        })
        .eq('id', sourceId);
    }

    return new Response(JSON.stringify({ ok: true, ...results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('ingest-excel fatal', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
