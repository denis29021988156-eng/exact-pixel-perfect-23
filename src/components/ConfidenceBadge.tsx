import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ShieldCheck, ShieldAlert, ShieldQuestion } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  score: number; // 0-100
  source?: string | null;
  ageMinutes?: number | null;
  className?: string;
  size?: 'sm' | 'md';
}

export default function ConfidenceBadge({ score, source, ageMinutes, className, size = 'sm' }: Props) {
  const tier =
    score >= 80 ? 'high' : score >= 60 ? 'mid' : 'low';

  const Icon = tier === 'high' ? ShieldCheck : tier === 'mid' ? ShieldQuestion : ShieldAlert;
  const colors =
    tier === 'high'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : tier === 'mid'
      ? 'bg-amber-50 text-amber-700 border-amber-200'
      : 'bg-rose-50 text-rose-700 border-rose-200';

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full border font-semibold',
              size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs',
              colors,
              className
            )}
          >
            <Icon className={cn(size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5')} />
            {score}%
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs text-xs">
          <div className="font-semibold mb-1">Уверенность данных: {score}%</div>
          <div className="text-muted-foreground">
            {source && <div>Источник: {source}</div>}
            {ageMinutes != null && <div>Возраст: {ageMinutes < 1 ? '< 1 мин' : `${Math.round(ageMinutes)} мин`}</div>}
            <div className="mt-1">
              Формула: полнота·0.4 + свежесть·0.3 + надёжность·0.2 + парсинг·0.1
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
