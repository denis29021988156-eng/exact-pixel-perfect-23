import { Toaster as Sonner } from "sonner";

/** Уведомления сверху по центру, как баннеры iOS. */
export function Toaster() {
  return (
    <Sonner
      position="top-center"
      theme="system"
      duration={4500}
      offset={16}
      toastOptions={{
        classNames: {
          toast:
            "!rounded-[16px] !border-0 !bg-elevated !text-foreground !shadow-float !px-4 !py-3 !text-[15px] !font-medium !items-center !gap-3",
          description: "!text-ink-2 !text-[13px]",
          actionButton: "!bg-tint/12 !text-tint !rounded-full !px-3 !h-8 !text-[14px] !font-semibold",
          cancelButton: "!bg-fill !text-foreground !rounded-full",
          error: "!text-critical-ink",
          success: "",
        },
      }}
    />
  );
}
