import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import ConfidenceBadge from '@/components/ConfidenceBadge';
import { useToast } from '@/hooks/use-toast';
import { Check, X, Edit3, Inbox, Filter } from 'lucide-react';

type TargetTable = 'incidents' | 'tasks' | 'public_complaints';

interface StagingRow {
  id: string;
  source_id: string | null;
  raw_payload: Record<string, unknown>;
  parsed_payload: Record<string, unknown> | null;
  status: string;
  confidence: number;
  target_table: string | null;
  target_id: string | null;
  created_at: string;
}

const TARGET_LABEL: Record<string, string> = {
  incidents: 'Инцидент',
  tasks: 'Поручение',
  public_complaints: 'Жалоба',
};

export default function ModerationPage() {
  const { toast } = useToast();
  const [items, setItems] = useState<StagingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [threshold, setThreshold] = useState(60);
  const [filterTarget, setFilterTarget] = useState<string>('all');
  const [editing, setEditing] = useState<StagingRow | null>(null);
  const [editForm, setEditForm] = useState<Record<string, string>>({});

  const load = async () => {
    setLoading(true);
    let q = supabase
      .from('staging_raw')
      .select('*')
      .lt('confidence', threshold)
      .neq('status', 'rejected')
      .order('created_at', { ascending: false })
      .limit(200);
    if (filterTarget !== 'all') q = q.eq('target_table', filterTarget);
    const { data, error } = await q;
    if (error) toast({ title: 'Ошибка загрузки', description: error.message, variant: 'destructive' });
    setItems((data as StagingRow[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threshold, filterTarget]);

  const approve = async (row: StagingRow) => {
    await supabase.from('staging_raw').update({ status: 'promoted' }).eq('id', row.id);
    if (row.target_id && row.target_table) {
      const tbl = row.target_table as TargetTable;
      const client = supabase as unknown as { from: (t: string) => { update: (p: Record<string, unknown>) => { eq: (c: string, v: string) => Promise<unknown> } } };
      await client.from(tbl).update({ confidence_score: Math.max(row.confidence, 75) }).eq('id', row.target_id);
    }
    toast({ title: 'Принято', description: 'Запись подтверждена и осталась в системе' });
    setItems((s) => s.filter((x) => x.id !== row.id));
  };

  const reject = async (row: StagingRow) => {
    await supabase.from('staging_raw').update({ status: 'rejected' }).eq('id', row.id);
    if (row.target_id && row.target_table === 'incidents') {
      await supabase.from('incidents').update({ status: 'closed' }).eq('id', row.target_id);
    } else if (row.target_id && row.target_table === 'tasks') {
      await supabase.from('tasks').update({ status: 'cancelled' }).eq('id', row.target_id);
    }
    toast({ title: 'Отклонено', description: 'Запись помечена как отклонённая' });
    setItems((s) => s.filter((x) => x.id !== row.id));
  };

  const openEdit = (row: StagingRow) => {
    setEditing(row);
    const p = (row.parsed_payload || {}) as Record<string, unknown>;
    setEditForm({
      title: String(p.title ?? ''),
      description: String(p.description ?? ''),
      address: String(p.address ?? ''),
      district: String(p.district ?? ''),
      topic: String(p.topic ?? ''),
    });
  };

  const saveEdit = async () => {
    if (!editing) return;
    const tbl = editing.target_table;
    const id = editing.target_id;
    if (!tbl || !id) {
      toast({ title: 'Нет целевой записи', variant: 'destructive' });
      return;
    }
    const patch: Record<string, unknown> = { confidence_score: 80 };
    if (tbl === 'incidents') {
      if (editForm.title) patch.title = editForm.title;
      if (editForm.description) patch.description = editForm.description;
      if (editForm.address) patch.address = editForm.address;
    } else if (tbl === 'tasks') {
      if (editForm.title) patch.title = editForm.title;
      if (editForm.description) patch.description = editForm.description;
    } else if (tbl === 'public_complaints') {
      if (editForm.topic) patch.topic = editForm.topic;
      if (editForm.description) patch.complaint_text = editForm.description;
      if (editForm.district) patch.district = editForm.district;
    }
    const client = supabase as unknown as { from: (t: string) => { update: (p: Record<string, unknown>) => { eq: (c: string, v: string) => Promise<{ error: { message: string } | null }> } } };
    const { error: e1 } = await client.from(tbl).update(patch).eq('id', id);
    if (e1) {
      toast({ title: 'Ошибка', description: e1.message, variant: 'destructive' });
      return;
    }
    await supabase
      .from('staging_raw')
      .update({
        status: 'promoted',
        confidence: 80,
        parsed_payload: { ...(editing.parsed_payload || {}), ...editForm } as never,
      })
      .eq('id', editing.id);
    toast({ title: 'Сохранено', description: 'Запись обновлена и подтверждена' });
    setItems((s) => s.filter((x) => x.id !== editing.id));
    setEditing(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Inbox className="w-8 h-8 text-primary" />
            Очередь модерации
          </h1>
          <p className="text-muted-foreground mt-1">
            Записи с низким confidence — требуют ручной проверки мэра / зама
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select value={filterTarget} onValueChange={setFilterTarget}>
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все типы</SelectItem>
                <SelectItem value="incidents">Инциденты</SelectItem>
                <SelectItem value="tasks">Поручения</SelectItem>
                <SelectItem value="public_complaints">Жалобы</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-sm whitespace-nowrap">Порог &lt;</Label>
            <Input
              type="number"
              min={0}
              max={100}
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value) || 0)}
              className="w-20"
            />
            <span className="text-sm text-muted-foreground">%</span>
          </div>
        </div>
      </div>

      {loading && <p className="text-muted-foreground">Загрузка…</p>}
      {!loading && items.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Check className="w-12 h-12 mx-auto text-success mb-3" />
            <p className="text-lg font-medium">Очередь пуста</p>
            <p className="text-sm text-muted-foreground mt-1">
              Все записи с confidence ≥ {threshold}% — данные качественные
            </p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {items.map((row) => {
          const p = (row.parsed_payload || {}) as Record<string, unknown>;
          const r = (row.raw_payload || {}) as Record<string, unknown>;
          const title =
            (p.title as string) || (p.topic as string) || (r.title as string) || 'Без названия';
          const desc = (p.description as string) || (r.description as string) || '';
          const addr = (p.address as string) || '';
          return (
            <Card key={row.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {TARGET_LABEL[row.target_table || ''] || row.target_table || '—'}
                      </span>
                      <ConfidenceBadge score={Math.round(row.confidence)} />
                      <span className="text-xs text-muted-foreground">
                        {new Date(row.created_at).toLocaleString('ru-RU')}
                      </span>
                    </div>
                    <h3 className="font-semibold text-base truncate">{title}</h3>
                    {desc && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{desc}</p>
                    )}
                    {addr && (
                      <p className="text-xs text-muted-foreground mt-1">📍 {addr}</p>
                    )}
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button size="sm" variant="outline" onClick={() => openEdit(row)}>
                      <Edit3 className="w-4 h-4 mr-1" /> Изменить
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-danger border-danger/40 hover:bg-danger/10"
                      onClick={() => reject(row)}
                    >
                      <X className="w-4 h-4 mr-1" /> Отклонить
                    </Button>
                    <Button
                      size="sm"
                      className="bg-success text-white hover:bg-success/90"
                      onClick={() => approve(row)}
                    >
                      <Check className="w-4 h-4 mr-1" /> Принять
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Редактирование записи</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {editing?.target_table === 'public_complaints' ? (
              <>
                <div className="space-y-1">
                  <Label>Тема</Label>
                  <Input
                    value={editForm.topic || ''}
                    onChange={(e) => setEditForm((s) => ({ ...s, topic: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Район</Label>
                  <Input
                    value={editForm.district || ''}
                    onChange={(e) => setEditForm((s) => ({ ...s, district: e.target.value }))}
                  />
                </div>
              </>
            ) : (
              <div className="space-y-1">
                <Label>Заголовок</Label>
                <Input
                  value={editForm.title || ''}
                  onChange={(e) => setEditForm((s) => ({ ...s, title: e.target.value }))}
                />
              </div>
            )}
            <div className="space-y-1">
              <Label>Описание</Label>
              <Textarea
                rows={4}
                value={editForm.description || ''}
                onChange={(e) => setEditForm((s) => ({ ...s, description: e.target.value }))}
              />
            </div>
            {editing?.target_table === 'incidents' && (
              <div className="space-y-1">
                <Label>Адрес</Label>
                <Input
                  value={editForm.address || ''}
                  onChange={(e) => setEditForm((s) => ({ ...s, address: e.target.value }))}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Отмена
            </Button>
            <Button onClick={saveEdit}>Сохранить и принять</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
