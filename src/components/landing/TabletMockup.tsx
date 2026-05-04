import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, MapPin, Sparkles, BarChart3 } from 'lucide-react';

type Slide = 'dashboard' | 'map' | 'copilot' | 'chart';
const SLIDES: Slide[] = ['dashboard', 'map', 'copilot', 'chart'];

function SlideDashboard() {
  return (
    <div className="h-full w-full p-5 flex flex-col gap-4 bg-[#0A0E1A] text-[#E5E7EB]">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-[#94A3B8]">city risk index</p>
          <p className="text-5xl font-light tracking-tight mt-1">87<span className="text-xl text-[#94A3B8]">/100</span></p>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#EF4444]/15 border border-[#EF4444]/30">
          <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444] animate-pulse-red" />
          <span className="text-[10px] font-semibold text-[#EF4444]">RED ZONE</span>
        </div>
      </div>
      <div className="rounded-lg border border-[#EF4444]/30 bg-[#EF4444]/10 p-3 flex items-start gap-2.5">
        <AlertTriangle className="w-4 h-4 text-[#EF4444] mt-0.5 flex-shrink-0 animate-pulse-red" />
        <div>
          <p className="text-xs font-semibold">Авария ЖКХ · ул. Победы 14</p>
          <p className="text-[10px] text-[#94A3B8] mt-0.5">SLA 38 мин · зам по ЖКХ</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[
          { l: 'инциденты', v: '24', c: '#3B82F6' },
          { l: 'просрочено', v: '8', c: '#F59E0B' },
          { l: 'в норме', v: '92%', c: '#10B981' },
        ].map((m) => (
          <div key={m.l} className="rounded-md bg-white/[0.03] border border-white/[0.06] p-2.5">
            <p className="text-[9px] uppercase tracking-wider text-[#94A3B8]">{m.l}</p>
            <p className="text-lg font-semibold mt-0.5" style={{ color: m.c }}>{m.v}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function SlideMap() {
  const dots = [
    { x: 25, y: 30, c: '#EF4444' },
    { x: 60, y: 20, c: '#F59E0B' },
    { x: 70, y: 55, c: '#3B82F6' },
    { x: 35, y: 70, c: '#10B981' },
    { x: 50, y: 45, c: '#3B82F6' },
    { x: 80, y: 80, c: '#F59E0B' },
  ];
  return (
    <div className="h-full w-full bg-[#0A0E1A] relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            'linear-gradient(rgba(59,130,246,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.08) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />
      {dots.map((d, i) => (
        <div key={i} className="absolute" style={{ left: `${d.x}%`, top: `${d.y}%` }}>
          <span className="absolute -inset-2 rounded-full animate-ping" style={{ background: `${d.c}40` }} />
          <span className="relative block w-2 h-2 rounded-full" style={{ background: d.c }} />
        </div>
      ))}
      <div className="absolute bottom-3 left-3 flex items-center gap-2 text-[10px] text-[#94A3B8]">
        <MapPin className="w-3 h-3" /> Реутов · 6 активных меток
      </div>
    </div>
  );
}

function SlideCopilot() {
  const full = 'Авария ЖКХ ул. Победы — критический риск. SLA через 38 минут. Рекомендую эскалацию.';
  const [t, setT] = useState('');
  useEffect(() => {
    let i = 0;
    setT('');
    const id = setInterval(() => {
      i++;
      setT(full.slice(0, i));
      if (i >= full.length) clearInterval(id);
    }, 25);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="h-full w-full bg-[#0A0E1A] p-5 flex flex-col gap-3 text-[#E5E7EB]">
      <div className="flex items-center gap-2">
        <Sparkles className="w-3.5 h-3.5 text-[#06B6D4]" />
        <span className="text-[11px] font-semibold tracking-wide">AI-копилот</span>
      </div>
      <div className="self-end max-w-[80%] rounded-2xl rounded-tr-sm bg-[#3B82F6] px-3 py-2 text-xs">
        Что критично сейчас?
      </div>
      <div className="self-start max-w-[90%] rounded-2xl rounded-tl-sm bg-white/[0.05] border border-white/[0.08] px-3 py-2.5 text-xs leading-relaxed">
        {t}
        <span className="inline-block w-1.5 h-3 ml-0.5 bg-[#06B6D4] align-middle animate-pulse" />
      </div>
      <div className="mt-auto flex gap-2">
        <button className="text-[10px] px-2.5 py-1.5 rounded-md bg-[#EF4444]/15 border border-[#EF4444]/30 text-[#EF4444]">✓ Эскалировать</button>
        <button className="text-[10px] px-2.5 py-1.5 rounded-md bg-white/5 border border-white/10 text-[#94A3B8]">Подробнее</button>
      </div>
    </div>
  );
}

function SlideChart() {
  const bars = [22, 35, 28, 48, 62, 55, 78, 71, 90, 82, 96, 88];
  return (
    <div className="h-full w-full bg-[#0A0E1A] p-5 flex flex-col gap-3 text-[#E5E7EB]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-3.5 h-3.5 text-[#3B82F6]" />
          <span className="text-[11px] font-semibold">Активность · 24ч</span>
        </div>
        <span className="text-[10px] text-[#94A3B8]">+18%</span>
      </div>
      <div className="flex-1 flex items-end gap-1.5">
        {bars.map((h, i) => (
          <motion.div
            key={i}
            initial={{ height: 0 }}
            animate={{ height: `${h}%` }}
            transition={{ delay: i * 0.05, duration: 0.6, ease: [0.65, 0, 0.35, 1] }}
            className="flex-1 rounded-t bg-gradient-to-t from-[#3B82F6] to-[#06B6D4]"
          />
        ))}
      </div>
    </div>
  );
}

const SLIDE_MAP: Record<Slide, () => JSX.Element> = {
  dashboard: SlideDashboard,
  map: SlideMap,
  copilot: SlideCopilot,
  chart: SlideChart,
};

export default function TabletMockup() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ rx: 6, ry: -12 });
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIdx((i) => (i + 1) % SLIDES.length), 4000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let raf = 0;
    let pending: { x: number; y: number } | null = null;
    const handler = (e: MouseEvent) => {
      pending = { x: e.clientX, y: e.clientY };
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const el = wrapRef.current;
        if (!el || !pending) return;
        const r = el.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const dx = (pending.x - cx) / r.width;
        const dy = (pending.y - cy) / r.height;
        setTilt({ ry: -12 + dx * 8, rx: 6 - dy * 6 });
      });
    };
    window.addEventListener('mousemove', handler, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handler);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const Current = SLIDE_MAP[SLIDES[idx]];

  return (
    <div ref={wrapRef} className="relative w-full max-w-[640px] mx-auto" style={{ perspective: '1600px' }}>
      {/* glow */}
      <div
        className="absolute -inset-12 rounded-full blur-[80px] opacity-60"
        style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.35), transparent 60%)' }}
      />
      <motion.div
        animate={{ rotateX: tilt.rx, rotateY: tilt.ry }}
        transition={{ type: 'spring', stiffness: 60, damping: 18 }}
        style={{ transformStyle: 'preserve-3d' }}
        className="relative aspect-[4/3] rounded-[28px] p-[10px] bg-gradient-to-br from-white/[0.12] via-white/[0.04] to-white/[0.10] border border-white/10 shadow-[0_80px_120px_-40px_rgba(59,130,246,0.25),0_40px_80px_-20px_rgba(0,0,0,0.5)]"
      >
        <div className="relative h-full w-full rounded-[20px] overflow-hidden bg-[#0A0E1A] border border-white/10">
          <AnimatePresence mode="wait">
            <motion.div
              key={SLIDES[idx]}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.65, 0, 0.35, 1] }}
              className="absolute inset-0"
            >
              <Current />
            </motion.div>
          </AnimatePresence>
          {/* screen highlight */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 30%, transparent 100%)',
            }}
          />
        </div>
      </motion.div>
      {/* floating ground glow */}
      <div
        aria-hidden
        className="absolute left-1/2 -translate-x-1/2 pointer-events-none"
        style={{
          bottom: '-30px',
          width: '80%',
          height: '60px',
          background: 'radial-gradient(ellipse, rgba(59,130,246,0.3) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />
      <div className="mt-6 flex justify-center gap-1.5">
        {SLIDES.map((s, i) => (
          <span
            key={s}
            className="h-1 rounded-full transition-all duration-500"
            style={{
              width: i === idx ? 28 : 8,
              background: i === idx ? '#3B82F6' : 'rgba(148,163,184,0.3)',
            }}
          />
        ))}
      </div>
    </div>
  );
}