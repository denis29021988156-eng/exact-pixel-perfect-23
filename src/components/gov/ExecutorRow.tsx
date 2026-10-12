import type { ExecutorStats } from "@/lib/types";
import { cn } from "@/lib/utils";
import { onTimeTone } from "./tones";

/** Исполнитель в рейтинге: доля поручений в срок, в работе и просрочено. */
export function ExecutorRow({ e, onClick }: { e: ExecutorStats; onClick: () => void }) {
  const done = e.done_on_time + e.done_late;
  return (
    <button type="button" onClick={onClick} className="tap-row flex w-full items-center gap-4 px-4 py-3 text-left">
      <span className="min-w-0 flex-1">
        <span className="block text-[16px] font-semibold leading-[21px]">{e.name}</span>
        <span className="mt-0.5 block text-subhead text-ink-2">
          в работе {e.active}
          {e.overdue > 0 && <span className="text-critical-ink"> · просрочено {e.overdue}</span>}
          {done > 0 && ` · выполнено в срок ${e.done_on_time} из ${done}`}
        </span>
      </span>
      <span className="shrink-0 text-right">
        <span
          className={cn(
            "block text-title3 tabular-nums",
            e.on_time_rate === null ? "text-ink-3" : onTimeTone(e.on_time_rate),
          )}
        >
          {e.on_time_rate === null ? "—" : `${e.on_time_rate}%`}
        </span>
        <span className="block text-caption text-ink-2">в срок</span>
      </span>
    </button>
  );
}
