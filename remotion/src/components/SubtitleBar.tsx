import React from "react";
import { useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { colors, fontFamily } from "../theme";

type Cue = { from: number; to: number; step: string; label: string };

export const SubtitleBar: React.FC<{ cues: Cue[] }>= ({ cues }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const active = cues.find((c) => frame >= c.from && frame < c.to);
  if (!active) return null;
  const local = frame - active.from;
  const dur = active.to - active.from;
  const sp = spring({ frame: local, fps, config: { damping: 22, stiffness: 160 } });
  const out = interpolate(local, [dur - 14, dur], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const opacity = Math.min(sp, out);
  const ty = interpolate(sp, [0, 1], [24, 0]);

  return (
    <div style={{
      position: "absolute", left: 0, right: 0, bottom: 56,
      display: "flex", justifyContent: "center", pointerEvents: "none",
      opacity, transform: `translateY(${ty}px)`,
      fontFamily, zIndex: 10000,
    }}>
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 16,
        padding: "14px 22px",
        borderRadius: 14,
        background: "rgba(8,11,18,0.78)",
        border: `1px solid rgba(255,255,255,0.10)`,
        boxShadow: "0 18px 48px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.04)",
        backdropFilter: "blur(8px)",
      }}>
        <div style={{
          fontSize: 11, fontWeight: 700, letterSpacing: 1.4,
          color: colors.primaryGlow, textTransform: "uppercase",
          padding: "5px 10px", borderRadius: 6,
          background: "rgba(59,130,246,0.14)",
          border: "1px solid rgba(59,130,246,0.28)",
        }}>{active.step}</div>
        <div style={{ fontSize: 18, fontWeight: 600, color: colors.text, letterSpacing: -0.2 }}>
          {active.label}
        </div>
      </div>
    </div>
  );
};