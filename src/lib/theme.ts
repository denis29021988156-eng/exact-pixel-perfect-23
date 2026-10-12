import { useSyncExternalStore } from "react";

/**
 * Оформление: как на устройстве, всегда светлое или всегда тёмное.
 * Выбор хранится на этом устройстве; до первой отрисовки его применяет скрипт в index.html.
 */
export type ThemePref = "auto" | "light" | "dark";

const KEY = "theme";
const media = typeof window !== "undefined" ? window.matchMedia?.("(prefers-color-scheme: dark)") : undefined;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

export function getThemePref(): ThemePref {
  try {
    const v = localStorage.getItem(KEY);
    return v === "light" || v === "dark" ? v : "auto";
  } catch {
    return "auto";
  }
}

export function isDark(): boolean {
  return document.documentElement.classList.contains("dark");
}

function apply() {
  const pref = getThemePref();
  const dark = pref === "dark" || (pref === "auto" && Boolean(media?.matches));
  document.documentElement.classList.toggle("dark", dark);
}

export function setThemePref(pref: ThemePref) {
  try {
    if (pref === "auto") localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, pref);
  } catch {
    // Хранилище недоступно (приватный режим) — тема всё равно переключится до перезагрузки.
  }
  apply();
  notify();
}

/** Применить тему при запуске и следить за настройкой устройства. */
export function initTheme() {
  apply();
  media?.addEventListener?.("change", () => {
    apply();
    notify();
  });
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export const useThemePref = () => useSyncExternalStore(subscribe, getThemePref, () => "auto" as ThemePref);
export const useIsDark = () => useSyncExternalStore(subscribe, isDark, () => false);
