import { Moon, Sun } from "lucide-react";
import { setThemePref, useIsDark, useThemePref } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { Segmented } from "./Segmented";

/** Кнопка «светлая / тёмная тема» для шапки. */
export function ThemeToggle({ className }: { className?: string }) {
  const dark = useIsDark();
  const label = dark ? "Включить светлую тему" : "Включить тёмную тему";
  return (
    <button
      type="button"
      onClick={() => setThemePref(dark ? "light" : "dark")}
      className={cn("glass press flex h-11 w-11 shrink-0 items-center justify-center rounded-full", className)}
      aria-label={label}
      title={label}
    >
      {dark ? <Sun className="h-5 w-5" aria-hidden /> : <Moon className="h-5 w-5" aria-hidden />}
    </button>
  );
}

/** Выбор оформления: как на устройстве, светлое или тёмное. */
export function ThemePicker({ className }: { className?: string }) {
  const pref = useThemePref();
  return (
    <Segmented
      value={pref}
      onChange={setThemePref}
      ariaLabel="Оформление"
      className={cn("md:w-full md:min-w-0", className)}
      options={[
        { value: "auto", label: "Авто" },
        { value: "light", label: "Светлая" },
        { value: "dark", label: "Тёмная" },
      ]}
    />
  );
}
