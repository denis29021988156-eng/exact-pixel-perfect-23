import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { colors, fontFamily } from "../theme";

export const SceneOutro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sp = spring({ frame, fps, config: { damping: 18, stiffness: 110 } });
  const y = interpolate(sp, [0, 1], [30, 0]);
  return (
    <AbsoluteFill style={{
      fontFamily,
      background: `radial-gradient(800px 600px at 50% 50%, rgba(59,130,246,0.18), transparent 60%), ${colors.bg}`,
      display: "grid", placeItems: "center",
    }}>
      <div style={{ textAlign: "center", transform: `translateY(${y}px)`, opacity: sp }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryGlow})`, display: "grid", placeItems: "center", fontWeight: 800, fontSize: 32, color: "#fff", boxShadow: `0 0 50px ${colors.primary}80` }}>⛨</div>
        </div>
        <div style={{ fontSize: 64, fontWeight: 800, color: colors.text, letterSpacing: -2 }}>City OS</div>
        <div style={{ fontSize: 16, color: colors.primaryGlow, marginTop: 10, letterSpacing: 5, textTransform: "uppercase", fontWeight: 500 }}>Реутов · Цифровая платформа</div>
        <div style={{ fontSize: 15, color: colors.textMuted, marginTop: 28, maxWidth: 680, marginLeft: "auto", marginRight: "auto" }}>
          Один экран — весь город. Решение принимает Глава города, поддерживает ИИ.
        </div>
      </div>
    </AbsoluteFill>
  );
};