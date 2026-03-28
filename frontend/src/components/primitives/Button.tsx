import { ReactNode, ButtonHTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'destructive' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className,
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles = 'font-semibold rounded-lg transition-colors inline-flex items-center justify-center gap-2';

  const variantStyles = {
    primary: 'bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white shadow-sm',
    secondary: 'bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 text-white',
    destructive: 'bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white',
    ghost: 'bg-transparent hover:bg-gray-800 text-gray-300 hover:text-white',
  };

  const sizeStyles = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  return (
    <button
      className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
