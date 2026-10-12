import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "filled" | "tinted" | "gray" | "plain" | "destructive" | "destructive-tinted" | "good";
type Size = "lg" | "md" | "sm";

const variants: Record<Variant, string> = {
  filled: "bg-tint text-white",
  tinted: "bg-tint/12 text-tint",
  gray: "bg-fill text-foreground",
  plain: "bg-transparent text-tint",
  destructive: "bg-critical text-white",
  "destructive-tinted": "bg-critical/12 text-critical-ink",
  good: "bg-good text-white",
};

const sizes: Record<Size, string> = {
  lg: "min-h-[50px] px-5 text-[17px] rounded-[14px]",
  md: "min-h-[44px] px-4 text-[16px] rounded-[12px]",
  sm: "min-h-[32px] px-3 text-[15px] rounded-full",
};

export interface IosButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
  block?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, IosButtonProps>(function Button(
  { variant = "filled", size = "md", loading, icon, block, className, children, disabled, type = "button", ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        "press inline-flex select-none items-center justify-center gap-2 font-semibold leading-tight",
        "disabled:pointer-events-none disabled:opacity-40",
        variants[variant],
        sizes[size],
        block && "w-full",
        className,
      )}
      {...rest}
    >
      {loading ? <Loader2 className="h-[18px] w-[18px] shrink-0 animate-spin" aria-hidden /> : icon}
      {children}
    </button>
  );
});
