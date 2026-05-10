import { useState } from 'react';
import { Lightbulb, Calculator, Check, TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import PermissionGate from '@/components/PermissionGate';
import { useToast } from '@/hooks/use-toast';

const ACTION_TYPES = [
  { value: 'allocate_budget', label: 'Выделить бюджет (млн ₽)', paramLabel: 'Сумма (млн)', paramKey: 'amount' },
  { value: 'add_staff', label: 'Добавить сотрудников', paramLabel: 'Количество', paramKey: 'staffCount' },
  { value: 'close_road', label: 'Закрыть дорожный участок', paramLabel: '', paramKey: '' },
  { value: 'launch_program', label: 'Запустить программу', paramLabel: '', paramKey: '' },
];

interface Prediction {
  predictedIncidentDelta: number;
  predictedComplaintDelta: number;
  predictedRiskDelta: number;
  predictedResolutionTimeDelta: number;
}

function DeltaIndicator({ value, label }: { value: number; label: string }) {
  if (value === 0) return null;
  const isPositive = value > 0;
  return (
    <div className={`flex items-center gap-1.5 text-xs ${isPositive ? 'text-danger' : 'text-success'}`}>
      {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      <span className="font-semibold">{value > 0 ? '+' : ''}{value}</span>
      <span className="text-muted-foreground">{label}</span>
    </div>
  );
}

export default function WhatIfCard() {
  const [actionType, setActionType] = useState('allocate_budget');
  const [paramValue, setParamValue] = useState(1);
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const selectedAction = ACTION_TYPES.find(a => a.value === actionType)!;

  async function handleCalculate() {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('what-if-analyzer', {
        body: {
          actionType,
          params: selectedAction.paramKey ? { [selectedAction.paramKey]: paramValue } : {},
        },
      });
      if (error) throw error;
      setPrediction(data);

      // Save to history
      await supabase.from('scenario_history').insert({
        user_id: user?.id,
        input_params: { actionType, params: selectedAction.paramKey ? { [selectedAction.paramKey]: paramValue } : {} },
        predicted_output: data,
      });
    } catch (err: any) {
      toast({ title: 'Ошибка расчёта', description: err.message, variant: 'destructive' });
    }
    setLoading(false);
  }

  async function handleApprove() {
    toast({ title: 'Сценарий утверждён', description: 'Задача будет создана на основе этого решения.' });
    setPrediction(null);
  }

  return (
    <div className="glass-card p-6">
      <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
          <Lightbulb className="w-4 h-4 text-primary" />
        </div>
        Бюджетные сценарии
      </h2>

      <div className="flex flex-wrap gap-3 mb-4">
        <select
          value={actionType}
          onChange={e => { setActionType(e.target.value); setPrediction(null); }}
          className="px-3 py-2 text-xs rounded-lg border border-border bg-background text-foreground"
        >
          {ACTION_TYPES.map(a => (
            <option key={a.value} value={a.value}>{a.label}</option>
          ))}
        </select>

        {selectedAction.paramKey && (
          <input
            type="number"
            min={1}
            value={paramValue}
            onChange={e => setParamValue(Number(e.target.value))}
            className="w-24 px-3 py-2 text-xs rounded-lg border border-border bg-background text-foreground"
            placeholder={selectedAction.paramLabel}
          />
        )}

        <button
          onClick={handleCalculate}
          disabled={loading}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          <Calculator className="w-3.5 h-3.5" />
          {loading ? 'Расчёт...' : 'Рассчитать'}
        </button>
      </div>

      {prediction && (
        <div className="p-4 rounded-xl bg-surface-muted/50 border border-border/50 space-y-2">
          <p className="text-xs font-semibold text-foreground mb-2">Прогноз воздействия:</p>
          <DeltaIndicator value={prediction.predictedIncidentDelta} label="инцидентов" />
          <DeltaIndicator value={prediction.predictedComplaintDelta} label="жалоб" />
          <DeltaIndicator value={prediction.predictedRiskDelta} label="проектов в риске" />
          <DeltaIndicator value={prediction.predictedResolutionTimeDelta} label="часов на решение" />

          <PermissionGate roles={['mayor', 'deputy']}>
            <button
              onClick={handleApprove}
              className="mt-3 flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg bg-success text-white hover:bg-success/90 transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              Утвердить сценарий
            </button>
          </PermissionGate>
        </div>
      )}
    </div>
  );
}
