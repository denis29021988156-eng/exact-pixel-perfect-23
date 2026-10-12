import { ChevronRight, Pause, RefreshCw, Sparkles, Volume2 } from "lucide-react";
import { toast } from "sonner";
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
    <section className="surface relative overflow-hidden p-5 md:p-6" aria-label="Сводка дня">
      <span
        className="pointer-events-none absolute -left-24 -top-28 h-72 w-72 rounded-full"
        style={{ background: "radial-gradient(closest-side, hsl(var(--ai) / 0.16), transparent)" }}
        aria-hidden
      />
      <div className="relative flex items-center justify-between gap-3">
        <Label />
        <span className="text-footnote text-ink-3">
          {brief.source === "ai" ? "Собрал ИИ в " : brief.source === "rules" ? "Собрано по данным в " : "Готова в "}
          {fmtTime(brief.generated_at)}
        </span>
      </div>

      <h2 className="relative mt-3 text-[24px] font-bold leading-[29px] tracking-[-0.02em] text-balance md:text-[26px] md:leading-[31px]">
        {brief.headline}
      </h2>
      <p className="relative mt-2.5 text-[16.5px] leading-[23px] text-ink-2 text-pretty">{brief.summary}</p>

      {brief.items.length > 0 && (
        <ul className="relative mt-4 overflow-hidden rounded-[18px] border border-[var(--inner-edge)] bg-[var(--inner)]">
          {brief.items.map((it, i) => (
            <li key={i} className={i ? "border-t border-line" : undefined}>
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

      <div className="relative mt-4 flex flex-wrap items-center gap-2">
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
    <span className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-ai-ink">
      <Sparkles className="h-4 w-4" aria-hidden />
      Сводка дня
    </span>
  );
}
