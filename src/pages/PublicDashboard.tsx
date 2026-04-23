import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3, AlertTriangle, FolderKanban, ClipboardCheck, DollarSign,
  Shield, ArrowRight, Activity, TrendingUp, Building2, Radio
} from 'lucide-react';
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
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<PublicMetrics | null>(null);
  const [benchmarks, setBenchmarks] = useState<Benchmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    Promise.all([
      supabase.from('public_metrics' as any).select('*').single(),
      supabase.from('benchmarks').select('metric_name, metric_value, norm_value').limit(8),
    ]).then(([mRes, bRes]) => {
      if (mRes.data) setMetrics(mRes.data as any);
      setBenchmarks((bRes.data as Benchmark[]) || []);
      setLoading(false);
    });
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  const budgetPct = metrics && metrics.total_budget > 0
    ? Math.round(Number(metrics.spent_budget) / Number(metrics.total_budget) * 100)
    : 0;

  // Композитный индекс «здоровья города» (визуальный, для публичного дашборда)
  const healthScore = metrics
    ? Math.max(0, Math.min(100, 100 - (metrics.critical_incidents * 8) - (metrics.risk_projects * 5)))
    : 0;

  const healthLabel = healthScore >= 80 ? 'Стабильная' : healthScore >= 60 ? 'Под контролем' : healthScore >= 40 ? 'Повышенный риск' : 'Критическая';
  const healthColor = healthScore >= 80 ? 'text-success' : healthScore >= 60 ? 'text-primary' : healthScore >= 40 ? 'text-warning' : 'text-danger';
  const healthGradient = healthScore >= 80 ? 'from-success/30 to-success/0' : healthScore >= 60 ? 'from-primary/30 to-primary/0' : healthScore >= 40 ? 'from-warning/30 to-warning/0' : 'from-danger/30 to-danger/0';

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Subtle grid background */}
      <div className="fixed inset-0 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(hsl(204 70% 53% / 0.04) 1px, transparent 1px), linear-gradient(90deg, hsl(204 70% 53% / 0.04) 1px, transparent 1px)',
        backgroundSize: '64px 64px',
      }} />

      {/* Top nav */}
      <header className="relative z-10 flex items-center justify-between px-6 lg:px-12 h-16 border-b border-border/50 backdrop-blur-md bg-background/80">
        <button onClick={() => navigate('/')} className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center group-hover:scale-105 transition-transform">
            <Shield className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="text-left">
            <p className="text-sm font-bold text-foreground tracking-tight leading-none">City Intelligence OS</p>
            <p className="text-[10px] text-muted-foreground tracking-widest uppercase mt-0.5">Открытые данные · Реутов</p>
          </div>
        </button>
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <Radio className="w-3 h-3 text-success ai-pulse" />
          <span>LIVE · {now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </header>

      {loading ? (
        <div className="flex items-center justify-center py-32 text-muted-foreground animate-pulse">Загрузка данных…</div>
      ) : !metrics ? (
        <div className="text-center py-32 text-muted-foreground">Данные недоступны</div>
      ) : (
        <>
          {/* ═══════ HERO — City Health Index ═══════ */}
          <section className="relative z-10 max-w-6xl mx-auto px-6 lg:px-12 pt-12 lg:pt-16 pb-10 animate-fade-in-up">
            <div className="grid lg:grid-cols-[1.2fr_1fr] gap-8 items-stretch">
              {/* Left: Health gauge */}
              <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card p-8 lg:p-10 shadow-sm">
                <div className={`absolute -top-32 -right-32 w-96 h-96 rounded-full bg-gradient-radial ${healthGradient} blur-3xl opacity-60`} />
                <div className="relative">
                  <div className="flex items-center gap-2 mb-6">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary ai-pulse" />
                    <span className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase">City Health Index · обновляется в реальном времени</span>
                  </div>
                  <div className="flex items-end gap-6 mb-6">
                    <div>
                      <div className={`text-7xl lg:text-8xl font-extrabold tracking-tighter ${healthColor} leading-none`}>
                        {healthScore}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2 tracking-widest uppercase">из 100 баллов</p>
                    </div>
                    <div className="pb-2">
                      <p className={`text-lg font-bold ${healthColor}`}>{healthLabel}</p>
                      <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                        Композитный индекс на основе инцидентов, рисков проектов и SLA
                      </p>
                    </div>
                  </div>
                  {/* Segmented bar */}
                  <div className="flex gap-1 h-2 mb-2">
                    {Array.from({ length: 20 }).map((_, i) => {
                      const segPct = (i + 1) * 5;
                      const active = segPct <= healthScore;
                      return (
                        <div
                          key={i}
                          className={`flex-1 rounded-sm transition-all ${active ? (healthScore >= 80 ? 'bg-success' : healthScore >= 60 ? 'bg-primary' : healthScore >= 40 ? 'bg-warning' : 'bg-danger') : 'bg-surface-muted'}`}
                          style={{ animationDelay: `${i * 30}ms` }}
                        />
                      );
                    })}
                  </div>
                  <div className="flex justify-between text-[10px] text-muted-foreground tracking-wider">
                    <span>КРИТИЧНО</span>
                    <span>СТАБИЛЬНО</span>
                  </div>
                </div>
              </div>

              {/* Right: Quick stats stack */}
              <div className="space-y-3">
                <div className="rounded-2xl border border-border/60 bg-card p-5 flex items-center gap-4 hover:border-primary/40 transition-colors">
                  <div className="w-12 h-12 rounded-xl bg-danger/10 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-5 h-5 text-danger" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] tracking-widest uppercase text-muted-foreground">Критических инцидентов</p>
                    <p className="text-3xl font-extrabold text-foreground tracking-tight leading-none mt-1">{metrics.critical_incidents}</p>
                  </div>
                  <p className="text-[10px] text-muted-foreground self-end">из {metrics.active_incidents} активных</p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-card p-5 flex items-center gap-4 hover:border-primary/40 transition-colors">
                  <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center flex-shrink-0">
                    <FolderKanban className="w-5 h-5 text-warning" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] tracking-widest uppercase text-muted-foreground">Проекты в зоне риска</p>
                    <p className="text-3xl font-extrabold text-foreground tracking-tight leading-none mt-1">{metrics.risk_projects}</p>
                  </div>
                  <p className="text-[10px] text-muted-foreground self-end">из {metrics.active_projects}</p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-card p-5 flex items-center gap-4 hover:border-primary/40 transition-colors">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <ClipboardCheck className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] tracking-widest uppercase text-muted-foreground">Поручений в работе</p>
                    <p className="text-3xl font-extrabold text-foreground tracking-tight leading-none mt-1">{metrics.active_tasks}</p>
                  </div>
                  <Activity className="w-4 h-4 text-success ai-pulse self-end" />
                </div>
              </div>
            </div>
          </section>

          {/* ═══════ SECONDARY KPI STRIP ═══════ */}
          <section className="relative z-10 max-w-6xl mx-auto px-6 lg:px-12 pb-10">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: 'Инцидентов всего', value: metrics.active_incidents, icon: AlertTriangle, accent: 'text-warning' },
                { label: 'Активных проектов', value: metrics.active_projects, icon: Building2, accent: 'text-success' },
                { label: 'Освоение бюджета', value: `${budgetPct}%`, icon: DollarSign, accent: 'text-primary', progress: budgetPct },
                { label: 'AI-мониторинг', value: '24/7', icon: TrendingUp, accent: 'text-success' },
              ].map((s) => (
                <div key={s.label} className="rounded-xl border border-border/60 bg-card p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[10px] tracking-widest uppercase text-muted-foreground">{s.label}</p>
                    <s.icon className={`w-3.5 h-3.5 ${s.accent}`} />
                  </div>
                  <p className="text-2xl font-extrabold text-foreground tracking-tight">{s.value}</p>
                  {typeof s.progress === 'number' && (
                    <div className="mt-3 h-1 bg-surface-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${s.progress}%` }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* ═══════ BENCHMARKS ═══════ */}
          {benchmarks.length > 0 && (
            <section className="relative z-10 max-w-6xl mx-auto px-6 lg:px-12 pb-16">
              <div className="rounded-2xl border border-border/60 bg-card p-6 lg:p-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-[10px] tracking-widest uppercase text-muted-foreground mb-1">Бенчмарки</p>
                    <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-primary" />
                      Показатели относительно нормативов
                    </h2>
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-x-8 gap-y-4">
                  {benchmarks.map((b, i) => {
                    const pct = b.norm_value > 0 ? Math.round(b.metric_value / b.norm_value * 100) : 0;
                    const tone = pct >= 100 ? 'success' : pct >= 70 ? 'warning' : 'danger';
                    const barClass = tone === 'success' ? 'bg-success' : tone === 'warning' ? 'bg-warning' : 'bg-danger';
                    const tagClass = tone === 'success' ? 'text-success bg-success/10' : tone === 'warning' ? 'text-warning bg-warning/10' : 'text-danger bg-danger/10';
                    return (
                      <div key={i} className="space-y-1.5">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm text-foreground">{b.metric_name}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${tagClass}`}>{pct}%</span>
                        </div>
                        <div className="h-1.5 bg-surface-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${barClass}`}
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          )}

          {/* ═══════ FOOTER CTA ═══════ */}
          <section className="relative z-10 max-w-6xl mx-auto px-6 lg:px-12 pb-20">
            <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary-soft/40 via-card to-card p-8 lg:p-10 flex flex-col lg:flex-row items-center justify-between gap-6">
              <div className="text-center lg:text-left">
                <p className="text-[10px] tracking-widest uppercase text-primary font-bold mb-2">Для администрации</p>
                <h3 className="text-xl lg:text-2xl font-bold text-foreground">Полный доступ к управлению городом</h3>
                <p className="text-sm text-muted-foreground mt-2 max-w-lg">
                  Детализация по каждому инциденту, AI-копилот, прогнозы рисков и сценарии «что если» — в защищённом контуре.
                </p>
              </div>
              <button
                onClick={() => navigate('/app')}
                className="flex items-center gap-2 px-7 py-3.5 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:bg-primary/90 transition-all hover:shadow-lg hover:-translate-y-0.5 whitespace-nowrap"
              >
                Войти в систему <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <p className="text-center text-[11px] text-muted-foreground/60 mt-8">
              Данные предоставлены в агрегированном виде · Источник: интеграционная платформа City Intelligence OS · Обновлено {now.toLocaleString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
            </p>
          </section>
        </>
      )}
    </div>
  );
}
