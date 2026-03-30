import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

export default function CreateContractDialog({ open, onOpenChange, onCreated }: Props) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '', contractor: '', department: '', amount: '', deadline: '', risk_level: 'low' as string, political_sensitivity: 'low' as string,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setLoading(true);
    const { error } = await supabase.from('contracts').insert({
      name: form.name.trim(),
      contractor: form.contractor.trim() || null,
      department: form.department.trim() || null,
      amount: form.amount ? Number(form.amount) : null,
      deadline: form.deadline || null,
      risk_level: form.risk_level,
      political_sensitivity: form.political_sensitivity,
    });
    setLoading(false);
    if (error) {
      toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Контракт создан' });
      setForm({ name: '', contractor: '', department: '', amount: '', deadline: '', risk_level: 'low' });
      onOpenChange(false);
      onCreated();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Новый контракт</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Название *</Label>
            <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} maxLength={200} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Подрядчик</Label>
              <Input value={form.contractor} onChange={e => setForm(p => ({ ...p, contractor: e.target.value }))} maxLength={150} />
            </div>
            <div>
              <Label>Департамент</Label>
              <Input value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value }))} maxLength={100} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Сумма (₽)</Label>
              <Input type="number" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} min={0} />
            </div>
            <div>
              <Label>Срок</Label>
              <Input type="date" value={form.deadline} onChange={e => setForm(p => ({ ...p, deadline: e.target.value }))} />
            </div>
          </div>
          <div>
            <Label>Уровень риска</Label>
            <Select value={form.risk_level} onValueChange={v => setForm(p => ({ ...p, risk_level: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Низкий</SelectItem>
                <SelectItem value="medium">Средний</SelectItem>
                <SelectItem value="high">Высокий</SelectItem>
              </SelectContent>
            </Select>
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
