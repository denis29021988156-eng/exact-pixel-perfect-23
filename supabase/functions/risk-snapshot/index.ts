import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Replicates the v1 deterministic Risk Engine on the server.
// Keep formula in sync with src/lib/risk/cityRiskEngine.ts (v1).
function calc(criticalIncidents: number, overdueTasks: number, highRiskProjects: number, trendFactor: number) {
  const raw =
    criticalIncidents * 0.4 +
    overdueTasks * 0.3 +
    highRiskProjects * 0.2 +
    trendFactor * 10 * 0.1;
  const index = Math.min(Math.round(Math.max(raw, 0)), 100);
  let level: 'low' | 'moderate' | 'elevated' | 'critical';
  if (index <= 15) level = 'low';
  else if (index <= 40) level = 'moderate';
  else if (index <= 70) level = 'elevated';
  else level = 'critical';
  return { index, level };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

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

    const { index, level } = calc(criticalIncidents, overdueTasks, highRiskProjects, trendFactor);
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
          formula_version: 'v1',
        },
        { onConflict: 'snapshot_date' }
      );

    if (error) throw error;

    return new Response(JSON.stringify({ ok: true, date: today, index, level }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});