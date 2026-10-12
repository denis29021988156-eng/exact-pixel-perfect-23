import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/** Группа строк с подписью сверху и снизу, как в настройках iOS. */
export function Section({
  title,
  action,
  footer,
  children,
  className,
  inset = 16,
}: {
  title?: ReactNode;
  action?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
  /** Отступ разделителя слева, px. */
  inset?: number;
}) {
  return (
    <section className={cn("min-w-0", className)}>
      {(title || action) && (
        <div className="flex items-end justify-between gap-3 px-4 pb-2">
          {title ? <h2 className="text-footnote uppercase tracking-wide text-ink-2">{title}</h2> : <span />}
          {action}
        </div>
      )}
      <div className="surface rows overflow-hidden" style={{ ["--row-inset" as string]: `${inset}px` }}>
        {children}
      </div>
      {footer && <p className="px-4 pt-2 text-footnote text-ink-2">{footer}</p>}
    </section>
  );
}

interface RowProps {
  title: ReactNode;
  subtitle?: ReactNode;
  leading?: ReactNode;
  detail?: ReactNode;
  trailing?: ReactNode;
  chevron?: boolean;
  onClick?: () => void;
  to?: string;
  selected?: boolean;
  className?: string;
  titleClassName?: string;
  ariaLabel?: string;
}

/** Строка списка: заголовок, подпись, значок слева и значение справа. */
export function Row({
  title,
  subtitle,
  leading,
  detail,
  trailing,
  chevron,
  onClick,
  to,
  selected,
  className,
  titleClassName,
  ariaLabel,
}: RowProps) {
  const interactive = Boolean(onClick || to);
  const body = (
    <>
      {leading && <div className="flex shrink-0 items-center self-start pt-0.5">{leading}</div>}
      <div className="min-w-0 flex-1">
        <div className={cn("text-[16px] leading-[21px]", titleClassName)}>{title}</div>
        {subtitle && <div className="mt-0.5 text-subhead text-ink-2">{subtitle}</div>}
      </div>
      {detail && <div className="shrink-0 self-center text-subhead text-ink-2">{detail}</div>}
      {trailing}
      {(chevron ?? interactive) && <ChevronRight className="h-4 w-4 shrink-0 self-center text-ink-3" aria-hidden />}
    </>
  );
  const cls = cn(
    "flex w-full min-h-[48px] items-start gap-3 px-4 py-3 text-left",
    interactive && "tap-row cursor-pointer",
    selected && "bg-tint/10",
    className,
  );
  if (to) {
    return (
      <Link to={to} className={cls} aria-label={ariaLabel}>
        {body}
      </Link>
    );
  }
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cls}
        aria-label={ariaLabel}
        aria-current={selected || undefined}
      >
        {body}
      </button>
    );
  }
  return <div className={cls}>{body}</div>;
}

/** Крупный заголовок экрана. */
export function PageHeader({
  title,
  subtitle,
  right,
  className,
}: {
  title: string;
  subtitle?: ReactNode;
  right?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-end justify-between gap-4 pb-4 pt-2", className)}>
      <div className="min-w-0">
        <h1 className="text-large-title">{title}</h1>
        {subtitle && <p className="mt-0.5 text-subhead text-ink-2">{subtitle}</p>}
      </div>
      {right && <div className="flex shrink-0 items-center gap-2 pb-1">{right}</div>}
    </div>
  );
}
