import { cn } from '@/lib/utils';

type BadgeVariant = 'danger' | 'warning' | 'success' | 'info' | 'muted';

const variantStyles: Record<BadgeVariant, string> = {
  danger: 'bg-danger/15 text-danger border-danger/20',
  warning: 'bg-warning/15 text-warning border-warning/20',
  success: 'bg-success/15 text-success border-success/20',
  info: 'bg-primary/15 text-primary border-primary/20',
  muted: 'bg-muted text-muted-foreground border-border',
};

interface StatusBadgeProps {
  variant: BadgeVariant;
  children: React.ReactNode;
  pulse?: boolean;
  className?: string;
}

export default function StatusBadge({ variant, children, pulse, className }: StatusBadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border',
      variantStyles[variant],
      pulse && 'animate-pulse-danger',
      className
    )}>
      {(variant === 'danger' || variant === 'warning') && (
        <span className={cn(
          'w-1.5 h-1.5 rounded-full',
          variant === 'danger' ? 'bg-danger' : 'bg-warning'
        )} />
      )}
      {children}
    </span>
  );
}
