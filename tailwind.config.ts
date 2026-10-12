import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

// Цвета задаются переменными в src/index.css (светлая и тёмная тема).
const token = (name: string) => `hsl(var(--${name}) / <alpha-value>)`;
// Полупрозрачные цвета стекла: своя прозрачность умножается на модификатор (bg-fill/60).
const glassToken = (name: string) => `hsl(var(--${name}) / calc(var(--${name}-a) * <alpha-value>))`;

const systemSans = [
  "-apple-system",
  "BlinkMacSystemFont",
  '"SF Pro Text"',
  '"SF Pro Display"',
  "Inter",
  '"Segoe UI"',
  "Roboto",
  '"Helvetica Neue"',
  "Arial",
  "sans-serif",
];

export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: { "2xl": "1280px" },
    },
    extend: {
      fontFamily: {
        sans: systemSans,
        rounded: ["ui-rounded", '"SF Pro Rounded"', ...systemSans],
      },
      // Шкала текста как в iOS; крупные заголовки — плотнее и жирнее, как в iPadOS 26.
      fontSize: {
        "large-title": ["34px", { lineHeight: "40px", fontWeight: "800", letterSpacing: "-0.025em" }],
        title1: ["28px", { lineHeight: "33px", fontWeight: "750", letterSpacing: "-0.02em" }],
        title2: ["22px", { lineHeight: "27px", fontWeight: "700", letterSpacing: "-0.015em" }],
        title3: ["20px", { lineHeight: "25px", fontWeight: "650", letterSpacing: "-0.01em" }],
        headline: ["17px", { lineHeight: "22px", fontWeight: "600" }],
        body: ["17px", { lineHeight: "22px" }],
        callout: ["16px", { lineHeight: "21px" }],
        subhead: ["15px", { lineHeight: "20px" }],
        footnote: ["13px", { lineHeight: "18px" }],
        caption: ["12px", { lineHeight: "16px" }],
      },
      colors: {
        border: glassToken("border"),
        input: glassToken("border"),
        ring: token("primary"),
        background: token("background"),
        foreground: token("foreground"),
        canvas: token("background"),
        elevated: glassToken("elevated"),
        ink: {
          DEFAULT: token("foreground"),
          2: token("ink-2"),
          3: token("ink-3"),
        },
        line: glassToken("border"),
        fill: glassToken("fill"),
        tint: token("primary"),
        critical: { DEFAULT: token("critical"), ink: token("critical-ink") },
        warning: { DEFAULT: token("warning"), ink: token("warning-ink") },
        good: { DEFAULT: token("good"), ink: token("good-ink") },
        ai: { DEFAULT: token("ai"), ink: token("ai-ink") },
        primary: {
          DEFAULT: token("primary"),
          foreground: token("primary-foreground"),
        },
        secondary: {
          DEFAULT: glassToken("fill"),
          foreground: token("foreground"),
        },
        destructive: {
          DEFAULT: token("critical"),
          foreground: token("primary-foreground"),
        },
        muted: {
          DEFAULT: glassToken("fill"),
          foreground: token("ink-2"),
        },
        accent: {
          DEFAULT: glassToken("fill"),
          foreground: token("foreground"),
        },
        popover: {
          DEFAULT: glassToken("elevated"),
          foreground: token("foreground"),
        },
        card: {
          DEFAULT: glassToken("card"),
          foreground: token("foreground"),
        },
      },
      opacity: {
        8: "0.08",
        12: "0.12",
        14: "0.14",
        16: "0.16",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 4px)",
        sm: "calc(var(--radius) - 6px)",
        card: "26px",
        sheet: "32px",
        panel: "32px",
      },
      boxShadow: {
        card: "var(--glass-shadow)",
        float: "0 24px 60px -18px rgb(10 20 50 / 0.35), 0 2px 8px rgb(10 20 50 / 0.08)",
        glow: "0 10px 26px -8px hsl(var(--primary) / 0.55)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "sheet-up": {
          from: { transform: "translateY(100%)" },
          to: { transform: "translateY(0)" },
        },
        "sheet-down": {
          from: { transform: "translateY(0)" },
          to: { transform: "translateY(100%)" },
        },
        "pop-in": {
          from: { opacity: "0", transform: "translate(-50%, -48%) scale(0.98)" },
          to: { opacity: "1", transform: "translate(-50%, -50%) scale(1)" },
        },
        "pop-out": {
          from: { opacity: "1", transform: "translate(-50%, -50%) scale(1)" },
          to: { opacity: "0", transform: "translate(-50%, -48%) scale(0.98)" },
        },
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
        "fade-out": { from: { opacity: "1" }, to: { opacity: "0" } },
        "rise-in": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.45" },
        },
        "listen-ring": {
          "0%": { boxShadow: "0 0 0 0 hsl(var(--critical) / 0.45)" },
          "100%": { boxShadow: "0 0 0 14px hsl(var(--critical) / 0)" },
        },
        // Кольцо вокруг критичного сигнала на карте.
        "map-ping": {
          "0%": { transform: "scale(0.6)", opacity: "0.55" },
          "80%, 100%": { transform: "scale(2.2)", opacity: "0" },
        },
        "orb-spin": {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
        // Точки карты «расцветают» от центра сигнала при открытии экрана.
        "dot-bloom": {
          from: { opacity: "0", transform: "scale(0.2)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "sheet-up": "sheet-up 0.32s cubic-bezier(0.32, 0.72, 0, 1)",
        "sheet-down": "sheet-down 0.24s ease-in",
        "pop-in": "pop-in 0.22s cubic-bezier(0.32, 0.72, 0, 1)",
        "pop-out": "pop-out 0.16s ease-in",
        "fade-in": "fade-in 0.2s ease-out",
        "fade-out": "fade-out 0.16s ease-in",
        "rise-in": "rise-in 0.28s ease-out both",
        "pulse-soft": "pulse-soft 1.6s ease-in-out infinite",
        "listen-ring": "listen-ring 1.2s ease-out infinite",
        "map-ping": "map-ping 2.4s cubic-bezier(0.2, 0.6, 0.3, 1) infinite",
        "orb-spin": "orb-spin 6s linear infinite",
        "dot-bloom": "dot-bloom 0.7s cubic-bezier(0.2, 0.7, 0.2, 1) both",
      },
    },
  },
  plugins: [animate],
} satisfies Config;
