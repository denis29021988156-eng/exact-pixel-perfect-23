import type { ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  /** Скрыть заголовок визуально (остаётся для экранного диктора). */
  hideTitle?: boolean;
  description?: string;
  headerLeft?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  size?: "md" | "lg";
  className?: string;
}

/**
 * Лист в духе iOS: на телефоне выезжает снизу, на планшете — карточка по центру.
 */
export function Sheet({
  open,
  onOpenChange,
  title,
  hideTitle,
  description,
  headerLeft,
  footer,
  children,
  size = "md",
  className,
}: SheetProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          className={cn(
            "fixed inset-0 z-50 bg-[var(--scrim)] backdrop-blur-[2px]",
            "data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out",
          )}
        />
        <Dialog.Content
          // Фокус на сам лист, а не на кнопку «Закрыть» — без лишней рамки при открытии.
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            (e.currentTarget as HTMLElement | null)?.focus();
          }}
          className={cn(
            "glass-strong fixed z-50 flex flex-col overflow-hidden text-foreground outline-none",
            // Телефон: снизу, почти во весь экран.
            "inset-x-0 bottom-0 max-h-[94dvh] rounded-t-sheet border-b-0",
            "data-[state=open]:animate-sheet-up data-[state=closed]:animate-sheet-down",
            // Планшет: по центру.
            "md:inset-auto md:left-1/2 md:top-1/2 md:max-h-[88dvh] md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-sheet md:border-b",
            "md:data-[state=open]:animate-pop-in md:data-[state=closed]:animate-pop-out",
            size === "lg" ? "md:w-[min(760px,92vw)]" : "md:w-[min(600px,92vw)]",
            className,
          )}
        >
          <div className="mx-auto mt-2 h-[5px] w-9 shrink-0 rounded-full bg-ink-3/40 md:hidden" aria-hidden />
          <header className="relative flex min-h-[56px] shrink-0 items-center justify-center px-14">
            {headerLeft && <div className="absolute left-2 top-1/2 -translate-y-1/2">{headerLeft}</div>}
            <Dialog.Title className={cn("truncate text-headline", hideTitle && "sr-only")}>{title}</Dialog.Title>
            <Dialog.Description className="sr-only">{description ?? title}</Dialog.Description>
            <Dialog.Close
              className="press absolute right-3 top-1/2 flex h-[34px] w-[34px] -translate-y-1/2 items-center justify-center rounded-full bg-fill text-ink-2"
              aria-label="Закрыть"
            >
              <X className="h-4 w-4" strokeWidth={2.5} />
            </Dialog.Close>
          </header>
          <div className="sheet-body min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-6 md:px-6">
            {children}
          </div>
          {footer && (
            <div className="shrink-0 border-t border-line px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 md:px-6">
              {footer}
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
