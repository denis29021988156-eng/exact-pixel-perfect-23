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
      className={cn("flex w-full rounded-full bg-fill p-[3px] md:w-auto md:min-w-[420px]", className)}
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
              "flex min-h-[36px] flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-3.5 text-[14.5px] transition-all duration-200",
              active
                ? "bg-white font-semibold text-foreground shadow-[0_2px_10px_rgb(14_26_51/0.14)] dark:bg-white/15 dark:shadow-none"
                : "text-foreground/75 hover:text-foreground",
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
