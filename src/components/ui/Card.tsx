'use client';

import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

export interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export function Card({ children, className, hover, onClick }: CardProps) {
  return (
    <div
      className={cn(
        'bg-white/90 backdrop-blur-md rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)]',
        hover && 'hover:shadow-[0_12px_40px_rgb(0,0,0,0.08)] transition-all cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('px-8 py-6', className)}>
      {children}
    </div>
  );
}

export function CardContent({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('px-8 py-6', className)}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('px-8 py-6 bg-black/5 rounded-b-[32px]', className)}>
      {children}
    </div>
  );
}
