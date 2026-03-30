import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    if (req.method === 'POST') {
      // Manual complaint entry
      const body = await req.json();
      const { topic, district, sentiment, complaint_text, source } = body;

      if (!topic) {
        return new Response(JSON.stringify({ error: 'topic is required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data, error } = await supabase.from('public_complaints').insert({
        topic,
        district: district || null,
        sentiment: sentiment || 'neutral',
        complaint_text: complaint_text || null,
        source: source || 'manual',
      }).select().single();

      if (error) throw error;

      return new Response(JSON.stringify({ ok: true, complaint: data }), {
        status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // GET — return aggregated stats
    const { data: complaints } = await supabase
      .from('public_complaints')
      .select('topic, sentiment, district, created_at')
      .order('created_at', { ascending: false })
      .limit(500);

    const { data: incidents } = await supabase
      .from('incidents')
      .select('type, status')
      .neq('status', 'closed');

    // Aggregate complaints by topic
    const topicCounts: Record<string, { count: number; negative: number }> = {};
    (complaints || []).forEach((c: any) => {
      if (!topicCounts[c.topic]) topicCounts[c.topic] = { count: 0, negative: 0 };
      topicCounts[c.topic].count++;
      if (c.sentiment === 'negative') topicCounts[c.topic].negative++;
    });

    const topTopics = Object.entries(topicCounts)
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, 5)
      .map(([topic, stats]) => ({ topic, ...stats, negativePct: Math.round(stats.negative / stats.count * 100) }));

    // Divergence: compare top complaint topics with incident types
    const incidentTypeCounts: Record<string, number> = {};
    (incidents || []).forEach((i: any) => {
      incidentTypeCounts[i.type] = (incidentTypeCounts[i.type] || 0) + 1;
    });

    const totalComplaints = complaints?.length || 0;
    const totalIncidents = incidents?.length || 0;
    const divergenceScore = totalComplaints > 0 && totalIncidents > 0
      ? Math.abs(totalComplaints - totalIncidents) / Math.max(totalComplaints, totalIncidents) * 100
      : 0;

    const result = {
      totalComplaints,
      topTopics,
      incidentTypeCounts,
      divergenceScore: Math.round(divergenceScore),
    };

    await supabase.from('ai_logs').insert({
      module: 'fetch-complaints',
      input_summary: 'Aggregation request',
      output_summary: `${totalComplaints} complaints, divergence: ${Math.round(divergenceScore)}%`,
      error_flag: false,
    });

    return new Response(JSON.stringify(result), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
