import React from 'react';
import { cn } from '@/lib/utils';

export type StatusType = 
  | 'confirmed' 
  | 'pending' 
  | 'completed' 
  | 'cancelled' 
  | 'maintenance' 
  | 'available' 
  | 'booked' 
  | 'paid' 
  | 'refunded'
  | 'active'
  | 'inactive';

interface StatusBadgeProps {
  status: StatusType | string;
  className?: string;
  dot?: boolean;
}

export function StatusBadge({ status, className, dot = true }: StatusBadgeProps) {
  const s = status.toLowerCase();

  const getStyle = () => {
    switch (s) {
      case 'confirmed':
      case 'paid':
      case 'active':
      case 'completed':
        return {
          bg: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
          dot: 'bg-emerald-500',
        };
      case 'pending':
      case 'processing':
        return {
          bg: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
          dot: 'bg-amber-500',
        };
      case 'cancelled':
      case 'refunded':
      case 'inactive':
      case 'danger':
        return {
          bg: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
          dot: 'bg-rose-500',
        };
      case 'maintenance':
      case 'blocked':
        return {
          bg: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
          dot: 'bg-blue-400',
        };
      case 'available':
        return {
          bg: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
          dot: 'bg-zinc-400',
        };
      case 'booked':
        return {
          bg: 'bg-primary/15 text-primary border-primary/30',
          dot: 'bg-primary',
        };
      default:
        return {
          bg: 'bg-muted text-muted-foreground border-border',
          dot: 'bg-muted-foreground',
        };
    }
  };

  const style = getStyle();

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide uppercase border',
        style.bg,
        className
      )}
    >
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', style.dot)} />}
      {status}
    </span>
  );
}
