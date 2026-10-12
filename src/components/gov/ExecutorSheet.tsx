import { Sheet } from "@/components/ios/Sheet";
import { EmptyState } from "@/components/ios/States";
import { useSheets } from "@/hooks/useSheetParam";
import { useInstructions } from "@/lib/queries";
import { cn } from "@/lib/utils";
import { InstructionRow } from "./InstructionRow";
import { onTimeTone } from "./tones";

/** Исполнитель: дисциплина сроков и все его поручения. */
export function ExecutorSheet({ id, onClose }: { id: string | null; onClose: () => void }) {
  const sheets = useSheets();
  const q = useInstructions();
  const stats = q.data?.executors.find((e) => e.id === id) ?? null;
  const name = stats?.name ?? q.data?.executor_options.find((e) => e.id === id)?.name ?? "Исполнитель";
  const items = (q.data?.items ?? [])
    .filter((i) => i.executor?.id === id)
    .sort((a, b) => {
      const rank = (s: string) => (s === "done" || s === "cancelled" ? 1 : 0);
      return rank(a.status) - rank(b.status) || b.overdue_days - a.overdue_days || a.due_date.localeCompare(b.due_date);
    });

  return (
    <Sheet open={id !== null} onOpenChange={(v) => !v && onClose()} title={name} size="lg">
      <div className="space-y-5 pt-1">
        {stats && (
          <div className="grid grid-cols-3 gap-2">
            <Stat
              label="В срок"
              value={stats.on_time_rate === null ? "—" : `${stats.on_time_rate}%`}
              className={cn(stats.on_time_rate !== null && onTimeTone(stats.on_time_rate))}
            />
            <Stat label="В работе" value={String(stats.active)} />
            <Stat
              label="Просрочено"
              value={String(stats.overdue)}
              className={cn(stats.overdue > 0 && "text-critical-ink")}
            />
          </div>
        )}
        {items.length ? (
          <div className="surface rows overflow-hidden">
            {items.map((i) => (
              <InstructionRow
                key={i.id}
                item={i}
                showExecutor={false}
                onClick={() => sheets.open("instruction", i.id)}
              />
            ))}
          </div>
        ) : (
          <EmptyState title="Поручений нет" text="За последние 30 дней поручений этому исполнителю не было." />
        )}
      </div>
    </Sheet>
  );
}

function Stat({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className="surface px-3 py-3 text-center">
      <div className={cn("text-title2 tabular-nums", className)}>{value}</div>
      <div className="text-footnote text-ink-2">{label}</div>
    </div>
  );
}
