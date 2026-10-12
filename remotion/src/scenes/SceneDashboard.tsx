import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { colors, fontFamily } from "../theme";
import { AppShell } from "../components/AppShell";
import { Cursor } from "../components/Cursor";

const kpis = [
  { label: "Активные инциденты", value: 47, delta: "+3", color: colors.danger, trend: [12, 18, 15, 22, 28, 35, 47] },
  { label: "Критические", value: 6, delta: "+1", color: colors.warning, trend: [2, 3, 2, 4, 5, 4, 6] },
  { label: "Задачи в работе", value: 184, delta: "−12", color: colors.info, trend: [220, 210, 205, 200, 196, 190, 184] },
  { label: "Бюджет освоен", value: 62, delta: "+4%", color: colors.success, trend: [40, 45, 50, 54, 57, 60, 62], suffix: "%" },
];

function useCount(end: number, startFrame: number, dur = 25) {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [startFrame, startFrame + dur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const eased = 1 - Math.pow(1 - p, 3);
  return Math.round(end * eased);
}

const KpiCard: React.FC<{ k: typeof kpis[0]; idx: number; clickPulse?: boolean }>= ({ k, idx, clickPulse }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const delay = 12 + idx * 6;
  const sp = spring({ frame: frame - delay, fps, config: { damping: 20, stiffness: 150 } });
  const ty = interpolate(sp, [0, 1], [30, 0]);
  const opacity = interpolate(sp, [0, 1], [0, 1]);
  const v = useCount(k.value, delay + 6, 22);
  const max = Math.max(...k.trend);
  return (
    <div style={{
      flex: 1, background: "rgba(20,24,35,0.6)", border: `1px solid ${colors.border}`, borderRadius: 16, padding: "20px 22px",
      transform: `translateY(${ty}px)`, opacity, position: "relative", overflow: "hidden",
    }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${k.color}, transparent)`, opacity: 0.6 }} />
      <div style={{ fontSize: 12, color: colors.textMuted, fontWeight: 500, letterSpacing: 0.3, textTransform: "uppercase" }}>{k.label}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 10 }}>
        <div style={{ fontSize: 40, fontWeight: 700, color: colors.text, letterSpacing: -1, fontVariantNumeric: "tabular-nums" }}>{v}{k.suffix || ""}</div>
        <div style={{ fontSize: 12, color: k.color, fontWeight: 600 }}>{k.delta}</div>
      </div>
      {/* sparkline */}
      <svg viewBox="0 0 120 32" style={{ marginTop: 14, width: "100%", height: 36 }}>
        <polyline
          fill="none"
          stroke={k.color}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={k.trend.map((y, i) => `${(i / (k.trend.length - 1)) * 120},${32 - (y / max) * 28}`).join(" ")}
          style={{ filter: `drop-shadow(0 0 4px ${k.color}80)` }}
        />
      </svg>
    </div>
  );
};

export const SceneDashboard: React.FC<{ withAiClick?: boolean }>= ({ withAiClick }) => {
  const frame = useCurrentFrame();
  // cursor moves to the AI Briefing button at end of scene
  const cursorPath = withAiClick ? [
    { x: 1700, y: 980, t: 0 },
    { x: 1500, y: 280, t: 30 },
    { x: 1500, y: 280, t: 60 },
    { x: 920, y: 540, t: 95 }, // briefing button center area
  ] : undefined;

  // briefing card pulse before click
  const briefBtnHover = frame > 75 && frame < 110;

  return (
    <AbsoluteFill>
      <AppShell>
        <div style={{ display: "flex", flexDirection: "column", gap: 22, height: "100%", fontFamily }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", opacity: interpolate(frame, [0, 14], [0, 1]) }}>
            <div>
              <div style={{ fontSize: 32, fontWeight: 700, color: colors.text, letterSpacing: -0.6 }}>Командный центр</div>
              <div style={{ fontSize: 14, color: colors.textMuted, marginTop: 4 }}>Сводка по городу — обновлено только что</div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              {["Все", "ЖКХ", "Транспорт", "Соцсфера"].map((t, i) => (
                <div key={t} style={{ padding: "8px 14px", borderRadius: 999, fontSize: 12, background: i === 0 ? "rgba(59,130,246,0.15)" : "rgba(255,255,255,0.04)", border: `1px solid ${i === 0 ? "rgba(59,130,246,0.35)" : colors.border}`, color: i === 0 ? colors.primaryGlow : colors.textMuted }}>{t}</div>
              ))}
            </div>
          </div>

          {/* KPIs */}
          <div style={{ display: "flex", gap: 18 }}>
            {kpis.map((k, i) => <KpiCard key={k.label} k={k} idx={i} />)}
          </div>

          {/* Two-col: AI briefing card + chart */}
          <div style={{ display: "flex", gap: 18, flex: 1, minHeight: 0 }}>
            {/* AI Briefing CTA card (left) */}
            <div style={{
              flex: 1.2,
              borderRadius: 18,
              padding: 26,
              background: `linear-gradient(135deg, rgba(59,130,246,0.18), rgba(96,165,250,0.06) 60%, rgba(20,24,35,0.6))`,
              border: `1px solid ${briefBtnHover ? "rgba(96,165,250,0.55)" : "rgba(59,130,246,0.25)"}`,
              opacity: interpolate(frame, [38, 58], [0, 1], { extrapolateRight: "clamp" }),
              transform: `translateY(${interpolate(frame, [38, 58], [20, 0], { extrapolateRight: "clamp" })}px)`,
              position: "relative", overflow: "hidden",
              boxShadow: briefBtnHover ? `0 0 60px rgba(59,130,246,0.25)` : "none",
            }}>
              <div style={{ position: "absolute", top: -50, right: -50, width: 200, height: 200, borderRadius: 999, background: `radial-gradient(circle, rgba(96,165,250,0.25), transparent 70%)` }} />
              <div style={{ display: "flex", alignItems: "center", gap: 10, position: "relative" }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryGlow})`, display: "grid", placeItems: "center", fontSize: 18 }}>✦</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: colors.primaryGlow, letterSpacing: 0.4, textTransform: "uppercase" }}>ИИ Сводка</div>
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, color: colors.text, marginTop: 18, letterSpacing: -0.4, lineHeight: 1.25, position: "relative" }}>
                Получите утренний брифинг<br />по всем департаментам
              </div>
              <div style={{ fontSize: 14, color: colors.textMuted, marginTop: 10, lineHeight: 1.5, position: "relative" }}>
                ИИ проанализирует 2 847 событий за сутки и подготовит ключевые риски, точки роста и рекомендации.
              </div>
              <div style={{
                marginTop: 24, display: "inline-flex", alignItems: "center", gap: 10,
                padding: "14px 22px", borderRadius: 12,
                background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryGlow})`,
                color: "#fff", fontWeight: 600, fontSize: 14,
                boxShadow: briefBtnHover ? `0 0 24px rgba(96,165,250,0.6), 0 8px 24px rgba(59,130,246,0.4)` : `0 8px 20px rgba(59,130,246,0.3)`,
                transform: frame > 92 && frame < 100 ? "scale(0.97)" : "scale(1)",
                position: "relative",
              }}>
                <span>✦</span> Сформировать брифинг
              </div>
            </div>

            {/* Chart card (right) */}
            <div style={{
              flex: 1, borderRadius: 18, padding: 22, background: "rgba(20,24,35,0.6)", border: `1px solid ${colors.border}`,
              opacity: interpolate(frame, [44, 64], [0, 1], { extrapolateRight: "clamp" }),
              transform: `translateY(${interpolate(frame, [44, 64], [20, 0], { extrapolateRight: "clamp" })}px)`,
            }}>
              <div style={{ fontSize: 13, color: colors.textMuted, fontWeight: 500, letterSpacing: 0.3, textTransform: "uppercase" }}>Динамика инцидентов · 7 дней</div>
              <svg viewBox="0 0 320 140" style={{ width: "100%", height: 180, marginTop: 14 }}>
                <defs>
                  <linearGradient id="g1" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor={colors.primary} stopOpacity="0.5" />
                    <stop offset="100%" stopColor={colors.primary} stopOpacity="0" />
                  </linearGradient>
                </defs>
                {[0, 35, 70, 105, 140].map((y) => (
                  <line key={y} x1="0" x2="320" y1={y} y2={y} stroke="rgba(255,255,255,0.04)" />
                ))}
                {(() => {
                  const pts = [25, 32, 28, 45, 38, 52, 47];
                  const max = 60;
                  const path = pts.map((p, i) => `${(i / 6) * 320},${140 - (p / max) * 130}`);
                  const lineP = "M" + path.join(" L");
                  const areaP = `${lineP} L 320,140 L 0,140 Z`;
                  const reveal = interpolate(frame, [55, 100], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
                  return (
                    <>
                      <path d={areaP} fill="url(#g1)" opacity={reveal} />
                      <path d={lineP} fill="none" stroke={colors.primaryGlow} strokeWidth="2.4" strokeLinecap="round" strokeDasharray="800" strokeDashoffset={800 - reveal * 800} style={{ filter: `drop-shadow(0 0 6px ${colors.primary})` }} />
                    </>
                  );
                })()}
              </svg>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 11, color: colors.textDim }}>
                {["Пн","Вт","Ср","Чт","Пт","Сб","Вс"].map((d) => <span key={d}>{d}</span>)}
              </div>
            </div>
          </div>
        </div>
      </AppShell>

      {cursorPath && <Cursor path={cursorPath} clickFrames={[95]} />}
    </AbsoluteFill>
  );
};