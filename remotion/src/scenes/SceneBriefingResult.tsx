import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { colors, fontFamily } from "../theme";
import { AppShell } from "../components/AppShell";

const bullets = [
  { tag: "РИСК", color: colors.danger, title: "ЖКХ · Восточный округ", text: "47 обращений по теплоснабжению за 6 ч. Прогноз эскалации — 78%." },
  { tag: "ВНИМАНИЕ", color: colors.warning, title: "Транспорт · ул. Ленина", text: "Превышение SLA по 3 заявкам. Ответственный — Сидоров А.В." },
  { tag: "ПОЗИТИВ", color: colors.success, title: "Благоустройство", text: "План по ремонту дворов выполнен на 104%. Бюджет в пределах нормы." },
  { tag: "ПРОГНОЗ", color: colors.info, title: "Социальная сфера", text: "Риск роста очередей в МФЦ к 18 мая (+22%). Рекомендация: усилить смену." },
];

function Typed({ text, start, speed = 1.2 }: { text: string; start: number; speed?: number }) {
  const frame = useCurrentFrame();
  const len = Math.max(0, Math.min(text.length, Math.floor((frame - start) / speed)));
  return <>{text.slice(0, len)}</>;
}

export const SceneBriefingResult: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill>
      <AppShell aiActive>
        <div style={{ display: "flex", gap: 22, height: "100%", fontFamily }}>
          <div style={{ flex: 1, opacity: 0.18 }}>
            <div style={{ fontSize: 32, fontWeight: 700, color: colors.text }}>Командный центр</div>
            <div style={{ marginTop: 22, display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14 }}>
              {[0,1,2,3].map(i => <div key={i} style={{ height: 110, borderRadius: 14, background: "rgba(20,24,35,0.5)", border: `1px solid ${colors.border}` }} />)}
            </div>
          </div>

          <div style={{
            width: 720,
            borderRadius: 20, padding: 28,
            background: `linear-gradient(160deg, rgba(59,130,246,0.10), rgba(20,24,35,0.85))`,
            border: `1px solid rgba(96,165,250,0.30)`,
            boxShadow: `0 30px 80px rgba(0,0,0,0.5), 0 0 60px rgba(59,130,246,0.10)`,
            position: "relative", overflow: "hidden",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryGlow})`, display: "grid", placeItems: "center", boxShadow: `0 0 18px ${colors.primary}`, fontSize: 22, color: "#fff" }}>✦</div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: colors.text }}>Утренний брифинг</div>
                  <div style={{ fontSize: 12, color: colors.primaryGlow, fontWeight: 500 }}>15 мая · 5 департаментов · 2 847 событий</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 12px", borderRadius: 999, background: "rgba(16,185,129,0.12)", border: `1px solid rgba(16,185,129,0.3)` }}>
                <div style={{ width: 6, height: 6, borderRadius: 999, background: colors.success }} />
                <span style={{ fontSize: 11, fontWeight: 600, color: colors.success, letterSpacing: 0.3 }}>ГОТОВО</span>
              </div>
            </div>

            {/* Risk score */}
            <div style={{
              marginTop: 22, padding: "14px 18px", borderRadius: 12,
              background: "rgba(239,68,68,0.08)", border: `1px solid rgba(239,68,68,0.25)`,
              display: "flex", alignItems: "center", justifyContent: "space-between",
              opacity: interpolate(frame, [4, 18], [0, 1], { extrapolateRight: "clamp" }),
            }}>
              <div>
                <div style={{ fontSize: 11, color: colors.textMuted, letterSpacing: 0.4, textTransform: "uppercase", fontWeight: 500 }}>City Risk Index</div>
                <div style={{ fontSize: 13, color: colors.text, marginTop: 4 }}>Повышенный — требуется внимание ЖКХ</div>
              </div>
              <div style={{ fontSize: 38, fontWeight: 800, color: colors.danger, letterSpacing: -1, fontVariantNumeric: "tabular-nums" }}>
                {Math.min(64, Math.round(interpolate(frame, [4, 28], [0, 64], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })))}
              </div>
            </div>

            {/* Bullets stream in */}
            <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 12 }}>
              {bullets.map((b, i) => {
                const startFrame = 26 + i * 26;
                const sp = spring({ frame: frame - startFrame, fps, config: { damping: 22, stiffness: 160 } });
                return (
                  <div key={i} style={{
                    padding: "14px 16px", borderRadius: 12,
                    background: "rgba(255,255,255,0.025)",
                    border: `1px solid ${colors.border}`,
                    borderLeft: `3px solid ${b.color}`,
                    transform: `translateY(${interpolate(sp, [0, 1], [16, 0])}px)`,
                    opacity: sp,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: b.color, letterSpacing: 0.6, padding: "3px 8px", borderRadius: 4, background: `${b.color}1f` }}>{b.tag}</span>
                      <span style={{ fontSize: 13.5, fontWeight: 600, color: colors.text }}>{b.title}</span>
                    </div>
                    <div style={{ marginTop: 8, fontSize: 13, color: colors.textMuted, lineHeight: 1.55 }}>
                      <Typed text={b.text} start={startFrame + 6} speed={0.8} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </AppShell>
    </AbsoluteFill>
  );
};