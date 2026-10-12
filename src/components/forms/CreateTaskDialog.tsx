import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

export default function CreateTaskDialog({ open, onOpenChange, onCreated }: Props) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<{ user_id: string; full_name: string; department: string | null }[]>([]);
  const [form, setForm] = useState({
    title: '', description: '', responsible: '', department: '', deadline: '', created_by_name: '', assigned_to: '',
  });

  useEffect(() => {
    if (!open) return;
    supabase.from('profiles').select('user_id, full_name, department').then(({ data }) => {
      setEmployees(data || []);
    });
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setLoading(true);
    const { error } = await supabase.from('tasks').insert({
      title: form.title.trim(),
      description: form.description.trim() || null,
      responsible: form.responsible.trim() || null,
      department: form.department.trim() || null,
      deadline: form.deadline || null,
      created_by_name: form.created_by_name.trim() || null,
      assigned_to: form.assigned_to || null,
    });
    setLoading(false);
    if (error) {
      toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Поручение создано' });
      setForm({ title: '', description: '', responsible: '', department: '', deadline: '', created_by_name: '', assigned_to: '' });
      onOpenChange(false);
      onCreated();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Новое поручение</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Название *</Label>
            <Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} maxLength={200} required />
          </div>
          <div>
            <Label>Исполнитель (получит доступ менять статус)</Label>
            <select
              value={form.assigned_to}
              onChange={e => {
                const emp = employees.find(x => x.user_id === e.target.value);
                setForm(p => ({
                  ...p,
                  assigned_to: e.target.value,
                  responsible: emp?.full_name || p.responsible,
                  department: emp?.department || p.department,
                }));
              }}
              className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm"
            >
              <option value="">— не назначен —</option>
              {employees.map(e => (
                <option key={e.user_id} value={e.user_id}>
                  {e.full_name}{e.department ? ` · ${e.department}` : ''}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Ответственный</Label>
              <Input value={form.responsible} onChange={e => setForm(p => ({ ...p, responsible: e.target.value }))} maxLength={100} />
            </div>
            <div>
              <Label>Департамент</Label>
              <Input value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value }))} maxLength={100} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Срок</Label>
              <Input type="date" value={form.deadline} onChange={e => setForm(p => ({ ...p, deadline: e.target.value }))} />
            </div>
            <div>
              <Label>Автор</Label>
              <Input value={form.created_by_name} onChange={e => setForm(p => ({ ...p, created_by_name: e.target.value }))} maxLength={100} />
            </div>
          </div>
          <div>
            <Label>Описание</Label>
            <Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} maxLength={2000} rows={3} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Отмена</Button>
            <Button type="submit" disabled={loading || !form.title.trim()}>{loading ? 'Создание...' : 'Создать'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
