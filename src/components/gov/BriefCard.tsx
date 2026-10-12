import { ChevronRight, Pause, RefreshCw, Sparkles, Volume2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ios/Badge";
import { Button } from "@/components/ios/Button";
import { fmtTime } from "@/lib/format";
import { useRefreshBrief } from "@/lib/queries";
import { useSpeaker } from "@/lib/speech";
import type { Brief } from "@/lib/types";

/** Сводка дня: главное, что произошло, и что ждёт решения. Можно прослушать. */
export function BriefCard({ brief, onOpenSignal }: { brief: Brief | null; onOpenSignal: (id: string) => void }) {
  const speaker = useSpeaker();
  const refresh = useRefreshBrief();

  const doRefresh = () =>
    refresh.mutate(undefined, {
      onSuccess: (r) => toast.success(r.mode === "ai" ? "Сводка обновлена" : "Сводка собрана по данным"),
    });

  if (!brief) {
    return (
      <section className="surface flex flex-col items-start gap-3 p-5" aria-label="Сводка дня">
        <Label />
        <p className="text-title3">Сводка за сегодня ещё не готова</p>
        <p className="text-subhead text-ink-2">ИИ соберёт главное по сигналам, поручениям и индексу доверия.</p>
        <Button onClick={doRefresh} loading={refresh.isPending} icon={<Sparkles className="h-4 w-4" />}>
          Собрать сводку
        </Button>
      </section>
    );
  }

  const listenText = `${brief.headline}. ${brief.summary}`;

  return (
    <section className="surface p-5" aria-label="Сводка дня">
      <div className="flex items-center justify-between gap-3">
        <Label />
        <span className="text-footnote text-ink-3">
          {brief.source === "ai" ? "ИИ" : brief.source === "rules" ? "По данным" : "Сводка"} ·{" "}
          {fmtTime(brief.generated_at)}
        </span>
      </div>

      <h2 className="mt-2 text-title2 text-balance">{brief.headline}</h2>
      <p className="mt-2 text-body text-pretty">{brief.summary}</p>

      {brief.items.length > 0 && (
        <ul className="mt-4 overflow-hidden rounded-[12px] bg-background/70 dark:bg-elevated/50">
          {brief.items.map((it, i) => (
            <li key={i} className={i ? "border-t border-line/70" : undefined}>
              {it.signal_id ? (
                <button
                  type="button"
                  onClick={() => onOpenSignal(it.signal_id!)}
                  className="tap-row flex w-full items-center gap-3 px-3.5 py-2.5 text-left text-[15px]"
                >
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-ink-3" aria-hidden />
                  <span className="flex-1">{it.text}</span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-ink-3" aria-hidden />
                </button>
              ) : (
                <div className="flex items-center gap-3 px-3.5 py-2.5 text-[15px]">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-ink-3" aria-hidden />
                  <span className="flex-1">{it.text}</span>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {speaker.supported && (
          <Button
            variant="tinted"
            size="sm"
            icon={speaker.speaking ? <Pause className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            onClick={() => (speaker.speaking ? speaker.stop() : speaker.speak(listenText))}
          >
            {speaker.speaking ? "Остановить" : "Слушать"}
          </Button>
        )}
        <Button
          variant="plain"
          size="sm"
          icon={<RefreshCw className={refresh.isPending ? "h-4 w-4 animate-spin" : "h-4 w-4"} />}
          onClick={doRefresh}
          disabled={refresh.isPending}
        >
          {refresh.isPending ? "Собираю…" : "Обновить"}
        </Button>
      </div>
    </section>
  );
}

function Label() {
  return (
    <Badge tone="ai" icon={<Sparkles className="h-3.5 w-3.5" aria-hidden />}>
      Сводка дня
    </Badge>
  );
}
