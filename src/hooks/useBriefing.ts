import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface BriefingData {
  briefing: string;
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
  const [data, setData] = useState<BriefingData | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const generate = async () => {
    setLoading(true);
    try {
      const { data: result, error } = await supabase.functions.invoke('city-briefing');
      if (error) throw error;
      if (result?.error) throw new Error(result.error);
      setData(result);
    } catch (e: any) {
      toast({
        title: 'Ошибка AI',
        description: e.message || 'Не удалось сгенерировать сводку',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, generate };
}
