import { BellRing } from "lucide-react";
import { fmtDue, mskToday } from "@/lib/format";
import type { Instruction } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Строка поручения: что, кто и срок. У выполненных — результат. */
export function InstructionRow({
  item,
  onClick,
  selected,
  showExecutor = true,
}: {
  item: Instruction;
  onClick: () => void;
  selected?: boolean;
  showExecutor?: boolean;
}) {
  const today = mskToday();
  const active = item.status === "new" || item.status === "in_progress";
  const due = fmtDue(item.due_date, today);
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={selected || undefined}
      className={cn("tap-row flex w-full items-start gap-3 px-4 py-3 text-left", selected && "bg-tint/10")}
    >
      <span className="min-w-0 flex-1">
        <span className="block text-[16px] font-semibold leading-[21px]">{item.title}</span>
        <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-subhead text-ink-2">
          {showExecutor && <span>{item.executor?.short_name ?? "Без исполнителя"}</span>}
          {showExecutor && <span aria-hidden>·</span>}
          {active ? (
            <span
              className={cn(
                due.tone === "critical" && "font-semibold text-critical-ink",
                due.tone === "warning" && "font-semibold text-warning-ink",
              )}
            >
              {due.text}
            </span>
          ) : item.status === "done" ? (
            <span className={cn(item.late ? "text-warning-ink" : "text-good-ink")}>
              {item.late ? "выполнено с опозданием" : "выполнено в срок"}
            </span>
          ) : (
            <span>отменено</span>
          )}
        </span>
        {item.status === "done" && item.effect && (
          <span className="mt-1.5 flex items-start gap-2 text-subhead">
            <span
              className={cn(
                "mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full",
                item.effect_positive === false ? "bg-critical" : "bg-good",
              )}
              aria-hidden
            />
            <span>{item.effect}</span>
          </span>
        )}
      </span>
      {active && item.reminders > 0 && (
        <span
          className="flex shrink-0 items-center gap-1 self-center text-subhead tabular-nums text-ink-2"
          aria-label={`Напоминаний: ${item.reminders}`}
        >
          <BellRing className="h-4 w-4 text-ink-3" aria-hidden />
          {item.reminders}
        </span>
      )}
    </button>
  );
}
