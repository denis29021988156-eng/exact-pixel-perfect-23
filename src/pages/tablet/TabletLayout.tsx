import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import * as Popover from "@radix-ui/react-popover";
import { Bell, CalendarDays, ClipboardCheck, LogOut, Mic, Sun, UsersRound } from "lucide-react";
import { AppMark } from "@/components/gov/AppMark";
import { TabletSheets } from "@/components/gov/TabletSheets";
import { Badge, CountBadge } from "@/components/ios/Badge";
import { useAuth } from "@/contexts/auth";
import { useSheets } from "@/hooks/useSheetParam";
import { useToday } from "@/lib/queries";
import { cn } from "@/lib/utils";

const roleLabel = { governor: "Губернатор", team: "Команда", admin: "Администратор" } as const;

export default function TabletLayout() {
  const { pathname } = useLocation();

  // Новый экран — наверх.
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);

  return (
    <div className="min-h-dvh bg-background">
      <TopBar />
      <main className="mx-auto w-full max-w-[1200px] px-4 pb-[calc(var(--tabbar-height)+env(safe-area-inset-bottom)+32px)] md:px-6">
        <Outlet />
      </main>
      <TabBar />
      <TabletSheets />
    </div>
  );
}

function TopBar() {
  const { user, role, signOut } = useAuth();
  const today = useToday();
  const navigate = useNavigate();
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
    <header className="sticky top-0 z-30 border-b border-transparent bg-background/80 pt-safe backdrop-blur-xl supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-12 max-w-[1200px] items-center justify-between gap-3 px-4 md:px-6">
        <Link to="/app" className="flex min-w-0 items-center gap-2">
          <AppMark size={26} />
          <span className="truncate text-[15px] font-semibold">{today.data?.region ?? "Планшет губернатора"}</span>
          {today.data?.demo && <Badge tone="warning">Демо</Badge>}
        </Link>

        <Popover.Root open={open} onOpenChange={setOpen}>
          <Popover.Trigger
            className="press flex h-9 w-9 items-center justify-center rounded-full bg-fill text-[13px] font-semibold"
            aria-label="Профиль"
          >
            {initials}
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Content
              align="end"
              sideOffset={8}
              className="z-50 w-64 overflow-hidden rounded-[14px] bg-elevated shadow-float ring-1 ring-black/5 data-[state=open]:animate-fade-in dark:ring-white/10"
            >
              <div className="px-4 py-3">
                <p className="truncate text-[15px] font-semibold">{name}</p>
                {role && <p className="text-footnote text-ink-2">{roleLabel[role]}</p>}
              </div>
              <div className="border-t border-line/70">
                {(role === "team" || role === "admin") && (
                  <button
                    type="button"
                    className="tap-row flex w-full items-center gap-3 px-4 py-3 text-left text-[16px]"
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
                  className="tap-row flex w-full items-center gap-3 px-4 py-3 text-left text-[16px] text-critical-ink"
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
    </header>
  );
}

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
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line/70 bg-background/85 pb-safe backdrop-blur-xl supports-[backdrop-filter]:bg-background/75"
      aria-label="Разделы"
    >
      <div className="mx-auto grid h-[var(--tabbar-height)] max-w-[680px] grid-cols-5 items-center px-2">
        {tabs.map((t) =>
          t ? (
            <NavLink
              key={t.to}
              to={t.to}
              end={t.end}
              className={({ isActive }) =>
                cn(
                  "relative flex h-full flex-col items-center justify-center gap-0.5 text-[11px] font-medium",
                  isActive ? "text-tint" : "text-ink-3",
                )
              }
            >
              <span className="relative">
                <t.icon className="h-6 w-6" strokeWidth={2} aria-hidden />
                <CountBadge
                  count={t.badge}
                  className={cn("absolute -right-2.5 -top-1.5", t.to === "/app/agenda" && "bg-tint")}
                />
              </span>
              {t.label}
            </NavLink>
          ) : (
            <div key="ask" className="flex justify-center">
              <button
                type="button"
                onClick={() => sheets.open("ask")}
                className="press -mt-5 flex h-[58px] w-[58px] items-center justify-center rounded-full bg-tint text-white shadow-float ring-4 ring-background"
                aria-label="Спросить"
              >
                <Mic className="h-7 w-7" aria-hidden />
              </button>
            </div>
          ),
        )}
      </div>
    </nav>
  );
}
