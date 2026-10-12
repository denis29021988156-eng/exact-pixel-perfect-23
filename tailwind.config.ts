import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

// Цвета задаются переменными в src/index.css (светлая и тёмная тема).
const token = (name: string) => `hsl(var(--${name}) / <alpha-value>)`;

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
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"SF Pro Text"',
          '"SF Pro Display"',
          '"Segoe UI"',
          "Roboto",
          "Inter",
          '"Helvetica Neue"',
          "Arial",
          "sans-serif",
        ],
      },
      // Шкала текста как в iOS.
      fontSize: {
        "large-title": ["34px", { lineHeight: "41px", fontWeight: "700", letterSpacing: "0.01em" }],
        title1: ["28px", { lineHeight: "34px", fontWeight: "700" }],
        title2: ["22px", { lineHeight: "28px", fontWeight: "700" }],
        title3: ["20px", { lineHeight: "25px", fontWeight: "600" }],
        headline: ["17px", { lineHeight: "22px", fontWeight: "600" }],
        body: ["17px", { lineHeight: "22px" }],
        callout: ["16px", { lineHeight: "21px" }],
        subhead: ["15px", { lineHeight: "20px" }],
        footnote: ["13px", { lineHeight: "18px" }],
        caption: ["12px", { lineHeight: "16px" }],
      },
      colors: {
        border: token("border"),
        input: token("border"),
        ring: token("primary"),
        background: token("background"),
        foreground: token("foreground"),
        canvas: token("background"),
        elevated: token("elevated"),
        ink: {
          DEFAULT: token("foreground"),
          2: token("ink-2"),
          3: token("ink-3"),
        },
        line: token("border"),
        fill: token("fill"),
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
          DEFAULT: token("fill"),
          foreground: token("foreground"),
        },
        destructive: {
          DEFAULT: token("critical"),
          foreground: token("primary-foreground"),
        },
        muted: {
          DEFAULT: token("fill"),
          foreground: token("ink-2"),
        },
        accent: {
          DEFAULT: token("fill"),
          foreground: token("foreground"),
        },
        popover: {
          DEFAULT: token("elevated"),
          foreground: token("foreground"),
        },
        card: {
          DEFAULT: token("card"),
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
        card: "14px",
        sheet: "16px",
      },
      boxShadow: {
        card: "0 1px 2px rgb(0 0 0 / 0.04), 0 1px 1px rgb(0 0 0 / 0.02)",
        float: "0 8px 30px rgb(0 0 0 / 0.12)",
        tab: "0 -0.5px 0 hsl(var(--border))",
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
      },
    },
  },
  plugins: [animate],
} satisfies Config;
