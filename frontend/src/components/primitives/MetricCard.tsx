import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '../../utils/cn';

interface MetricCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  className?: string;
}

export function MetricCard({ icon: Icon, label, value, className }: MetricCardProps) {
  return (
    <div className={cn('bg-gray-800 rounded-xl p-4 text-center', className)}>
      <div className="flex flex-col items-center gap-2">
        <Icon className="w-8 h-8 text-blue-400" />
        <p className="text-2xl font-bold text-white">{value}</p>
        <p className="text-sm text-gray-400">{label}</p>
      </div>
    </div>
  );
}
