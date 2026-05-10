import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Deterministic coefficients — same as client-side engine
const ACTION_COEFFICIENTS: Record<string, any> = {
  allocate_budget: { incidentReduction: -0.15, complaintReduction: -0.40, riskReduction: -0.10, resolutionSpeedup: -4 },
  add_staff: { incidentReduction: -0.08, complaintReduction: -0.05, riskReduction: -0.05, resolutionSpeedup: -2 },
  close_road: { incidentReduction: -0.30, complaintReduction: 0.20, riskReduction: -0.15, resolutionSpeedup: 0 },
  launch_program: { incidentReduction: -0.05, complaintReduction: -0.25, riskReduction: -0.20, resolutionSpeedup: -1 },
};

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
    const { actionType, params } = await req.json();
    if (!actionType || !ACTION_COEFFICIENTS[actionType]) {
      return new Response(JSON.stringify({ error: 'Invalid actionType' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const [incRes, taskRes, projRes, compRes] = await Promise.all([
      supabase.from('incidents').select('id, severity, sla_overdue').neq('status', 'closed'),
      supabase.from('tasks').select('id, overdue').neq('status', 'completed'),
      supabase.from('projects').select('id, status'),
      supabase.from('public_complaints').select('id'),
    ]);

    const stats = {
      activeIncidents: incRes.data?.length || 0,
      overdueIncidents: incRes.data?.filter((i: any) => i.sla_overdue).length || 0,
      overdueTasks: taskRes.data?.filter((t: any) => t.overdue).length || 0,
      highRiskProjects: projRes.data?.filter((p: any) => p.status === 'risk' || p.status === 'overdue').length || 0,
      complaintsCount: compRes.data?.length || 0,
    };

    const coeff = ACTION_COEFFICIENTS[actionType];
    const multiplier = params?.amount ?? params?.staffCount ?? 1;

    const result = {
      predictedIncidentDelta: Math.round(stats.activeIncidents * coeff.incidentReduction * multiplier),
      predictedComplaintDelta: Math.round(stats.complaintsCount * coeff.complaintReduction * multiplier),
      predictedRiskDelta: Math.round(stats.highRiskProjects * coeff.riskReduction * multiplier),
      predictedResolutionTimeDelta: Math.round(coeff.resolutionSpeedup * multiplier),
      currentStats: stats,
    };

    // Log to ai_logs
    await supabase.from('ai_logs').insert({
      module: 'what-if-analyzer',
      input_summary: JSON.stringify({ actionType, params }),
      output_summary: JSON.stringify(result),
      error_flag: false,
    });

    return new Response(JSON.stringify(result), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
