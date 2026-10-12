import { useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarDays, CheckCircle2, ChevronRight, Quote } from "lucide-react";
import { BriefCard } from "@/components/gov/BriefCard";
import { DecisionCard } from "@/components/gov/DecisionCard";
import { RegionMap } from "@/components/gov/map/RegionMap";
import { SignalRow } from "@/components/gov/SignalRow";
import { TrustGlance } from "@/components/gov/TrustCard";
import { PageHeader } from "@/components/ios/List";
import { EmptyState, ErrorState, ScreenSkeleton } from "@/components/ios/States";
import { useSheets } from "@/hooks/useSheetParam";
import { capitalize, fmtLongDate, plural } from "@/lib/format";
import { useSignals, useToday } from "@/lib/queries";
import type { Signal } from "@/lib/types";
import { cn } from "@/lib/utils";

const isOpen = (s: Signal) => s.status === "new" || s.status === "assigned" || s.status === "watch";
const sevRank = { critical: 3, high: 2, medium: 1 } as const;

export default function Today() {
  const q = useToday();
  const all = useSignals();
  const sheets = useSheets();
  const navigate = useNavigate();
  const [picked, setPicked] = useState<string | null>(null);
  const openSignal = (id: string) => sheets.open("signal", id);
  // На карте — все открытые сигналы; пока список не пришёл, хватает главных из сводки.
  const open = useMemo(() => (all.data?.items ?? q.data?.top ?? []).filter(isOpen), [all.data, q.data]);

  if (q.error && !q.data) {
    return (
      <>
        <PageHeader title="Сегодня" />
        <ErrorState message={(q.error as Error).message} onRetry={() => q.refetch()} />
      </>
    );
  }
  if (!q.data) {
    return (
      <>
        <PageHeader title="Сегодня" />
        <ScreenSkeleton />
      </>
    );
  }

  const t = q.data;
  const c = t.counts;
  const has = (id: string | null | undefined): id is string => Boolean(id && open.some((s) => s.id === id));
  // На карте сразу выбран главный сигнал дня: из сводки, из решений или самый острый.
  const headline = t.brief?.items.find((i) => has(i.signal_id))?.signal_id;
  const firstDecision = t.decisions.find((d) => d.type === "signal" && has(d.id))?.id;
  const sharpest = [...open].sort(
    (a, b) => sevRank[b.severity] - sevRank[a.severity] || b.detected_at.localeCompare(a.detected_at),
  )[0]?.id;
  const selectedId = has(picked) ? picked : (headline ?? firstDecision ?? sharpest ?? null);

  const decisionIds = new Set(t.decisions.filter((d) => d.type === "signal").map((d) => d.id));
  const others = t.top.filter((s) => !decisionIds.has(s.id));

  return (
    <div>
      <PageHeader title="Сегодня" subtitle={capitalize(fmtLongDate(t.date, t.date))} />

      {/* На широком экране две колонки: карта и цифры слева, сводка и решения справа.
          На телефоне и в портрете — одна лента: сводка, карта, решения, цифры. */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 lg:items-start lg:gap-6">
        <div className="contents lg:col-span-7 lg:flex lg:flex-col lg:gap-5">
          <RegionMap
            className="order-2 lg:order-none"
            title={t.region ?? "Карта области"}
            signals={open}
            selectedId={selectedId}
            onSelect={setPicked}
            onOpen={openSignal}
            renderOverlay={(placement) => (
              <TrustGlance
                trust={t.trust}
                onOpen={() => sheets.open("trust")}
                layout={placement === "over" ? "stack" : "row"}
              />
            )}
          />

          <div className="order-4 space-y-3 lg:order-none">
            <div className="grid grid-cols-3 gap-3">
              <Counter
                value={c.instructions_overdue}
                label="просрочено"
                tone={c.instructions_overdue > 0 ? "critical" : "normal"}
                onClick={() => navigate("/app/instructions")}
              />
              <Counter value={c.instructions_active} label="в работе" onClick={() => navigate("/app/instructions")} />
              <Counter
                value={c.instructions_done_week}
                label="сделано за неделю"
                tone="good"
                onClick={() => navigate("/app/instructions")}
              />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <LinkTile
                icon={<Quote className="h-5 w-5" />}
                iconClass={c.promises_at_risk > 0 ? "bg-warning/16 text-warning-ink" : "bg-good/16 text-good-ink"}
                title="Обещания"
                text={
                  c.promises_at_risk > 0
                    ? `${c.promises_at_risk} ${plural(c.promises_at_risk, "обещание", "обещания", "обещаний")} под риском или без поручения`
                    : "Все обещания в работе"
                }
                onClick={() => navigate("/app/instructions?tab=promises")}
              />
              <LinkTile
                icon={<CalendarDays className="h-5 w-5" />}
                iconClass="bg-tint/14 text-tint"
                title="Повестка"
                text={
                  c.agenda_pending > 0
                    ? `${c.agenda_pending} ${plural(c.agenda_pending, "пункт ждёт", "пункта ждут", "пунктов ждут")} согласования`
                    : "Повестка согласована"
                }
                onClick={() => navigate("/app/agenda")}
              />
            </div>
          </div>

          {others.length > 0 && (
            <section aria-label="Другие сигналы" className="order-5 min-w-0 lg:order-none">
              <SectionHead
                title="Ещё сигналы"
                action={
                  <button
                    type="button"
                    className="press text-[15px] font-semibold text-tint"
                    onClick={() => navigate("/app/signals")}
                  >
                    Все
                  </button>
                }
              />
              <div className="surface rows overflow-hidden">
                {others.map((s) => (
                  <SignalRow key={s.id} signal={s} onClick={() => openSignal(s.id)} />
                ))}
              </div>
            </section>
          )}
        </div>

        <div className="contents lg:col-span-5 lg:flex lg:flex-col lg:gap-5">
          <div className="order-1 min-w-0 lg:order-none">
            <BriefCard brief={t.brief} onOpenSignal={openSignal} />
          </div>

          <section aria-label="Ждут решения" className="order-3 min-w-0 lg:order-none">
            <SectionHead title="Ждут решения" count={t.decisions.length} />
            {t.decisions.length ? (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-1">
                {t.decisions.map((d) => (
                  <DecisionCard
                    key={`${d.type}-${d.id}`}
                    d={d}
                    onOpenSignal={openSignal}
                    onOpenAgenda={() => navigate("/app/agenda")}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<CheckCircle2 className="h-9 w-9 text-good" />}
                title="Все решения приняты"
                text="Новые вопросы появятся здесь, как только ИИ их найдёт."
              />
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function SectionHead({ title, count, action }: { title: string; count?: number; action?: ReactNode }) {
  return (
    <div className="flex items-end justify-between px-1 pb-3">
      <h2 className="text-title2">
        {title}
        {count ? <span className="ml-2 font-semibold text-ink-3 tabular-nums">{count}</span> : null}
      </h2>
      {action}
    </div>
  );
}

function Counter({
  value,
  label,
  tone = "normal",
  onClick,
}: {
  value: number;
  label: string;
  tone?: "critical" | "good" | "normal";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="surface press flex min-w-0 flex-col items-start px-4 py-3.5 text-left"
    >
      <span
        className={cn(
          "num-rounded text-[34px] font-extrabold leading-[38px]",
          tone === "critical" && value > 0 && "text-critical-ink",
          tone === "good" && value > 0 && "text-good-ink",
        )}
      >
        {value}
      </span>
      <span className="text-footnote leading-tight text-ink-2">{label}</span>
    </button>
  );
}

function LinkTile({
  icon,
  iconClass,
  title,
  text,
  onClick,
}: {
  icon: ReactNode;
  iconClass: string;
  title: string;
  text: string;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className="surface press flex w-full items-center gap-3 p-4 text-left">
      <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px]", iconClass)} aria-hidden>
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-headline">{title}</span>
        <span className="block text-subhead text-ink-2">{text}</span>
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-ink-3" aria-hidden />
    </button>
  );
}
