import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import * as Popover from "@radix-ui/react-popover";
import { Bell, CalendarDays, ClipboardCheck, LogOut, Mic, Sun, UsersRound } from "lucide-react";
import { OrbLayers } from "@/components/gov/Orb";
import { TabletSheets } from "@/components/gov/TabletSheets";
import { CountBadge } from "@/components/ios/Badge";
import { ThemePicker, ThemeToggle } from "@/components/ios/Theme";
import { useAuth } from "@/contexts/auth";
import { HeaderAccessoryContext } from "@/contexts/headerAccessory";
import { useSheets } from "@/hooks/useSheetParam";
import { useToday } from "@/lib/queries";
import { cn } from "@/lib/utils";

const roleLabel = { governor: "Губернатор", team: "Команда", admin: "Администратор" } as const;

const screenTitles: [string, string][] = [
  ["/app/signals", "Сигналы"],
  ["/app/instructions", "Поручения"],
  ["/app/agenda", "Повестка"],
  ["/app", "Сегодня"],
];

export default function TabletLayout() {
  const { pathname } = useLocation();

  // Новый экран — наверх.
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);

  return (
    <HeaderAccessoryContext.Provider value={<ProfileButton />}>
      <div className="min-h-dvh">
        <CompactTitle pathname={pathname} />
        <main className="mx-auto w-full max-w-[1240px] px-4 pb-[var(--tabbar-space)] pt-safe md:px-7">
          <Outlet />
        </main>
        <TabBar />
        <TabletSheets />
      </div>
    </HeaderAccessoryContext.Provider>
  );
}

/** Когда крупный заголовок уехал вверх, название экрана остаётся в стеклянной капсуле. */
function CompactTitle({ pathname }: { pathname: string }) {
  const [shown, setShown] = useState(false);
  const title = screenTitles.find(([p]) => pathname.startsWith(p))?.[1] ?? "";

  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setShown(window.scrollY > 72));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, [pathname]);

  return (
    <>
      <div
        aria-hidden
        className={cn(
          "scroll-edge scroll-edge-top transition-opacity duration-300",
          shown ? "opacity-100" : "opacity-0",
        )}
      />
      <div
        aria-hidden
        className={cn(
          "pointer-events-none fixed inset-x-0 top-0 z-30 flex justify-center pt-safe transition-all duration-300",
          shown ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0",
        )}
      >
        <div className="glass-bar mt-2 flex h-10 items-center rounded-full px-5 text-[15px] font-semibold">{title}</div>
      </div>
    </>
  );
}

function ProfileButton() {
  const { user, role, signOut } = useAuth();
  const today = useToday();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  // На «Сегодня» пометка «демо» стоит в подзаголовке, на остальных экранах — капсулой.
  const demoChip = today.data?.demo && pathname !== "/app";
  const [open, setOpen] = useState(false);
  const name = (user?.user_metadata?.full_name as string | undefined) || user?.email || "";
  const initials =
    name
      .replace(/\(.*?\)/g, "")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join("") || "Г";

  return (
    <div className="flex items-center gap-2">
      {demoChip && (
        <span
          className="glass hidden h-9 items-center rounded-full px-3.5 text-[13px] font-semibold text-warning-ink sm:inline-flex"
          title="Учебные события на реальной карте области"
        >
          Демо
        </span>
      )}
      <ThemeToggle />
      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger
          className="glass press flex h-11 w-11 items-center justify-center rounded-full text-[15px] font-bold"
          aria-label="Профиль"
        >
          {initials}
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            align="end"
            sideOffset={10}
            className="glass-strong z-50 w-72 overflow-hidden rounded-[24px] data-[state=open]:animate-fade-in"
          >
            <div className="px-5 pb-3 pt-4">
              <p className="truncate text-[16px] font-semibold">{name}</p>
              <p className="text-footnote text-ink-2">
                {role ? roleLabel[role] : ""}
                {today.data?.region ? `, ${today.data.region}` : ""}
              </p>
            </div>
            <div className="border-t border-line px-4 pb-3 pt-3">
              <p className="pb-2 text-footnote font-semibold text-ink-2">Оформление</p>
              <ThemePicker />
            </div>
            <div className="border-t border-line px-2 py-2">
              {(role === "team" || role === "admin") && (
                <button
                  type="button"
                  className="tap-row flex w-full items-center gap-3 rounded-[14px] px-3 py-3 text-left text-[16px]"
                  onClick={() => {
                    setOpen(false);
                    navigate("/team");
                  }}
                >
                  <UsersRound className="h-5 w-5 text-ink-2" aria-hidden />
                  Кабинет команды
                </button>
              )}
              <button
                type="button"
                className="tap-row flex w-full items-center gap-3 rounded-[14px] px-3 py-3 text-left text-[16px] text-critical-ink"
                onClick={async () => {
                  setOpen(false);
                  await signOut();
                  navigate("/", { replace: true });
                }}
              >
                <LogOut className="h-5 w-5" aria-hidden />
                Выйти
              </button>
            </div>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
}

/** Плавающая стеклянная панель вкладок; в центре — кнопка «Спросить». */
function TabBar() {
  const today = useToday();
  const sheets = useSheets();
  const counts = today.data?.counts;
  const tabs = [
    { to: "/app", label: "Сегодня", icon: Sun, end: true, badge: 0 },
    { to: "/app/signals", label: "Сигналы", icon: Bell, end: false, badge: counts?.signals_new ?? 0 },
    null,
    {
      to: "/app/instructions",
      label: "Поручения",
      icon: ClipboardCheck,
      end: false,
      badge: counts?.instructions_overdue ?? 0,
    },
    { to: "/app/agenda", label: "Повестка", icon: CalendarDays, end: false, badge: counts?.agenda_pending ?? 0 },
  ];

  return (
    <>
      <div className="scroll-edge scroll-edge-bottom" aria-hidden />
      <nav
        className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-3 pb-[max(14px,env(safe-area-inset-bottom))]"
        aria-label="Разделы"
      >
        <div className="glass-bar pointer-events-auto flex h-[64px] w-full max-w-[580px] items-center gap-0.5 rounded-full px-[6px] sm:h-[70px] sm:px-[7px]">
          {tabs.map((t) =>
            t ? (
              <NavLink
                key={t.to}
                to={t.to}
                end={t.end}
                className={({ isActive }) =>
                  cn(
                    "press relative flex h-[52px] min-w-0 flex-1 flex-col items-center justify-center gap-[3px] rounded-full text-[10.5px] font-semibold sm:h-14 sm:text-[11px]",
                    isActive ? "bg-tint/12 text-tint dark:bg-tint/20" : "text-ink-2 hover:text-foreground",
                  )
                }
              >
                <span className="relative">
                  <t.icon className="h-[23px] w-[23px]" strokeWidth={2} aria-hidden />
                  <CountBadge
                    count={t.badge}
                    className={cn("absolute -right-3 -top-1.5", t.to === "/app/agenda" && "bg-tint")}
                  />
                </span>
                <span className="max-w-full truncate">{t.label}</span>
              </NavLink>
            ) : (
              <AskOrb key="ask" onClick={() => sheets.open("ask")} />
            ),
          )}
        </div>
      </nav>
    </>
  );
}

/** Голосовой вопрос: шар с радужным ореолом, как у Siri. */
function AskOrb({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="press relative mx-1 flex h-[54px] w-[54px] shrink-0 items-center justify-center rounded-full sm:mx-1.5 sm:h-[58px] sm:w-[58px]"
      aria-label="Спросить"
    >
      <OrbLayers />
      <Mic className="relative h-[26px] w-[26px] text-white" strokeWidth={2.2} aria-hidden />
    </button>
  );
}
