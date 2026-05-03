import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Check, Clock, ShieldAlert, Save } from 'lucide-react';

const TYPES = ['housing', 'road', 'social', 'ecology', 'transport', 'other'] as const;
const TYPE_LABEL: Record<string, string> = {
  housing: 'ЖКХ', road: 'Дороги', social: 'Социальное',
  ecology: 'Экология', transport: 'Транспорт', other: 'Прочее',
};
const SEVERITIES = ['high', 'medium', 'low'] as const;
const SEV_LABEL: Record<string, string> = { high: 'Критический', medium: 'Средний', low: 'Низкий' };
const SEV_COLOR: Record<string, string> = {
  high: 'text-danger border-danger/30 bg-danger/5',
  medium: 'text-warning border-warning/30 bg-warning/5',
  low: 'text-success border-success/30 bg-success/5',
};

type Row = {
  id: string;
  incident_type: string;
  severity: string;
  reaction_hours: number;
  resolution_hours: number;
  approved: boolean;
  note: string | null;
  updated_at: string;
};

export default function SlaMatrixPage() {
  const { userRole, user } = useAuth();
  const { toast } = useToast();
  const canManage = userRole === 'mayor' || userRole === 'deputy';
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from('sla_matrix_draft')
      .select('*')
      .order('incident_type')
      .order('severity');
    if (error) {
      toast({ title: 'Ошибка загрузки', description: error.message, variant: 'destructive' });
    } else {
      setRows((data || []) as Row[]);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function update(id: string, patch: Partial<Row>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  async function save(row: Row) {
    setSavingId(row.id);
    const { error } = await supabase
      .from('sla_matrix_draft')
      .update({
        reaction_hours: row.reaction_hours,
        resolution_hours: row.resolution_hours,
        approved: row.approved,
        note: row.note,
        updated_by: user?.id ?? null,
      })
      .eq('id', row.id);
    setSavingId(null);
    if (error) {
      toast({ title: 'Не сохранено', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Сохранено', description: `${TYPE_LABEL[row.incident_type]} · ${SEV_LABEL[row.severity]}` });
    }
  }

  async function approveAll() {
    if (!confirm('Согласовать все строки матрицы как утверждённые?')) return;
    const { error } = await supabase
      .from('sla_matrix_draft')
      .update({ approved: true, updated_by: user?.id ?? null })
      .neq('id', '00000000-0000-0000-0000-000000000000');
    if (error) {
      toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Все строки согласованы' });
      load();
    }
  }

  const approvedCount = rows.filter((r) => r.approved).length;
  const totalCount = rows.length;

  if (!canManage) {
    return (
      <div className="p-8">
        <div className="rounded-xl border border-border p-6 bg-surface-muted">
          <p className="text-sm text-muted-foreground">Доступ к матрице SLA только для мэра и заместителей.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl">
      <header className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <ShieldAlert className="w-6 h-6 text-primary" />
            Матрица SLA — черновик
          </h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
            Согласуйте сроки реакции и решения по каждому типу инцидента и уровню важности.
            Матрица будет применена только после включения соответствующего feature flag (Этап 1).
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-lg bg-surface-muted border border-border">
            <p className="text-xs text-muted-foreground">Согласовано</p>
            <p className="text-lg font-bold text-foreground">{approvedCount} / {totalCount}</p>
          </div>
          <Button onClick={approveAll} variant="default">
            <Check className="w-4 h-4 mr-2" /> Согласовать всё
          </Button>
        </div>
      </header>

      {loading ? (
        <div className="text-sm text-muted-foreground">Загрузка…</div>
      ) : (
        <div className="space-y-8">
          {TYPES.map((type) => {
            const group = rows.filter((r) => r.incident_type === type);
            return (
              <section key={type} className="rounded-2xl border border-border bg-card p-5">
                <h2 className="text-base font-semibold text-foreground mb-4">{TYPE_LABEL[type]}</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {SEVERITIES.map((sev) => {
                    const row = group.find((r) => r.severity === sev);
                    if (!row) return null;
                    return (
                      <div
                        key={sev}
                        className={`rounded-xl border p-4 space-y-3 ${SEV_COLOR[sev]} ${row.approved ? 'ring-2 ring-success/40' : ''}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold uppercase tracking-wider">{SEV_LABEL[sev]}</span>
                          {row.approved && <Check className="w-4 h-4 text-success" />}
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <label className="block">
                            <span className="text-[11px] text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3"/>Реакция, ч</span>
                            <Input
                              type="number"
                              min={0}
                              value={row.reaction_hours}
                              onChange={(e) => update(row.id, { reaction_hours: Number(e.target.value) })}
                              className="mt-1 h-9"
                            />
                          </label>
                          <label className="block">
                            <span className="text-[11px] text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3"/>Решение, ч</span>
                            <Input
                              type="number"
                              min={0}
                              value={row.resolution_hours}
                              onChange={(e) => update(row.id, { resolution_hours: Number(e.target.value) })}
                              className="mt-1 h-9"
                            />
                          </label>
                        </div>
                        <Textarea
                          placeholder="Комментарий / обоснование"
                          value={row.note ?? ''}
                          onChange={(e) => update(row.id, { note: e.target.value })}
                          className="text-xs min-h-[60px]"
                        />
                        <div className="flex items-center justify-between gap-2">
                          <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer">
                            <input
                              type="checkbox"
                              checked={row.approved}
                              onChange={(e) => update(row.id, { approved: e.target.checked })}
                              className="h-4 w-4"
                            />
                            Согласовано
                          </label>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => save(row)}
                            disabled={savingId === row.id}
                          >
                            <Save className="w-3.5 h-3.5 mr-1.5" />
                            {savingId === row.id ? '…' : 'Сохранить'}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}