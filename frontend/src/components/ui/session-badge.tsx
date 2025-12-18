import { cn } from '@/lib/utils';

interface SessionBadgeProps {
  colorIndex: number;
  children: React.ReactNode;
  className?: string;
  variant?: 'solid' | 'light';
}

export function SessionBadge({ colorIndex, children, className, variant = 'light' }: SessionBadgeProps) {
  const colorClasses: Record<number, { solid: string; light: string }> = {
    1: { solid: 'bg-session-1 text-primary-foreground', light: 'session-1-light' },
    2: { solid: 'bg-session-2 text-primary-foreground', light: 'session-2-light' },
    3: { solid: 'bg-session-3 text-primary-foreground', light: 'session-3-light' },
    4: { solid: 'bg-session-4 text-primary-foreground', light: 'session-4-light' },
    5: { solid: 'bg-session-5 text-primary-foreground', light: 'session-5-light' },
    6: { solid: 'bg-session-6 text-primary-foreground', light: 'session-6-light' },
    7: { solid: 'bg-session-7 text-foreground', light: 'session-7-light' },
    8: { solid: 'bg-session-8 text-primary-foreground', light: 'session-8-light' },
  };

  const colors = colorClasses[colorIndex] || colorClasses[1];

  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium",
      variant === 'solid' ? colors.solid : colors.light,
      className
    )}>
      {children}
    </span>
  );
}
