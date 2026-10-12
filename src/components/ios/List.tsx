import { useContext, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { HeaderAccessoryContext } from "@/contexts/headerAccessory";
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
          {title ? <h2 className="text-[15px] font-semibold text-ink-2">{title}</h2> : <span />}
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

/** Крупный заголовок экрана; справа — действия экрана и профиль (его подставляет раскладка). */
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
  const accessory = useContext(HeaderAccessoryContext);
  return (
    <div className={cn("pb-5 pt-3 md:pb-6 md:pt-7", className)}>
      <div className="flex items-center justify-between gap-3">
        <h1 className="min-w-0 truncate text-large-title md:text-[44px] md:leading-[52px]">{title}</h1>
        {(right || accessory) && (
          <div className="flex shrink-0 items-center gap-2">
            {right}
            {accessory}
          </div>
        )}
      </div>
      {subtitle && (
        <p className="mt-0.5 text-[16px] leading-[21px] text-ink-2 md:text-[17px] md:leading-[22px]">{subtitle}</p>
      )}
    </div>
  );
}
