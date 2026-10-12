import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { ToggleLeft } from 'lucide-react';

type Flag = {
  key: string;
  description: string | null;
  enabled: boolean;
  enabled_at: string | null;
  enabled_for_roles: string[];
  updated_at: string;
};

export default function FeatureFlagsPage() {
  const { userRole } = useAuth();
  const { toast } = useToast();
  const [flags, setFlags] = useState<Flag[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('feature_flags').select('*').order('key');
    setFlags((data as any) || []);
    setLoading(false);
  };

  useEffect(() => {
    if (userRole === 'admin') load();
  }, [userRole]);

  const toggle = async (key: string, enabled: boolean) => {
    const { error } = await supabase
      .from('feature_flags')
      .update({ enabled, enabled_at: enabled ? new Date().toISOString() : null })
      .eq('key', key);
    if (error) {
      toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: enabled ? 'Модуль включён' : 'Модуль выключен', description: key });
      load();
    }
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
          <ToggleLeft className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Feature Flags</h1>
          <p className="text-sm text-muted-foreground">Включение и отключение модулей системы</p>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Загрузка…</div>
        ) : flags.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">Флагов пока нет</div>
        ) : (
          <div className="divide-y divide-border/50">
            {flags.map((f) => (
              <div key={f.key} className="px-5 py-4 flex items-center justify-between gap-4 hover:bg-surface-muted/30">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground font-mono">{f.key}</p>
                  {f.description && <p className="text-xs text-muted-foreground mt-0.5">{f.description}</p>}
                  {f.enabled_at && (
                    <p className="text-[10px] text-muted-foreground/70 mt-1">
                      Активен с {new Date(f.enabled_at).toLocaleString('ru-RU')}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => toggle(f.key, !f.enabled)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${f.enabled ? 'bg-success' : 'bg-muted'}`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                      f.enabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}