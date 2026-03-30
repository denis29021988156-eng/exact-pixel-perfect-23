import { useState, useEffect } from 'react';
import { DollarSign, AlertTriangle, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import StatusBadge from '@/components/StatusBadge';

interface ContractRisk {
  contract_id: string;
  name: string;
  execution_rate: number;
  risk_of_non_execution: number;
}

export default function BudgetRiskCard() {
  const [contracts, setContracts] = useState<ContractRisk[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadRiskContracts();
  }, []);

  async function loadRiskContracts() {
    const { data } = await supabase
      .from('contracts')
      .select('id, name, execution_rate, risk_of_non_execution')
      .gt('risk_of_non_execution', 30)
      .order('risk_of_non_execution', { ascending: false });
    setContracts((data as ContractRisk[]) || []);
  }

  async function handleRecalculate() {
    setLoading(true);
    try {
      await supabase.functions.invoke('budget-forecast');
      await loadRiskContracts();
    } catch {}
    setLoading(false);
  }

  if (contracts.length === 0 && !loading) return null;

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-warning/10 flex items-center justify-center">
            <DollarSign className="w-4 h-4 text-warning" />
          </div>
          Бюджетный прогноз
        </h2>
        <button
          onClick={handleRecalculate}
          disabled={loading}
          className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-medium rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          Пересчитать
        </button>
      </div>

      <div className="space-y-3">
        {contracts.map(c => (
          <div key={c.contract_id} className="flex items-center gap-4 p-3 rounded-xl bg-surface-muted/50">
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${c.risk_of_non_execution > 70 ? 'bg-danger animate-pulse' : 'bg-warning'}`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{c.name}</p>
              <p className="text-[11px] text-muted-foreground">
                Освоение: {c.execution_rate}% · Риск: {c.risk_of_non_execution}%
              </p>
            </div>
            <StatusBadge variant={c.risk_of_non_execution > 70 ? 'danger' : 'warning'}>
              {c.risk_of_non_execution > 70 ? 'Критический' : 'Внимание'}
            </StatusBadge>
          </div>
        ))}
      </div>
    </div>
  );
}
