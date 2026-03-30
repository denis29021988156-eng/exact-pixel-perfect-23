import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
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

export default function CreateIncidentDialog({ open, onOpenChange, onCreated }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', type: 'other' as string, severity: 'medium' as string,
    address: '', department: '', responsible: '', political_sensitivity: 'low' as string,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setLoading(true);
    const { error } = await supabase.from('incidents').insert({
      title: form.title.trim(),
      description: form.description.trim() || null,
      type: form.type as any,
      severity: form.severity as any,
      address: form.address.trim() || null,
      department: form.department.trim() || null,
      responsible: form.responsible.trim() || null,
      created_by: user?.id,
    });
    setLoading(false);
    if (error) {
      toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Инцидент создан' });
      setForm({ title: '', description: '', type: 'other', severity: 'medium', address: '', department: '', responsible: '' });
      onOpenChange(false);
      onCreated();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Новый инцидент</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Название *</Label>
            <Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} maxLength={200} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Тип</Label>
              <Select value={form.type} onValueChange={v => setForm(p => ({ ...p, type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="housing">ЖКХ</SelectItem>
                  <SelectItem value="road">Дороги</SelectItem>
                  <SelectItem value="social">Соцсфера</SelectItem>
                  <SelectItem value="ecology">Экология</SelectItem>
                  <SelectItem value="transport">Транспорт</SelectItem>
                  <SelectItem value="other">Другое</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Критичность</Label>
              <Select value={form.severity} onValueChange={v => setForm(p => ({ ...p, severity: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Низкая</SelectItem>
                  <SelectItem value="medium">Средняя</SelectItem>
                  <SelectItem value="high">Высокая</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Адрес</Label>
            <Input value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} maxLength={300} />
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
