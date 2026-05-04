import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { AlertTriangle, Sparkles, MapPin, Activity } from 'lucide-react';

export default function ParallaxStack() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const yBack = useTransform(scrollYProgress, [0, 1], [60, -60]);
  const yMid = useTransform(scrollYProgress, [0, 1], [30, -30]);
  const yFront = useTransform(scrollYProgress, [0, 1], [-40, 80]);

  return (
    <div ref={ref} className="relative aspect-[5/4] w-full">
      <motion.div
        style={{ y: yBack, willChange: 'transform' }}
        className="absolute inset-6 rounded-2xl bg-[#0A0E1A] border border-white/[0.06] overflow-hidden"
      >
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              'linear-gradient(rgba(59,130,246,0.10) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.10) 1px, transparent 1px)',
            backgroundSize: '36px 36px',
          }}
        />
        {[
          { x: 22, y: 28, c: '#EF4444' },
          { x: 60, y: 18, c: '#F59E0B' },
          { x: 72, y: 58, c: '#3B82F6' },
          { x: 30, y: 70, c: '#10B981' },
          { x: 50, y: 45, c: '#3B82F6' },
        ].map((d, i) => (
          <div key={i} className="absolute" style={{ left: `${d.x}%`, top: `${d.y}%` }}>
            <span className="absolute -inset-1.5 rounded-full opacity-40" style={{ background: `${d.c}30` }} />
            <span className="relative block w-2 h-2 rounded-full" style={{ background: d.c }} />
          </div>
        ))}
        <div className="absolute bottom-3 left-3 flex items-center gap-2 text-[10px] text-[#94A3B8] font-mono">
          <MapPin className="w-3 h-3" /> CITY MAP
        </div>
      </motion.div>

      <motion.div
        style={{ y: yMid, rotate: -2, willChange: 'transform' }}
        className="absolute left-0 right-12 top-12 rounded-2xl bg-gradient-to-br from-[#0F1524] to-[#0A0E1A] border border-white/10 p-5 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.6)]"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-[#94A3B8] font-mono">city risk</p>
            <p className="text-4xl font-light tracking-tight text-[#E5E7EB] mt-1">87</p>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#EF4444]/15 border border-[#EF4444]/30">
            <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444] animate-pulse" />
            <span className="text-[10px] font-semibold text-[#EF4444]">RED</span>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[['24', 'инц.'], ['8', 'просроч.'], ['92%', 'норма']].map(([v, l]) => (
            <div key={l} className="rounded-md bg-white/[0.03] border border-white/[0.06] p-2">
              <p className="text-[9px] uppercase tracking-wider text-[#94A3B8]">{l}</p>
              <p className="text-sm font-semibold text-[#E5E7EB] mt-0.5">{v}</p>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div
        style={{ y: yFront, rotate: 4, willChange: 'transform' }}
        className="absolute right-0 top-2 w-[230px] rounded-xl bg-[#0F1524] border border-[#EF4444]/30 p-4 shadow-[0_15px_30px_-10px_rgba(239,68,68,0.25)]"
      >
        <div className="flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-[#EF4444] mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-[#E5E7EB]">Авария ЖКХ</p>
            <p className="text-[10px] text-[#94A3B8] mt-0.5 font-mono">SLA 38 мин</p>
          </div>
        </div>
      </motion.div>

      <motion.div
        style={{ y: yFront, rotate: -3, willChange: 'transform' }}
        className="absolute right-16 bottom-12 w-[210px] rounded-xl bg-[#0F1524] border border-[#06B6D4]/30 p-4 shadow-[0_15px_30px_-10px_rgba(6,182,212,0.25)]"
      >
        <div className="flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-[#06B6D4] mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-[#E5E7EB]">AI: брифинг готов</p>
            <p className="text-[10px] text-[#94A3B8] mt-0.5 font-mono">5 департаментов</p>
          </div>
        </div>
      </motion.div>

      <motion.div
        style={{ y: yFront, rotate: 2, willChange: 'transform' }}
        className="absolute left-4 bottom-0 w-[180px] rounded-xl bg-[#0F1524] border border-[#F59E0B]/30 p-4 shadow-[0_15px_30px_-10px_rgba(245,158,11,0.2)]"
      >
        <div className="flex items-start gap-2.5">
          <Activity className="w-4 h-4 text-[#F59E0B] mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-[#E5E7EB]">3 критичных</p>
            <p className="text-[10px] text-[#94A3B8] mt-0.5 font-mono">требуют внимания</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
