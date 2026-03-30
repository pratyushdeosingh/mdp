import type { CSSProperties, ReactNode, KeyboardEvent, HTMLAttributes } from 'react';

interface GlassCardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onClick'> {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  onClick?: () => void;
}

export default function GlassCard({ children, className = '', style, onClick, ...rest }: GlassCardProps) {
  // Handle keyboard activation for clickable cards
  const handleKeyDown = onClick
    ? (e: KeyboardEvent<HTMLDivElement>) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }
    : undefined;

  return (
    <div
      className={`glass-card p-5 ${onClick ? 'cursor-pointer' : ''} ${className}`}
      style={style}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      {...rest}
    >
      {children}
    </div>
  );
}
