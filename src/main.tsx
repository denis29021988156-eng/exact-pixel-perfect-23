import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Тема как на устройстве: класс .dark включает тёмные цвета и варианты dark: в стилях.
const media = window.matchMedia?.("(prefers-color-scheme: dark)");
const applyTheme = () => document.documentElement.classList.toggle("dark", Boolean(media?.matches));
applyTheme();
media?.addEventListener?.("change", applyTheme);

createRoot(document.getElementById("root")!).render(<App />);
