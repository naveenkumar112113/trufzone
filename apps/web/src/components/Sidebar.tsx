'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, CalendarDays, BookCheck, Map, 
  Users, IndianRupee, Tag, Star, BarChart3, 
  Trophy, ShieldHalf, UserCircle2, 
  Settings, HelpCircle, Bell, LogOut,
  MapPin, Sparkles, CreditCard, UserCheck, LogIn
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUserRole } from '@/context/UserRoleContext';

export default function Sidebar() {
  const pathname = usePathname();
  const { currentRole, user, isAuthenticated, logout } = useUserRole();

  // If not authenticated, render clean public navigation
  if (!isAuthenticated || !user) {
    return (
      <aside className="hidden lg:flex w-64 flex-col fixed inset-y-0 bg-card border-r border-border z-50 transition-colors">
        <div className="flex h-16 shrink-0 items-center px-6 border-b border-border bg-card">
          <Link href="/login" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-primary/25 group-hover:scale-105 transition-transform">
              <MapPin className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-foreground leading-none">
                TurfHub
              </span>
              <span className="text-[10px] font-medium text-muted-foreground tracking-tight block mt-0.5">
                Sports Venue Network
              </span>
            </div>
          </Link>
        </div>

        <div className="flex-1 px-4 py-6 space-y-4">
          <div className="p-4 rounded-2xl bg-muted/40 border border-border text-center space-y-3">
            <Sparkles className="w-6 h-6 text-primary mx-auto" />
            <div className="space-y-1">
              <h4 className="text-xs font-black text-foreground">Welcome to TurfHub</h4>
              <p className="text-[11px] text-muted-foreground">
                Sign in to manage venues, book courts, and view match passes.
              </p>
            </div>
            <Link
              href="/login"
              className="w-full py-2 px-3 rounded-xl bg-primary text-primary-foreground text-xs font-bold transition-all flex items-center justify-center gap-2 hover:bg-primary/90"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
            </Link>
          </div>
        </div>
      </aside>
    );
  }

  const roleTag = 
    currentRole === 'TURF_OWNER' || currentRole === 'TURF_ADMIN' ? 'OWNER' : 
    currentRole === 'STAFF' ? 'STAFF' : 
    currentRole === 'PLAYER' ? 'PLAYER' : 'ADMIN';

  // Role-specific navigation items
  const navGroups = currentRole === 'PLAYER' ? [
    {
      title: 'PLAYER PORTAL',
      items: [
        { name: 'Match Passes', href: '/', icon: LayoutDashboard },
        { name: 'My Bookings', href: '/bookings', icon: BookCheck },
      ]
    },
    {
      title: 'COMMUNITY',
      items: [
        { name: 'My Teams', href: '/teams', icon: ShieldHalf },
        { name: 'Tournaments', href: '/tournaments', icon: Trophy },
      ]
    },
    {
      title: 'SUPPORT',
      items: [
        { name: 'Help & Support', href: '/support', icon: HelpCircle },
      ]
    }
  ] : currentRole === 'STAFF' ? [
    {
      title: 'GROUND OPERATIONS',
      items: [
        { name: 'Today Schedule', href: '/', icon: LayoutDashboard },
        { name: 'Calendar', href: '/calendar', icon: CalendarDays },
        { name: 'Bookings Check-in', href: '/bookings', icon: BookCheck },
      ]
    },
    {
      title: 'CRM',
      items: [
        { name: 'Customers', href: '/customers', icon: Users },
        { name: 'Reviews', href: '/reviews', icon: Star },
      ]
    },
    {
      title: 'SYSTEM',
      items: [
        { name: 'Help & Support', href: '/support', icon: HelpCircle },
      ]
    }
  ] : [
    // TURF_OWNER / TURF_ADMIN / ADMIN
    {
      title: 'MAIN',
      items: [
        { name: 'Overview', href: '/', icon: LayoutDashboard },
        { name: 'Calendar', href: '/calendar', icon: CalendarDays },
        { name: 'Bookings', href: '/bookings', icon: BookCheck },
        { name: 'My Turfs', href: '/turfs', icon: Map },
      ]
    },
    {
      title: 'BUSINESS',
      items: [
        { name: 'Customers', href: '/customers', icon: Users },
        { name: 'Pricing Tiers', href: '/pricing', icon: IndianRupee },
        { name: 'Offers & Campaigns', href: '/offers', icon: Tag },
        { name: 'Reviews', href: '/reviews', icon: Star },
        { name: 'Financial Reports', href: '/reports', icon: BarChart3 },
      ]
    },
    {
      title: 'MANAGEMENT',
      items: [
        { name: 'Tournaments', href: '/tournaments', icon: Trophy },
        { name: 'Ground Staff', href: '/staff', icon: UserCheck },
        { name: 'Payments', href: '/payments', icon: CreditCard },
        { name: 'Notifications', href: '/notifications', icon: Bell },
      ]
    },
    {
      title: 'SYSTEM',
      items: [
        { name: 'Settings', href: '/settings', icon: Settings },
        { name: 'Help & Support', href: '/support', icon: HelpCircle },
      ]
    }
  ];

  return (
    <aside className="hidden lg:flex w-64 flex-col fixed inset-y-0 bg-card border-r border-border z-50 transition-colors">
      {/* Brand Header */}
      <div className="flex h-16 shrink-0 items-center px-6 border-b border-border bg-card">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-primary/25 group-hover:scale-105 transition-transform">
            <MapPin className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-black tracking-tight text-foreground leading-none">
                TurfHub
              </span>
              <span className={cn(
                'text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded border',
                (currentRole === 'TURF_OWNER' || currentRole === 'TURF_ADMIN') && 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
                currentRole === 'STAFF' && 'bg-blue-500/20 text-blue-400 border-blue-500/30',
                currentRole === 'PLAYER' && 'bg-amber-500/20 text-amber-400 border-amber-500/30',
                currentRole === 'ADMIN' && 'bg-purple-500/20 text-purple-400 border-purple-500/30'
              )}>
                {roleTag}
              </span>
            </div>
            <span className="text-[10px] font-medium text-muted-foreground tracking-tight block mt-0.5">
              Run your turf. Grow your game.
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar px-3 py-4 space-y-5">
        
        {/* Special Player Portal banner if player */}
        {currentRole === 'PLAYER' && (
          <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-500/15 via-amber-500/5 to-transparent border border-amber-500/30 space-y-2">
            <div className="flex items-center gap-1.5 text-amber-400 text-xs font-black">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Player Booking Portal</span>
            </div>
            <p className="text-[10px] text-muted-foreground leading-snug">
              Book live pitches in Tirunelveli with verified match passes.
            </p>
            <Link
              href="/public"
              className="w-full py-1.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-black transition-colors flex items-center justify-center gap-1.5 shadow-xs"
            >
              <span>Explore Public Turfs</span>
              <MapPin className="w-3 h-3" />
            </Link>
          </div>
        )}

        {/* Special Staff Operations banner if staff */}
        {currentRole === 'STAFF' && (
          <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/25 space-y-1.5">
            <div className="flex items-center gap-1.5 text-blue-400 text-xs font-black">
              <UserCheck className="w-3.5 h-3.5" />
              <span>Ground Operations Shift</span>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Vannarpettai Ground Counter · Match Check-in & Walk-ins
            </p>
          </div>
        )}

        {navGroups.map((group) => (
          <div key={group.title}>
            <h3 className="px-3 text-[10px] font-black uppercase tracking-wider text-muted-foreground/80 mb-1.5">
              {group.title}
            </h3>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={cn(
                        'group flex items-center justify-between rounded-xl px-3 py-2 text-xs font-bold transition-all relative',
                        isActive 
                          ? 'text-primary bg-primary/10 font-black shadow-xs' 
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      )}
                    >
                      {isActive && (
                        <div className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-primary rounded-r-full" />
                      )}
                      <div className="flex items-center gap-x-2.5">
                        <item.icon 
                          className={cn(
                            'h-4 w-4 shrink-0 transition-transform group-hover:scale-110', 
                            isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                          )} 
                        />
                        <span>{item.name}</span>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {/* Dynamic Profile Footer */}
      <div className="p-3 border-t border-border bg-muted/10">
        <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted/80 transition-colors group">
          <div className={cn(
            'w-10 h-10 rounded-full border flex items-center justify-center relative font-bold text-sm shrink-0',
            (currentRole === 'TURF_OWNER' || currentRole === 'TURF_ADMIN') && 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400',
            currentRole === 'STAFF' && 'bg-blue-500/20 border-blue-500/40 text-blue-400',
            currentRole === 'PLAYER' && 'bg-amber-500/20 border-amber-500/40 text-amber-400',
            currentRole === 'ADMIN' && 'bg-purple-500/20 border-purple-500/40 text-purple-400'
          )}>
            {user.avatar || user.name.slice(0, 2).toUpperCase()}
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-card" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-foreground truncate">{user.name}</p>
            <p className="text-[10px] text-muted-foreground truncate">{user.title || user.role}</p>
          </div>
          <button 
            title="Sign Out" 
            onClick={() => logout()}
            className="p-2 rounded-lg hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}


