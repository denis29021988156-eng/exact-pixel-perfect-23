import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import GradientMeshBg from '@/components/landing/GradientMeshBg';
import TabletMockup from '@/components/landing/TabletMockup';
import CountUp from '@/components/landing/CountUp';

const META_LINE = 'Управление городом · v1.0 · Реутов · 2026';

const HERO_LINES = ['Один экран.', 'Весь город.', 'Восемь недель.'];

const METRICS = [
  { value: 8,  label: 'недель\nдо запуска' },
  { value: 5,  label: 'дней\nобучения команды' },
  { value: 9,  label: 'модулей\nв одной системе' },
  { value: 0,  label: 'совещаний\nдля контроля статусов' },
];

const PAINS = [
  { text: '«О ЧП я узнаю последним — из новостей.»',                w: 'md:w-[380px]', off: 'md:ml-0' },
  { text: '«У каждого зама свой Excel. Общей картины нет.»',         w: 'md:w-[420px]', off: 'md:ml-24' },
  { text: '«Дал поручение — забыли. Узнаю через неделю.»',           w: 'md:w-[340px]', off: 'md:ml-12' },
  { text: '«О срыве контракта узнаём в день дедлайна.»',             w: 'md:w-[400px]', off: 'md:ml-40' },
  { text: '«Жалобы граждан расползаются по чатам.»',                 w: 'md:w-[360px]', off: 'md:ml-8' },
];

const EASE = [0.65, 0, 0.35, 1] as const;

export default function LandingPage() {
  const navigate = useNavigate();
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  useEffect(() => {
    document.title = 'Планшет Мэра — один экран, весь город, восемь недель';
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-[#E5E7EB] font-sans antialiased overflow-x-hidden selection:bg-[#3B82F6]/30">
      {/* ─── Section 1 — Hero ─── */}
      <section ref={heroRef} className="relative min-h-screen w-full overflow-hidden">
        <GradientMeshBg />
        {/* dot grid overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.08]"
          style={{
            backgroundImage: 'radial-gradient(circle, #E5E7EB 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />
        {/* noise */}
        <div
          className="absolute inset-0 pointer-events-none mix-blend-overlay opacity-[0.15]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2'/></filter><rect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/></svg>\")",
          }}
        />

        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="relative z-10 max-w-[1400px] mx-auto px-6 lg:px-12 pt-24 pb-32 min-h-screen grid lg:grid-cols-[1.1fr_1fr] gap-12 items-center"
        >
          <div>
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EASE }}
              className="text-[11px] tracking-[0.2em] uppercase text-[#94A3B8] font-mono mb-10"
            >
              {META_LINE}
            </motion.p>

            <h1
              className="font-medium leading-[0.95] tracking-[-0.04em]"
              style={{ fontSize: 'clamp(56px, 8vw, 120px)' }}
            >
              {HERO_LINES.map((line, i) => (
                <span key={i} className="block overflow-hidden">
                  <motion.span
                    initial={{ y: '110%', opacity: 0 }}
                    animate={{ y: '0%', opacity: 1 }}
                    transition={{ duration: 0.9, delay: 0.15 + i * 0.08, ease: EASE }}
                    className={`block ${
                      i === 0
                        ? 'bg-gradient-to-r from-[#3B82F6] via-[#06B6D4] to-[#3B82F6] bg-clip-text text-transparent'
                        : 'text-[#E5E7EB]'
                    }`}
                  >
                    {line}
                  </motion.span>
                </span>
              ))}
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.7, ease: EASE }}
              className="mt-10 max-w-xl text-base lg:text-lg text-[#94A3B8] leading-relaxed"
            >
              Платформа, где сходятся все сигналы города — от аварии ЖКХ до риска срыва контракта.
              Без совещаний. Без Excel. Без отчётов в почте.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.9, ease: EASE }}
              className="mt-12 flex items-center gap-8 flex-wrap"
            >
              <button
                onClick={() => navigate('/auth')}
                className="group relative inline-flex items-center gap-3 px-7 py-4 rounded-full text-sm font-semibold text-white bg-gradient-to-r from-[#3B82F6] to-[#06B6D4] shadow-[0_10px_40px_-10px_rgba(59,130,246,0.6)] hover:shadow-[0_20px_60px_-10px_rgba(6,182,212,0.7)] transition-shadow duration-500"
              >
                Открыть живое демо
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
              </button>
              <a
                href="#plan"
                className="text-sm text-[#E5E7EB]/80 hover:text-white transition-colors inline-flex items-center gap-2 group"
              >
                Посмотреть план внедрения
                <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
              </a>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, delay: 0.4, ease: EASE }}
            className="hidden lg:block"
          >
            <TabletMockup />
          </motion.div>
        </motion.div>

        {/* scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-3">
          <div className="relative h-12 w-px bg-white/15 overflow-hidden">
            <motion.span
              animate={{ y: [-12, 48] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute left-1/2 -translate-x-1/2 w-1 h-3 rounded-full bg-[#3B82F6]"
            />
          </div>
          <span className="text-[10px] tracking-[0.25em] uppercase text-[#94A3B8] font-mono">прокрутите</span>
        </div>
      </section>

      {/* ─── Section 2 — Metrics ─── */}
      <section className="relative py-32 lg:py-44 px-6 lg:px-12 border-t border-white/[0.06]">
        <div className="max-w-[1400px] mx-auto">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-[11px] tracking-[0.25em] uppercase text-[#94A3B8] font-mono mb-16"
          >
            01 — цифры
          </motion.p>
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-white/[0.06]">
            {METRICS.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.7, delay: i * 0.1, ease: EASE }}
                className="px-6 lg:px-10 first:pl-0 last:pr-0"
              >
                <div
                  className="font-light tracking-[-0.04em] leading-none text-[#E5E7EB]"
                  style={{ fontSize: 'clamp(72px, 9vw, 160px)' }}
                >
                  <CountUp to={m.value} />
                </div>
                <p className="mt-6 text-[11px] tracking-[0.18em] uppercase text-[#94A3B8] font-mono whitespace-pre-line leading-relaxed">
                  {m.label}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Section 3 — Pain points ─── */}
      <section className="relative py-32 lg:py-44 px-6 lg:px-12 border-t border-white/[0.06]">
        <div className="max-w-[1400px] mx-auto">
          <div className="grid lg:grid-cols-[1.1fr_1fr] gap-10 lg:gap-20 items-end mb-20">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: EASE }}
              className="font-medium tracking-[-0.04em] leading-[0.95] text-[#E5E7EB]"
              style={{ fontSize: 'clamp(56px, 7vw, 110px)' }}
            >
              Знакомо?
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.15, ease: EASE }}
              className="text-base lg:text-lg text-[#94A3B8] leading-relaxed max-w-md lg:justify-self-end"
            >
              Если хотя бы три из этих фраз — про вас, дальше есть смысл читать.
            </motion.p>
          </div>

          <div className="space-y-5">
            {PAINS.map((p, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.7, delay: i * 0.08, ease: EASE }}
                className={`${p.off} ${p.w} max-w-full`}
              >
                <div className="group relative px-7 py-6 rounded-2xl bg-[#0F1524]/60 backdrop-blur-md border border-white/[0.06] hover:border-[#3B82F6]/40 hover:-translate-y-2 hover:shadow-[0_20px_50px_-20px_rgba(59,130,246,0.4)] transition-all duration-300 cursor-default">
                  <p className="text-base lg:text-lg text-[#E5E7EB] font-light leading-snug tracking-[-0.01em]">
                    {p.text}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.2 }}
            className="mt-32 text-center italic font-light text-[#94A3B8] tracking-[-0.02em]"
            style={{ fontSize: 'clamp(28px, 3.5vw, 48px)' }}
          >
            Это не управление. Это разбор завалов.
          </motion.p>
        </div>
      </section>

      {/* placeholder for sections 4–10 */}
      <section className="py-24 px-6 border-t border-white/[0.06]">
        <div className="max-w-[1400px] mx-auto text-center">
          <p className="text-[11px] tracking-[0.25em] uppercase text-[#94A3B8] font-mono mb-6">далее по тз</p>
          <p className="text-2xl lg:text-3xl font-light text-[#E5E7EB]/60 tracking-[-0.02em]">
            Секции 4–10 — решение, дисциплина, день мэра, AI, модули, план, финал — реализую следом.
          </p>
          <button
            onClick={() => navigate('/auth')}
            className="mt-12 inline-flex items-center gap-3 px-7 py-4 rounded-full text-sm font-semibold text-white bg-gradient-to-r from-[#3B82F6] to-[#06B6D4] shadow-[0_10px_40px_-10px_rgba(59,130,246,0.6)] hover:shadow-[0_20px_60px_-10px_rgba(6,182,212,0.7)] transition-shadow"
          >
            Открыть платформу
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      <footer className="border-t border-white/[0.06] py-10 px-6">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between text-[11px] font-mono tracking-[0.15em] uppercase text-[#94A3B8]">
          <span>Планшет Мэра</span>
          <span>tablet.su · 2026</span>
        </div>
      </footer>
    </div>
  );
}
