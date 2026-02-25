'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';

interface CategoryBadgeProps {
  name: string;
  slug: string;
  color?: string | null;
  size?: 'sm' | 'md';
  clickable?: boolean;
}

export function CategoryBadge({ 
  name, 
  slug, 
  color = '#6B7280', 
  size = 'sm',
  clickable = true 
}: CategoryBadgeProps) {
  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
  };

  const badge = (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full transition-colors',
        sizeStyles[size],
        clickable && 'hover:opacity-80'
      )}
      style={{
        backgroundColor: `${color}20`,
        color: color || '#6B7280',
      }}
    >
      {name}
    </span>
  );

  if (clickable) {
    return (
      <Link href={`/category/${slug}`}>
        {badge}
      </Link>
    );
  }

  return badge;
}
