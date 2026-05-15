import React from "react";
import { colors, fontFamily } from "../theme";
import { useCurrentFrame, interpolate } from "remotion";

const navItems = [
  { label: "Сегодня", icon: "▦", active: true },
  { label: "Инциденты", icon: "⚠" },
  { label: "Задачи", icon: "✓" },
  { label: "Проекты", icon: "◇" },
  { label: "Карта", icon: "◉" },
  { label: "Репутация", icon: "★" },
  { label: "Telegram", icon: "✈" },
  { label: "Пользователи", icon: "◑" },
];

export const AppShell: React.FC<{ children: React.ReactNode; aiActive?: boolean }>= ({ children, aiActive }) => {
  const frame = useCurrentFrame();
  const pulse = aiActive ? 0.5 + 0.5 * Math.sin(frame / 6) : 0;
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", fontFamily, color: colors.text, background: `radial-gradient(1200px 800px at 20% 0%, ${colors.bgGrad1}, ${colors.bgGrad2} 60%, ${colors.bg} 100%)` }}>
      {/* Sidebar */}
      <div style={{ width: 260, background: "rgba(10,12,18,0.6)", borderRight: `1px solid ${colors.border}`, padding: "32px 18px", display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "0 10px 28px" }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryGlow})`, display: "grid", placeItems: "center", fontWeight: 800, fontSize: 18 }}>Б</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: -0.2 }}>Балашиха</div>
            <div style={{ fontSize: 11, color: colors.textMuted }}>Цифровая платформа</div>
          </div>
        </div>
        {navItems.map((it) => (
          <div key={it.label} style={{
            display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 10,
            background: it.active ? "rgba(59,130,246,0.12)" : "transparent",
            color: it.active ? colors.text : colors.textMuted,
            fontSize: 13.5, fontWeight: it.active ? 600 : 500,
            border: it.active ? `1px solid rgba(59,130,246,0.25)` : "1px solid transparent",
          }}>
            <span style={{ width: 18, fontSize: 14, opacity: 0.85 }}>{it.icon}</span>
            <span>{it.label}</span>
          </div>
        ))}
        <div style={{ marginTop: "auto", padding: 12, borderRadius: 12, background: "rgba(255,255,255,0.03)", border: `1px solid ${colors.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 999, background: "linear-gradient(135deg,#475569,#1E293B)", display: "grid", placeItems: "center", fontWeight: 700, fontSize: 13 }}>ГБ</div>
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 600 }}>Глава города</div>
              <div style={{ fontSize: 10.5, color: colors.textMuted }}>mayor@balashikha</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Topbar */}
        <div style={{ height: 64, borderBottom: `1px solid ${colors.border}`, padding: "0 32px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(10,12,18,0.4)" }}>
          <div style={{ fontSize: 14, color: colors.textMuted, letterSpacing: 0.3 }}>Сегодня · 15 мая 2026 · пятница</div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 12px", borderRadius: 999, background: aiActive ? "rgba(59,130,246,0.12)" : "rgba(255,255,255,0.03)", border: `1px solid ${aiActive ? "rgba(59,130,246,0.4)" : colors.border}` }}>
              <div style={{ width: 8, height: 8, borderRadius: 999, background: aiActive ? colors.primary : colors.success, boxShadow: aiActive ? `0 0 ${8 + pulse * 12}px ${colors.primary}` : `0 0 6px ${colors.success}` }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: aiActive ? colors.primaryGlow : colors.text }}>{aiActive ? "ИИ работает" : "ИИ активен"}</span>
            </div>
            <div style={{ fontSize: 12, color: colors.textMuted }}>+18°C, ясно</div>
          </div>
        </div>
        <div style={{ flex: 1, padding: "28px 36px", overflow: "hidden" }}>{children}</div>
      </div>
    </div>
  );
};