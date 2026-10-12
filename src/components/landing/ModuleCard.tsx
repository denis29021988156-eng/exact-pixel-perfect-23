import { useRef, useState } from 'react';
import type { LucideIcon } from 'lucide-react';

export default function ModuleCard({
  icon: Icon,
  title,
  desc,
  accent = false,
}: {
  icon: LucideIcon;
  title: string;
  desc: string;
  accent?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });

  const onMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const dx = (e.clientX - r.left) / r.width - 0.5;
    const dy = (e.clientY - r.top) / r.height - 0.5;
    setTilt({ ry: dx * 4, rx: -dy * 4 });
  };
  const onLeave = () => setTilt({ rx: 0, ry: 0 });

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ perspective: '1000px' }}
      className={accent ? 'lg:scale-[1.04]' : ''}
    >
      <div
        style={{
          transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
          transition: 'transform 300ms cubic-bezier(0.65,0,0.35,1)',
          transformStyle: 'preserve-3d',
        }}
        className={`relative h-full rounded-2xl p-7 transition-all duration-300 ${
          accent
            ? 'bg-gradient-to-br from-[#162033] via-[#0F1524] to-[#0F2330] border border-[#3B82F6]/30'
            : 'bg-[#0F1524] border border-white/[0.08] hover:border-white/[0.15]'
        }`}
      >
        <Icon
          className={`w-7 h-7 mb-6 ${accent ? 'text-[#06B6D4]' : 'text-[#3B82F6]'}`}
          strokeWidth={1.4}
        />
        <h3 className="text-lg font-medium text-[#E5E7EB] tracking-[-0.02em] mb-3">{title}</h3>
        <p className="text-sm text-[#94A3B8] leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}
