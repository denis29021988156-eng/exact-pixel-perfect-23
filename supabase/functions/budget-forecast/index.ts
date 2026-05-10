import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { data: contracts } = await supabase
      .from('contracts')
      .select('id, name, amount, deadline, status, budget_spent:amount')
      .eq('status', 'active');

    if (!contracts || contracts.length === 0) {
      return new Response(JSON.stringify({ contracts: [], escalations: [] }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const now = new Date();
    const results: any[] = [];
    const escalationIds: string[] = [];

    for (const contract of contracts) {
      const { data: forecasts } = await supabase
        .from('budget_forecast')
        .select('*')
        .eq('contract_id', contract.id);

      const totalPlanned = forecasts?.reduce((s: number, f: any) => s + (Number(f.planned_amount) || 0), 0) || 0;
      const totalActual = forecasts?.reduce((s: number, f: any) => s + (Number(f.actual_amount) || 0), 0) || 0;
      const contractAmount = Number(contract.amount) || 1;

      // Execution rate = actual payments / total contract amount
      const executionRate = Math.min(totalActual / contractAmount, 1);

      // Risk calculation: days remaining vs budget remaining
      let riskOfNonExecution = 0;
      if (contract.deadline) {
        const deadline = new Date(contract.deadline);
        const totalDays = Math.max((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24), 1);
        const contractStart = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000); // assume 90 days ago
        const elapsed = Math.max((now.getTime() - contractStart.getTime()) / (1000 * 60 * 60 * 24), 1);
        const totalPeriod = elapsed + totalDays;
        const expectedRate = elapsed / totalPeriod;

        // If execution lags behind time progression
        if (executionRate < expectedRate * 0.7) {
          riskOfNonExecution = Math.min(Math.round((1 - executionRate / expectedRate) * 100), 100);
        }
      }

      // Update contract with calculated rates
      await supabase.from('contracts').update({
        execution_rate: Math.round(executionRate * 100),
        risk_of_non_execution: riskOfNonExecution,
      }).eq('id', contract.id);

      results.push({
        contract_id: contract.id,
        name: contract.name,
        execution_rate: Math.round(executionRate * 100),
        risk_of_non_execution: riskOfNonExecution,
      });

      // Auto-escalate if risk > 70%
      if (riskOfNonExecution > 70) {
        await supabase.from('escalations').insert({
          type: 'budget_risk',
          severity: 4,
          source_type: 'contract',
          source_id: contract.id,
          message: `Критический риск неисполнения контракта "${contract.name}": ${riskOfNonExecution}%`,
          suggested_action: 'Ускорить освоение бюджета или пересмотреть сроки контракта.',
        });
        escalationIds.push(contract.id);
      }
    }

    // Log
    await supabase.from('ai_logs').insert({
      module: 'budget-forecast',
      input_summary: `Processed ${contracts.length} contracts`,
      output_summary: `High risk: ${escalationIds.length}`,
      error_flag: false,
    });

    return new Response(JSON.stringify({ contracts: results, escalations: escalationIds }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
