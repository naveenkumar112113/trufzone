import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import { UserRoleProvider } from '@/context/UserRoleContext';
import AppShell from '@/components/AppShell';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'TurfHub — Sports Command Center & Turf Management',
  description: 'Run your turf. Grow your game. Premier sports ground booking & analytics platform for owners in Tirunelveli, India.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased suppressHydrationWarning">
      <body className={`${inter.className} h-full flex bg-background text-foreground transition-colors duration-200`}>
        <UserRoleProvider>
          <ThemeProvider>
            <AppShell>
              {children}
            </AppShell>
          </ThemeProvider>
        </UserRoleProvider>
      </body>
    </html>
  );
}
