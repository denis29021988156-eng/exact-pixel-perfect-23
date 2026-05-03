import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
  ArrowRight,
  AlertTriangle,
  Map,
  ClipboardCheck,
  FolderKanban,
  Newspaper,
  Database,
  BrainCircuit,
  ShieldAlert,
  CloudRain,
} from 'lucide-react';
import GradientMeshBg from '@/components/landing/GradientMeshBg';
import TabletMockup from '@/components/landing/TabletMockup';
import CountUp from '@/components/landing/CountUp';
import ParallaxStack from '@/components/landing/ParallaxStack';
import AiChatDemo from '@/components/landing/AiChatDemo';
import ModuleCard from '@/components/landing/ModuleCard';

const META_LINE = 'Управление городом · v1.0 · Реутов · 2026';
const HERO_LINES = ['Один экран.', 'Весь город.', 'Восемь недель.'];
const EASE = [0.65, 0, 0.35, 1] as const;

const METRICS = [
  { value: 8, label: 'недель\nдо запуска' },
  { value: 5, label: 'дней\nобучения команды' },
  { value: 9, label: 'модулей\nв одной системе' },
  { value: 0, label: 'совещаний\nдля контроля статусов' },
];

const PAINS = [
  { text: '«О ЧП я узнаю последним — из новостей.»', w: 'md:w-[380px]', off: 'md:ml-0' },
  { text: '«У каждого зама свой Excel. Общей картины нет.»', w: 'md:w-[420px]', off: 'md:ml-24' },
  { text: '«Дал поручение — забыли. Узнаю через неделю.»', w: 'md:w-[340px]', off: 'md:ml-12' },
  { text: '«О срыве контракта узнаём в день дедлайна.»', w: 'md:w-[400px]', off: 'md:ml-40' },
  { text: '«Жалобы граждан расползаются по чатам.»', w: 'md:w-[360px]', off: 'md:ml-8' },
];

const COMPARE = [
  { before: 'Зам обещал «к пятнице» — забыл.', after: 'Срок в системе. За день — напоминание. После — автоэскалация мэру.' },
  { before: '«У меня всё в порядке» на планёрке.', after: 'На экране мэра: 8 задач просрочено, 3 в красной зоне.' },
  { before: 'Отчёт раз в месяц на 20 страниц.', after: 'Отчёт обновляется сам, в реальном времени.' },
  { before: 'Нельзя проверить, кто что делал.', after: 'Каждое действие записано. Видно кто и когда.' },
  { before: 'Поручение через мессенджер — потерялось.', after: 'Поручение в системе. У исполнителя в списке. Со сроком.' },
];

const DAY = [
  { time: '08:00', title: 'Утро. Открываете планшет.', text: 'Видите индекс города 87, три критичных инцидента, пять задач в зоне риска по срокам.' },
  { time: '08:15', title: 'Авария ЖКХ на ул. Победы.', text: 'Открываете карточку: ответственный — зам по ЖКХ, срок 4 часа, бригада выехала в 07:40.' },
  { time: '11:00', title: 'Вопрос помощнику.', text: '«Что у нас по жалобам в Юбилейном за неделю?» — ответ за 5 секунд, со ссылками.' },
  { time: '16:00', title: 'Контроль.', text: 'Задача, которую дали утром, в работе. SLA — 38 минут до истечения. Если не успеют — автоматическая эскалация.' },
];

const MODULES = [
  { icon: AlertTriangle, title: 'Инциденты', desc: 'Все ЧП города в одной ленте. SLA, ответственные, эскалации.' },
  { icon: BrainCircuit, title: 'AI-копилот', desc: 'Сводки, ответы, брифинги. Без галлюцинаций, без действий за вас.' },
  { icon: Map, title: 'Карта города', desc: 'Все события на одной карте. Слои инцидентов, проектов, жалоб.' },
  { icon: FolderKanban, title: 'Программа', desc: 'Проекты и контракты. Прогресс, бюджет, риск срыва.' },
  { icon: ClipboardCheck, title: 'Поручения', desc: 'Каждое со сроком и ответственным. Без срока — нельзя.' },
  { icon: Newspaper, title: 'Репутация', desc: 'СМИ, соцсети, жалобы. Тональность по темам и районам.' },
  { icon: Database, title: 'Качество данных', desc: 'Откуда что пришло, насколько надёжно, что требует проверки.' },
  { icon: ShieldAlert, title: 'Эскалации', desc: 'Просроченные SLA, политически чувствительные кейсы — наверх.' },
  { icon: CloudRain, title: 'Погода и риски', desc: 'Прогноз 72ч с автоматическими алертами для коммунальных служб.' },
];

const PLAN = [
  {
    weeks: 'Неделя 1—2',
    label: 'Основа',
    bg: 'linear-gradient(135deg, #0F1A2E 0%, #1A2340 100%)',
    items: ['Развёртывание платформы', 'Подключение пользователей и ролей', 'Базовые модули: инциденты, поручения'],
  },
  {
    weeks: 'Неделя 3—6',
    label: 'Интеграции и AI',
    bg: 'linear-gradient(135deg, #1E3A8A 0%, #1E40AF 100%)',
    items: ['Excel-выгрузки и Telegram-каналы', 'AI-копилот и автоматические сводки', 'Карта, программа, репутация'],
  },
  {
    weeks: 'Неделя 7—8',
    label: 'Обучение',
    bg: 'linear-gradient(135deg, #0891B2 0%, #06B6D4 100%)',
    items: ['Тренинг операторов', 'Передача мэру и замам', 'Сопровождение первой недели работы'],
  },
];

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
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.08]"
          style={{
            backgroundImage: 'radial-gradient(circle, #E5E7EB 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />
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

            <h1 className="font-medium leading-[0.95] tracking-[-0.04em]" style={{ fontSize: 'clamp(56px, 8vw, 120px)' }}>
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
              <a href="#plan" className="text-sm text-[#E5E7EB]/80 hover:text-white transition-colors inline-flex items-center gap-2 group">
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
                <div className="font-light tracking-[-0.04em] leading-none text-[#E5E7EB]" style={{ fontSize: 'clamp(72px, 9vw, 160px)' }}>
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

      {/* ─── Section 3 — Pains ─── */}
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
                  <p className="text-base lg:text-lg text-[#E5E7EB] font-light leading-snug tracking-[-0.01em]">{p.text}</p>
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

      {/* ─── Section 4 — Solution ─── */}
      <section className="relative py-32 lg:py-44 px-6 lg:px-12 border-t border-white/[0.06] overflow-hidden">
        <div className="max-w-[1400px] mx-auto grid lg:grid-cols-[0.9fr_1.1fr] gap-16 lg:gap-24 items-center">
          <div>
            <p className="text-[11px] tracking-[0.25em] uppercase text-[#94A3B8] font-mono mb-10">02 — решение</p>
            <h2 className="font-medium tracking-[-0.04em] leading-[0.95] text-[#E5E7EB]" style={{ fontSize: 'clamp(44px, 5.5vw, 80px)' }}>
              Один источник правды о городе
            </h2>
            <div className="mt-12 space-y-6 text-base lg:text-lg text-[#94A3B8] leading-relaxed max-w-lg">
              <p>Все департаменты работают в одной системе. Не в десяти Excel.</p>
              <p>У каждого поручения — срок и ответственный. Без срока — нельзя создать.</p>
              <p>Опоздание видно сразу. Не на следующей планёрке.</p>
            </div>
          </div>
          <ParallaxStack />
        </div>
      </section>

      {/* ─── Section 5 — Discipline ─── */}
      <section className="relative py-32 lg:py-44 px-6 lg:px-12 border-t border-white/[0.06]">
        <div className="max-w-[1400px] mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: EASE }}
            className="font-medium tracking-[-0.04em] leading-[0.95] text-[#E5E7EB] max-w-4xl"
            style={{ fontSize: 'clamp(44px, 5.5vw, 80px)' }}
          >
            Дисциплина становится автоматической
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.15, ease: EASE }}
            className="mt-8 text-lg text-[#94A3B8] max-w-2xl"
          >
            Не потому что вы давите. Потому что система не позволяет иначе.
          </motion.p>

          <div className="mt-20 space-y-3">
            {COMPARE.map((row, i) => (
              <div key={i} className="grid md:grid-cols-2 gap-3">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.4 }}
                  transition={{ duration: 0.6, ease: EASE }}
                  className="relative px-7 py-6 rounded-2xl bg-gradient-to-br from-[#1A0F0F]/80 to-[#0F1524]/40 border border-[#EF4444]/15"
                >
                  <span className="absolute top-5 right-5 w-6 h-6 rounded-full border border-[#EF4444]/40 flex items-center justify-center text-[#EF4444] text-sm">×</span>
                  <p className="text-[10px] uppercase tracking-[0.2em] font-mono text-[#94A3B8]/80 mb-3">было</p>
                  <p className="text-base text-[#94A3B8] font-light leading-snug pr-10">{row.before}</p>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.4 }}
                  transition={{ duration: 0.6, delay: 0.2, ease: EASE }}
                  className="relative px-7 py-6 rounded-2xl bg-gradient-to-br from-[#0F1A2E]/80 to-[#0F1524]/60 border border-[#3B82F6]/25"
                >
                  <span className="absolute top-5 right-5 w-6 h-6 rounded-full bg-[#10B981]/15 border border-[#10B981]/40 flex items-center justify-center text-[#10B981] text-xs">✓</span>
                  <p className="text-[10px] uppercase tracking-[0.2em] font-mono text-[#06B6D4] mb-3">стало</p>
                  <p className="text-base text-[#E5E7EB] font-light leading-snug pr-10">{row.after}</p>
                </motion.div>
              </div>
            ))}
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
            className="mt-24 text-center font-medium text-[#E5E7EB] tracking-[-0.03em] leading-tight max-w-4xl mx-auto"
            style={{ fontSize: 'clamp(28px, 3.5vw, 52px)' }}
          >
            Подчинённый знает: мэр видит всё.<br />
            <span className="text-[#94A3B8]">Это работает лучше любого совещания.</span>
          </motion.p>
        </div>
      </section>

      {/* ─── Section 6 — Day ─── */}
      <section className="relative py-32 lg:py-44 px-6 lg:px-12 border-t border-white/[0.06]">
        <div className="max-w-[1400px] mx-auto">
          <p className="text-[11px] tracking-[0.25em] uppercase text-[#94A3B8] font-mono mb-10">03 — день мэра</p>
          <h2 className="font-medium tracking-[-0.04em] leading-[0.95] text-[#E5E7EB] max-w-3xl" style={{ fontSize: 'clamp(44px, 5.5vw, 80px)' }}>
            Один день. Без совещаний.
          </h2>

          <div className="mt-20 relative">
            <div className="absolute left-[7px] top-2 bottom-2 w-px bg-gradient-to-b from-[#3B82F6]/40 via-[#3B82F6]/15 to-transparent hidden md:block" />
            <div className="space-y-16">
              {DAY.map((d, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.7, ease: EASE }}
                  className="relative pl-0 md:pl-12"
                >
                  <span className="hidden md:block absolute left-0 top-3 w-4 h-4 rounded-full bg-[#3B82F6] shadow-[0_0_0_6px_rgba(59,130,246,0.15)]" />
                  <div className="grid md:grid-cols-[160px_1fr] gap-6 lg:gap-12 items-start">
                    <div className="font-mono text-3xl lg:text-4xl font-light tracking-tight text-[#06B6D4]">{d.time}</div>
                    <div>
                      <p className="text-xl lg:text-2xl font-light text-[#E5E7EB] tracking-[-0.02em] leading-snug">{d.title}</p>
                      <p className="mt-3 text-base text-[#94A3B8] leading-relaxed max-w-2xl">{d.text}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="mt-28 grid md:grid-cols-3 gap-6 text-center">
            {[
              ['0', 'совещаний для проверки статусов'],
              ['0', 'звонков «как дела с тем поручением»'],
              ['0', 'ручных сводок'],
            ].map(([n, l]) => (
              <div key={l}>
                <div className="font-light tracking-[-0.05em] leading-none text-[#3B82F6]" style={{ fontSize: 'clamp(80px, 10vw, 160px)' }}>{n}</div>
                <p className="mt-4 text-xs uppercase tracking-[0.18em] font-mono text-[#94A3B8]">{l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Section 7 — AI ─── */}
      <section className="relative py-32 lg:py-44 px-6 lg:px-12 border-t border-white/[0.06]">
        <div className="max-w-[1400px] mx-auto grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          <div>
            <p className="text-[11px] tracking-[0.25em] uppercase text-[#94A3B8] font-mono mb-10">04 — ai-помощник</p>
            <h2 className="font-medium tracking-[-0.04em] leading-[0.95] text-[#E5E7EB]" style={{ fontSize: 'clamp(40px, 5vw, 72px)' }}>
              AI-помощник, который видит весь город
            </h2>
            <p className="mt-8 text-lg text-[#94A3B8] max-w-lg">Не чат-бот из 2023. Полноценный аналитик внутри планшета.</p>
            <ul className="mt-12 space-y-4">
              {[
                'Не меняет данные сам',
                'Не принимает решения за вас',
                'Не видит персональные данные граждан',
                'Не действует без вашего подтверждения',
              ].map((t) => (
                <li key={t} className="flex items-start gap-4 text-base text-[#E5E7EB]/80">
                  <span className="mt-2 w-4 h-px bg-[#EF4444]/60 flex-shrink-0" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <AiChatDemo />
        </div>
      </section>

      {/* ─── Section 8 — Modules ─── */}
      <section className="relative py-32 lg:py-44 px-6 lg:px-12 border-t border-white/[0.06]">
        <div className="max-w-[1400px] mx-auto">
          <p className="text-[11px] tracking-[0.25em] uppercase text-[#94A3B8] font-mono mb-10">05 — возможности</p>
          <h2 className="font-medium tracking-[-0.04em] leading-[0.95] text-[#E5E7EB] max-w-3xl" style={{ fontSize: 'clamp(44px, 5.5vw, 80px)' }}>
            9 модулей. Один интерфейс.
          </h2>
          <div className="mt-20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {MODULES.map((m, i) => (
              <ModuleCard key={i} {...m} accent={i === 1 || i === 4} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── Section 9 — Plan ─── */}
      <section id="plan" className="relative py-32 lg:py-44 px-6 lg:px-12 border-t border-white/[0.06]">
        <div className="max-w-[1400px] mx-auto">
          <p className="text-[11px] tracking-[0.25em] uppercase text-[#94A3B8] font-mono mb-10">06 — внедрение</p>
          <h2 className="font-medium tracking-[-0.04em] leading-[0.95] text-[#E5E7EB] max-w-3xl" style={{ fontSize: 'clamp(44px, 5.5vw, 80px)' }}>
            8 недель. Три этапа.
          </h2>
          <div className="mt-20 grid md:grid-cols-3 gap-4">
            {PLAN.map((p, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scaleX: 0.6 }}
                whileInView={{ opacity: 1, scaleX: 1 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.8, delay: i * 0.15, ease: EASE }}
                style={{ transformOrigin: 'left' }}
                className="relative rounded-2xl p-7 lg:p-8 border border-white/[0.06] overflow-hidden"
              >
                <div className="absolute inset-0" style={{ background: p.bg }} />
                <div className="relative">
                  <p className="text-[11px] uppercase tracking-[0.18em] font-mono text-white/60">{p.weeks}</p>
                  <p className="mt-2 text-2xl font-medium tracking-[-0.02em] text-white">{p.label}</p>
                  <ul className="mt-6 space-y-2.5 text-sm text-white/80">
                    {p.items.map((x) => <li key={x}>— {x}</li>)}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-20 max-w-2xl">
            <p className="text-[11px] uppercase tracking-[0.18em] font-mono text-[#94A3B8] mb-6">что нужно от мэрии</p>
            <ul className="space-y-3">
              {[
                '1 контактное лицо для проекта',
                '2–5 операторов на обучение',
                'Доступ к существующим Excel-выгрузкам',
              ].map((t) => (
                <li key={t} className="flex items-start gap-3 text-base text-[#E5E7EB]/85">
                  <span className="mt-1.5 w-4 h-4 rounded-full bg-[#10B981]/15 border border-[#10B981]/40 flex items-center justify-center text-[#10B981] text-[10px]">✓</span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ─── Section 10 — Final CTA ─── */}
      <section className="relative min-h-[90vh] flex items-center justify-center px-6 py-32 border-t border-white/[0.06] overflow-hidden">
        <GradientMeshBg static />
        <div className="absolute inset-0 bg-[#0A0E1A]/30" />
        <div className="relative z-10 max-w-5xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: EASE }}
            className="font-medium tracking-[-0.04em] leading-[0.95] text-[#E5E7EB]"
            style={{ fontSize: 'clamp(48px, 7vw, 120px)' }}
          >
            Через 8 недель вы открываете планшет — и видите{' '}
            <span className="bg-gradient-to-r from-[#3B82F6] to-[#06B6D4] bg-clip-text text-transparent">весь город</span>.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.3 }}
            className="mt-12 text-xl lg:text-3xl font-light text-[#94A3B8] tracking-[-0.02em]"
          >
            И каждый ваш зам знает, что вы это видите.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mt-16 flex flex-col sm:flex-row items-center justify-center gap-8"
          >
            <button
              onClick={() => navigate('/auth')}
              className="inline-flex items-center gap-3 px-10 py-5 rounded-full text-base font-semibold text-white bg-gradient-to-r from-[#3B82F6] to-[#06B6D4] shadow-[0_15px_50px_-10px_rgba(59,130,246,0.6)] hover:shadow-[0_25px_70px_-10px_rgba(6,182,212,0.8)] transition-shadow duration-500"
            >
              Запросить демо
              <ArrowRight className="w-5 h-5" />
            </button>
            <a href="https://tablet.su/demo" className="text-sm text-[#94A3B8] hover:text-white transition-colors">
              или просто посмотреть → tablet.su/demo
            </a>
          </motion.div>
        </div>
      </section>

      <footer className="border-t border-white/[0.06] py-10 px-6 bg-[#0A0E1A]">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] font-mono tracking-[0.15em] uppercase text-[#94A3B8]">
          <span>Планшет Мэра</span>
          <span>tablet.su · 2026 · команда@tablet.su</span>
        </div>
      </footer>
    </div>
  );
}
