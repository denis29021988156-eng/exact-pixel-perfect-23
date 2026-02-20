import { AlertTriangle, Clock, Eye, ArrowRight, TrendingUp, TrendingDown } from 'lucide-react';
import { useState } from 'react';
import { incidents, tasks, projects, chartDataDay, chartDataWeek } from '@/data/mock';
import StatusBadge from '@/components/StatusBadge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useNavigate } from 'react-router-dom';

function RedZoneCard({ title, total, critical, label, onClick }: { title: string; total: number; critical?: number; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="glass-card glow-danger p-5 text-left hover:border-danger/40 transition-all group w-full">
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</span>
        <AlertTriangle className="w-4 h-4 text-danger" />
      </div>
      <div className="text-3xl font-extrabold text-foreground mb-1">{total}</div>
      {critical !== undefined && (
        <div className="text-xs text-danger font-semibold">{label}: {critical}</div>
      )}
      <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground group-hover:text-primary transition-colors">
        Подробнее <ArrowRight className="w-3 h-3" />
      </div>
    </button>
  );
}

function TodoItem({ title, dept, responsible, deadline, overdue }: { title: string; dept: string; responsible: string; deadline: string; overdue: boolean }) {
  return (
    <div className="flex items-center gap-4 p-3 rounded-lg bg-surface hover:bg-surface-elevated transition-colors">
      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${overdue ? 'bg-danger' : 'bg-warning'}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{title}</p>
        <p className="text-xs text-muted-foreground">{dept} · {responsible}</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-xs text-muted-foreground">{deadline}</span>
        {overdue && <StatusBadge variant="danger">Просрочено</StatusBadge>}
      </div>
    </div>
  );
}

export default function TodayPage() {
  const [chartPeriod, setChartPeriod] = useState<'day' | 'week'>('day');
  const navigate = useNavigate();

  const activeIncidents = incidents.filter(i => i.status !== 'closed');
  const criticalIncidents = incidents.filter(i => i.severity === 'high' && i.status !== 'closed');
  const overdueIncidents = incidents.filter(i => i.slaOverdue);
  const socialAtRisk = incidents.filter(i => i.socialObject && i.status !== 'closed');
  const repeatedIncidents = 3; // mock

  const urgentItems = [
    ...overdueIncidents.map(i => ({ title: i.title, dept: i.department.split(' ').slice(1).join(' '), responsible: i.responsible, deadline: i.slaDeadline.split('T')[0], overdue: true })),
    ...tasks.filter(t => t.overdue && t.status !== 'completed').map(t => ({ title: t.title, dept: t.department.split(' ').slice(1).join(' '), responsible: t.responsible, deadline: t.deadline, overdue: true })),
  ];

  const todayItems = tasks.filter(t => t.deadline === '2026-02-20' && !t.overdue && t.status !== 'completed')
    .map(t => ({ title: t.title, dept: t.department.split(' ').slice(1).join(' '), responsible: t.responsible, deadline: t.deadline, overdue: false }));

  const riskProjects = projects.filter(p => p.status === 'risk' || p.status === 'overdue')
    .map(p => ({ title: p.name, dept: p.department.split(' ').slice(1).join(' '), responsible: p.responsible, deadline: p.plannedEnd, overdue: p.status === 'overdue' }));

  const chartData = chartPeriod === 'day' ? chartDataDay : chartDataWeek;

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">Сегодня</h1>
          <p className="text-sm text-muted-foreground mt-0.5">20 февраля 2026 · Четверг</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="w-4 h-4" />
          Обновлено 5 мин назад
        </div>
      </div>

      {/* Red Zone */}
      <div>
        <h2 className="text-xs font-bold text-danger uppercase tracking-widest mb-3 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-danger animate-pulse-danger" />
          Красная зона
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <RedZoneCard title="Инциденты в работе" total={activeIncidents.length} critical={criticalIncidents.length} label="Критических" onClick={() => navigate('/incidents')} />
          <RedZoneCard title="Просрочено SLA" total={overdueIncidents.length} critical={undefined} label="" onClick={() => navigate('/incidents')} />
          <RedZoneCard title="Соцобъекты под риском" total={socialAtRisk.length} critical={undefined} label="" onClick={() => navigate('/incidents')} />
          <RedZoneCard title="Повторные инциденты" total={repeatedIncidents} critical={undefined} label="" onClick={() => navigate('/incidents')} />
        </div>
      </div>

      {/* What to do today */}
      <div className="glass-card p-5">
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
      </div>

      {/* Chart */}
      <div className="glass-card p-5">
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
