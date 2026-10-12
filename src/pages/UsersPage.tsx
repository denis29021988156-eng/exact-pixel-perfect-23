import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Users as UsersIcon } from 'lucide-react';

type Row = {
  user_id: string;
  full_name: string;
  department: string | null;
  role: 'mayor' | 'deputy' | 'employee' | 'admin';
};

const DEPARTMENTS = [
  { value: '', label: '— не задан —' },
  { value: 'utilities', label: 'ЖКХ / Энергетика' },
  { value: 'transport', label: 'Транспорт / Дороги' },
  { value: 'improvement', label: 'Благоустройство / Экология' },
  { value: 'social', label: 'Социальная сфера' },
  { value: 'construction', label: 'Строительство / Капремонт' },
];

const ROLES = [
  { value: 'admin', label: 'Администратор системы' },
  { value: 'mayor', label: 'Мэр' },
  { value: 'deputy', label: 'Заместитель' },
  { value: 'employee', label: 'Сотрудник' },
];

export default function UsersPage() {
  const { userRole } = useAuth();
  const { toast } = useToast();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [{ data: profiles }, { data: roles }] = await Promise.all([
      supabase.from('profiles').select('user_id, full_name, department'),
      supabase.from('user_roles').select('user_id, role'),
    ]);
    const roleMap = new Map((roles ?? []).map((r: any) => [r.user_id, r.role]));
    const merged: Row[] = (profiles ?? []).map((p: any) => ({
      user_id: p.user_id,
      full_name: p.full_name || '—',
      department: p.department,
      role: (roleMap.get(p.user_id) as Row['role']) ?? 'employee',
    }));
    merged.sort((a, b) => a.full_name.localeCompare(b.full_name, 'ru'));
    setRows(merged);
    setLoading(false);
  };

  useEffect(() => {
    if (userRole === 'admin') load();
  }, [userRole]);

  const updateRole = async (userId: string, role: Row['role']) => {
    const { error } = await supabase
      .from('user_roles')
      .upsert({ user_id: userId, role }, { onConflict: 'user_id' });
    if (error) {
      toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Роль обновлена' });
    setRows((rs) => rs.map((r) => (r.user_id === userId ? { ...r, role } : r)));
  };

  const updateDepartment = async (userId: string, department: string) => {
    const value = department || null;
    const { error } = await supabase
      .from('profiles')
      .update({ department: value })
      .eq('user_id', userId);
    if (error) {
      toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Департамент обновлён' });
    setRows((rs) => rs.map((r) => (r.user_id === userId ? { ...r, department: value } : r)));
  };

  if (userRole !== 'admin') {
    return (
      <div className="glass-card p-8 text-center text-muted-foreground">
        Доступно только Администратору системы.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <UsersIcon className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Пользователи и роли</h1>
          <p className="text-sm text-muted-foreground">
            Назначение ролей и зон ответственности сотрудникам
          </p>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Загрузка…</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-surface-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">ФИО</th>
                <th className="text-left px-4 py-3 font-semibold">Роль</th>
                <th className="text-left px-4 py-3 font-semibold">Департамент</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.user_id} className="border-t border-border/50 hover:bg-surface-muted/30">
                  <td className="px-4 py-3 font-medium">{r.full_name}</td>
                  <td className="px-4 py-3">
                    <select
                      value={r.role}
                      onChange={(e) => updateRole(r.user_id, e.target.value as Row['role'])}
                      className="px-2 py-1.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      {ROLES.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={r.department ?? ''}
                      onChange={(e) => updateDepartment(r.user_id, e.target.value)}
                      disabled={r.role !== 'deputy'}
                      className="px-2 py-1.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
                    >
                      {DEPARTMENTS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">
                    Пользователей пока нет.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <div className="text-xs text-muted-foreground">
        Департамент имеет смысл только для роли «Заместитель» — он определяет зону данных,
        к которым у него есть доступ.
      </div>
    </div>
  );
}