import { loadFont } from "@remotion/google-fonts/Inter";

export const { fontFamily } = loadFont("normal", {
  weights: ["400", "500", "600", "700", "800"],
  subsets: ["latin", "cyrillic"],
});

export const colors = {
  bg: "#0B0E14",
  bgGrad1: "#0E1320",
  bgGrad2: "#0A0D14",
  card: "#141823",
  cardHi: "#1B2030",
  border: "rgba(255,255,255,0.06)",
  borderHi: "rgba(255,255,255,0.12)",
  text: "#E8EAF0",
  textMuted: "#8B91A0",
  textDim: "#5C6273",
  primary: "#3B82F6",
  primaryGlow: "#60A5FA",
  success: "#10B981",
  warning: "#F59E0B",
  danger: "#EF4444",
  info: "#06B6D4",
};