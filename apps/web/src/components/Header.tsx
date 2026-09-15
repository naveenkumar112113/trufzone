'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Bell, Calendar as CalendarIcon, 
  Sun, Moon, ShieldCheck, MapPin, Sparkles, UserCheck, Shield, LogOut
} from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';
import { useUserRole } from '@/context/UserRoleContext';
import { cn } from '@/lib/utils';

export default function Header() {
  const { theme, toggleTheme } = useTheme();
  const { currentRole, user, isAuthenticated, logout } = useUserRole();

  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'short', 
    day: 'numeric', 
    month: 'short', 
    year: 'numeric' 
  });

  if (!isAuthenticated || !user) {
    return (
      <header className="h-16 border-b border-border bg-card/80 backdrop-blur-md px-4 sm:px-8 flex items-center justify-between sticky top-0 z-40 transition-colors">
        <div className="flex items-center gap-2">
          <Link href="/public" className="flex items-center gap-2 font-black text-base text-foreground">
            <span className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-black text-xs">
              TH
            </span>
            <span>TurfHub Sports Network</span>
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary-hover transition-colors shadow-sm"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="px-4 py-2 rounded-xl border border-border text-foreground text-xs font-bold hover:bg-muted transition-colors"
          >
            Register
          </Link>
        </div>
      </header>
    );
  }

  return (
    <header className="h-16 border-b border-border bg-card/80 backdrop-blur-md px-4 sm:px-8 flex items-center justify-between sticky top-0 z-40 transition-colors">
      
      {/* Left side: Greeting & Arena Venue */}
      <div className="flex items-center gap-4">
        <div>
          <h2 className="text-sm sm:text-base font-extrabold text-foreground flex items-center gap-2">
            <span>Good {new Date().getHours() < 12 ? 'morning' : (new Date().getHours() < 17 ? 'afternoon' : 'evening')}, {user.name.split(' ')[0]}</span>
            <span className="inline-block animate-wave origin-[70%_70%]">👋</span>
          </h2>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
            <MapPin className="w-3 h-3 text-primary shrink-0" />
            <span className="truncate max-w-[200px] sm:max-w-[320px] font-medium">
              {user.venueName || 'Tirunelveli Sports Network'}
            </span>
          </div>
        </div>
      </div>

      {/* Right side: Role Badge, Date, Theme, Notifications & User Avatar */}
      <div className="flex items-center gap-2 sm:gap-4">
        
        {/* Authenticated Role Badge */}
        <div className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border shadow-xs',
          user.badgeBg
        )}>
          <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
          <span>{user.roleBadge}</span>
        </div>

        {/* Date Selector Badge */}
        <div className="hidden md:flex items-center bg-muted/60 rounded-full px-3.5 py-1.5 border border-border text-xs font-medium text-foreground">
          <CalendarIcon className="w-3.5 h-3.5 text-primary mr-2 shrink-0" />
          <span className="font-bold text-foreground mr-1.5">Today</span>
          <span className="text-muted-foreground">{today}</span>
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Sports Mode'}
          aria-label="Toggle Theme"
          className="w-9 h-9 rounded-full bg-muted/50 hover:bg-muted border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400 hover:rotate-45 transition-transform" />
          ) : (
            <Moon className="w-4 h-4 text-primary hover:-rotate-12 transition-transform" />
          )}
        </button>

        {/* Notifications Icon with link to /notifications */}
        <Link
          href="/notifications"
          className="w-9 h-9 rounded-full bg-muted/50 hover:bg-muted border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors relative"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-card animate-pulse" />
        </Link>

        {/* User Avatar & Logout */}
        <div className="flex items-center gap-2 pl-2 border-l border-border">
          <div className={cn(
            'w-8 h-8 rounded-full border flex items-center justify-center font-black text-xs transition-colors',
            (currentRole === 'TURF_OWNER' || currentRole === 'TURF_ADMIN') && 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400',
            currentRole === 'STAFF' && 'bg-blue-500/20 border-blue-500/40 text-blue-400',
            currentRole === 'PLAYER' && 'bg-amber-500/20 border-amber-500/40 text-amber-400',
            currentRole === 'ADMIN' && 'bg-purple-500/20 border-purple-500/40 text-purple-400'
          )}>
            {user.avatar ? (
              user.avatar.startsWith('http') ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
              ) : (
                user.avatar
              )
            ) : (
              user.name.slice(0, 2).toUpperCase()
            )}
          </div>
          <button
            onClick={() => logout()}
            title="Sign Out"
            className="p-1.5 rounded-lg hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
