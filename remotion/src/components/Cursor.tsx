import React from "react";
import { useCurrentFrame, interpolate, Easing } from "remotion";

type Pt = { x: number; y: number; t: number };

export const Cursor: React.FC<{ path: Pt[]; clickFrames?: number[] }>= ({ path, clickFrames = [] }) => {
  const frame = useCurrentFrame();
  // find segment
  let x = path[0].x;
  let y = path[0].y;
  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i];
    const b = path[i + 1];
    if (frame >= a.t && frame <= b.t) {
      const p = interpolate(frame, [a.t, b.t], [0, 1], { easing: Easing.bezier(0.4, 0, 0.2, 1) });
      x = a.x + (b.x - a.x) * p;
      y = a.y + (b.y - a.y) * p;
      break;
    } else if (frame > b.t && i === path.length - 2) {
      x = b.x; y = b.y;
    } else if (frame > b.t) {
      x = b.x; y = b.y;
    }
  }
  const click = clickFrames.find((cf) => frame >= cf && frame < cf + 14);
  const clickScale = click ? interpolate(frame - click, [0, 6, 14], [1, 0.7, 1]) : 1;
  const ringFrame = click ? frame - click : -1;
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `translate(-4px,-2px) scale(${clickScale})`, pointerEvents: "none", zIndex: 9999 }}>
      {ringFrame >= 0 && (
        <div style={{
          position: "absolute", left: -10, top: -10, width: 28, height: 28, borderRadius: 999,
          border: "2px solid rgba(96,165,250,0.9)",
          opacity: interpolate(ringFrame, [0, 14], [0.9, 0]),
          transform: `scale(${interpolate(ringFrame, [0, 14], [0.4, 2])})`,
        }} />
      )}
      <svg width="28" height="32" viewBox="0 0 28 32" style={{ filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.5))" }}>
        <path d="M2 2 L2 22 L8 17 L12 27 L16 25 L12 15 L20 15 Z" fill="#fff" stroke="#0B0E14" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    </div>
  );
};