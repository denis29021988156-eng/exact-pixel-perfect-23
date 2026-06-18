import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { calculateCityRiskIndex } from '../_shared/riskEngine.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Risk engine lives in _shared/riskEngine.ts (single source of truth, v2).

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  // --- Auth: CRON_SECRET header OR signed-in user ---
  {
    const _cronSecret = Deno.env.get("CRON_SECRET");
    const _hdrSecret = req.headers.get("x-cron-secret");
    let _ok = !!(_cronSecret && _hdrSecret && _cronSecret === _hdrSecret);
    if (!_ok) {
      const _authHeader = req.headers.get("Authorization");
      if (_authHeader?.startsWith("Bearer ")) {
        const _supaAuth = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_ANON_KEY")!
        );
        const { data: _claims, error: _authErr } = await _supaAuth.auth.getClaims(
          _authHeader.replace("Bearer ", "")
        );
        _ok = !_authErr && !!_claims?.claims;
      }
    }
    if (!_ok) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const [incRes, taskRes, projRes] = await Promise.all([
      supabase.from('incidents').select('severity, sla_overdue, status').neq('status', 'closed'),
      supabase.from('tasks').select('overdue, status').neq('status', 'completed'),
      supabase.from('projects').select('status'),
    ]);

    const incidents = incRes.data || [];
    const tasks = taskRes.data || [];
    const projects = projRes.data || [];

    const criticalIncidents = incidents.filter((i: any) => i.severity === 'high').length;
    const overdueIncidents = incidents.filter((i: any) => i.sla_overdue).length;
    const overdueTasks = tasks.filter((t: any) => t.overdue).length;
    const highRiskProjects = projects.filter((p: any) => p.status === 'risk' || p.status === 'overdue').length;
    const overdueRatio = incidents.length > 0 ? overdueIncidents / incidents.length : 0;
    const trendFactor = overdueRatio > 0.3 ? 1 : overdueRatio > 0.1 ? 0.5 : 0;

    const { index, level } = calculateCityRiskIndex({
      criticalIncidents,
      overdueTasks,
      highRiskProjects,
      trendFactor,
      totalIncidents: incidents.length,
      totalTasks: tasks.length,
      totalProjects: projects.length,
    });
    const today = new Date().toISOString().slice(0, 10);

    const { error } = await supabase
      .from('risk_index_snapshots')
      .upsert(
        {
          snapshot_date: today,
          index_value: index,
          level,
          components: {
            criticalIncidents,
            overdueIncidents,
            overdueTasks,
            highRiskProjects,
            trendFactor,
            activeIncidents: incidents.length,
            activeTasks: tasks.length,
            totalProjects: projects.length,
          },
          formula_version: 'v2',
        },
        { onConflict: 'snapshot_date' }
      );

    if (error) throw error;

    return new Response(JSON.stringify({ ok: true, date: today, index, level }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});