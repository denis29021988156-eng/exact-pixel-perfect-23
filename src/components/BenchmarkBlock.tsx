import { useState, useEffect } from 'react';
import { BarChart3, TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Benchmark {
  id: string;
  metric_name: string;
  metric_value: number;
  norm_value: number;
  category: string;
}

export default function BenchmarkBlock() {
  const [benchmarks, setBenchmarks] = useState<Benchmark[]>([]);

  useEffect(() => {
    supabase.from('benchmarks').select('*').order('category').then(({ data }) => {
      setBenchmarks((data as Benchmark[]) || []);
    });
  }, []);

  if (benchmarks.length === 0) return null;

  return (
    <div className="glass-card p-6">
      <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
          <BarChart3 className="w-4 h-4 text-primary" />
        </div>
        Бенчмарки
      </h2>

      <div className="space-y-2">
        {benchmarks.map(b => {
          const diff = b.metric_value - b.norm_value;
          const pct = b.norm_value > 0 ? Math.round((diff / b.norm_value) * 100) : 0;
          const isAbove = diff > 0;
          const isBelow = diff < 0;

          return (
            <div key={b.id} className="flex items-center gap-4 p-3 rounded-xl bg-surface-muted/50">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{b.metric_name}</p>
                <p className="text-[11px] text-muted-foreground">
                  Факт: {b.metric_value} · Норма: {b.norm_value}
                </p>
              </div>
              <div className={`flex items-center gap-1 text-xs font-semibold ${isBelow ? 'text-danger' : isAbove ? 'text-success' : 'text-muted-foreground'}`}>
                {isBelow ? <TrendingDown className="w-3 h-3" /> : isAbove ? <TrendingUp className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                {pct > 0 ? '+' : ''}{pct}%
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
