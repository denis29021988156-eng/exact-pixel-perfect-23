import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import StatusBadge from '@/components/StatusBadge';
import CreateIncidentDialog from '@/components/forms/CreateIncidentDialog';
import { Search, Filter, MapPin, User, Clock, Plus, Shield, AlertTriangle, TrendingUp, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

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

function StatPill({ label, value, variant = 'default' }: { label: string; value: number; variant?: 'default' | 'danger' | 'warning' | 'success' }) {
  const colorMap = {
    default: 'bg-card text-foreground',
    danger: 'bg-danger-soft/50 text-danger border-danger/10',
    warning: 'bg-warning-muted/50 text-warning border-warning/10',
    success: 'bg-success-muted/50 text-success border-success/10',
  };
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${colorMap[variant]}`}>
      <span className="text-2xl font-bold">{value}</span>
      <span className="text-xs font-medium text-muted-foreground leading-tight">{label}</span>
    </div>
  );
}

export default function IncidentsPage() {
  const { userRole, userDepartment } = useAuth();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [incidents, setIncidents] = useState<Tables<'incidents'>[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);

  const loadData = useCallback(() => {
    let query = supabase.from('incidents').select('*').order('created_at', { ascending: false });
    if (userRole === 'deputy' && userDepartment) {
      query = query.eq('department', userDepartment);
    }
    query.then(({ data }) => {
      setIncidents(data || []);
      setLoading(false);
    });
  }, [userRole, userDepartment]);

  useEffect(() => { loadData(); }, [loadData]);

  const filtered = incidents.filter(i => {
    if (search && !i.title.toLowerCase().includes(search.toLowerCase()) && !(i.address || '').toLowerCase().includes(search.toLowerCase())) return false;
    if (typeFilter !== 'all' && i.type !== typeFilter) return false;
    if (statusFilter !== 'all' && i.status !== statusFilter) return false;
    return true;
  });

  const activeIncidents = incidents.filter(i => i.status !== 'closed');
  const criticalCount = activeIncidents.filter(i => i.severity === 'high').length;
  const overdueCount = activeIncidents.filter(i => i.sla_overdue).length;
  const resolvedCount = incidents.filter(i => i.status === 'resolved' || i.status === 'closed').length;

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-bold text-foreground tracking-tight">Инциденты</h1>
          <p className="meta-text mt-1">Городские происшествия и аварии ЖКХ</p>
        </div>
        <button onClick={() => setCreateOpen(true)} className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 transition-all shadow-sm">
          <Plus className="w-4 h-4" /> Новый инцидент
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatPill label="Активных инцидентов" value={activeIncidents.length} />
        <StatPill label="Критический уровень" value={criticalCount} variant="danger" />
        <StatPill label="Просрочено SLA" value={overdueCount} variant={overdueCount > 0 ? 'danger' : 'default'} />
        <StatPill label="Решено / Закрыто" value={resolvedCount} variant="success" />
      </div>

      {/* Filters */}
      <div className="glass-card p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по названию или адресу..."
            className="w-full pl-10 pr-4 py-2.5 bg-surface border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-shadow"
          />
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="bg-surface border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20">
          <option value="all">Все типы</option>
          {Object.entries(incidentTypeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="bg-surface border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20">
          <option value="all">Все статусы</option>
          {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <div className="meta-text flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surface-muted text-xs font-medium">
          <Filter className="w-3.5 h-3.5" />
          {filtered.length} из {incidents.length}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="glass-card p-16 text-center">
          <div className="inline-flex items-center gap-2 text-muted-foreground">
            <Clock className="w-4 h-4 animate-spin" />
            <p className="text-sm">Загрузка инцидентов...</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((inc) => (
            <div key={inc.id} className={`glass-card glass-card-hover p-5 cursor-pointer transition-all ${inc.sla_overdue ? 'border-l-[3px] border-l-danger bg-danger-soft/20' : ''}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2.5 flex-wrap">
                    <StatusBadge variant={severityVariants[inc.severity]}>{severityLabels[inc.severity]}</StatusBadge>
                    <StatusBadge variant={statusVariants[inc.status]}>{statusLabels[inc.status]}</StatusBadge>
                    {inc.sla_overdue && <StatusBadge variant="danger" pulse>SLA просрочен</StatusBadge>}
                    {inc.social_object && (
                      <StatusBadge variant="warning">
                        <ShieldAlert className="w-3 h-3 inline mr-0.5" />Соцобъект
                      </StatusBadge>
                    )}
                    {(inc as any).political_sensitivity === 'high' && (
                      <StatusBadge variant="danger"><Shield className="w-3 h-3 inline mr-0.5" />Полит. чувств.</StatusBadge>
                    )}
                    {(inc as any).political_sensitivity === 'medium' && (
                      <StatusBadge variant="warning"><Shield className="w-3 h-3 inline mr-0.5" />Внимание</StatusBadge>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-foreground leading-snug">{inc.title}</h3>
                  {inc.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{inc.description}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-1 mt-3">
                    {inc.address && <span className="meta-text flex items-center gap-1.5 text-xs"><MapPin className="w-3.5 h-3.5 text-primary/60" />{inc.address}</span>}
                    {inc.responsible && <span className="meta-text flex items-center gap-1.5 text-xs"><User className="w-3.5 h-3.5 text-primary/60" />{inc.responsible}</span>}
                    {inc.sla_deadline && (
                      <span className={`flex items-center gap-1.5 text-xs ${inc.sla_overdue ? 'text-danger font-semibold' : 'meta-text'}`}>
                        <Clock className={`w-3.5 h-3.5 ${inc.sla_overdue ? 'text-danger' : 'text-primary/60'}`} />
                        SLA: {new Date(inc.sla_deadline).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right flex-shrink-0 flex flex-col items-end gap-2">
                  <span className="text-[11px] px-3 py-1.5 rounded-lg bg-surface-muted text-muted-foreground font-semibold">{incidentTypeLabels[inc.type]}</span>
                  <span className="text-[10px] text-muted-foreground/60">{new Date(inc.created_at).toLocaleDateString('ru-RU')}</span>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="glass-card p-16 text-center">
              <AlertTriangle className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">Инцидентов не найдено</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Попробуйте изменить фильтры</p>
            </div>
          )}
        </div>
      )}

      <CreateIncidentDialog open={createOpen} onOpenChange={setCreateOpen} onCreated={loadData} />
    </div>
  );
}
