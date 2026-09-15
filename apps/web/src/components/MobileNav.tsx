'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, CalendarDays, BookCheck, Map, BarChart3, ShieldHalf, Trophy, Users, LogIn } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUserRole } from '@/context/UserRoleContext';

export function MobileNav() {
  const pathname = usePathname();
  const { isAuthenticated, currentRole } = useUserRole();

  if (!isAuthenticated) {
    return (
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border py-2 px-6 flex items-center justify-around shadow-lg">
        <Link
          href="/login"
          className="flex items-center gap-2 py-1.5 px-4 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-xs"
        >
          <LogIn className="w-4 h-4" />
          <span>Sign In to TurfHub</span>
        </Link>
      </nav>
    );
  }

  const items = currentRole === 'PLAYER' ? [
    { name: 'Passes', href: '/', icon: LayoutDashboard },
    { name: 'Bookings', href: '/bookings', icon: BookCheck },
    { name: 'Teams', href: '/teams', icon: ShieldHalf },
    { name: 'Tournaments', href: '/tournaments', icon: Trophy },
  ] : currentRole === 'STAFF' ? [
    { name: 'Schedule', href: '/', icon: LayoutDashboard },
    { name: 'Calendar', href: '/calendar', icon: CalendarDays },
    { name: 'Check-in', href: '/bookings', icon: BookCheck },
    { name: 'Customers', href: '/customers', icon: Users },
  ] : [
    { name: 'Home', href: '/', icon: LayoutDashboard },
    { name: 'Calendar', href: '/calendar', icon: CalendarDays },
    { name: 'Bookings', href: '/bookings', icon: BookCheck },
    { name: 'Turfs', href: '/turfs', icon: Map },
    { name: 'Reports', href: '/reports', icon: BarChart3 },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border py-2 px-3 flex items-center justify-around shadow-lg">
      {items.map((item) => {
        const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
        return (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              'flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-xl transition-all duration-200',
              isActive ? 'text-primary font-bold' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <item.icon className={cn('w-5 h-5', isActive ? 'text-primary scale-110' : 'text-muted-foreground')} />
            <span className="text-[10px] tracking-tight">{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}

