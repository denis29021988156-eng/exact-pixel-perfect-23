import { AlertTriangle, Clock, Eye, ArrowRight, TrendingUp, Sparkles, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useBriefing } from '@/hooks/useBriefing';
import StatusBadge from '@/components/StatusBadge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { chartDataDay, chartDataWeek } from '@/data/mock';

function RedZoneCard({ title, total, critical, label, onClick }: { title: string; total: number; critical?: number; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="glass-card glass-card-hover glow-danger p-5 text-left hover:border-danger/40 group w-full">
      <div className="flex items-start justify-between mb-3">
        <span className="meta-text uppercase tracking-wider font-medium">{title}</span>
        <AlertTriangle className="w-4 h-4 text-danger" />
      </div>
      <div className="kpi-value mb-1">{total}</div>
      {critical !== undefined && critical > 0 && (
        <div className="text-[11px] text-danger font-semibold">{label}: {critical}</div>
      )}
      <div className="mt-3 flex items-center gap-1 text-[11px] text-muted-foreground group-hover:text-primary transition-colors">
        Подробнее <ArrowRight className="w-3 h-3" />
      </div>
    </button>
  );
}

function TodoItem({ title, dept, responsible, deadline, overdue }: { title: string; dept: string; responsible: string; deadline: string; overdue: boolean }) {
  return (
    <div className="flex items-center gap-4 px-3 py-3.5 rounded-lg bg-surface hover:bg-surface-elevated transition-colors">
      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${overdue ? 'bg-danger' : 'bg-warning'}`} />
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

  // Live stats from DB
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

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setDataLoading(true);
    const today = new Date().toISOString().split('T')[0];
    
    const [incRes, taskRes, projRes] = await Promise.all([
      supabase.from('incidents').select('*').neq('status', 'closed'),
      supabase.from('tasks').select('*').neq('status', 'completed'),
      supabase.from('projects').select('*'),
    ]);

    const incidents = incRes.data || [];
    const tasks = taskRes.data || [];
    const projects = projRes.data || [];

    setStats({
      activeIncidents: incidents.length,
      criticalIncidents: incidents.filter(i => i.severity === 'high').length,
      overdueIncidents: incidents.filter(i => i.sla_overdue).length,
      socialAtRisk: incidents.filter(i => i.social_object).length,
      overdueTasks: tasks.filter(t => t.overdue).length,
    });

    // Urgent: overdue incidents + overdue tasks
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

    // Today items
    const todayTasks = tasks.filter(t => t.deadline === today && !t.overdue).map(t => ({
      title: t.title, dept: t.department || '', responsible: t.responsible || '',
      deadline: t.deadline || '', overdue: false,
    }));
    setTodayItems(todayTasks);

    // Risk projects
    const risky = projects.filter(p => p.status === 'risk' || p.status === 'overdue').map(p => ({
      title: p.name, dept: p.department || '', responsible: p.responsible || '',
      deadline: p.planned_end || '', overdue: p.status === 'overdue',
    }));
    setRiskProjects(risky);

    setDataLoading(false);
  }

  const chartData = chartPeriod === 'day' ? chartDataDay : chartDataWeek;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Сегодня</h1>
          <p className="meta-text mt-1">
            {new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' })}
          </p>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          {dataLoading ? (
            <><Clock className="w-3.5 h-3.5" /> Загрузка...</>
          ) : (
            <><span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" /><span>Live</span> · Данные синхронизированы</>
          )}
        </div>
      </div>

      {/* AI Briefing Panel */}
      <div className="glass-card glow-primary p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            AI-сводка для руководства
          </h2>
          <button
            onClick={generateBriefing}
            disabled={briefingLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${briefingLoading ? 'animate-spin' : ''}`} />
            {briefingLoading ? 'Генерация...' : 'Сгенерировать'}
          </button>
        </div>
        {briefing ? (
          <div className="text-sm text-foreground whitespace-pre-line leading-relaxed">
            {briefing.briefing}
            <p className="text-xs text-muted-foreground mt-3">
              Сгенерировано: {new Date(briefing.generatedAt).toLocaleTimeString('ru-RU')}
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Нажмите «Сгенерировать» для получения AI-анализа текущей ситуации в городе.
          </p>
        )}
      </div>

      {/* Red Zone */}
      <div className="red-zone-panel section-divider pt-6">
        <h2 className="text-[10px] font-bold text-danger uppercase tracking-widest mb-3 flex items-center gap-2">
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
      <div className="glass-card p-5 section-divider">
        <h2 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
          <Eye className="w-4 h-4 text-primary" />
          Что сделать сегодня
        </h2>

        {urgentItems.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-semibold text-danger uppercase tracking-wider mb-2">Сделать сейчас</p>
            <div className="space-y-2">
              {urgentItems.map((item, i) => <TodoItem key={`u-${i}`} {...item} />)}
            </div>
          </div>
        )}

        {todayItems.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-semibold text-warning uppercase tracking-wider mb-2">До конца дня</p>
            <div className="space-y-2">
              {todayItems.map((item, i) => <TodoItem key={`t-${i}`} {...item} />)}
            </div>
          </div>
        )}

        {riskProjects.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">На контроле</p>
            <div className="space-y-2">
              {riskProjects.map((item, i) => <TodoItem key={`r-${i}`} {...item} />)}
            </div>
          </div>
        )}

        {urgentItems.length === 0 && todayItems.length === 0 && riskProjects.length === 0 && (
          <p className="text-sm text-muted-foreground">Нет срочных задач. Добавьте данные через формы.</p>
        )}
      </div>

      {/* Chart */}
      <div className="glass-card p-5 section-divider">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            Динамика инцидентов
          </h2>
          <div className="flex bg-surface rounded-lg p-1">
            <button
              onClick={() => setChartPeriod('day')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${chartPeriod === 'day' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              День
            </button>
            <button
              onClick={() => setChartPeriod('week')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${chartPeriod === 'week' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Неделя
            </button>
          </div>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(214 20% 90%)" />
              <XAxis dataKey="time" tick={{ fill: 'hsl(215 16% 47%)', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'hsl(215 16% 47%)', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: 'hsl(0 0% 100%)', border: '1px solid hsl(214 20% 90%)', borderRadius: '8px', color: 'hsl(222 47% 11%)' }}
                labelStyle={{ color: 'hsl(222 47% 11%)' }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="new" name="Новые" fill="hsl(0 72% 51%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="closed" name="Закрытые" fill="hsl(142 71% 45%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
