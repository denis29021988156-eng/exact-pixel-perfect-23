import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { setCachedBriefing, getCachedBriefing } from '@/lib/ai/conversationState';

interface BriefingStructured {
  summary: string;
  riskLevelInterpretation: string;
  keyRisks: string[];
  recommendedActions: string[];
}

interface BriefingData {
  briefing: string;
  structured?: BriefingStructured;
  riskIndex?: number;
  mode?: 'ai' | 'fallback';
  fallbackReason?: string;
  stats: {
    activeIncidents: number;
    criticalIncidents: number;
    overdueIncidents: number;
    overdueTasks: number;
    riskyProjects: number;
  };
  generatedAt: string;
}

export function useBriefing() {
  const cached = getCachedBriefing();
  const [data, setData] = useState<BriefingData | null>(
    cached ? { briefing: cached.text, stats: { activeIncidents: 0, criticalIncidents: 0, overdueIncidents: 0, overdueTasks: 0, riskyProjects: 0 }, generatedAt: cached.generatedAt } : null
  );
  const [loading, setLoading] = useState(false);
  const [aiStatus, setAiStatus] = useState<'active' | 'error'>('active');
  const { toast } = useToast();

  const generate = async () => {
    setLoading(true);
    try {
      const { data: result, error } = await supabase.functions.invoke('city-briefing');
      if (error) throw error;
      if (result?.error) throw new Error(result.error);
      setData(result);
      setAiStatus('active');
      // Cache the briefing
      if (result?.briefing) {
        setCachedBriefing(result.briefing, result.generatedAt);
      }
    } catch (e: any) {
      setAiStatus('error');
      // Show cached data if available
      const fallback = getCachedBriefing();
      if (fallback) {
        toast({
          title: 'AI временно недоступен',
          description: 'Показана последняя сохранённая сводка',
          variant: 'default',
        });
      } else {
        toast({
          title: 'Ошибка AI',
          description: e.message || 'Не удалось сгенерировать сводку',
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, generate, aiStatus };
}
