import { useEffect, useRef, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowUp,
  CalendarDays,
  CircleDot,
  ClipboardCheck,
  Mic,
  Pause,
  Quote,
  Sparkles,
  Square,
  Volume2,
} from "lucide-react";
import { Button } from "@/components/ios/Button";
import { Sheet } from "@/components/ios/Sheet";
import { useSheets } from "@/hooks/useSheetParam";
import { fmtDay, mskToday } from "@/lib/format";
import { useAsk } from "@/lib/queries";
import { useDictation, useSpeaker } from "@/lib/speech";
import type { AskAnswer, AskRef } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useCreateFlow } from "./actions";
import { OrbLayers } from "./Orb";

const SUGGESTIONS = [
  "Что горит сегодня?",
  "Кто срывает сроки?",
  "Что с обещаниями прямой линии?",
  "Почему изменился индекс доверия?",
  "Что сказать жителям Удомли?",
];

interface Turn {
  id: number;
  q: string;
  a?: AskAnswer;
  error?: string;
  assignedId?: string;
}

const refIcon = {
  signal: CircleDot,
  instruction: ClipboardCheck,
  promise: Quote,
  agenda: CalendarDays,
} as const;

/** «Спросить»: вопрос голосом или текстом, ответ по данным планшета и предложение поручить. */
export function AskSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [text, setText] = useState("");
  const ask = useAsk();
  const speaker = useSpeaker();
  const sheets = useSheets();
  const navigate = useNavigate();
  const create = useCreateFlow();
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const nextId = useRef(1);

  const send = (question: string) => {
    const q = question.trim();
    if (!q || ask.isPending) return;
    const id = nextId.current++;
    const history = turns
      .filter((t) => t.a)
      .slice(-3)
      .map((t) => ({ q: t.q, a: t.a!.answer }));
    setTurns((prev) => [...prev, { id, q }]);
    setText("");
    speaker.stop();
    ask.mutate(
      { question: q, history },
      {
        onSuccess: (a) => setTurns((prev) => prev.map((t) => (t.id === id ? { ...t, a } : t))),
        onError: (err) =>
          setTurns((prev) => prev.map((t) => (t.id === id ? { ...t, error: (err as Error).message } : t))),
      },
    );
  };

  const dictation = useDictation((spoken) => send(spoken));

  // Новый ответ — прокручиваем вниз.
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [turns, ask.isPending]);

  // Закрыли лист — перестаём слушать и говорить.
  useEffect(() => {
    if (!open) {
      dictation.stop();
      speaker.stop();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const openRef = (r: AskRef) => {
    if (r.type === "signal") sheets.open("signal", r.id);
    else if (r.type === "instruction") sheets.open("instruction", r.id);
    else if (r.type === "promise") navigate("/app/instructions?tab=promises");
    else navigate("/app/agenda");
  };

  const assign = async (turn: Turn) => {
    const act = turn.a?.action;
    if (!act) return;
    const instr = await create.run({
      title: act.title,
      executorId: act.executor.id,
      due: act.due,
      municipalityId: act.municipality_id,
      details: act.details,
      source: "ask",
    });
    if (instr) setTurns((prev) => prev.map((t) => (t.id === turn.id ? { ...t, assignedId: instr.id } : t)));
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    send(text);
  };

  const today = mskToday();
  const empty = turns.length === 0;

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => !v && onClose()}
      title="Спросить"
      size="lg"
      headerLeft={
        turns.length > 0 ? (
          <button
            type="button"
            className="press px-2 text-[16px] text-tint"
            onClick={() => {
              setTurns([]);
              speaker.stop();
            }}
          >
            Очистить
          </button>
        ) : undefined
      }
      footer={
        <form onSubmit={submit} className="flex items-center gap-2">
          <div className="flex min-h-[44px] flex-1 items-center rounded-full bg-fill px-4">
            <input
              ref={inputRef}
              value={dictation.listening ? dictation.interim : text}
              onChange={(e) => setText(e.target.value)}
              placeholder={dictation.listening ? "Слушаю…" : "Спросите о чём угодно"}
              className="w-full bg-transparent text-[17px] outline-none placeholder:text-ink-3"
              aria-label="Вопрос"
              readOnly={dictation.listening}
              enterKeyHint="send"
            />
          </div>
          {dictation.supported && (
            <button
              type="button"
              onClick={dictation.listening ? dictation.stop : dictation.start}
              className={cn(
                "press flex h-11 w-11 shrink-0 items-center justify-center rounded-full",
                dictation.listening ? "animate-listen-ring bg-critical text-white" : "bg-tint/12 text-tint",
              )}
              aria-label={dictation.listening ? "Остановить запись" : "Сказать голосом"}
            >
              {dictation.listening ? <Square className="h-4 w-4" fill="currentColor" /> : <Mic className="h-5 w-5" />}
            </button>
          )}
          <button
            type="submit"
            disabled={!text.trim() || ask.isPending || dictation.listening}
            className="press flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-tint text-white disabled:opacity-30"
            aria-label="Отправить"
          >
            <ArrowUp className="h-5 w-5" strokeWidth={2.5} />
          </button>
        </form>
      }
    >
      <div className="space-y-4 pt-1" aria-live="polite">
        {empty && (
          <div className="flex flex-col items-center px-2 pb-2 pt-6 text-center">
            {dictation.supported ? (
              <button
                type="button"
                onClick={dictation.listening ? dictation.stop : dictation.start}
                className="press relative flex h-20 w-20 items-center justify-center rounded-full text-white"
                aria-label={dictation.listening ? "Остановить запись" : "Сказать голосом"}
              >
                <OrbLayers active={dictation.listening} />
                {dictation.listening ? (
                  <Square className="relative h-7 w-7" fill="currentColor" />
                ) : (
                  <Mic className="relative h-9 w-9" />
                )}
              </button>
            ) : (
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-ai/12 text-ai-ink">
                <Sparkles className="h-8 w-8" />
              </span>
            )}
            <p className="mt-4 text-title3">
              {dictation.listening ? dictation.interim || "Говорите…" : "Спросите голосом или текстом"}
            </p>
            <p className="mt-1 max-w-md text-subhead text-ink-2">
              ИИ ответит по сигналам, поручениям, обещаниям и повестке и предложит, кому поручить.
            </p>
            {dictation.error && <p className="mt-2 text-subhead text-critical-ink">{dictation.error}</p>}
          </div>
        )}

        {empty && (
          <div className="flex flex-wrap justify-center gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => send(s)}
                className="press rounded-full bg-card px-3.5 py-2 text-[15px] shadow-card ring-1 ring-line/60"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {turns.map((t) => (
          <div key={t.id} className="space-y-3">
            <div className="flex justify-end">
              <p className="max-w-[85%] rounded-[18px] rounded-br-[6px] bg-tint px-4 py-2.5 text-[16px] text-white">
                {t.q}
              </p>
            </div>

            {!t.a && !t.error && (
              <div className="flex items-center gap-2 px-1 text-subhead text-ink-2" role="status">
                <Sparkles className="h-4 w-4 animate-pulse-soft text-ai" aria-hidden />
                Смотрю данные…
              </div>
            )}

            {t.error && (
              <div className="surface p-4">
                <p className="text-callout text-critical-ink">{t.error}</p>
                <Button variant="tinted" size="sm" className="mt-3" onClick={() => send(t.q)} disabled={ask.isPending}>
                  Спросить ещё раз
                </Button>
              </div>
            )}

            {t.a && (
              <div className="surface space-y-3 p-4">
                <div className="space-y-2 text-[16px] leading-[23px]">
                  {t.a.answer
                    .split(/\n+/)
                    .filter(Boolean)
                    .map((p, i) => (
                      <p key={i}>{p}</p>
                    ))}
                </div>

                {t.a.refs.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {t.a.refs.map((r) => {
                      const Icon = refIcon[r.type];
                      return (
                        <button
                          key={`${r.type}-${r.id}`}
                          type="button"
                          onClick={() => openRef(r)}
                          className="press inline-flex max-w-full items-center gap-1.5 rounded-full bg-fill px-3 py-1.5 text-left text-[14px]"
                        >
                          <Icon className="h-4 w-4 shrink-0 text-ink-2" aria-hidden />
                          <span className="truncate">{r.title}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {t.a.action && (
                  <div className="rounded-[12px] bg-tint/8 p-3 ring-1 ring-tint/15">
                    <p className="text-footnote font-semibold text-tint">ИИ предлагает поручить</p>
                    <p className="mt-1 text-callout font-semibold">{t.a.action.title}</p>
                    <p className="mt-0.5 text-subhead text-ink-2">
                      {t.a.action.executor.name} · срок {fmtDay(t.a.action.due, today)}
                    </p>
                    {t.assignedId ? (
                      <Button
                        variant="gray"
                        size="sm"
                        className="mt-3"
                        onClick={() => sheets.open("instruction", t.assignedId!)}
                      >
                        Поручено — открыть
                      </Button>
                    ) : (
                      <Button size="sm" className="mt-3" loading={create.pending} onClick={() => assign(t)}>
                        Поручить
                      </Button>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between gap-3 pt-1">
                  {speaker.supported ? (
                    <button
                      type="button"
                      className="press inline-flex items-center gap-1.5 text-[15px] font-semibold text-tint"
                      onClick={() => (speaker.speaking ? speaker.stop() : speaker.speak(t.a!.answer))}
                    >
                      {speaker.speaking ? <Pause className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                      {speaker.speaking ? "Остановить" : "Слушать"}
                    </button>
                  ) : (
                    <span />
                  )}
                  <span className="text-caption text-ink-3">
                    {t.a.mode === "ai" ? "Ответ ИИ" : "Ответ по данным, без ИИ"}
                  </span>
                </div>
              </div>
            )}
          </div>
        ))}
        <div ref={listRef} />
      </div>
    </Sheet>
  );
}
