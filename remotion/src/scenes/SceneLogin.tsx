import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { colors, fontFamily } from "../theme";
import { Cursor } from "../components/Cursor";

export const SceneLogin: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fadeIn = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const cardY = spring({ frame, fps, config: { damping: 18, stiffness: 110 } });
  const cardYOff = interpolate(cardY, [0, 1], [40, 0]);

  // typing email
  const email = "mayor@reutov.gov";
  const password = "••••••••••";
  const emailLen = Math.max(0, Math.min(email.length, Math.floor((frame - 25) / 1.6)));
  const pwdLen = Math.max(0, Math.min(password.length, Math.floor((frame - 70) / 1.4)));

  // cursor path
  const cx = 960, cy = 540;
  const cursorPath = [
    { x: cx + 280, y: cy + 260, t: 0 },
    { x: cx - 150, y: cy - 120, t: 22 }, // email field
    { x: cx - 150, y: cy - 120, t: 65 },
    { x: cx - 150, y: cy - 40, t: 80 }, // pwd field
    { x: cx - 150, y: cy - 40, t: 100 },
    { x: cx + 130, y: cy + 70, t: 112 }, // sign-in button
  ];

  return (
    <AbsoluteFill style={{
      fontFamily,
      background: `radial-gradient(900px 600px at 70% 30%, rgba(59,130,246,0.10), transparent 60%), radial-gradient(700px 500px at 20% 80%, rgba(96,165,250,0.06), transparent 60%), ${colors.bg}`,
    }}>
      {/* Brand center-top (matches AuthPage: City OS / Ситуационный центр) */}
      <div style={{ position: "absolute", top: 110, left: 0, right: 0, display: "flex", justifyContent: "center", alignItems: "center", gap: 14, opacity: fadeIn }}>
        <div style={{ width: 52, height: 52, borderRadius: 14, background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryGlow})`, display: "grid", placeItems: "center", fontWeight: 800, fontSize: 26, color: "#fff", boxShadow: `0 0 30px ${colors.primary}60` }}>⛨</div>
        <div>
          <div style={{ fontSize: 26, fontWeight: 800, color: colors.text, letterSpacing: -0.5 }}>City OS</div>
          <div style={{ fontSize: 12, color: colors.textMuted, letterSpacing: 0.4 }}>Ситуационный центр · Реутов</div>
        </div>
      </div>

      {/* Login card */}
      <div style={{
        position: "absolute", left: "50%", top: "50%", width: 520,
        transform: `translate(-50%, calc(-50% + ${cardYOff}px))`,
        opacity: fadeIn,
        background: "rgba(20,24,35,0.7)",
        backdropFilter: "blur(20px)",
        border: `1px solid ${colors.borderHi}`,
        borderRadius: 20,
        padding: "44px 48px",
        boxShadow: "0 30px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(59,130,246,0.05)",
      }}>
        <div style={{ fontSize: 26, fontWeight: 700, color: colors.text, letterSpacing: -0.5 }}>Вход в систему</div>
        <div style={{ fontSize: 14, color: colors.textMuted, marginTop: 6 }}>Используйте корпоративный аккаунт</div>

        <div style={{ marginTop: 32 }}>
          <div style={{ fontSize: 12, color: colors.textMuted, marginBottom: 8, fontWeight: 500 }}>EMAIL</div>
          <div style={{ height: 48, borderRadius: 10, background: "rgba(255,255,255,0.03)", border: `1px solid ${frame > 22 && frame < 70 ? "rgba(59,130,246,0.5)" : colors.border}`, padding: "0 16px", display: "flex", alignItems: "center", color: colors.text, fontSize: 15 }}>
            {email.slice(0, emailLen)}<span style={{ opacity: emailLen < email.length && Math.floor(frame / 8) % 2 === 0 ? 1 : 0, marginLeft: 1 }}>|</span>
          </div>
        </div>

        <div style={{ marginTop: 18 }}>
          <div style={{ fontSize: 12, color: colors.textMuted, marginBottom: 8, fontWeight: 500 }}>ПАРОЛЬ</div>
          <div style={{ height: 48, borderRadius: 10, background: "rgba(255,255,255,0.03)", border: `1px solid ${frame > 78 && frame < 110 ? "rgba(59,130,246,0.5)" : colors.border}`, padding: "0 16px", display: "flex", alignItems: "center", color: colors.text, fontSize: 15, letterSpacing: 2 }}>
            {password.slice(0, pwdLen)}<span style={{ opacity: pwdLen < password.length && Math.floor(frame / 8) % 2 === 0 ? 1 : 0, marginLeft: 1, letterSpacing: 0 }}>|</span>
          </div>
        </div>

        <div style={{
          marginTop: 28, height: 50, borderRadius: 10,
          background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryGlow})`,
          display: "grid", placeItems: "center", fontWeight: 600, fontSize: 15, color: "#fff",
          boxShadow: frame > 108 ? `0 0 30px rgba(59,130,246,0.5)` : `0 8px 24px rgba(59,130,246,0.3)`,
          transform: frame > 110 && frame < 116 ? "scale(0.98)" : "scale(1)",
        }}>Войти →</div>
      </div>

      <Cursor path={cursorPath} clickFrames={[112]} />
    </AbsoluteFill>
  );
};