import { AlertTriangle, Clock, Eye, ArrowRight, TrendingUp, BrainCircuit, RefreshCw } from 'lucide-react';
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
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { chartDataDay, chartDataWeek } from '@/data/mock';
import EscalationPanel from '@/components/EscalationPanel';
import WhatIfCard from '@/components/WhatIfCard';
import BudgetRiskCard from '@/components/BudgetRiskCard';
import CityPulseBlock from '@/components/CityPulseBlock';
import BenchmarkBlock from '@/components/BenchmarkBlock';

function RedZoneCard({ title, total, critical, label, onClick }: { title: string; total: number; critical?: number; label: string; onClick: () => void }) {
  const animTotal = useCountUp(total);
  const animCritical = useCountUp(critical ?? 0);
  return (
    <button onClick={onClick} className="glass-card glass-card-hover p-6 text-left group w-full bg-danger-soft/40 border-danger/10 hover:border-danger/25">
      <div className="flex items-start justify-between mb-4">
        <span className="section-heading text-muted-foreground">{title}</span>
        <AlertTriangle className="w-4 h-4 text-danger/60" />
      </div>
      <div className="kpi-value mb-1">{animTotal}</div>
      {critical !== undefined && critical > 0 && (
        <div className="text-[11px] text-danger/80 font-semibold">{label}: {animCritical}</div>
      )}
      <div className="mt-4 flex items-center gap-1 text-[11px] text-muted-foreground/60 group-hover:text-primary transition-colors">
        Подробнее <ArrowRight className="w-3 h-3" />
      </div>
    </button>
  );
}

function TodoItem({ title, dept, responsible, deadline, overdue }: { title: string; dept: string; responsible: string; deadline: string; overdue: boolean }) {
  return (
    <div className="flex items-center gap-4 px-4 py-4 rounded-xl bg-surface-muted/50 hover:bg-surface-muted transition-colors duration-150">
      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${overdue ? 'bg-danger' : 'bg-warning'}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{title}</p>
        <p className="meta-text mt-0.5">{dept} · {responsible}</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="meta-text">{deadline}</span>
        {overdue && <StatusBadge variant="danger">Просрочено</StatusBadge>}
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
  });
  const [urgentItems, setUrgentItems] = useState<any[]>([]);
  const [todayItems, setTodayItems] = useState<any[]>([]);
  const [riskProjects, setRiskProjects] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  // E008: Load deputy's department for zone filtering
  useEffect(() => {
    if (userRole === 'deputy' && user?.id) {
      supabase.from('profiles').select('department').eq('user_id', user.id).maybeSingle().then(({ data }) => {
        setDeputyDept(data?.department || null);
      });
    }
  }, [userRole, user?.id]);

  useEffect(() => {
    loadData();
  }, [deputyDept]);

  async function loadData() {
    setDataLoading(true);
    const today = new Date().toISOString().split('T')[0];
    
    const [incRes, taskRes, projRes] = await Promise.all([
      supabase.from('incidents').select('*').neq('status', 'closed'),
      supabase.from('tasks').select('*').neq('status', 'completed'),
      supabase.from('projects').select('*'),
    ]);

    // E008: Filter by deputy's department if applicable
    const allIncidents = incRes.data || [];
    const allTasks = taskRes.data || [];
    const allProjects = projRes.data || [];

    const incidents = deputyDept ? allIncidents.filter(i => i.department === deputyDept) : allIncidents;
    const tasks = deputyDept ? allTasks.filter(t => t.department === deputyDept) : allTasks;
    const projects = deputyDept ? allProjects.filter(p => p.department === deputyDept) : allProjects;

    setStats({
      activeIncidents: incidents.length,
      criticalIncidents: incidents.filter(i => i.severity === 'high').length,
      overdueIncidents: incidents.filter(i => i.sla_overdue).length,
      socialAtRisk: incidents.filter(i => i.social_object).length,
      overdueTasks: tasks.filter(t => t.overdue).length,
    });

    const urgent = [
      ...incidents.filter(i => i.sla_overdue).map(i => ({
        title: i.title, dept: i.department || '', responsible: i.responsible || '',
        deadline: i.sla_deadline ? new Date(i.sla_deadline).toLocaleDateString('ru-RU') : '', overdue: true,
      })),
      ...tasks.filter(t => t.overdue).map(t => ({
        title: t.title, dept: t.department || '', responsible: t.responsible || '',
        deadline: t.deadline || '', overdue: true,
      })),
    ];
    setUrgentItems(urgent);

    const todayTasks = tasks.filter(t => t.deadline === today && !t.overdue).map(t => ({
      title: t.title, dept: t.department || '', responsible: t.responsible || '',
      deadline: t.deadline || '', overdue: false,
    }));
    setTodayItems(todayTasks);

    const risky = projects.filter(p => p.status === 'risk' || p.status === 'overdue').map(p => ({
      title: p.name, dept: p.department || '', responsible: p.responsible || '',
      deadline: p.planned_end || '', overdue: p.status === 'overdue',
    }));
    setRiskProjects(risky);

    setDataLoading(false);
  }

  const chartData = chartPeriod === 'day' ? chartDataDay : chartDataWeek;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Сегодня</h1>
          <p className="meta-text mt-1">
            {new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' })}
          </p>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground/60">
          {dataLoading ? (
            <><Clock className="w-3.5 h-3.5" /> Загрузка...</>
          ) : (
            <><span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" /><span className="font-medium">Live</span> · Данные синхронизированы</>
          )}
        </div>
      </div>

      {/* Escalation Panel */}
      <EscalationPanel />

      {/* AI Briefing Panel */}
      <div className="ai-card p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <BrainCircuit className="w-4 h-4 text-primary" />
            </div>
            AI-сводка для руководства
            {briefing?.riskIndex !== undefined && (
              <span className={`ml-2 px-2 py-0.5 rounded-lg text-[10px] font-bold ${
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
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${briefingLoading ? 'animate-spin' : ''}`} />
            {briefingLoading ? 'Генерация...' : 'Сгенерировать'}
          </button>
        </div>
        {briefing ? (
          <div className="text-sm text-foreground/90 whitespace-pre-line leading-relaxed">
            <div className="prose prose-sm max-w-none">
              <ReactMarkdown>{briefing.briefing}</ReactMarkdown>
            </div>
            <p className="meta-text mt-4">
              Сгенерировано: {new Date(briefing.generatedAt).toLocaleTimeString('ru-RU')}
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground/60">
            Нажмите «Сгенерировать» для получения AI-анализа текущей ситуации в городе.
          </p>
        )}
      </div>

      {/* Red Zone */}
      <div className="red-zone-panel">
        <h2 className="section-heading text-danger mb-4 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-danger animate-pulse" />
          Красная зона
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <RedZoneCard title="Инциденты в работе" total={stats.activeIncidents} critical={stats.criticalIncidents} label="Критических" onClick={() => navigate('/incidents')} />
          <RedZoneCard title="Просрочено SLA" total={stats.overdueIncidents} critical={undefined} label="" onClick={() => navigate('/incidents')} />
          <RedZoneCard title="Соцобъекты под риском" total={stats.socialAtRisk} critical={undefined} label="" onClick={() => navigate('/incidents')} />
          <RedZoneCard title="Просроченные задачи" total={stats.overdueTasks} critical={undefined} label="" onClick={() => navigate('/tasks')} />
        </div>
      </div>

      {/* What to do today */}
      <div className="glass-card p-6">
        <h2 className="text-sm font-semibold text-foreground mb-5 flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
            <Eye className="w-4 h-4 text-primary" />
          </div>
          Что сделать сегодня
        </h2>

        {urgentItems.length > 0 && (
          <div className="mb-5">
            <p className="section-heading text-danger mb-3">Сделать сейчас</p>
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

      {/* Chart */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-primary" />
            </div>
            Динамика инцидентов
          </h2>
          <div className="flex bg-surface-muted rounded-xl p-1">
            <button
              onClick={() => setChartPeriod('day')}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${chartPeriod === 'day' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              День
            </button>
            <button
              onClick={() => setChartPeriod('week')}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${chartPeriod === 'week' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Неделя
            </button>
          </div>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 92%)" />
              <XAxis dataKey="time" tick={{ fill: 'hsl(220 15% 50%)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'hsl(220 15% 50%)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: 'hsl(220 20% 100%)', border: '1px solid hsl(220 15% 90%)', borderRadius: '12px', color: 'hsl(222 47% 11%)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                labelStyle={{ color: 'hsl(222 47% 11%)' }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="new" name="Новые" fill="hsl(2 72% 52%)" radius={[6, 6, 0, 0]} />
              <Bar dataKey="closed" name="Закрытые" fill="hsl(145 55% 45%)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
