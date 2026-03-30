import { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import PermissionGate from '@/components/PermissionGate';
import StatusBadge from '@/components/StatusBadge';
import { useToast } from '@/hooks/use-toast';

interface Escalation {
  id: string;
  type: string;
  severity: number;
  source_type: string;
  source_id: string | null;
  message: string;
  suggested_action: string | null;
  status: 'active' | 'acknowledged' | 'resolved';
  channels: any;
  acknowledged_by: string | null;
  acknowledged_at: string | null;
  created_at: string;
}

export default function EscalationPanel() {
  const [escalations, setEscalations] = useState<Escalation[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadEscalations();

    const channel = supabase
      .channel('escalations-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'escalations' }, () => {
        loadEscalations();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  async function loadEscalations() {
    const { data } = await supabase
      .from('escalations')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });
    setEscalations((data as any as Escalation[]) || []);
    setLoading(false);
  }

  async function handleAcknowledge(id: string) {
    const { error } = await supabase
      .from('escalations')
      .update({
        status: 'acknowledged' as any,
        acknowledged_by: user?.id,
        acknowledged_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Эскалация принята' });
      loadEscalations();
    }
  }

  async function handleResolve(id: string) {
    const { error } = await supabase
      .from('escalations')
      .update({ status: 'resolved' as any })
      .eq('id', id);

    if (error) {
      toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Эскалация закрыта' });
      loadEscalations();
    }
  }

  if (loading) return null;
  if (escalations.length === 0) return null;

  return (
    <div className="glass-card p-6 border-danger/20 bg-danger-soft/30">
      <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-danger/10 flex items-center justify-center">
          <AlertTriangle className="w-4 h-4 text-danger" />
        </div>
        Эскалации
        <span className="ml-auto px-2 py-0.5 rounded-lg text-[10px] font-bold bg-danger/10 text-danger">
          {escalations.length}
        </span>
      </h2>

      <div className="space-y-3">
        {escalations.map((esc) => (
          <div key={esc.id} className="flex items-start gap-4 p-4 rounded-xl bg-background/80 border border-danger/10">
            <div className="w-2 h-2 rounded-full bg-danger mt-1.5 animate-pulse flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">{esc.message}</p>
              {esc.suggested_action && (
                <p className="text-xs text-muted-foreground mt-1">💡 {esc.suggested_action}</p>
              )}
              <div className="flex items-center gap-2 mt-2">
                <StatusBadge variant="danger">Severity {esc.severity}</StatusBadge>
                <span className="text-[10px] text-muted-foreground">
                  {new Date(esc.created_at).toLocaleString('ru-RU')}
                </span>
              </div>
            </div>
            <PermissionGate roles={['mayor', 'deputy']}>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => handleAcknowledge(esc.id)}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-primary text-primary-foreground shadow-btn hover:bg-primary/90 transition-colors"
                >
                  <CheckCircle className="w-3 h-3" />
                  Принять
                </button>
                <button
                  onClick={() => handleResolve(esc.id)}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-muted text-muted-foreground shadow-btn hover:bg-muted-foreground hover:text-white transition-colors"
                >
                  <Clock className="w-3 h-3" />
                  Закрыть
                </button>
              </div>
            </PermissionGate>
          </div>
        ))}
      </div>
    </div>
  );
}
