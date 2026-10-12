import { useState } from "react";
import { Pause, Play, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ios/Button";
import { fmtTime } from "@/lib/format";
import { useRefreshBrief } from "@/lib/queries";
import { useSpeaker } from "@/lib/speech";
import type { Brief } from "@/lib/types";

// Без ретроспективных групп в регулярке: старые iPad (iOS до 16.4) их не понимают.
const sentences = (text: string) =>
  text
    .replace(/([.!?…])\s+/g, "$1\n")
    .split("\n")
    .filter(Boolean);

/** Сводка дня: главное одной строкой и пара предложений о том, что изменилось. Можно прослушать. */
export function BriefCard({ brief }: { brief: Brief | null }) {
  const speaker = useSpeaker();
  const refresh = useRefreshBrief();
  const [expanded, setExpanded] = useState(false);

  const doRefresh = () =>
    refresh.mutate(undefined, {
      onSuccess: (r) => toast.success(r.mode === "ai" ? "Сводка обновлена" : "Сводка собрана по данным"),
    });

  if (!brief) {
    return (
      <section className="surface flex flex-col items-start gap-3 rounded-[30px] p-5" aria-label="Сводка дня">
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
  const minutes = Math.max(1, Math.round(listenText.split(/\s+/).length / 130));
  // На карточке — первое предложение; остальное по нажатию «Ещё» и в прослушивании.
  const parts = sentences(brief.summary);
  const short = parts[0] ?? "";
  const hasMore = parts.length > 1;

  return (
    <section className="surface rounded-[30px] px-5 pb-4 pt-[18px] md:px-[22px]" aria-label="Сводка дня">
      <div className="flex items-center justify-between gap-3">
        <Label />
        {/* На телефоне время сводки здесь, на планшете — в шапке экрана. */}
        <span className="text-footnote text-ink-3 sm:hidden">в {fmtTime(brief.generated_at)}</span>
      </div>

      <h2 className="mt-1.5 text-[22px] font-bold leading-[27px] tracking-[-0.02em] text-balance">{brief.headline}</h2>
      <p className="mt-2 text-[15.5px] leading-[22px] text-ink-2 text-pretty">
        {expanded || !hasMore ? brief.summary : short}
        {hasMore && !expanded && (
          <>
            {" "}
            <button type="button" className="font-semibold text-tint" onClick={() => setExpanded(true)}>
              Ещё
            </button>
          </>
        )}
      </p>

      <div className="mt-3.5 flex flex-wrap items-center gap-2.5">
        {speaker.supported && (
          <Button
            variant="tinted"
            size="md"
            className="min-h-[40px] px-4 text-[15px]"
            icon={
              speaker.speaking ? (
                <Pause className="h-4 w-4" fill="currentColor" />
              ) : (
                <Play className="h-4 w-4" fill="currentColor" />
              )
            }
            onClick={() => (speaker.speaking ? speaker.stop() : speaker.speak(listenText))}
          >
            {speaker.speaking ? "Остановить" : `Слушать · ${minutes} мин`}
          </Button>
        )}
        <Button
          variant="plain"
          size="md"
          className="min-h-[40px] px-4 text-[15px]"
          loading={refresh.isPending}
          onClick={doRefresh}
        >
          {refresh.isPending ? "Собираю…" : "Обновить"}
        </Button>
      </div>
    </section>
  );
}

function Label() {
  return (
    <span className="inline-flex items-center gap-1.5 text-[13px] font-bold text-ai-ink">
      <Sparkles className="h-3.5 w-3.5" aria-hidden />
      Сводка дня
    </span>
  );
}
