'use client';

import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

export interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'outline';
  size?: 'sm' | 'md';
  className?: string;
}

export function Badge({ children, variant = 'default', size = 'sm', className }: BadgeProps) {
  const variantStyles = {
    default: 'bg-gray-100 text-gray-700',
    primary: 'bg-blue-100 text-blue-700',
    success: 'bg-green-100 text-green-700',
    warning: 'bg-yellow-100 text-yellow-700',
    danger: 'bg-red-100 text-red-700',
    outline: 'bg-transparent border border-gray-300 text-gray-600',
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
    >
      {children}
    </span>
  );
}

// 文件类型徽章
export function FileTypeBadge({ type }: { type: string }) {
  const typeConfig: Record<string, { label: string; color: string }> = {
    pdf: { label: 'PDF', color: 'bg-red-100 text-red-700' },
    docx: { label: 'Word', color: 'bg-blue-100 text-blue-700' },
    doc: { label: 'Word', color: 'bg-blue-100 text-blue-700' },
    xlsx: { label: 'Excel', color: 'bg-green-100 text-green-700' },
    xls: { label: 'Excel', color: 'bg-green-100 text-green-700' },
    pptx: { label: 'PPT', color: 'bg-orange-100 text-orange-700' },
    ppt: { label: 'PPT', color: 'bg-orange-100 text-orange-700' },
    txt: { label: 'TXT', color: 'bg-gray-100 text-gray-700' },
  };

  const config = typeConfig[type.toLowerCase()] || { label: type.toUpperCase(), color: 'bg-gray-100 text-gray-700' };

  return (
    <span className={cn('px-2 py-0.5 text-xs font-medium rounded', config.color)}>
      {config.label}
    </span>
  );
}
