import axios from 'axios';
import { ITurf, ITurfSlot, IBooking } from '@turfhub/shared-types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('jwt_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('jwt_token');
        localStorage.removeItem('user_data');
        localStorage.removeItem('turfhub_user_role');
        window.dispatchEvent(new Event('turfhub_auth_logout'));

        const currentPath = window.location.pathname;
        if (currentPath !== '/login' && !currentPath.startsWith('/public') && currentPath !== '/signup' && currentPath !== '/forgot-password') {
          window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
        }
      }
    }
    return Promise.reject(error);
  }
);

// --- Authentication Endpoints ---
export const register = (data: { name: string; phone: string; email?: string; password: string }) =>
  api.post<{
    success: boolean;
    data: { token: string; user: any };
    message: string;
  }>('/auth/register', data);

export const loginWithPassword = (data: { identifier: string; password: string }) =>
  api.post<{
    success: boolean;
    data: { token: string; user: any };
    message: string;
  }>('/auth/login', data);

export const googleAuth = (idToken: string) =>
  api.post<{
    success: boolean;
    data: { token: string; user: any };
    message: string;
  }>('/auth/google', { idToken });

export const sendOtp = (phone: string) =>
  api.post<{ success: boolean; message: string }>('/auth/send-otp', { phone });

export const verifyOtp = (phone: string, otp: string) =>
  api.post<{
    success: boolean;
    data: { token: string; user: any };
    message: string;
  }>('/auth/verify-otp', { phone, otp });

export const forgotPassword = (identifier: string) =>
  api.post<{ success: boolean; message: string }>('/auth/forgot-password', { identifier });

export const resetPassword = (data: { identifier: string; token: string; newPassword: string }) =>
  api.post<{ success: boolean; message: string }>('/auth/reset-password', data);

export const getMe = () =>
  api.get<{
    success: boolean;
    data: { user: any };
  }>('/auth/me');

export const logout = () =>
  api.post<{
    success: boolean;
    message: string;
  }>('/auth/logout');

// --- Bookings ---
export const getMyBookings = () =>
  api.get<{ success: boolean; data: any[] }>('/bookings/my-bookings');

export const publicBookTurf = (data: {
  turfId: string;
  customerName: string;
  customerPhone: string;
  date: string;
  timeSlot: string;
  sport?: string;
  amount?: number;
  paymentMethod?: string;
}) =>
  api.post<{
    success: boolean;
    message: string;
    data?: any;
  }>('/bookings/public', data);

export const getOwnerBookings = (params?: { status?: string; turfId?: string; search?: string }) => 
  api.get<{ success: boolean; data: any[] }>('/owner/bookings', { params });

export const createOfflineBooking = (data: {
  turfId: string;
  customerName: string;
  customerPhone: string;
  date?: string;
  timeSlot?: string;
  amount?: number;
  paymentMethod?: string;
  sport?: string;
  notes?: string;
}) => api.post<{ success: boolean; message: string; data: any }>('/owner/bookings/offline', data);

export const updateBookingStatus = (id: string, data: { status?: string; paymentStatus?: string }) => 
  api.put<{ success: boolean; message: string; data: any }>(`/owner/bookings/${id}/status`, data);

// --- Public Turf Discovery ---
export const getPublicTurfs = (params?: { lat?: number; lng?: number; radius?: number; sport?: string }) =>
  api.get<{ success: boolean; data: any[] }>('/turfs', { params });

export const getPublicTurfDetails = (id: string) =>
  api.get<{ success: boolean; data: any }>(`/turfs/${id}`);

export const getPublicTurfSlots = (id: string, date: string) =>
  api.get<{ success: boolean; data: any[] }>(`/turfs/${id}/slots`, { params: { date } });

// --- Owner Dashboard & Stats ---
export const getDashboardStats = () => api.get<{ 
  success: boolean; 
  data: { 
    totalTurfs: number;
    activeBookings: number;
    totalBookings: number;
    availableSlots: number;
    occupancy: number;
    todayRevenue: number;
    totalRevenue: number;
    recentBookings: Array<{
      id: string;
      bookingCode: string;
      turf: string;
      turfId?: string;
      sport?: string;
      user: string;
      phone: string;
      email: string;
      time: string;
      date?: string;
      amount: number;
      paymentMethod?: string;
      paymentStatus: string;
      status: string;
    }>;
  } 
}>('/owner/dashboard');

// --- Turfs ---
export const getOwnerTurfs = (params?: { sport?: string }) => 
  api.get<{ success: boolean; data: any[] }>('/owner/turfs', { params });
export const getAllSports = () => 
  api.get<{ success: boolean; data: string[] }>('/turfs/sports/all');
export const createTurf = (data: Partial<ITurf>) => api.post<{ success: boolean; data: ITurf }>('/owner/turfs', data);
export const generateSlots = (data: any) => api.post<{ success: boolean; data: ITurfSlot[] }>('/owner/slots', data);
export const blockSlot = (data: { turfId: string; date?: string; timeSlot?: string; reason?: string }) => 
  api.post<{ success: boolean; message: string; data: any }>('/owner/slots/block', data);

// --- Customers CRM ---
export const getOwnerCustomers = () => api.get<{ success: boolean; data: any[] }>('/owner/customers');

// --- Dynamic Random Data Seeder ---
export const seedRandomMatches = (count: number = 5) => 
  api.post<{ success: boolean; message: string; count: number; data: any[] }>('/owner/seed-random', { count });

// --- Reviews ---
export const getOwnerReviews = () => api.get<{ success: boolean; data: any[] }>('/owner/reviews');
export const addReviewReply = (id: string, text: string) => 
  api.post<{ success: boolean; data: any; message: string }>(`/owner/reviews/${id}/reply`, { text });

// --- Offers ---
export const getOwnerOffers = () => api.get<{ success: boolean; data: any[] }>('/owner/offers');
export const createOwnerOffer = (data: any) => 
  api.post<{ success: boolean; data: any; message: string }>('/owner/offers', data);
export const deleteOwnerOffer = (id: string) =>
  api.delete<{ success: boolean; message: string }>(`/owner/offers/${id}`);

// --- Tournaments ---
export const getOwnerTournaments = () => api.get<{ success: boolean; data: any[] }>('/owner/tournaments');
export const createOwnerTournament = (data: any) => 
  api.post<{ success: boolean; data: any; message: string }>('/owner/tournaments', data);
export const registerTournamentTeam = (tournamentId: string, data: {
  teamName: string;
  captainName: string;
  captainPhone: string;
  membersCount?: number;
}) => api.post<{ success: boolean; message: string; data: any }>(`/owner/tournaments/${tournamentId}/register-team`, data);
export const updateTournamentTeamStatus = (tournamentId: string, teamId: string, status: string) =>
  api.patch<{ success: boolean; message: string; data: any }>(`/owner/tournaments/${tournamentId}/teams/${teamId}`, { status });

// --- Reports ---
export const getOwnerReports = () => api.get<{ 
  success: boolean; 
  data: {
    totalRevenue: number;
    totalBookings: number;
    turfContributions: Array<{ name: string; revenue: number; bookings: number }>;
    sportDistribution: Array<{ name: string; value: number }>;
  } 
}>('/owner/reports');

// --- Staff ---
export const getOwnerStaff = () => api.get<{ success: boolean; data: any[] }>('/owner/staff');
