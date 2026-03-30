import { useState, useEffect } from 'react';
import { MessageSquare, AlertCircle, RefreshCw, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import PermissionGate from '@/components/PermissionGate';
import StatusBadge from '@/components/StatusBadge';

interface TopicStat {
  topic: string;
  count: number;
  negative: number;
  negativePct: number;
}

interface PulseData {
  totalComplaints: number;
  topTopics: TopicStat[];
  divergenceScore: number;
}

export default function CityPulseBlock() {
  const [data, setData] = useState<PulseData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPulse();
  }, []);

  async function loadPulse() {
    setLoading(true);
    try {
      const { data: result } = await supabase.functions.invoke('fetch-complaints', {
        method: 'GET',
      });
      if (result) setData(result);
    } catch {}
    setLoading(false);
  }

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-accent/50 flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-primary" />
          </div>
          Пульс города
          {data && (
            <span className="ml-2 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-muted text-muted-foreground">
              {data.totalComplaints} обращений
            </span>
          )}
        </h2>
        <button
          onClick={loadPulse}
          disabled={loading}
          className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-medium rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          Обновить
        </button>
      </div>

      {data && data.divergenceScore > 50 && (
        <div className="mb-4 p-3 rounded-xl bg-danger-soft/50 border border-danger/10 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-danger flex-shrink-0" />
          <p className="text-xs text-danger font-medium">
            Расхождение с инцидентами: {data.divergenceScore}% — граждане жалуются на проблемы, не отражённые в системе
          </p>
        </div>
      )}

      {data && data.topTopics.length > 0 ? (
        <div className="space-y-2">
          {data.topTopics.map((t, i) => (
            <div key={t.topic} className="flex items-center gap-3 p-3 rounded-xl bg-surface-muted/50">
              <span className="text-xs font-bold text-muted-foreground w-5">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{t.topic}</p>
                <p className="text-[11px] text-muted-foreground">{t.count} обращений · {t.negativePct}% негатив</p>
              </div>
              {t.negativePct > 60 && <StatusBadge variant="danger">Негатив</StatusBadge>}
              {t.negativePct > 30 && t.negativePct <= 60 && <StatusBadge variant="warning">Внимание</StatusBadge>}
            </div>
          ))}

          <PermissionGate roles={['mayor', 'deputy']}>
            <button className="mt-2 flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
              <Plus className="w-3.5 h-3.5" />
              Создать поручение по топ-теме
            </button>
          </PermissionGate>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground/60">
          {loading ? 'Загрузка данных...' : 'Нет данных об обращениях. Добавьте через форму или API.'}
        </p>
      )}
    </div>
  );
}
