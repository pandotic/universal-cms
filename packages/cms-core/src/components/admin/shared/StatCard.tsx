import React from 'react';
import type { LucideIcon } from 'lucide-react';

export interface StatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'gray';
  onClick?: () => void;
  subtitle?: string;
}

const COLOR_MAP: Record<string, { bg: string; icon: string; text: string }> = {
  blue:   { bg: 'bg-blue-50',   icon: 'text-blue-600',   text: 'text-blue-900' },
  green:  { bg: 'bg-green-50',  icon: 'text-green-600',  text: 'text-green-900' },
  purple: { bg: 'bg-purple-50', icon: 'text-purple-600', text: 'text-purple-900' },
  orange: { bg: 'bg-orange-50', icon: 'text-orange-600', text: 'text-orange-900' },
  red:    { bg: 'bg-red-50',    icon: 'text-red-600',    text: 'text-red-900' },
  gray:   { bg: 'bg-gray-50',   icon: 'text-gray-600',   text: 'text-gray-900' },
};

export function StatCard({ title, value, icon: Icon, color = 'blue', onClick, subtitle }: StatCardProps) {
  const colors = COLOR_MAP[color] ?? COLOR_MAP.blue;

  const Wrapper = onClick ? 'button' : 'div';

  return (
    <Wrapper
      onClick={onClick}
      className={`
        ${colors.bg} rounded-lg p-6 transition-shadow
        ${onClick ? 'cursor-pointer hover:shadow-md' : ''}
      `}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className={`text-2xl font-bold ${colors.text} mt-1`}>{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`${colors.icon}`}>
          <Icon className="h-8 w-8" />
        </div>
      </div>
    </Wrapper>
  );
}
