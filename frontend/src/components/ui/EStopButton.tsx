import { cn } from '@/lib/utils';
import { forwardRef } from 'react';
import { OctagonX } from 'lucide-react';

interface EStopButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: 'md' | 'lg' | 'xl';
  label?: string;
}

export const EStopButton = forwardRef<HTMLButtonElement, EStopButtonProps>(
  ({ className, size = 'lg', label = 'E-STOP', ...props }, ref) => {
    const sizeStyles = {
      md: 'w-24 h-24',
      lg: 'w-32 h-32',
      xl: 'w-40 h-40',
    };

    const innerSizeStyles = {
      md: 'w-16 h-16',
      lg: 'w-22 h-22',
      xl: 'w-28 h-28',
    };

    const iconSizes = {
      md: 'w-6 h-6',
      lg: 'w-8 h-8',
      xl: 'w-10 h-10',
    };

    const textSizes = {
      md: 'text-[10px]',
      lg: 'text-xs',
      xl: 'text-sm',
    };

    return (
      <button
        ref={ref}
        className={cn(
          'e-stop-circular group relative flex items-center justify-center',
          'touch-none select-none cursor-pointer',
          'transition-transform duration-150',
          'active:scale-95',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {/* Outer Yellow Ring - Safety Border */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-b from-yellow-400 via-yellow-500 to-yellow-600 shadow-[0_4px_20px_rgba(234,179,8,0.5)]" />
        
        {/* Black Ring - Industrial Frame */}
        <div className="absolute inset-2 rounded-full bg-gradient-to-b from-zinc-800 via-zinc-900 to-black" />
        
        {/* Red Button Base - 3D Effect */}
        <div 
          className={cn(
            'absolute rounded-full',
            'bg-gradient-to-b from-red-500 via-red-600 to-red-800',
            'shadow-[inset_0_-4px_10px_rgba(0,0,0,0.4),inset_0_4px_10px_rgba(255,255,255,0.2)]',
            'group-hover:from-red-400 group-hover:via-red-500 group-hover:to-red-700',
            'group-active:from-red-700 group-active:via-red-800 group-active:to-red-900',
            'group-active:shadow-[inset_0_4px_10px_rgba(0,0,0,0.5)]',
            'transition-all duration-150',
            size === 'md' && 'inset-4',
            size === 'lg' && 'inset-5',
            size === 'xl' && 'inset-6'
          )}
        />
        
        {/* Inner Button Surface with Icon */}
        <div 
          className={cn(
            'relative z-10 flex flex-col items-center justify-center gap-1',
            'text-white font-bold uppercase tracking-wider',
            innerSizeStyles[size]
          )}
        >
          <OctagonX className={cn(iconSizes[size], 'drop-shadow-lg')} />
          <span className={cn(textSizes[size], 'drop-shadow-lg font-extrabold')}>{label}</span>
        </div>

        {/* Animated Glow Effect */}
        <div className="absolute inset-0 rounded-full animate-e-stop-pulse pointer-events-none" />
      </button>
    );
  }
);

EStopButton.displayName = 'EStopButton';
