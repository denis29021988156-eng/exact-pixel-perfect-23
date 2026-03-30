import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

export default function CreateProjectDialog({ open, onOpenChange, onCreated }: Props) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '', description: '', department: '', responsible: '', status: 'on_track' as string,
    planned_start: '', planned_end: '', budget_total: '', political_sensitivity: 'low' as string,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setLoading(true);
    const { error } = await supabase.from('projects').insert({
      name: form.name.trim(),
      description: form.description.trim() || null,
      department: form.department.trim() || null,
      responsible: form.responsible.trim() || null,
      status: form.status as any,
      planned_start: form.planned_start || null,
      planned_end: form.planned_end || null,
      budget_total: form.budget_total ? Number(form.budget_total) : null,
    });
    setLoading(false);
    if (error) {
      toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Проект создан' });
      setForm({ name: '', description: '', department: '', responsible: '', status: 'on_track', planned_start: '', planned_end: '', budget_total: '' });
      onOpenChange(false);
      onCreated();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Новый проект</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Название *</Label>
            <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} maxLength={200} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Департамент</Label>
              <Input value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value }))} maxLength={100} />
            </div>
            <div>
              <Label>Ответственный</Label>
              <Input value={form.responsible} onChange={e => setForm(p => ({ ...p, responsible: e.target.value }))} maxLength={100} />
            </div>
          </div>
          <div>
            <Label>Статус</Label>
            <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="on_track">В срок</SelectItem>
                <SelectItem value="risk">Риск</SelectItem>
                <SelectItem value="overdue">Просрочено</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Начало</Label>
              <Input type="date" value={form.planned_start} onChange={e => setForm(p => ({ ...p, planned_start: e.target.value }))} />
            </div>
            <div>
              <Label>Окончание</Label>
              <Input type="date" value={form.planned_end} onChange={e => setForm(p => ({ ...p, planned_end: e.target.value }))} />
            </div>
          </div>
          <div>
            <Label>Бюджет (₽)</Label>
            <Input type="number" value={form.budget_total} onChange={e => setForm(p => ({ ...p, budget_total: e.target.value }))} min={0} />
          </div>
          <div>
            <Label>Описание</Label>
            <Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} maxLength={2000} rows={3} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Отмена</Button>
            <Button type="submit" disabled={loading || !form.name.trim()}>{loading ? 'Создание...' : 'Создать'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
