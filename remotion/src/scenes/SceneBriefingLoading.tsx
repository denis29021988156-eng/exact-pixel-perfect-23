import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { colors, fontFamily } from "../theme";
import { AppShell } from "../components/AppShell";

const departments = ["ЖКХ", "Транспорт", "Благоустройство", "Социальная сфера", "Строительство"];

export const SceneBriefingLoading: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const panelSp = spring({ frame, fps, config: { damping: 22, stiffness: 140 } });
  const panelX = interpolate(panelSp, [0, 1], [600, 0]);

  // typing label
  const baseLabel = "Готовлю брифинг по 5 департаментам";
  const dots = frame > 30 ? ".".repeat((Math.floor(frame / 8) % 4)) : "";
  const charLen = Math.min(baseLabel.length, Math.floor((frame - 8) / 1.2));
  const label = baseLabel.slice(0, Math.max(0, charLen)) + (charLen >= baseLabel.length ? dots : "");

  return (
    <AbsoluteFill>
      <AppShell aiActive>
        <div style={{ display: "flex", gap: 22, height: "100%", fontFamily }}>
          {/* dim left */}
          <div style={{ flex: 1, opacity: 0.25, filter: "blur(0.5px)" }}>
            <div style={{ fontSize: 32, fontWeight: 700, color: colors.text }}>Командный центр</div>
            <div style={{ marginTop: 22, display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14 }}>
              {[0,1,2,3].map(i => (
                <div key={i} style={{ height: 110, borderRadius: 14, background: "rgba(20,24,35,0.5)", border: `1px solid ${colors.border}` }} />
              ))}
            </div>
            <div style={{ marginTop: 20, height: 280, borderRadius: 14, background: "rgba(20,24,35,0.5)", border: `1px solid ${colors.border}` }} />
          </div>

          {/* AI panel right */}
          <div style={{
            width: 560, transform: `translateX(${panelX}px)`,
            borderRadius: 20, padding: 28,
            background: `linear-gradient(160deg, rgba(59,130,246,0.12), rgba(20,24,35,0.85))`,
            border: `1px solid rgba(96,165,250,0.35)`,
            boxShadow: `0 30px 80px rgba(0,0,0,0.5), 0 0 60px rgba(59,130,246,0.15)`,
            position: "relative", overflow: "hidden",
          }}>
            {/* shimmer */}
            <div style={{
              position: "absolute", top: 0, bottom: 0, width: 200,
              left: `${interpolate(frame % 90, [0, 90], [-200, 760])}px`,
              background: "linear-gradient(90deg, transparent, rgba(96,165,250,0.12), transparent)",
              pointerEvents: "none",
            }} />

            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryGlow})`,
                display: "grid", placeItems: "center",
                boxShadow: `0 0 ${15 + Math.sin(frame / 5) * 10}px ${colors.primary}`,
                fontSize: 22, color: "#fff",
              }}>✦</div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: colors.text, letterSpacing: -0.3 }}>ИИ ассистент</div>
                <div style={{ fontSize: 12, color: colors.primaryGlow, fontWeight: 500 }}>gemini-3-flash · стрим</div>
              </div>
            </div>

            <div style={{ marginTop: 28, fontSize: 17, color: colors.text, fontWeight: 500, minHeight: 28 }}>
              {label}<span style={{ opacity: Math.floor(frame / 8) % 2 === 0 ? 1 : 0 }}>|</span>
            </div>

            {/* progress dept rows */}
            <div style={{ marginTop: 26, display: "flex", flexDirection: "column", gap: 12 }}>
              {departments.map((d, i) => {
                const start = 30 + i * 18;
                const done = frame > start + 22;
                const inProg = frame >= start && !done;
                const p = interpolate(frame, [start, start + 22], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
                return (
                  <div key={d} style={{ display: "flex", alignItems: "center", gap: 12, opacity: interpolate(frame, [start - 8, start], [0.2, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
                    <div style={{
                      width: 22, height: 22, borderRadius: 999,
                      border: `2px solid ${done ? colors.success : inProg ? colors.primary : "rgba(255,255,255,0.15)"}`,
                      display: "grid", placeItems: "center", color: done ? colors.success : colors.primary, fontSize: 12,
                      background: done ? "rgba(16,185,129,0.1)" : "transparent",
                    }}>
                      {done ? "✓" : inProg ? <div style={{ width: 8, height: 8, borderRadius: 999, background: colors.primary, boxShadow: `0 0 8px ${colors.primary}` }} /> : ""}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: done ? colors.text : colors.textMuted, fontWeight: 500 }}>
                        <span>{d}</span>
                        <span style={{ fontVariantNumeric: "tabular-nums", color: done ? colors.success : colors.textDim }}>
                          {done ? "готово" : inProg ? `${Math.round(p * 100)}%` : "ожидание"}
                        </span>
                      </div>
                      <div style={{ marginTop: 6, height: 3, borderRadius: 999, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${(done ? 1 : p) * 100}%`, background: done ? colors.success : `linear-gradient(90deg, ${colors.primary}, ${colors.primaryGlow})`, borderRadius: 999 }} />
                      </div>
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