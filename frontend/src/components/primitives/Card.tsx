import { ReactNode } from 'react';
import { cn } from '../../utils/cn';

interface CardProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'elevated';
  className?: string;
}

export function Card({ children, variant = 'primary', className }: CardProps) {
  const baseStyles = 'rounded-xl';

  const variantStyles = {
    primary: 'bg-gray-800 p-6 shadow-xl',
    secondary: 'bg-gray-800/50 p-6',
    elevated: 'bg-gray-800 p-8 shadow-2xl',
  };

  return (
    <div className={cn(baseStyles, variantStyles[variant], className)}>
      {children}
    </div>
  );
}
