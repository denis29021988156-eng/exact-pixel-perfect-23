import {
  forwardRef,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

/** Группа полей на белой карточке. */
export function FormGroup({
  title,
  footer,
  children,
  className,
}: {
  title?: string;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      {title && <div className="px-4 pb-2 text-footnote uppercase tracking-wide text-ink-2">{title}</div>}
      <div className="surface rows overflow-hidden">{children}</div>
      {footer && <p className="px-4 pt-2 text-footnote text-ink-2">{footer}</p>}
    </div>
  );
}

/** Поле: подпись слева, значение справа (выбор, дата, число). */
export function FieldRow({ label, htmlFor, children }: { label: string; htmlFor?: string; children: ReactNode }) {
  return (
    <div className="flex min-h-[48px] items-center gap-3 px-4 py-1.5">
      <label htmlFor={htmlFor} className="shrink-0 text-[16px]">
        {label}
      </label>
      <div className="flex min-w-0 flex-1 justify-end">{children}</div>
    </div>
  );
}

/** Поле: подпись над полем ввода во всю ширину. */
export function FieldStack({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="px-4 py-3">
      <label htmlFor={htmlFor} className="block text-footnote text-ink-2">
        {label}
      </label>
      <div className="mt-1">{children}</div>
      {hint && <p className="mt-1 text-caption text-ink-3">{hint}</p>}
    </div>
  );
}

export const TextInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function TextInput(
  { className, ...rest },
  ref,
) {
  return (
    <input
      ref={ref}
      className={cn("w-full bg-transparent text-[17px] outline-none placeholder:text-ink-3", className)}
      {...rest}
    />
  );
});

export const TextArea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function TextArea(
  { className, rows = 3, ...rest },
  ref,
) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={cn(
        "w-full resize-none bg-transparent text-[17px] leading-[22px] outline-none placeholder:text-ink-3",
        className,
      )}
      {...rest}
    />
  );
});

export const SelectInput = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function SelectInput(
  { className, children, ...rest },
  ref,
) {
  return (
    <span className="relative inline-flex min-w-0 max-w-full items-center">
      <select
        ref={ref}
        className={cn(
          "min-w-0 max-w-full cursor-pointer appearance-none truncate bg-transparent py-2 pl-2 pr-6 text-right text-[16px] text-ink-2 outline-none",
          className,
        )}
        {...rest}
      >
        {children}
      </select>
      <ChevronsUpDown className="pointer-events-none absolute right-0 h-4 w-4 text-ink-3" aria-hidden />
    </span>
  );
});

export const DateInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function DateInput(
  { className, ...rest },
  ref,
) {
  return (
    <input
      ref={ref}
      type="date"
      className={cn(
        "min-h-[34px] rounded-[8px] bg-fill px-2.5 text-right text-[16px] text-foreground outline-none",
        className,
      )}
      {...rest}
    />
  );
});
