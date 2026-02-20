import { useState } from 'react';
import { tasks, departments } from '@/data/mock';
import StatusBadge from '@/components/StatusBadge';
import { ClipboardCheck, Search, Filter, User, Calendar } from 'lucide-react';

const statusLabels: Record<string, string> = { new: 'Новое', in_progress: 'В работе', on_control: 'На контроле', completed: 'Выполнено' };
const statusVariants: Record<string, 'danger' | 'warning' | 'success' | 'info' | 'muted'> = {
  new: 'info', in_progress: 'warning', on_control: 'muted', completed: 'success',
};

export default function TasksPage() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  const filtered = tasks.filter(t => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-slide-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">Личные поручения</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Поручения мэра и эскалации</p>
        </div>
        <button className="px-4 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors">
          + Новое поручение
        </button>
      </div>

      <div className="glass-card p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск поручений..." className="w-full pl-10 pr-4 py-2.5 bg-surface border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="bg-surface border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50">
          <option value="all">Все статусы</option>
          {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <div className="text-xs text-muted-foreground flex items-center gap-1">
          <Filter className="w-3.5 h-3.5" />
          {filtered.length} из {tasks.length}
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map(t => (
          <div key={t.id} className={`glass-card p-5 ${t.overdue ? 'border-l-2 border-l-danger' : ''}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xs font-mono text-muted-foreground">{t.id}</span>
                  <StatusBadge variant={statusVariants[t.status]}>{statusLabels[t.status]}</StatusBadge>
                  {t.overdue && <StatusBadge variant="danger" pulse>Просрочено</StatusBadge>}
                </div>
                <h3 className="text-sm font-bold text-foreground">{t.title}</h3>
                <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" />{t.responsible}</span>
                  <span className="flex items-center gap-1"><ClipboardCheck className="w-3.5 h-3.5" />{t.department.split(' ').slice(1, 3).join(' ')}</span>
                  <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />Срок: {t.deadline}</span>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-[10px] text-muted-foreground">Автор: {t.createdBy}</p>
                <p className="text-[10px] text-muted-foreground">{t.createdAt}</p>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="glass-card p-12 text-center">
            <p className="text-muted-foreground">Поручений не найдено</p>
          </div>
        )}
      </div>
    </div>
  );
}
