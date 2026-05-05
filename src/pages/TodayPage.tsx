import { AlertTriangle, Clock, Eye, ArrowRight, TrendingUp, BrainCircuit, RefreshCw, Activity, ShieldAlert, Users, CheckCircle2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';

function useCountUp(end: number, duration = 800) {
  const [value, setValue] = useState(0);
  const prevEnd = useRef(0);
  useEffect(() => {
    if (end === prevEnd.current) return;
    const start = prevEnd.current;
    prevEnd.current = end;
    if (end === 0) { setValue(0); return; }
    const startTime = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(start + (end - start) * eased));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [end, duration]);
  return value;
}

import { supabase } from '@/integrations/supabase/client';
import { useBriefing } from '@/hooks/useBriefing';
import StatusBadge from '@/components/StatusBadge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { chartDataDay, chartDataWeek } from '@/data/mock';
import EscalationPanel from '@/components/EscalationPanel';
import WhatIfCard from '@/components/WhatIfCard';
import BudgetRiskCard from '@/components/BudgetRiskCard';
import CityPulseBlock from '@/components/CityPulseBlock';
import BenchmarkBlock from '@/components/BenchmarkBlock';
import ConfidenceBadge from '@/components/ConfidenceBadge';
import WeatherWidget from '@/components/WeatherWidget';

/* ─── Risk Index Gauge ─── */
function RiskGauge({ value }: { value: number }) {
  const animVal = useCountUp(value);
  const color = value > 70 ? 'var(--danger)' : value > 40 ? 'var(--warning)' : value > 15 ? 'var(--info)' : 'var(--success)';
  const colorName = value > 70 ? 'danger' : value > 40 ? 'warning' : value > 15 ? 'info' : 'success';
  const label = value > 70 ? 'Критический' : value > 40 ? 'Повышенный' : value > 15 ? 'Умеренный' : 'Низкий';
  const pct = Math.min(value, 100);
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (pct / 100) * circumference * 0.75; // 270 degrees

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-36 h-36">
        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-[135deg]">
          <circle cx="60" cy="60" r="54" fill="none" stroke="hsl(var(--border))" strokeWidth="8" strokeLinecap="round"
            strokeDasharray={`${circumference * 0.75} ${circumference * 0.25}`} />
          <circle cx="60" cy="60" r="54" fill="none" stroke={`hsl(${color})`} strokeWidth="8" strokeLinecap="round"
            strokeDasharray={`${circumference * 0.75} ${circumference * 0.25}`}
            strokeDashoffset={offset}
            className="transition-all duration-1000 ease-out" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-5xl font-extrabold text-foreground tracking-tight leading-none">{animVal}</span>
          <span className="text-[10px] font-semibold text-muted-foreground tracking-wider uppercase mt-1">/ 100</span>
        </div>
      </div>
      <StatusBadge variant={colorName === 'info' ? 'info' : colorName === 'danger' ? 'danger' : colorName === 'warning' ? 'warning' : 'success'} className="mt-2">
        {label}
      </StatusBadge>
    </div>
  );
}

/* ─── KPI Stat Card ─── */
function StatCard({ icon: Icon, label, value, subtitle, variant = 'default', onClick }: {
  icon: any; label: string; value: number; subtitle?: string;
  variant?: 'default' | 'danger' | 'warning' | 'success'; onClick?: () => void;
}) {
  const animVal = useCountUp(value);
  const bgMap = {
    default: 'bg-card',
    danger: 'bg-danger-soft/50 border-danger/15',
    warning: 'bg-warning-muted/50 border-warning/15',
    success: 'bg-success-muted/50 border-success/15',
  };
  const iconBgMap = {
    default: 'bg-primary/10 text-primary',
    danger: 'bg-danger/10 text-danger',
    warning: 'bg-warning/10 text-warning',
    success: 'bg-success/10 text-success',
  };
  return (
    <button onClick={onClick} className={`glass-card glass-card-hover p-5 text-left group w-full ${bgMap[variant]}`}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconBgMap[variant]}`}>
          <Icon className="w-4.5 h-4.5" />
        </div>
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</span>
      </div>
      <div className="kpi-value">{animVal}</div>
      {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
    </button>
  );
}

/* ─── Todo Item ─── */
function TodoItem({ title, dept, responsible, deadline, overdue }: { title: string; dept: string; responsible: string; deadline: string; overdue: boolean }) {
  return (
    <div className={`flex items-center gap-4 px-4 py-3.5 rounded-xl transition-colors duration-150 ${overdue ? 'bg-danger-soft/40 border border-danger/10' : 'bg-surface-muted/50 hover:bg-surface-muted'}`}>
      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${overdue ? 'bg-danger animate-pulse' : 'bg-warning'}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{title}</p>
        <p className="meta-text mt-0.5 text-xs">{dept} · {responsible}</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-xs text-muted-foreground">{deadline}</span>
        {overdue && <StatusBadge variant="danger" pulse>Просрочено</StatusBadge>}
      </div>
    </div>
  );
}

export default function TodayPage() {
  const [chartPeriod, setChartPeriod] = useState<'day' | 'week'>('day');
  const navigate = useNavigate();
  const { data: briefing, loading: briefingLoading, generate: generateBriefing } = useBriefing();
  const { user, userRole } = useAuth();
  const [deputyDept, setDeputyDept] = useState<string | null>(null);

  const [stats, setStats] = useState({
    activeIncidents: 0,
    criticalIncidents: 0,
    overdueIncidents: 0,
    socialAtRisk: 0,
    overdueTasks: 0,
    totalTasks: 0,
    completedTasks: 0,
    activeProjects: 0,
  });
  const [urgentItems, setUrgentItems] = useState<any[]>([]);
  const [todayItems, setTodayItems] = useState<any[]>([]);
  const [riskProjects, setRiskProjects] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (userRole === 'deputy' && user?.id) {
      supabase.from('profiles').select('department').eq('user_id', user.id).maybeSingle().then(({ data }) => {
        setDeputyDept(data?.department || null);
      });
    }
  }, [userRole, user?.id]);

  useEffect(() => { loadData(); }, [deputyDept]);

  async function loadData() {
    setDataLoading(true);
    const today = new Date().toISOString().split('T')[0];
    
    const [incRes, taskRes, projRes] = await Promise.all([
      supabase.from('incidents').select('*').neq('status', 'closed'),
      supabase.from('tasks').select('*'),
      supabase.from('projects').select('*'),
    ]);

    const allIncidents = incRes.data || [];
    const allTasks = taskRes.data || [];
    const allProjects = projRes.data || [];

    const incidents = deputyDept ? allIncidents.filter(i => i.department === deputyDept) : allIncidents;
    const tasks = deputyDept ? allTasks.filter(t => t.department === deputyDept) : allTasks;
    const projects = deputyDept ? allProjects.filter(p => p.department === deputyDept) : allProjects;

    const activeTasks = tasks.filter(t => t.status !== 'completed' && t.status !== 'cancelled');

    setStats({
      activeIncidents: incidents.length,
      criticalIncidents: incidents.filter(i => i.severity === 'high').length,
      overdueIncidents: incidents.filter(i => i.sla_overdue).length,
      socialAtRisk: incidents.filter(i => i.social_object).length,
      overdueTasks: activeTasks.filter(t => t.overdue).length,
      totalTasks: activeTasks.length,
      completedTasks: tasks.filter(t => t.status === 'completed').length,
      activeProjects: projects.filter(p => p.status !== 'completed').length,
    });

    const urgent = [
      ...incidents.filter(i => i.sla_overdue).map(i => ({
        title: i.title, dept: i.department || '', responsible: i.responsible || '',
        deadline: i.sla_deadline ? new Date(i.sla_deadline).toLocaleDateString('ru-RU') : '', overdue: true,
      })),
      ...activeTasks.filter(t => t.overdue).map(t => ({
        title: t.title, dept: t.department || '', responsible: t.responsible || '',
        deadline: t.deadline || '', overdue: true,
      })),
    ];
    setUrgentItems(urgent);

    const todayTasksList = activeTasks.filter(t => t.deadline === today && !t.overdue).map(t => ({
      title: t.title, dept: t.department || '', responsible: t.responsible || '',
      deadline: t.deadline || '', overdue: false,
    }));
    setTodayItems(todayTasksList);

    const risky = projects.filter(p => p.status === 'risk' || p.status === 'overdue').map(p => ({
      title: p.name, dept: p.department || '', responsible: p.responsible || '',
      deadline: p.planned_end || '', overdue: p.status === 'overdue',
    }));
    setRiskProjects(risky);

    setDataLoading(false);
  }

  const chartData = chartPeriod === 'day' ? chartDataDay : chartDataWeek;
  const riskIndex = briefing?.riskIndex ?? 0;
  // Простой расчёт уверенности: чем больше данных и свежее briefing — тем выше
  const dataConfidence = briefing
    ? Math.min(95, 60 + Math.min(stats.activeIncidents, 10) * 3 + Math.min(stats.activeProjects, 10) * 2)
    : 50;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-bold text-foreground tracking-tight">Сегодня</h1>
          <p className="meta-text mt-1">
            {new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' })}
            {deputyDept && <span className="ml-2 px-2 py-0.5 rounded-lg bg-primary/10 text-primary text-[10px] font-semibold">Зона: {deputyDept}</span>}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {dataLoading ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground"><Clock className="w-3.5 h-3.5 animate-spin" /> Загрузка...</div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-success-muted/60 border border-success/15">
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              <span className="text-xs font-semibold text-success">Live</span>
              <span className="text-[10px] text-muted-foreground">Данные актуальны</span>
            </div>
          )}
        </div>
      </div>

      {/* ─── Risk Index + KPI Row ─── */}
      <div className="grid grid-cols-12 gap-4">
        {/* Risk Index Gauge */}
        <div className="col-span-12 lg:col-span-3">
          <div className="glass-card p-6 h-full flex flex-col items-center justify-center">
            <p className="section-heading mb-3">Индекс риска города</p>
            <RiskGauge value={riskIndex} />
            <div className="mt-3">
              <ConfidenceBadge score={dataConfidence} source="Агрегированные источники" ageMinutes={1} />
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="col-span-12 lg:col-span-9 grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={AlertTriangle} label="Инциденты" value={stats.activeIncidents}
            subtitle={`${stats.criticalIncidents} критических`} variant="danger" onClick={() => navigate('/app/incidents')} />
          <StatCard icon={ShieldAlert} label="Просрочено SLA" value={stats.overdueIncidents}
            variant="danger" onClick={() => navigate('/app/incidents')} />
          <StatCard icon={Clock} label="Задачи просрочены" value={stats.overdueTasks}
            subtitle={`из ${stats.totalTasks} активных`} variant="warning" onClick={() => navigate('/app/tasks')} />
          <StatCard icon={CheckCircle2} label="Выполнено задач" value={stats.completedTasks}
            variant="success" />
          <StatCard icon={Users} label="Соцобъекты" value={stats.socialAtRisk}
            subtitle="под угрозой" variant={stats.socialAtRisk > 0 ? 'warning' : 'default'} onClick={() => navigate('/app/incidents')} />
          <StatCard icon={Activity} label="Проекты" value={stats.activeProjects}
            subtitle={`${riskProjects.length} в риске`} variant={riskProjects.length > 0 ? 'warning' : 'default'} onClick={() => navigate('/app/program')} />
          <div className="col-span-2 glass-card p-5 flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Активность за 24ч</p>
              <div className="h-12">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartDataDay}>
                    <defs>
                      <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="new" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#sparkGrad)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="text-right">
              <span className="text-lg font-bold text-foreground">{chartDataDay.reduce((s, d) => s + d.new, 0)}</span>
              <p className="text-[10px] text-muted-foreground">новых</p>
            </div>
          </div>
        </div>
      </div>

      {/* Escalation Panel */}
      <EscalationPanel />

      {/* Weather 72h */}
      <WeatherWidget />

      {/* AI Briefing Panel */}
      <div className="ai-card p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary/15 flex items-center justify-center">
              <BrainCircuit className="w-4.5 h-4.5 text-primary" />
            </div>
            AI-сводка для руководства
            {briefing?.mode === 'fallback' && (
              <span
                className="ml-2 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-warning/10 text-warning border border-warning/30"
                title={briefing.fallbackReason ? `AI недоступен: ${briefing.fallbackReason}` : 'AI недоступен'}
              >
                Технический режим
              </span>
            )}
            {briefing?.riskIndex !== undefined && (
              <span className={`ml-2 px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                briefing.riskIndex > 70 ? 'bg-danger/10 text-danger' :
                briefing.riskIndex > 40 ? 'bg-warning/10 text-warning' :
                briefing.riskIndex > 15 ? 'bg-primary/10 text-primary' :
                'bg-success/10 text-success'
              }`}>
                Risk Index: {briefing.riskIndex}/100
              </span>
            )}
          </h2>
          <button
            onClick={generateBriefing}
            disabled={briefingLoading}
            className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${briefingLoading ? 'animate-spin' : ''}`} />
            {briefingLoading ? 'Генерация...' : 'Сгенерировать'}
          </button>
        </div>
        {briefing ? (
          <div className="text-sm text-foreground/90 whitespace-pre-line leading-relaxed">
            <div className="prose prose-sm prose-invert max-w-none">
              <ReactMarkdown>{briefing.briefing}</ReactMarkdown>
            </div>
            <p className="meta-text mt-4 text-xs">
              Сгенерировано: {new Date(briefing.generatedAt).toLocaleTimeString('ru-RU')}
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-4 py-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <BrainCircuit className="w-6 h-6 text-primary/40" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground/70">AI-анализ не загружен</p>
              <p className="text-xs text-muted-foreground mt-0.5">Нажмите «Сгенерировать» для получения сводки по текущей ситуации</p>
            </div>
          </div>
        )}
      </div>

      {/* What to do today */}
      <div className="glass-card p-6">
        <h2 className="text-sm font-semibold text-foreground mb-5 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary/15 flex items-center justify-center">
            <Eye className="w-4.5 h-4.5 text-primary" />
          </div>
          Что сделать сегодня
          {urgentItems.length > 0 && (
            <span className="ml-auto px-2.5 py-1 rounded-lg text-[10px] font-bold bg-danger/10 text-danger">
              {urgentItems.length} срочных
            </span>
          )}
        </h2>

        {urgentItems.length > 0 && (
          <div className="mb-5">
            <p className="section-heading text-danger mb-3 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-danger animate-pulse" />
              Сделать сейчас
            </p>
            <div className="space-y-2">
              {urgentItems.map((item, i) => <TodoItem key={`u-${i}`} {...item} />)}
            </div>
          </div>
        )}

        {todayItems.length > 0 && (
          <div className="mb-5">
            <p className="section-heading text-warning mb-3">До конца дня</p>
            <div className="space-y-2">
              {todayItems.map((item, i) => <TodoItem key={`t-${i}`} {...item} />)}
            </div>
          </div>
        )}

        {riskProjects.length > 0 && (
          <div>
            <p className="section-heading mb-3">На контроле</p>
            <div className="space-y-2">
              {riskProjects.map((item, i) => <TodoItem key={`r-${i}`} {...item} />)}
            </div>
          </div>
        )}

        {urgentItems.length === 0 && todayItems.length === 0 && riskProjects.length === 0 && (
          <p className="text-sm text-muted-foreground/60">Нет срочных задач. Добавьте данные через формы.</p>
        )}
      </div>

      {/* What-If Scenarios */}
      <WhatIfCard />

      {/* Budget Risk */}
      <BudgetRiskCard />

      {/* City Pulse */}
      <CityPulseBlock />

      {/* Benchmarks */}
      <BenchmarkBlock />

      {/* Chart */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary/15 flex items-center justify-center">
              <TrendingUp className="w-4.5 h-4.5 text-primary" />
            </div>
            Динамика инцидентов
          </h2>
          <div className="flex bg-surface-muted rounded-xl p-1">
            <button
              onClick={() => setChartPeriod('day')}
              className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${chartPeriod === 'day' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              День
            </button>
            <button
              onClick={() => setChartPeriod('week')}
              className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${chartPeriod === 'week' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Неделя
            </button>
          </div>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="time" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} axisLine={false} tickLine={false} width={30} />
              <Tooltip
                contentStyle={{ backgroundColor: 'hsl(213 33% 17%)', border: 'none', borderRadius: '12px', color: '#FFFFFF', boxShadow: '0 8px 24px rgba(0,0,0,0.25)', padding: '12px 16px' }}
                labelStyle={{ color: '#FFFFFF', fontWeight: 600, marginBottom: 4 }}
                itemStyle={{ color: '#FFFFFF', fontSize: 12 }}
              />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
              <Bar dataKey="new" name="Новые" fill="hsl(var(--danger))" radius={[6, 6, 0, 0]} />
              <Bar dataKey="closed" name="Закрытые" fill="hsl(var(--success))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
