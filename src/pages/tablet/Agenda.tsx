import { useMemo, useState } from "react";
import { Check, ChevronDown, MessageSquareQuote, Undo2, X } from "lucide-react";
import { useAgendaFlow } from "@/components/gov/actions";
import { ChannelIcon } from "@/components/gov/meta";
import { TrustChart } from "@/components/gov/TrustChart";
import { Delta, Legend } from "@/components/gov/TrustSheet";
import { Badge } from "@/components/ios/Badge";
import { Button } from "@/components/ios/Button";
import { PageHeader } from "@/components/ios/List";
import { Segmented } from "@/components/ios/Segmented";
import { EmptyState, ErrorState, ScreenSkeleton } from "@/components/ios/States";
import { useSheets } from "@/hooks/useSheetParam";
import {
  capitalize,
  channelLabel,
  diffDays,
  fmtDay,
  fmtNum,
  fmtRelDay,
  fmtWeekday,
  mskToday,
  plural,
} from "@/lib/format";
import { useAgenda } from "@/lib/queries";
import type { AgendaItem } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function Agenda() {
  const q = useAgenda();
  const sheets = useSheets();
  const [range, setRange] = useState<"30" | "120">("120");
  const [showPast, setShowPast] = useState(false);
  const today = q.data?.today ?? mskToday();

  const { upcoming, past } = useMemo(() => {
    const items = q.data?.items ?? [];
    const byDay = (list: AgendaItem[]) => {
      const map = new Map<string, AgendaItem[]>();
      list.forEach((i) => map.set(i.day, [...(map.get(i.day) ?? []), i]));
      return [...map.entries()];
    };
    return {
      upcoming: byDay(items.filter((i) => i.day >= today)),
      past: byDay(items.filter((i) => i.day < today)).reverse(),
    };
  }, [q.data, today]);

  if (q.error && !q.data) {
    return (
      <>
        <PageHeader title="Повестка" />
        <ErrorState message={(q.error as Error).message} onRetry={() => q.refetch()} />
      </>
    );
  }
  if (!q.data) {
    return (
      <>
        <PageHeader title="Повестка" />
        <ScreenSkeleton />
      </>
    );
  }

  const a = q.data;
  const series = range === "30" ? a.trust.slice(-30) : a.trust;
  const pending = a.items.filter((i) => i.status === "proposed" && i.day >= today).length;

  return (
    <div>
      <PageHeader
        title="Повестка"
        subtitle={
          pending
            ? `${pending} ${plural(pending, "пункт ждёт", "пункта ждут", "пунктов ждут")} решения`
            : "Всё согласовано"
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="min-w-0 space-y-6 lg:col-span-7">
          {upcoming.length ? (
            upcoming.map(([day, items]) => <DayGroup key={day} day={day} today={today} items={items} />)
          ) : (
            <EmptyState title="Ближайших пунктов нет" text="Команда добавит предложения в кабинете." />
          )}

          {past.length > 0 && (
            <section>
              <button
                type="button"
                onClick={() => setShowPast((v) => !v)}
                className="press flex items-center gap-1.5 px-4 text-[15px] font-semibold text-tint"
                aria-expanded={showPast}
              >
                <ChevronDown className={cn("h-4 w-4 transition-transform", showPast && "rotate-180")} aria-hidden />
                {showPast ? "Скрыть прошедшее" : "Прошедшая неделя"}
              </button>
              {showPast && (
                <div className="mt-4 space-y-6">
                  {past.map(([day, items]) => (
                    <DayGroup key={day} day={day} today={today} items={items} />
                  ))}
                </div>
              )}
            </section>
          )}
        </div>

        <aside className="min-w-0 space-y-6 lg:sticky lg:top-16 lg:col-span-5 lg:self-start">
          <section className="surface p-4" aria-label="Индекс доверия">
            <div className="flex items-start justify-between gap-3">
              <button type="button" className="text-left" onClick={() => sheets.open("trust")}>
                <span className="block text-footnote font-semibold uppercase tracking-wide text-ink-2">
                  Индекс доверия
                </span>
                {a.trust_summary && (
                  <span className="mt-1 flex items-baseline gap-2">
                    <span className="text-title1 tabular-nums">{fmtNum(Number(a.trust_summary.value))}</span>
                    <span className="text-subhead">
                      <Delta value={a.trust_summary.delta_week} /> <span className="text-ink-2">за неделю</span>
                    </span>
                  </span>
                )}
              </button>
              <Segmented
                value={range}
                onChange={setRange}
                className="w-[180px] md:min-w-0 md:w-[180px]"
                ariaLabel="Период"
                options={[
                  { value: "30", label: "Месяц" },
                  { value: "120", label: "4 мес." },
                ]}
              />
            </div>
            <TrustChart points={series} height={200} className="mt-3" />
            <Legend />
            <p className="mt-3 text-footnote text-ink-2">
              Как мероприятия, проекты и публикации двигают доверие к власти.
            </p>
          </section>

          {a.tone && (a.tone.tone.length > 0 || a.tone.avoid.length > 0) && (
            <section className="surface p-4" aria-label="Как говорим">
              <h2 className="flex items-center gap-2 text-headline">
                <MessageSquareQuote className="h-5 w-5 text-ai" aria-hidden />
                Как говорим
              </h2>
              <ul className="mt-3 space-y-2">
                {a.tone.tone.map((t) => (
                  <li key={t} className="flex gap-2.5 text-callout">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-good-ink" aria-hidden />
                    {t}
                  </li>
                ))}
              </ul>
              {a.tone.avoid.length > 0 && (
                <>
                  <h3 className="mt-4 text-footnote font-semibold uppercase tracking-wide text-ink-2">Чего избегаем</h3>
                  <ul className="mt-2 space-y-2">
                    {a.tone.avoid.map((t) => (
                      <li key={t} className="flex gap-2.5 text-callout">
                        <X className="mt-0.5 h-4 w-4 shrink-0 text-critical-ink" aria-hidden />
                        {t}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}

function DayGroup({ day, today, items }: { day: string; today: string; items: AgendaItem[] }) {
  const rel = fmtRelDay(day, today);
  const d = diffDays(today, day);
  const title =
    d >= -1 && d <= 2
      ? `${capitalize(rel)}, ${fmtDay(day, today)}`
      : `${capitalize(fmtWeekday(day))}, ${fmtDay(day, today)}`;
  return (
    <section aria-label={title}>
      <h2 className={cn("section-title", d === 0 && "text-tint")}>{title}</h2>
      <div className="space-y-3">
        {items.map((i) => (
          <AgendaCard key={i.id} item={i} />
        ))}
      </div>
    </section>
  );
}

function AgendaCard({ item }: { item: AgendaItem }) {
  const flow = useAgendaFlow();
  const [returning, setReturning] = useState(false);
  const [note, setNote] = useState("");
  const busy = flow.pending;

  return (
    <article className={cn("surface p-4", item.status === "done" && "opacity-70")}>
      <div className="flex items-start gap-3">
        <ChannelIcon channel={item.channel} />
        <div className="min-w-0 flex-1">
          <p className="text-footnote text-ink-2">
            {channelLabel[item.channel]}
            {item.municipality ? ` · ${item.municipality.name}` : ""}
          </p>
          <h3 className="text-headline">{item.title}</h3>
          {item.description && <p className="mt-1 text-subhead text-ink-2">{item.description}</p>}
          {item.expected_effect && (
            <p className="mt-1.5 text-subhead">
              <span className="text-ink-2">Зачем: </span>
              {item.expected_effect}
            </p>
          )}
        </div>
      </div>

      {item.status === "proposed" && !returning && (
        <div className="mt-3 flex gap-2">
          <Button className="flex-1" loading={busy} onClick={() => flow.run(item.id, "approved")}>
            Согласовать
          </Button>
          <Button variant="gray" className="flex-1" disabled={busy} onClick={() => setReturning(true)}>
            Вернуть
          </Button>
        </div>
      )}

      {item.status === "proposed" && returning && (
        <div className="mt-3 space-y-2">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            autoFocus
            placeholder="Что поправить? Например: перенести на следующую неделю"
            className="w-full resize-none rounded-[12px] bg-fill px-3 py-2.5 text-[16px] outline-none placeholder:text-ink-3"
            aria-label="Комментарий"
          />
          <div className="flex gap-2">
            <Button
              variant="destructive-tinted"
              className="flex-1"
              loading={busy}
              onClick={async () => {
                const ok = await flow.run(item.id, "returned", note.trim() || null);
                if (ok) {
                  setReturning(false);
                  setNote("");
                }
              }}
            >
              Вернуть команде
            </Button>
            <Button variant="gray" onClick={() => setReturning(false)} disabled={busy}>
              Отмена
            </Button>
          </div>
        </div>
      )}

      {item.status === "approved" && (
        <div className="mt-3 flex items-center justify-between gap-3">
          <Badge tone="good" icon={<Check className="h-3.5 w-3.5" aria-hidden />}>
            Согласовано
          </Badge>
          <button
            type="button"
            className="press inline-flex items-center gap-1 text-[14px] text-ink-2"
            onClick={() => flow.run(item.id, "proposed")}
            disabled={busy}
          >
            <Undo2 className="h-3.5 w-3.5" aria-hidden /> Пересмотреть
          </button>
        </div>
      )}

      {item.status === "returned" && (
        <div className="mt-3 flex items-start justify-between gap-3">
          <div>
            <Badge tone="warning">Возвращено</Badge>
            {item.decision_note && <p className="mt-1.5 text-subhead text-ink-2">«{item.decision_note}»</p>}
          </div>
          <button
            type="button"
            className="press inline-flex shrink-0 items-center gap-1 text-[14px] text-ink-2"
            onClick={() => flow.run(item.id, "proposed")}
            disabled={busy}
          >
            <Undo2 className="h-3.5 w-3.5" aria-hidden /> Пересмотреть
          </button>
        </div>
      )}

      {item.status === "done" && (
        <div className="mt-3">
          <Badge tone="gray">Прошло</Badge>
        </div>
      )}
    </article>
  );
}
