import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { History } from 'lucide-react';

type LogRow = {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  diff: any;
  created_at: string;
};

const ACTION_COLOR: Record<string, string> = {
  INSERT: 'bg-success/10 text-success border-success/20',
  UPDATE: 'bg-warning/10 text-warning border-warning/20',
  DELETE: 'bg-danger/10 text-danger border-danger/20',
};

export default function AuditLogPage() {
  const { userRole } = useAuth();
  const [rows, setRows] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    if (userRole !== 'admin') return;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);
      setRows((data as any) || []);
      setLoading(false);
    })();
  }, [userRole]);

  if (userRole !== 'admin') {
    return (
      <div className="glass-card p-8 text-center text-muted-foreground">
        Доступно только Администратору системы.
      </div>
    );
  }

  const entities = Array.from(new Set(rows.map((r) => r.entity_type))).sort();
  const filtered = filter === 'all' ? rows : rows.filter((r) => r.entity_type === filter);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <History className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Аудит-лог</h1>
          <p className="text-sm text-muted-foreground">Последние 500 системных операций</p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition ${
            filter === 'all' ? 'bg-primary text-primary-foreground border-primary' : 'bg-surface border-border text-muted-foreground hover:text-foreground'
          }`}
        >
          Все ({rows.length})
        </button>
        {entities.map((e) => (
          <button
            key={e}
            onClick={() => setFilter(e)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition ${
              filter === e ? 'bg-primary text-primary-foreground border-primary' : 'bg-surface border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            {e}
          </button>
        ))}
      </div>

      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Загрузка…</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">Записей не найдено</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-surface-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">Время</th>
                <th className="text-left px-4 py-3 font-semibold">Действие</th>
                <th className="text-left px-4 py-3 font-semibold">Сущность</th>
                <th className="text-left px-4 py-3 font-semibold">ID записи</th>
                <th className="text-left px-4 py-3 font-semibold">Пользователь</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-t border-border/50 hover:bg-surface-muted/30">
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(r.created_at).toLocaleString('ru-RU')}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md border ${ACTION_COLOR[r.action] || 'bg-muted text-muted-foreground border-border'}`}>
                      {r.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium">{r.entity_type}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground font-mono">{r.entity_id?.slice(0, 8) ?? '—'}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground font-mono">{r.user_id?.slice(0, 8) ?? 'system'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}