'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { MobileNav } from '@/components/MobileNav';
import AuthGuard from '@/components/AuthGuard';
import { useUserRole } from '@/context/UserRoleContext';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isAuthenticated } = useUserRole();

  const isLoginPage = pathname === '/login';

  if (isLoginPage) {
    return (
      <AuthGuard>
        <main className="min-h-screen w-full bg-background">{children}</main>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      {isAuthenticated && <Sidebar />}
      <div className={`flex-1 flex flex-col min-h-screen bg-background transition-all ${isAuthenticated ? 'lg:ml-64' : ''}`}>
        <Header />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 lg:pb-10 overflow-auto">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
      {isAuthenticated && <MobileNav />}
    </AuthGuard>
  );
}
