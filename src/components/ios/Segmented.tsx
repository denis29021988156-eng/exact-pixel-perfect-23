import { cn } from "@/lib/utils";

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
  count?: number;
}

/** Переключатель-сегменты в духе iOS. */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  className,
  ariaLabel,
}: {
  value: T;
  // Тип значения берём из value, а не из подписей сегментов.
  onChange: (v: NoInfer<T>) => void;
  options: SegmentOption<NoInfer<T>>[];
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn("flex w-full rounded-[10px] bg-fill p-[2px] md:w-auto md:min-w-[420px]", className)}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={cn(
              "flex min-h-[34px] flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-[8px] px-3 text-[14px] transition-all",
              active
                ? "bg-card font-semibold shadow-[0_1px_3px_rgb(0_0_0/0.12)] dark:bg-elevated"
                : "text-foreground/80",
            )}
          >
            {o.label}
            {o.count !== undefined && o.count > 0 && (
              <span className={cn("tabular-nums", active ? "text-ink-2" : "text-ink-3")}>{o.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
