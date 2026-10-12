import { useId } from "react";
import { cn } from "@/lib/utils";

/** Значок продукта: растущая линия индекса доверия на синем фоне. */
export function AppMark({ className, size = 56 }: { className?: string; size?: number }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      className={cn("shrink-0", className)}
      role="img"
      aria-label="Планшет губернатора"
    >
      <defs>
        <linearGradient id={`g${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2F8BFF" />
          <stop offset="1" stopColor="#5856D6" />
        </linearGradient>
      </defs>
      <rect width="120" height="120" rx="27" fill={`url(#g${id})`} />
      <path
        d="M24 78 L44 62 L58 70 L76 46 L96 38"
        fill="none"
        stroke="#fff"
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="96" cy="38" r="8.5" fill="#fff" />
      <path d="M24 92 H96" stroke="#fff" strokeOpacity="0.35" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}
