import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { initTheme } from "./lib/theme";
import "./index.css";

// Класс .dark включает тёмные цвета: по выбору в приложении или как на устройстве.
initTheme();

createRoot(document.getElementById("root")!).render(<App />);
