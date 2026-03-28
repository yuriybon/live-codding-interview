import { ReactNode } from 'react';
import { cn } from '../../utils/cn';

interface SectionHeaderProps {
  children: ReactNode;
  level?: 1 | 2 | 3;
  className?: string;
}

export function SectionHeader({ children, level = 2, className }: SectionHeaderProps) {
  const baseStyles = 'font-bold text-white';

  const levelStyles = {
    1: 'text-4xl md:text-5xl',
    2: 'text-2xl md:text-3xl',
    3: 'text-lg md:text-xl',
  };

  const Component = `h${level}` as keyof JSX.IntrinsicElements;

  return (
    <Component className={cn(baseStyles, levelStyles[level], className)}>
      {children}
    </Component>
  );
}
