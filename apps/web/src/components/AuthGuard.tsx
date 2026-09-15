'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useUserRole } from '@/context/UserRoleContext';
import { ShieldAlert, ArrowLeft, LogOut, MapPin, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface AuthGuardProps {
  children: React.ReactNode;
}

// Public authentication routes accessible while logged out
const PUBLIC_AUTH_ROUTES = ['/login', '/signup', '/forgot-password', '/reset-password'];

// All routes accessible without logging in
const PUBLIC_ROUTES = [
  ...PUBLIC_AUTH_ROUTES,
  '/public'
];

// Routes forbidden for standard Player accounts
const OWNER_ONLY_ROUTES = [
  '/turfs',
  '/pricing',
  '/reports',
  '/staff',
  '/payments',
  '/customers',
  '/calendar',
  '/offers',
  '/reviews'
];

export default function AuthGuard({ children }: AuthGuardProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading, currentRole, logout } = useUserRole();

  const isPublicRoute = PUBLIC_ROUTES.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  );

  const isPublicAuthRoute = pathname === '/login' || pathname.startsWith('/login/') ||
    pathname === '/signup' || pathname.startsWith('/signup/');

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated && !isPublicRoute) {
        // Redirect unauthenticated users to login with return path
        router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      } else if (isAuthenticated && isPublicAuthRoute) {
        // Already logged in, redirect away from login/signup pages to dashboard/home
        router.replace('/');
      }
    }
  }, [isAuthenticated, isLoading, isPublicRoute, isPublicAuthRoute, pathname, router]);

  // 1. Loading session verification
  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background text-foreground space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-primary/20 border border-primary/40 flex items-center justify-center animate-pulse">
          <MapPin className="w-6 h-6 text-primary animate-bounce" />
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
          <span>Verifying security session...</span>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated user on protected route: do NOT render sensitive content
  if (!isAuthenticated && !isPublicRoute) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background text-foreground p-6">
        <div className="max-w-md w-full p-6 rounded-3xl bg-card border border-border shadow-xl text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-500 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-foreground">Authentication Required</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Please sign in to access TurfZone features and protected data.
            </p>
          </div>
          <Link
            href={`/login?redirect=${encodeURIComponent(pathname)}`}
            className="w-full py-2.5 px-4 bg-primary text-primary-foreground font-bold rounded-xl text-xs flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  // 3. Role-based authorization guard (e.g. Player accessing Owner/Admin management pages)
  if (isAuthenticated && currentRole === 'PLAYER') {
    const isOwnerRoute = OWNER_ONLY_ROUTES.some(route => 
      pathname === route || pathname.startsWith(`${route}/`)
    );

    if (isOwnerRoute) {
      return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center p-6">
          <div className="max-w-md w-full p-6 sm:p-8 rounded-3xl bg-card border border-rose-500/30 shadow-2xl text-center space-y-5 relative overflow-hidden">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                403 Forbidden
              </span>
              <h2 className="text-xl font-black text-foreground">
                Turf Admin Access Required
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Your account is authenticated as a <strong>Player</strong>. You do not have permission to access venue configuration, financials, or ground administration tools.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
              <Link
                href="/"
                className="w-full py-2.5 px-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold transition-all flex items-center justify-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Player Home</span>
              </Link>
              <button
                onClick={() => logout()}
                className="w-full py-2.5 px-4 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-xs font-bold transition-all flex items-center justify-center gap-1.5"
              >
                <LogOut className="w-4 h-4 text-rose-500" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      );
    }
  }

  // 4. Authorized, render page
  return <>{children}</>;
}
