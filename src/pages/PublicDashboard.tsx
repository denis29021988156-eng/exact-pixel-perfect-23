import { useState, useEffect } from 'react';
import { BarChart3, AlertTriangle, FolderKanban, ClipboardCheck, DollarSign, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface PublicMetrics {
  active_incidents: number;
  critical_incidents: number;
  active_tasks: number;
  active_projects: number;
  risk_projects: number;
  total_budget: number;
  spent_budget: number;
}

interface Benchmark {
  metric_name: string;
  metric_value: number;
  norm_value: number;
}

export default function PublicDashboard() {
  const [metrics, setMetrics] = useState<PublicMetrics | null>(null);
  const [benchmarks, setBenchmarks] = useState<Benchmark[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from('public_metrics' as any).select('*').single(),
      supabase.from('benchmarks').select('metric_name, metric_value, norm_value').limit(10),
    ]).then(([mRes, bRes]) => {
      if (mRes.data) setMetrics(mRes.data as any);
      setBenchmarks((bRes.data as Benchmark[]) || []);
      setLoading(false);
    });
  }, []);

  const budgetPct = metrics && metrics.total_budget > 0
    ? Math.round(Number(metrics.spent_budget) / Number(metrics.total_budget) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">Открытый дашборд города</h1>
          </div>
          <p className="text-muted-foreground">Агрегированные данные о работе городских служб</p>
          <p className="text-[11px] text-muted-foreground/60 mt-2">
            Обновлено: {new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>

        {loading ? (
          <div className="text-center py-20 text-muted-foreground">Загрузка данных...</div>
        ) : metrics ? (
          <>
            {/* KPI Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="glass-card p-6 text-center">
                <AlertTriangle className="w-5 h-5 text-warning mx-auto mb-2" />
                <p className="text-[11px] text-muted-foreground mb-1">Инциденты в работе</p>
                <p className="text-3xl font-bold text-foreground">{metrics.active_incidents}</p>
                {metrics.critical_incidents > 0 && (
                  <p className="text-[10px] text-danger mt-1">Критических: {metrics.critical_incidents}</p>
                )}
              </div>
              <div className="glass-card p-6 text-center">
                <ClipboardCheck className="w-5 h-5 text-primary mx-auto mb-2" />
                <p className="text-[11px] text-muted-foreground mb-1">Задачи в работе</p>
                <p className="text-3xl font-bold text-foreground">{metrics.active_tasks}</p>
              </div>
              <div className="glass-card p-6 text-center">
                <FolderKanban className="w-5 h-5 text-success mx-auto mb-2" />
                <p className="text-[11px] text-muted-foreground mb-1">Активные проекты</p>
                <p className="text-3xl font-bold text-foreground">{metrics.active_projects}</p>
                {metrics.risk_projects > 0 && (
                  <p className="text-[10px] text-warning mt-1">В зоне риска: {metrics.risk_projects}</p>
                )}
              </div>
              <div className="glass-card p-6 text-center">
                <DollarSign className="w-5 h-5 text-warning mx-auto mb-2" />
                <p className="text-[11px] text-muted-foreground mb-1">Освоение бюджета</p>
                <p className="text-3xl font-bold text-foreground">{budgetPct}%</p>
                <div className="mt-2 h-2 bg-surface-muted rounded-full overflow-hidden mx-4">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${budgetPct}%` }} />
                </div>
              </div>
            </div>

            {/* Benchmarks */}
            {benchmarks.length > 0 && (
              <div className="glass-card p-6 mb-8">
                <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-primary" />
                  Показатели относительно нормативов
                </h2>
                <div className="space-y-3">
                  {benchmarks.map((b, i) => {
                    const pct = b.norm_value > 0 ? Math.round(b.metric_value / b.norm_value * 100) : 0;
                    return (
                      <div key={i} className="flex items-center gap-4">
                        <span className="text-sm text-foreground flex-1">{b.metric_name}</span>
                        <div className="w-32 h-2 bg-surface-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${pct >= 100 ? 'bg-success' : pct >= 70 ? 'bg-warning' : 'bg-danger'}`}
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-muted-foreground w-12 text-right">{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Disclaimer */}
            <div className="text-center text-[11px] text-muted-foreground/50 mt-12">
              Данные предоставлены в агрегированном виде. Детализация доступна авторизованным пользователям.
            </div>
          </>
        ) : (
          <div className="text-center py-20 text-muted-foreground">Данные недоступны</div>
        )}
      </div>
    </div>
  );
}
