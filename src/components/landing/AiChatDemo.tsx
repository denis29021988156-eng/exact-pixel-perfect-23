import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';

const SCRIPT: { who: 'you' | 'ai'; text: string; pause?: number }[] = [
  { who: 'you', text: 'Что критично сейчас?' },
  {
    who: 'ai',
    text:
      '3 критичных инцидента. Главный риск — авария ЖКХ на ул. Победы, SLA через 40 минут. Рекомендую немедленную эскалацию заму по ЖКХ.',
    pause: 900,
  },
  { who: 'you', text: 'Подготовь сводку для совещания', pause: 1200 },
  { who: 'ai', text: 'Готовлю брифинг по 5 департаментам...', pause: 700 },
];

type Msg = { who: 'you' | 'ai'; text: string; partial?: boolean };

export default function AiChatDemo() {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [thinking, setThinking] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
    async function play() {
      while (!cancelled) {
        setMsgs([]);
        for (const step of SCRIPT) {
          if (cancelled) return;
          if (step.pause) await sleep(step.pause);
          if (step.who === 'you') {
            setMsgs((m) => [...m, { who: 'you', text: step.text }]);
            continue;
          }
          setThinking(true);
          await sleep(800);
          setThinking(false);
          setMsgs((m) => [...m, { who: 'ai', text: '', partial: true }]);
          for (let i = 1; i <= step.text.length; i++) {
            if (cancelled) return;
            setMsgs((m) => {
              const c = [...m];
              c[c.length - 1] = { who: 'ai', text: step.text.slice(0, i), partial: i < step.text.length };
              return c;
            });
            await sleep(18);
          }
        }
        await sleep(4000);
      }
    }
    play();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="relative rounded-3xl bg-gradient-to-br from-[#0F1524] to-[#0A0E1A] border border-white/[0.08] p-6 lg:p-8 shadow-[0_40px_80px_-30px_rgba(59,130,246,0.4)]">
      <div className="flex items-center gap-2 pb-5 border-b border-white/[0.06]">
        <Sparkles className="w-4 h-4 text-[#06B6D4]" />
        <span className="text-xs font-semibold tracking-wide text-[#E5E7EB]">AI-копилот</span>
        <span className="ml-auto text-[10px] font-mono text-[#94A3B8]">live</span>
      </div>
      <div className="min-h-[340px] flex flex-col gap-3 pt-5">
        {msgs.map((m, i) =>
          m.who === 'you' ? (
            <div key={i} className="self-end max-w-[82%] rounded-2xl rounded-tr-sm bg-[#3B82F6] px-4 py-2.5 text-sm text-white">
              {m.text}
            </div>
          ) : (
            <div key={i} className="self-start max-w-[92%] rounded-2xl rounded-tl-sm bg-white/[0.04] border border-white/[0.08] px-4 py-3 text-sm text-[#E5E7EB] leading-relaxed">
              {m.text}
              {m.partial && <span className="inline-block w-1.5 h-3.5 ml-0.5 bg-[#06B6D4] align-middle animate-pulse" />}
              {!m.partial && i === 1 && (
                <div className="mt-3 flex gap-2">
                  <button className="text-[11px] px-3 py-1.5 rounded-md bg-[#EF4444]/15 border border-[#EF4444]/30 text-[#EF4444] font-medium">✓ Эскалировать</button>
                  <button className="text-[11px] px-3 py-1.5 rounded-md bg-white/5 border border-white/10 text-[#94A3B8]">Подробнее</button>
                </div>
              )}
            </div>
          )
        )}
        {thinking && (
          <div className="self-start flex items-center gap-1.5 px-4 py-2.5">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-[#06B6D4]"
                style={{ animation: `pulse 1.2s ${i * 0.15}s ease-in-out infinite` }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
