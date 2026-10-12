import type { ReactNode } from "react";
import { RefreshCw, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./Button";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse-soft rounded-[10px] bg-fill", className)} aria-hidden />;
}

/** Заглушка экрана на время загрузки. */
export function ScreenSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-4" role="status" aria-label="Загрузка">
      <Skeleton className="h-40 w-full" />
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full" />
        ))}
      </div>
    </div>
  );
}

export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="surface rows overflow-hidden" role="status" aria-label="Загрузка">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 px-4 py-3.5">
          <Skeleton className="mt-1 h-2.5 w-2.5 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-3 w-2/5" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
  className,
}: {
  message: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div className={cn("surface flex flex-col items-center px-6 py-10 text-center", className)} role="alert">
      <WifiOff className="h-8 w-8 text-ink-3" aria-hidden />
      <p className="mt-3 text-headline">Не удалось загрузить</p>
      <p className="mt-1 max-w-sm text-subhead text-ink-2">{message}</p>
      {onRetry && (
        <Button variant="tinted" size="sm" className="mt-4" onClick={onRetry} icon={<RefreshCw className="h-4 w-4" />}>
          Повторить
        </Button>
      )}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  text,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  text?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("surface flex flex-col items-center px-6 py-10 text-center", className)}>
      {icon && <div className="text-ink-3">{icon}</div>}
      <p className="mt-3 text-headline">{title}</p>
      {text && <p className="mt-1 max-w-sm text-subhead text-ink-2">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
