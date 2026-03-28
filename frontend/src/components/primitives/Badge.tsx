import { ReactNode } from 'react';
import { cn } from '../../utils/cn';

interface BadgeProps {
  children: ReactNode;
  status?: 'info' | 'success' | 'warning' | 'error';
  className?: string;
}

export function Badge({ children, status = 'info', className }: BadgeProps) {
  const baseStyles = 'rounded text-sm font-medium px-3 py-1 inline-block';

  const statusStyles = {
    info: 'bg-blue-900/30 text-blue-300',
    success: 'bg-green-900/30 text-green-300',
    warning: 'bg-yellow-900/30 text-yellow-300',
    error: 'bg-red-900/30 text-red-300',
  };

  return (
    <span className={cn(baseStyles, statusStyles[status], className)}>
      {children}
    </span>
  );
}
