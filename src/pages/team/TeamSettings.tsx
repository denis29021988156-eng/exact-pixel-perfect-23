import { useEffect, useState } from "react";
import { RotateCcw, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ios/Badge";
import { Button } from "@/components/ios/Button";
import { FieldStack, FormGroup, TextArea } from "@/components/ios/Form";
import { PageHeader } from "@/components/ios/List";
import { Skeleton } from "@/components/ios/States";
import { fmtTime } from "@/lib/format";
import { useAgenda, useDemoReset, useRefreshBrief, useToday } from "@/lib/queries";
import { useSaveTone } from "@/lib/team";

const toLines = (s: string) =>
  s
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean);

export default function TeamSettings() {
  const today = useToday();
  const agenda = useAgenda();
  const refresh = useRefreshBrief();
  const reset = useDemoReset();
  const saveTone = useSaveTone();
  const [tone, setTone] = useState("");
  const [avoid, setAvoid] = useState("");

  useEffect(() => {
    if (agenda.data?.tone) {
      setTone(agenda.data.tone.tone.join("\n"));
      setAvoid(agenda.data.tone.avoid.join("\n"));
    }
  }, [agenda.data?.tone]);

  const brief = today.data?.brief;

  return (
    <div className="space-y-8">
      <PageHeader title="Сводка и тон" subtitle="Утренняя сводка ИИ и правила, как власть говорит с жителями" />

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="surface p-5">
          <div className="flex items-center justify-between gap-3">
            <Badge tone="ai" icon={<Sparkles className="h-3.5 w-3.5" />}>
              Сводка дня
            </Badge>
            {brief && (
              <span className="text-footnote text-ink-3">
                {brief.source === "ai" ? "ИИ" : brief.source === "rules" ? "По данным" : "Подготовлена"} ·{" "}
                {fmtTime(brief.generated_at)}
              </span>
            )}
          </div>
          {today.isLoading ? (
            <div className="mt-3 space-y-2">
              <Skeleton className="h-6 w-4/5" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : brief ? (
            <>
              <h2 className="mt-2 text-title3">{brief.headline}</h2>
              <p className="mt-2 text-callout text-ink-2">{brief.summary}</p>
            </>
          ) : (
            <p className="mt-3 text-callout text-ink-2">Сводки за сегодня ещё нет.</p>
          )}
          <Button
            className="mt-4"
            variant="tinted"
            icon={<Sparkles className="h-4 w-4" />}
            loading={refresh.isPending}
            onClick={() =>
              refresh.mutate(undefined, {
                onSuccess: (r) =>
                  toast.success(r.mode === "ai" ? "ИИ собрал новую сводку" : "Сводка собрана по данным: ИИ недоступен"),
              })
            }
          >
            Собрать заново
          </Button>
          <p className="mt-3 text-footnote text-ink-2">
            ИИ пишет сводку по открытым сигналам, поручениям, обещаниям и индексу доверия. Если ИИ недоступен, сводка
            собирается по правилам.
          </p>
        </div>

        <div className="space-y-4">
          <FormGroup title="Как говорим" footer="Каждое правило с новой строки. ИИ учитывает их в ответах и сводке.">
            <FieldStack label="Правила тона" htmlFor="tone">
              <TextArea id="tone" rows={5} value={tone} onChange={(e) => setTone(e.target.value)} />
            </FieldStack>
          </FormGroup>
          <FormGroup title="Чего избегаем">
            <FieldStack label="Запреты" htmlFor="avoid">
              <TextArea id="avoid" rows={3} value={avoid} onChange={(e) => setAvoid(e.target.value)} />
            </FieldStack>
          </FormGroup>
          <Button
            block
            loading={saveTone.isPending}
            onClick={() => saveTone.mutate({ tone: toLines(tone), avoid: toLines(avoid) })}
          >
            Сохранить тон
          </Button>
        </div>
      </section>

      {today.data?.demo && (
        <section className="surface flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-headline">Демо-данные</h2>
            <p className="mt-1 max-w-xl text-subhead text-ink-2">
              Вернуть сигналы, поручения и повестку к исходному сценарию. Данные и так пересобираются каждую ночь —
              кнопка нужна перед показом.
            </p>
          </div>
          <Button
            variant="destructive-tinted"
            icon={<RotateCcw className="h-4 w-4" />}
            loading={reset.isPending}
            onClick={() => {
              if (window.confirm("Сбросить демо-данные? Все изменения за сегодня пропадут.")) {
                reset.mutate(undefined, { onSuccess: () => toast.success("Демо-данные восстановлены") });
              }
            }}
          >
            Сбросить демо
          </Button>
        </section>
      )}
    </div>
  );
}
