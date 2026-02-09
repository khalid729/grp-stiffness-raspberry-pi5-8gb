import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface TestStatusBadgeProps {
  status: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 99 | -1;
}

const statusConfig: Record<number, {
  key: string;
  variant: string;
  animate?: boolean;
}> = {
  [-1]: { key: 'disconnected', variant: 'bg-destructive/20 text-destructive border-destructive/30' },
  0: { key: 'idle', variant: 'bg-muted text-muted-foreground border-border' },
  1: { key: 'initializing', variant: 'bg-info/20 text-info border-info/30', animate: true },
  2: { key: 'zeroing', variant: 'bg-info/20 text-info border-info/30', animate: true },
  3: { key: 'testing', variant: 'bg-warning/20 text-warning border-warning/30', animate: true },
  4: { key: 'recording', variant: 'bg-success/20 text-success border-success/30' },
  5: { key: 'returning', variant: 'bg-info/20 text-info border-info/30', animate: true },
  6: { key: 'complete', variant: 'bg-success/20 text-success border-success/30' },
  99: { key: 'error', variant: 'bg-destructive/20 text-destructive border-destructive/30', animate: true },
};

export function TestStatusBadge({ status }: TestStatusBadgeProps) {
  const { t } = useLanguage();
  const config = statusConfig[status] || statusConfig[0];
  
  return (
    <span className={cn(
      'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold border',
      config.variant,
      config.animate && 'animate-pulse-glow'
    )}>
      {config.animate && (
        <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
      )}
      {t(`status.${config.key}`)}
    </span>
  );
}
