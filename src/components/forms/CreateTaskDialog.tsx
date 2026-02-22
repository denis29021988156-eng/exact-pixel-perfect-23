import { useState } from 'react';
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
  const [form, setForm] = useState({
    title: '', description: '', responsible: '', department: '', deadline: '', created_by_name: '',
  });

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
    });
    setLoading(false);
    if (error) {
      toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Поручение создано' });
      setForm({ title: '', description: '', responsible: '', department: '', deadline: '', created_by_name: '' });
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
