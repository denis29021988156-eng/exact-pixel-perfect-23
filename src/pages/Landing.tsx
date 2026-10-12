import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Bell, CalendarDays, ClipboardCheck, Mic, Sparkles, Sun } from "lucide-react";
import { AppMark } from "@/components/gov/AppMark";
import { Button } from "@/components/ios/Button";
import { homeFor, useAuth } from "@/contexts/auth";
import { capitalize, fmtWeekday, mskToday } from "@/lib/format";

const features = [
  {
    icon: Sun,
    title: "Сегодня",
    text: "Сводка дня от ИИ, индекс доверия и вопросы, которые ждут решения.",
  },
  {
    icon: Bell,
    title: "Сигналы",
    text: "ЕДДС, ЦУР, соцсети и СМИ: что случилось, почему и что будет дальше.",
  },
  {
    icon: ClipboardCheck,
    title: "Поручения",
    text: "Поручить в одно касание, напомнить, перенести срок, увидеть результат.",
  },
  {
    icon: CalendarDays,
    title: "Повестка",
    text: "СМИ, PR, GR и мероприятия на три недели и их влияние на доверие.",
  },
  {
    icon: Mic,
    title: "Спросить",
    text: "Голосом или текстом: «Что горит сегодня?», «Кто срывает сроки?»",
  },
];

export default function Landing() {
  const { status, role, demoLogin } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState<"governor" | "team" | null>(null);

  const openDemo = async (as: "governor" | "team") => {
    setBusy(as);
    try {
      const r = await demoLogin(as);
      navigate(homeFor(r));
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const signedIn = status === "ready" && role;

  return (
    <div className="min-h-dvh bg-background">
      <header className="mx-auto flex max-w-[1080px] items-center justify-between px-5 pt-[max(16px,env(safe-area-inset-top))]">
        <div className="flex items-center gap-2.5">
          <AppMark size={32} />
          <span className="text-headline">Планшет губернатора</span>
        </div>
        {signedIn ? (
          <Link to={homeFor(role)} className="press text-[16px] font-semibold text-tint">
            Открыть
          </Link>
        ) : (
          <Link to="/login" className="press text-[16px] font-semibold text-tint">
            Войти
          </Link>
        )}
      </header>

      <main className="mx-auto max-w-[1080px] px-5 pb-16">
        <section className="grid grid-cols-1 items-center gap-10 pt-10 md:grid-cols-[1.05fr_1fr] md:pt-16">
          <div className="animate-rise-in">
            <p className="inline-flex items-center gap-1.5 rounded-full bg-ai/12 px-3 py-1 text-[13px] font-semibold text-ai-ink">
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              ИИ-помощник руководителя региона
            </p>
            <h1 className="mt-4 text-[40px] font-bold leading-[1.08] tracking-tight text-balance md:text-[52px]">
              Главное за день — на одном экране
            </h1>
            <p className="mt-4 max-w-[34rem] text-[19px] leading-[27px] text-ink-2 text-pretty">
              ИИ собирает сигналы из ЕДДС, ЦУР, соцсетей и СМИ, готовит сводку и предлагает решение. Поручить можно в
              одно касание, а результат виден в индексе доверия.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              {signedIn ? (
                <Button size="lg" onClick={() => navigate(homeFor(role))}>
                  Открыть планшет
                </Button>
              ) : (
                <>
                  <Button
                    size="lg"
                    loading={busy === "governor"}
                    disabled={busy !== null}
                    onClick={() => openDemo("governor")}
                  >
                    Открыть демо
                  </Button>
                  <Button
                    size="lg"
                    variant="gray"
                    loading={busy === "team"}
                    disabled={busy !== null}
                    onClick={() => openDemo("team")}
                  >
                    Кабинет команды
                  </Button>
                </>
              )}
            </div>
            <p className="mt-4 max-w-[34rem] text-footnote text-ink-2">
              Демо на примере Тверской области: округа настоящие, события и цифры придуманы. Данные пересобираются
              каждую ночь.
            </p>
          </div>

          <PreviewCard />
        </section>

        <section className="mt-16 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {features.map((f) => (
            <div key={f.title} className="surface p-4">
              <f.icon className="h-6 w-6 text-tint" aria-hidden />
              <h2 className="mt-3 text-headline">{f.title}</h2>
              <p className="mt-1 text-subhead text-ink-2">{f.text}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}

/** Схематичный экран «Сегодня» для первого впечатления. */
function PreviewCard() {
  const points = [58.3, 58.7, 59.4, 60, 60.6, 61.4, 61.7, 61.6, 61.7, 61.3];
  const max = 62.2;
  const min = 57.8;
  const path = points
    .map((v, i) => `${i === 0 ? "M" : "L"}${(i / (points.length - 1)) * 200} ${((max - v) / (max - min)) * 56 + 4}`)
    .join(" ");
  return (
    <div className="animate-rise-in [animation-delay:120ms]" aria-hidden>
      <div className="rounded-[28px] bg-card p-3 shadow-float ring-1 ring-black/5 dark:ring-white/10">
        <div className="rounded-[20px] bg-background p-4">
          <div className="text-[13px] font-semibold text-ink-2">{capitalize(fmtWeekday(mskToday()))}</div>
          <div className="text-[28px] font-bold leading-tight">Сегодня</div>

          <div className="mt-3 grid grid-cols-[1.4fr_1fr] gap-3">
            <div className="surface p-3">
              <div className="flex items-center gap-1 text-[12px] font-semibold text-ai-ink">
                <Sparkles className="h-3 w-3" /> Сводка дня
              </div>
              <div className="mt-1.5 text-[14px] font-semibold leading-[18px]">
                Главное — Удомля: три дома без отопления с ночи
              </div>
              <div className="mt-1 text-[12px] leading-[16px] text-ink-2">
                Решения ждут три вопроса: отопление, мусор в Твери и выезд к жителям.
              </div>
            </div>
            <div className="surface p-3">
              <div className="text-[12px] font-semibold text-ink-2">Индекс доверия</div>
              <div className="mt-0.5 text-[26px] font-bold leading-none tabular-nums">61,3</div>
              <div className="mt-0.5 text-[11px] font-semibold text-good-ink">+1,9 за неделю</div>
              <svg viewBox="0 0 200 64" className="mt-1 h-10 w-full">
                <path d={path} fill="none" className="stroke-tint" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </div>
          </div>

          <div className="surface mt-3 p-3">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-critical" />
              <span className="text-[12px] font-semibold text-critical-ink">Критично · Удомельский округ</span>
            </div>
            <div className="mt-1 text-[14px] font-semibold leading-[18px]">Три дома без отопления после аварии</div>
            <div className="mt-2 flex gap-2">
              <span className="rounded-[10px] bg-tint px-3 py-1.5 text-[13px] font-semibold text-white">
                Поручить ЖКХ до завтра
              </span>
              <span className="rounded-[10px] bg-fill px-3 py-1.5 text-[13px] font-semibold">Подробнее</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
