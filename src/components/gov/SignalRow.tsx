import { MessageSquareText } from "lucide-react";
import { Badge } from "@/components/ios/Badge";
import { fmtAgo } from "@/lib/format";
import type { Signal } from "@/lib/types";
import { cn } from "@/lib/utils";
import { severityBar } from "./tones";

/** Строка сигнала: цветная метка важности, заголовок, где и когда. */
export function SignalRow({ signal, onClick, selected }: { signal: Signal; onClick: () => void; selected?: boolean }) {
  const closed = signal.status === "resolved" || signal.status === "dismissed";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={selected || undefined}
      className={cn("tap-row flex w-full items-stretch gap-3 px-4 py-3 text-left", selected && "bg-tint/10")}
    >
      <span
        className={cn("w-1 shrink-0 rounded-full", closed ? "bg-ink-3/40" : severityBar[signal.severity])}
        aria-hidden
      />
      <span className="min-w-0 flex-1">
        <span className={cn("block text-[16px] font-semibold leading-[21px]", closed && "text-ink-2")}>
          {signal.title}
        </span>
        <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-subhead text-ink-2">
          <span>{signal.municipality?.name ?? "Вся область"}</span>
          <span aria-hidden>·</span>
          <span>{fmtAgo(signal.detected_at)}</span>
          {signal.status === "watch" && <Badge tone="tint">На наблюдении</Badge>}
          {signal.status === "assigned" && signal.instruction && (
            <Badge tone="gray">{signal.instruction.executor ?? "Поручено"}</Badge>
          )}
          {signal.status === "resolved" && <Badge tone="good">Решено</Badge>}
          {signal.status === "dismissed" && <Badge tone="gray">Снят с контроля</Badge>}
        </span>
      </span>
      {signal.mentions ? (
        <span
          className="flex shrink-0 items-center gap-1 self-center text-subhead tabular-nums text-ink-2"
          aria-label={`${signal.mentions} упоминаний`}
        >
          <MessageSquareText className="h-4 w-4 text-ink-3" aria-hidden />
          {signal.mentions}
        </span>
      ) : null}
    </button>
  );
}
