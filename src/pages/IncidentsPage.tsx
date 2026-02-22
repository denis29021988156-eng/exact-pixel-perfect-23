import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import StatusBadge from '@/components/StatusBadge';
import { Search, Filter, MapPin, User, Clock } from 'lucide-react';

const incidentTypeLabels: Record<string, string> = {
  housing: 'ЖКХ', road: 'Дороги', social: 'Соцсфера', ecology: 'Экология', transport: 'Транспорт', other: 'Другое',
};
const statusLabels: Record<string, string> = {
  new: 'Новый', in_progress: 'В работе', resolved: 'Решён', closed: 'Закрыт',
};
const statusVariants: Record<string, 'danger' | 'warning' | 'success' | 'info' | 'muted'> = {
  new: 'info', in_progress: 'warning', resolved: 'success', closed: 'muted',
};
const severityLabels: Record<string, string> = { low: 'Низкая', medium: 'Средняя', high: 'Высокая' };
const severityVariants: Record<string, 'danger' | 'warning' | 'muted'> = { low: 'muted', medium: 'warning', high: 'danger' };

export default function IncidentsPage() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [incidents, setIncidents] = useState<Tables<'incidents'>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('incidents').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      setIncidents(data || []);
      setLoading(false);
    });
  }, []);

  const filtered = incidents.filter(i => {
    if (search && !i.title.toLowerCase().includes(search.toLowerCase()) && !(i.address || '').toLowerCase().includes(search.toLowerCase())) return false;
    if (typeFilter !== 'all' && i.type !== typeFilter) return false;
    if (statusFilter !== 'all' && i.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-slide-in">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground">Инциденты</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Городские происшествия и аварии ЖКХ</p>
      </div>

      <div className="glass-card p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по названию или адресу..."
            className="w-full pl-10 pr-4 py-2.5 bg-surface border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="bg-surface border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50">
          <option value="all">Все типы</option>
          {Object.entries(incidentTypeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="bg-surface border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50">
          <option value="all">Все статусы</option>
          {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <div className="text-xs text-muted-foreground flex items-center gap-1">
          <Filter className="w-3.5 h-3.5" />
          {filtered.length} из {incidents.length}
        </div>
      </div>

      {loading ? (
        <div className="glass-card p-12 text-center">
          <p className="text-muted-foreground">Загрузка...</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((inc) => (
            <div key={inc.id} className={`glass-card p-5 hover:border-primary/30 transition-all cursor-pointer ${inc.sla_overdue ? 'border-l-2 border-l-danger' : ''}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <StatusBadge variant={severityVariants[inc.severity]}>{severityLabels[inc.severity]}</StatusBadge>
                    <StatusBadge variant={statusVariants[inc.status]}>{statusLabels[inc.status]}</StatusBadge>
                    {inc.sla_overdue && <StatusBadge variant="danger" pulse>SLA просрочен</StatusBadge>}
                    {inc.social_object && <StatusBadge variant="warning">Соцобъект</StatusBadge>}
                  </div>
                  <h3 className="text-sm font-bold text-foreground">{inc.title}</h3>
                  <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-muted-foreground">
                    {inc.address && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{inc.address}</span>}
                    {inc.responsible && <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" />{inc.responsible}</span>}
                    {inc.sla_deadline && <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />SLA: {new Date(inc.sla_deadline).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="text-xs px-2 py-1 rounded bg-surface text-muted-foreground">{incidentTypeLabels[inc.type]}</span>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="glass-card p-12 text-center">
              <p className="text-muted-foreground">Инцидентов не найдено</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
