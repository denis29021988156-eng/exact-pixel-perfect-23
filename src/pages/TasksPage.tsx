import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import StatusBadge from '@/components/StatusBadge';
import CreateTaskDialog from '@/components/forms/CreateTaskDialog';
import { ClipboardCheck, Search, Filter, User, Calendar, Plus, Clock, AlertTriangle, CheckCircle2, ListChecks, BarChart3 } from 'lucide-react';
import { useCanManage } from '@/hooks/useCanManage';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';

const statusLabels: Record<string, string> = { new: 'Новое', in_progress: 'В работе', completed: 'Выполнено', cancelled: 'Отменено' };
const statusVariants: Record<string, 'danger' | 'warning' | 'success' | 'info' | 'muted'> = {
  new: 'info', in_progress: 'warning', completed: 'success', cancelled: 'muted',
};

function PerformanceDialog({ open, onOpenChange, tasks }: { open: boolean; onOpenChange: (v: boolean) => void; tasks: Tables<'tasks'>[] }) {
  const rows = (() => {
    const map = new Map<string, { name: string; total: number; completed: number; overdue: number; active: number }>();
    tasks.forEach(t => {
      const name = t.responsible || '— не назначен —';
      const r = map.get(name) || { name, total: 0, completed: 0, overdue: 0, active: 0 };
      r.total += 1;
      if (t.status === 'completed') r.completed += 1;
      if (t.status !== 'completed' && t.status !== 'cancelled') r.active += 1;
      if (t.overdue && t.status !== 'completed' && t.status !== 'cancelled') r.overdue += 1;
      map.set(name, r);
    });
    return Array.from(map.values())
      .map(r => ({ ...r, rate: r.total ? Math.round((r.completed / r.total) * 100) : 0 }))
      .sort((a, b) => b.rate - a.rate || b.total - a.total);
  })();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><BarChart3 className="w-5 h-5 text-primary" /> Исполнительность</DialogTitle>
          <DialogDescription>Процент выполнения и нарушения сроков по каждому ответственному</DialogDescription>
        </DialogHeader>

        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">Недостаточно данных для расчёта.</p>
        ) : (
          <>
            <div className="h-72 mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rows} layout="vertical" margin={{ left: 20, right: 20, top: 8, bottom: 8 }}>
                  <CartesianGrid horizontal={false} stroke="hsl(var(--border))" strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis type="category" dataKey="name" width={140} stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <Tooltip
                    contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                    formatter={(v: number) => [`${v}%`, '% выполнения']}
                  />
                  <Bar dataKey="rate" radius={[0, 6, 6, 0]}>
                    {rows.map((r, i) => (
                      <Cell key={i} fill={r.rate >= 70 ? 'hsl(var(--success))' : r.rate >= 40 ? 'hsl(var(--warning))' : 'hsl(var(--danger))'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="overflow-x-auto mt-2 border-t border-border pt-3">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    <th className="text-left font-medium pb-2">Ответственный</th>
                    <th className="text-right font-medium pb-2">Всего</th>
                    <th className="text-right font-medium pb-2">Активных</th>
                    <th className="text-right font-medium pb-2">Выполнено</th>
                    <th className="text-right font-medium pb-2">Просрочено</th>
                    <th className="text-right font-medium pb-2">% исполн.</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(r => (
                    <tr key={r.name} className="border-t border-border/50">
                      <td className="py-2 font-medium text-foreground">{r.name}</td>
                      <td className="py-2 text-right text-muted-foreground">{r.total}</td>
                      <td className="py-2 text-right text-muted-foreground">{r.active}</td>
                      <td className="py-2 text-right text-success font-semibold">{r.completed}</td>
                      <td className={`py-2 text-right font-semibold ${r.overdue > 0 ? 'text-danger' : 'text-muted-foreground'}`}>{r.overdue}</td>
                      <td className={`py-2 text-right font-bold ${r.rate >= 70 ? 'text-success' : r.rate >= 40 ? 'text-warning' : 'text-danger'}`}>{r.rate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function StatPill({ icon: Icon, label, value, variant = 'default', active = false, onClick }: { icon: any; label: string; value: number; variant?: 'default' | 'danger' | 'warning' | 'success'; active?: boolean; onClick?: () => void }) {
  const colorMap = {
    default: 'bg-card text-foreground border-border',
    danger: 'bg-danger-soft/50 text-danger border-danger/10',
    warning: 'bg-warning-muted/50 text-warning border-warning/10',
    success: 'bg-success-muted/50 text-success border-success/10',
  };
  const iconColorMap = {
    default: 'bg-primary/10 text-primary',
    danger: 'bg-danger/10 text-danger',
    warning: 'bg-warning/10 text-warning',
    success: 'bg-success/10 text-success',
  };
  const ringMap = {
    default: 'ring-primary/40',
    danger: 'ring-danger/50',
    warning: 'ring-warning/50',
    success: 'ring-success/50',
  };
  const Comp: any = onClick ? 'button' : 'div';
  return (
    <Comp
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border text-left transition-all ${colorMap[variant]} ${onClick ? 'cursor-pointer hover:shadow-sm hover:-translate-y-px' : ''} ${active ? `ring-2 ${ringMap[variant]} shadow-sm` : ''}`}
    >
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconColorMap[variant]}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <span className="text-2xl font-bold">{value}</span>
        <p className="text-[10px] font-medium text-muted-foreground leading-tight mt-0.5">{label}</p>
      </div>
    </Comp>
  );
}

export default function TasksPage() {
  const canManage = useCanManage();
  const { user, userRole, userDepartment } = useAuth();
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [activeOnly, setActiveOnly] = useState(true);
  const [search, setSearch] = useState('');
  const [tasks, setTasks] = useState<Tables<'tasks'>[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Tables<'tasks'> | null>(null);
  const [perfOpen, setPerfOpen] = useState(false);

  const loadData = useCallback(() => {
    let query = supabase.from('tasks').select('*').order('created_at', { ascending: false });
    if (userRole === 'deputy' && userDepartment) {
      query = query.eq('department', userDepartment);
    }
    query.then(({ data }) => {
      setTasks(data || []);
      setLoading(false);
    });
  }, [userRole, userDepartment]);

  useEffect(() => { loadData(); }, [loadData]);

  // Realtime: listen for any task change so mayor dashboard reflects status updates live
  useEffect(() => {
    const channel = supabase
      .channel('tasks-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => loadData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [loadData]);

  async function updateStatus(id: string, status: 'in_progress' | 'completed') {
    const { error } = await supabase.from('tasks').update({ status }).eq('id', id);
    if (error) toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
    else toast({ title: status === 'completed' ? 'Поручение выполнено' : 'Взято в работу' });
  }

  const filtered = tasks.filter(t => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (overdueOnly && !t.overdue) return false;
    if (statusFilter === 'all' && activeOnly && (t.status === 'completed' || t.status === 'cancelled')) return false;
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const activeTasks = tasks.filter(t => t.status !== 'completed' && t.status !== 'cancelled');
  const overdueCount = activeTasks.filter(t => t.overdue).length;
  const completedCount = tasks.filter(t => t.status === 'completed').length;
  const inProgressCount = tasks.filter(t => t.status === 'in_progress').length;

  const isActiveFilter = activeOnly && statusFilter === 'all' && !overdueOnly;
  const isInProgress = statusFilter === 'in_progress' && !overdueOnly;
  const isOverdue = overdueOnly;
  const isCompleted = statusFilter === 'completed';

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-bold text-foreground tracking-tight">Личные поручения</h1>
          <p className="meta-text mt-1">Поручения мэра и контроль исполнения</p>
        </div>
        {canManage && (
          <div className="flex items-center gap-2">
            <button onClick={() => setPerfOpen(true)} className="flex items-center gap-2 px-4 py-2.5 bg-surface border border-border text-sm font-semibold rounded-xl hover:bg-surface-muted transition-all">
              <BarChart3 className="w-4 h-4 text-primary" /> Исполнительность
            </button>
            <button onClick={() => setCreateOpen(true)} className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 transition-all shadow-sm">
              <Plus className="w-4 h-4" /> Новое поручение
            </button>
          </div>
        )}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatPill icon={ListChecks} label="Активных (новые + в работе)" value={activeTasks.length} active={isActiveFilter}
          onClick={() => { setActiveOnly(true); setStatusFilter('all'); setOverdueOnly(false); }} />
        <StatPill icon={Clock} label="в т.ч. в работе" value={inProgressCount} variant="warning" active={isInProgress}
          onClick={() => { setStatusFilter(isInProgress ? 'all' : 'in_progress'); setOverdueOnly(false); setActiveOnly(true); }} />
        <StatPill icon={AlertTriangle} label="в т.ч. просрочено" value={overdueCount} variant={overdueCount > 0 ? 'danger' : 'default'} active={isOverdue}
          onClick={() => { setOverdueOnly(!isOverdue); setStatusFilter('all'); setActiveOnly(true); }} />
        <StatPill icon={CheckCircle2} label="Выполнено (всего)" value={completedCount} variant="success" active={isCompleted}
          onClick={() => { setStatusFilter(isCompleted ? 'all' : 'completed'); setActiveOnly(false); setOverdueOnly(false); }} />
      </div>
      <p className="text-[11px] text-muted-foreground -mt-3 px-1">
        «В работе» и «Просрочено» — подмножества активных и могут пересекаться (просроченные часто остаются в работе). Всего поручений в системе: {activeTasks.length + completedCount + tasks.filter(t => t.status === 'cancelled').length}.
      </p>

      {/* Filters */}
      <div className="glass-card p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск поручений..."
            className="w-full pl-10 pr-4 py-2.5 bg-surface border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-shadow" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="bg-surface border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20">
          <option value="all">Все статусы</option>
          {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <div className="meta-text flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surface-muted text-xs font-medium">
          <Filter className="w-3.5 h-3.5" />
          {filtered.length} из {tasks.length}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="glass-card p-16 text-center">
          <div className="inline-flex items-center gap-2 text-muted-foreground">
            <Clock className="w-4 h-4 animate-spin" />
            <p className="text-sm">Загрузка поручений...</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(t => (
            <div
              key={t.id}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedTask(t)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedTask(t); } }}
              className={`glass-card glass-card-hover p-5 cursor-pointer transition-all ${t.overdue ? 'border-l-[3px] border-l-danger bg-danger-soft/20' : ''}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2.5 flex-wrap">
                    <StatusBadge variant={statusVariants[t.status]}>{statusLabels[t.status]}</StatusBadge>
                    {t.overdue && <StatusBadge variant="danger" pulse>Просрочено</StatusBadge>}
                  </div>
                  <h3 className="text-sm font-bold text-foreground leading-snug">{t.title}</h3>
                  {t.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{t.description}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-1 mt-3">
                    {t.responsible && (
                      <span className="meta-text flex items-center gap-1.5 text-xs">
                        <User className="w-3.5 h-3.5 text-primary/60" />{t.responsible}
                      </span>
                    )}
                    {t.department && (
                      <span className="meta-text flex items-center gap-1.5 text-xs">
                        <ClipboardCheck className="w-3.5 h-3.5 text-primary/60" />{t.department}
                      </span>
                    )}
                    {t.deadline && (
                      <span className={`flex items-center gap-1.5 text-xs ${t.overdue ? 'text-danger font-semibold' : 'meta-text'}`}>
                        <Calendar className={`w-3.5 h-3.5 ${t.overdue ? 'text-danger' : 'text-primary/60'}`} />
                        Срок: {t.deadline}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right flex-shrink-0 flex flex-col items-end gap-1.5">
                  {t.created_by_name && (
                    <span className="text-[11px] px-3 py-1.5 rounded-lg bg-surface-muted text-muted-foreground font-semibold">{t.created_by_name}</span>
                  )}
                  <span className="text-[10px] text-muted-foreground/60">{new Date(t.created_at).toLocaleDateString('ru-RU')}</span>
                  {t.assigned_to === user?.id && t.status !== 'completed' && t.status !== 'cancelled' && (
                    <div className="flex gap-1.5 mt-1" onClick={(e) => e.stopPropagation()}>
                      {t.status === 'new' && (
                        <button onClick={() => updateStatus(t.id, 'in_progress')}
                          className="text-[10px] font-semibold px-2.5 py-1 rounded-md bg-warning/10 text-warning hover:bg-warning/20 transition-colors">
                          В работу
                        </button>
                      )}
                      <button onClick={() => updateStatus(t.id, 'completed')}
                        className="text-[10px] font-semibold px-2.5 py-1 rounded-md bg-success/10 text-success hover:bg-success/20 transition-colors">
                        Выполнить
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="glass-card p-16 text-center">
              <ClipboardCheck className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">Поручений не найдено</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Попробуйте изменить фильтры</p>
            </div>
          )}
        </div>
      )}

      <CreateTaskDialog open={createOpen} onOpenChange={setCreateOpen} onCreated={loadData} />

      <PerformanceDialog open={perfOpen} onOpenChange={setPerfOpen} tasks={tasks} />

      <Dialog open={!!selectedTask} onOpenChange={(open) => !open && setSelectedTask(null)}>
        <DialogContent className="max-w-xl">
          {selectedTask && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <StatusBadge variant={statusVariants[selectedTask.status]}>{statusLabels[selectedTask.status]}</StatusBadge>
                  {selectedTask.overdue && <StatusBadge variant="danger" pulse>Просрочено</StatusBadge>}
                </div>
                <DialogTitle className="text-lg leading-snug">{selectedTask.title}</DialogTitle>
                {selectedTask.description && (
                  <DialogDescription className="text-sm text-foreground/80 whitespace-pre-line pt-2 leading-relaxed">
                    {selectedTask.description}
                  </DialogDescription>
                )}
              </DialogHeader>

              <div className="grid grid-cols-2 gap-3 mt-2 text-sm">
                {selectedTask.responsible && (
                  <div className="space-y-0.5">
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Ответственный</p>
                    <p className="font-medium text-foreground flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-primary/60" />{selectedTask.responsible}</p>
                  </div>
                )}
                {selectedTask.department && (
                  <div className="space-y-0.5">
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Отдел</p>
                    <p className="font-medium text-foreground">{selectedTask.department}</p>
                  </div>
                )}
                {selectedTask.deadline && (
                  <div className="space-y-0.5">
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Срок</p>
                    <p className={`font-medium flex items-center gap-1.5 ${selectedTask.overdue ? 'text-danger' : 'text-foreground'}`}>
                      <Calendar className="w-3.5 h-3.5" />{selectedTask.deadline}
                    </p>
                  </div>
                )}
                {selectedTask.created_by_name && (
                  <div className="space-y-0.5">
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Поставил</p>
                    <p className="font-medium text-foreground">{selectedTask.created_by_name}</p>
                  </div>
                )}
                <div className="space-y-0.5">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Создано</p>
                  <p className="font-medium text-foreground">{new Date(selectedTask.created_at).toLocaleString('ru-RU')}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Обновлено</p>
                  <p className="font-medium text-foreground">{new Date(selectedTask.updated_at).toLocaleString('ru-RU')}</p>
                </div>
              </div>

              {selectedTask.assigned_to === user?.id && selectedTask.status !== 'completed' && selectedTask.status !== 'cancelled' && (
                <div className="flex gap-2 pt-3 mt-2 border-t border-border">
                  {selectedTask.status === 'new' && (
                    <button onClick={() => { updateStatus(selectedTask.id, 'in_progress'); setSelectedTask(null); }}
                      className="text-xs font-semibold px-3 py-2 rounded-lg bg-warning/10 text-warning hover:bg-warning/20 transition-colors">
                      Взять в работу
                    </button>
                  )}
                  <button onClick={() => { updateStatus(selectedTask.id, 'completed'); setSelectedTask(null); }}
                    className="text-xs font-semibold px-3 py-2 rounded-lg bg-success/10 text-success hover:bg-success/20 transition-colors">
                    Отметить выполненным
                  </button>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
