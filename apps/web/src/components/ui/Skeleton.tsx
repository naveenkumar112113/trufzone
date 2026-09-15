import React from 'react';
import { cn } from '@/lib/utils';

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-shimmer bg-gradient-to-r from-muted/50 via-muted to-muted/50 bg-[length:400%_100%] rounded-md", className)}
      {...props}
    />
  );
}
