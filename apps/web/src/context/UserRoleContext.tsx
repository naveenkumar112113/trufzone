'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getMe, logout as logoutApi } from '@/services/api';

export type UserRoleType = 'TURF_OWNER' | 'TURF_ADMIN' | 'STAFF' | 'PLAYER' | 'ADMIN';

export interface UserPersona {
  id: string;
  name: string;
  role: UserRoleType;
  title: string;
  roleBadge: string;
  venueName: string;
  phone: string;
  email: string;
  avatar: string;
  themeColor: string;
  badgeBg: string;
  description: string;
  permissions: string[];
}

export const USER_PERSONAS: Record<string, UserPersona> = {
  TURF_OWNER: {
    id: 'owner-1',
    name: 'John Doe',
    role: 'TURF_OWNER',
    title: 'Turf Owner & General Manager',
    roleBadge: '👑 Turf Owner',
    venueName: 'TurfHub Nellai Sports Network (3 Arenas)',
    phone: '+91 94431 82940',
    email: 'john.doe@turfhub.in',
    avatar: 'JD',
    themeColor: 'text-emerald-500',
    badgeBg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    description: 'Full commercial control, live revenue, pricing tiers, staff rosters, coupon campaigns, and facility management.',
    permissions: ['ALL_ACCESS', 'FINANCIALS', 'PRICING_CONFIG', 'STAFF_MANAGEMENT', 'TURF_MANAGEMENT', 'REPORTS']
  },
  TURF_ADMIN: {
    id: 'owner-1',
    name: 'John Doe',
    role: 'TURF_ADMIN',
    title: 'Turf Owner & General Manager',
    roleBadge: '👑 Turf Admin',
    venueName: 'TurfHub Nellai Sports Network (3 Arenas)',
    phone: '+91 94431 82940',
    email: 'john.doe@turfhub.in',
    avatar: 'JD',
    themeColor: 'text-emerald-500',
    badgeBg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    description: 'Full commercial control, live revenue, pricing tiers, staff rosters, coupon campaigns, and facility management.',
    permissions: ['ALL_ACCESS', 'FINANCIALS', 'PRICING_CONFIG', 'STAFF_MANAGEMENT', 'TURF_MANAGEMENT', 'REPORTS']
  },
  STAFF: {
    id: 'staff-1',
    name: 'Karthik R',
    role: 'STAFF',
    title: 'Ground Supervisor & Front Desk',
    roleBadge: '🛡️ Ground Staff',
    venueName: 'ABC Football Arena (Vannarpettai)',
    phone: '+91 98421 00001',
    email: 'karthik.staff@turfhub.in',
    avatar: 'KR',
    themeColor: 'text-blue-400',
    badgeBg: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
    description: 'Ground operations focus: today schedule, match check-in QR scanner, counter walk-ins, and pitch rain/repair blocking.',
    permissions: ['GROUND_OPS', 'CHECKIN_SCANNER', 'OFFLINE_BOOKINGS', 'BLOCK_COURT', 'VIEW_CALENDAR']
  },
  PLAYER: {
    id: 'player-1',
    name: 'Vigneshwaran P',
    role: 'PLAYER',
    title: 'Captain · Nellai Strikers FC',
    roleBadge: '⚽ Player / Customer',
    venueName: 'Tirunelveli Football League',
    phone: '+91 98690 25765',
    email: 'vigneshwaranp@gmail.com',
    avatar: 'VP',
    themeColor: 'text-amber-400',
    badgeBg: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
    description: 'Player portal: explore & book live pitches, digital match pass & QR ticket, tournaments registration, and team roster.',
    permissions: ['BROWSE_TURFS', 'BOOK_SLOTS', 'VIEW_PASSES', 'REGISTER_TOURNAMENTS', 'SUBMIT_REVIEWS']
  },
  ADMIN: {
    id: 'admin-1',
    name: 'Sundar Raman',
    role: 'ADMIN',
    title: 'Platform Superadmin',
    roleBadge: '⚡ Platform Admin',
    venueName: 'TurfHub Tamil Nadu Network',
    phone: '+91 94431 00002',
    email: 'admin@turfhub.in',
    avatar: 'SR',
    themeColor: 'text-purple-400',
    badgeBg: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
    description: 'Multi-turf system oversight, partner verification, database connection monitoring, platform health & diagnostics.',
    permissions: ['SUPERADMIN', 'ALL_ACCESS', 'SYSTEM_DIAGNOSTICS', 'MULTI_TENANT_AUDIT']
  }
};

export interface AuthUser extends UserPersona {}

interface UserRoleContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
  currentRole: UserRoleType | null;
  user: AuthUser | null;
  login: (token: string, user: any) => void;
  logout: () => Promise<void>;
  isOwner: boolean;
  isStaff: boolean;
  isPlayer: boolean;
  isAdmin: boolean;
  canViewFinancials: boolean;
  canManagePricing: boolean;
  canOperateGround: boolean;
}

const UserRoleContext = createContext<UserRoleContextType | undefined>(undefined);

const mapUserToPersona = (rawUser: any): AuthUser => {
  const role = (rawUser.role || 'PLAYER').toUpperCase() as UserRoleType;
  const canonicalRole = role === 'TURF_ADMIN' ? 'TURF_OWNER' : role;
  const basePersona = USER_PERSONAS[canonicalRole] || USER_PERSONAS['PLAYER'];

  return {
    ...basePersona,
    id: rawUser._id || rawUser.id || basePersona.id,
    name: rawUser.name || basePersona.name,
    phone: rawUser.phone || basePersona.phone,
    email: rawUser.email || basePersona.email,
    role: role
  };
};

export function UserRoleProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [token, setToken] = useState<string | null>(null);
  const [currentRole, setCurrentRole] = useState<UserRoleType | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);

  // Initialize and verify session on load
  const initAuth = useCallback(async () => {
    if (typeof window === 'undefined') return;

    const savedToken = localStorage.getItem('jwt_token');
    if (!savedToken) {
      setIsAuthenticated(false);
      setUser(null);
      setCurrentRole(null);
      setToken(null);
      setIsLoading(false);
      return;
    }

    try {
      const res = await getMe();
      if (res.data?.success && res.data?.data?.user) {
        const validatedUser = res.data.data.user;
        const mapped = mapUserToPersona(validatedUser);
        setToken(savedToken);
        setUser(mapped);
        setCurrentRole(mapped.role);
        setIsAuthenticated(true);
      } else {
        throw new Error('Invalid session');
      }
    } catch (err) {
      // Clear invalid session
      localStorage.removeItem('jwt_token');
      localStorage.removeItem('user_data');
      localStorage.removeItem('turfhub_user_role');
      setIsAuthenticated(false);
      setUser(null);
      setCurrentRole(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    initAuth();

    const handleExternalLogout = () => {
      setIsAuthenticated(false);
      setUser(null);
      setCurrentRole(null);
      setToken(null);
    };

    const handlePageShow = (event: PageTransitionEvent) => {
      // If page was restored from browser back/forward cache (bfcache)
      if (event.persisted) {
        const savedToken = typeof window !== 'undefined' ? localStorage.getItem('jwt_token') : null;
        if (!savedToken) {
          setIsAuthenticated(false);
          setUser(null);
          setCurrentRole(null);
          setToken(null);
          window.location.replace('/login');
        } else {
          initAuth();
        }
      }
    };

    window.addEventListener('turfhub_auth_logout', handleExternalLogout);
    window.addEventListener('pageshow', handlePageShow);
    return () => {
      window.removeEventListener('turfhub_auth_logout', handleExternalLogout);
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, [initAuth]);

  const login = (newToken: string, rawUser: any) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('jwt_token', newToken);
      const role = rawUser.role || 'PLAYER';
      localStorage.setItem('turfhub_user_role', role);
      localStorage.setItem('user_data', JSON.stringify(rawUser));
    }
    const mapped = mapUserToPersona(rawUser);
    setToken(newToken);
    setUser(mapped);
    setCurrentRole(mapped.role);
    setIsAuthenticated(true);
  };

  const logout = async () => {
    try {
      await logoutApi();
    } catch (err) {
      console.warn('Backend logout warning:', err);
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('jwt_token');
        localStorage.removeItem('turfhub_user_role');
        localStorage.removeItem('user_data');
        sessionStorage.clear();
        window.dispatchEvent(new Event('turfhub_auth_logout'));
      }
      setIsAuthenticated(false);
      setUser(null);
      setCurrentRole(null);
      setToken(null);

      // Force navigation to login and replace history to prevent back button caching
      if (typeof window !== 'undefined') {
        window.location.replace('/login');
      }
    }
  };

  const isOwner = (currentRole === 'TURF_OWNER' || currentRole === 'TURF_ADMIN') && isAuthenticated;
  const isStaff = currentRole === 'STAFF' && isAuthenticated;
  const isPlayer = currentRole === 'PLAYER' && isAuthenticated;
  const isAdmin = currentRole === 'ADMIN' && isAuthenticated;

  const canViewFinancials = (isOwner || isAdmin) && isAuthenticated;
  const canManagePricing = (isOwner || isAdmin) && isAuthenticated;
  const canOperateGround = (isOwner || isStaff || isAdmin) && isAuthenticated;

  return (
    <UserRoleContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        token,
        currentRole,
        user,
        login,
        logout,
        isOwner,
        isStaff,
        isPlayer,
        isAdmin,
        canViewFinancials,
        canManagePricing,
        canOperateGround
      }}
    >
      {children}
    </UserRoleContext.Provider>
  );
}

export function useUserRole() {
  const context = useContext(UserRoleContext);
  if (!context) {
    throw new Error('useUserRole must be used within a UserRoleProvider');
  }
  return context;
}


