'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, 
  Filter, Plus, Search, MapPin, Clock, Phone, AlertCircle,
  Eye, CheckCircle2, ShieldCheck, Tag, Sparkles, RefreshCw, Database
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { cn } from '@/lib/utils';
import { 
  getOwnerBookings, getOwnerTurfs, updateBookingStatus 
} from '@/services/api';
import { useUserRole } from '@/context/UserRoleContext';

import { BookingDetailDrawer, IBookingDetail } from '@/components/BookingDetailDrawer';
import { OfflineBookingDrawer } from '@/components/OfflineBookingDrawer';
import { BlockSlotModal } from '@/components/BlockSlotModal';

export interface CalendarBooking extends IBookingDetail {}

const HOURS = Array.from({ length: 17 }, (_, i) => i + 6); // 6 AM to 10 PM

export default function CalendarPage() {
  const router = useRouter();
  const { isAuthenticated, canManagePricing, isOwner, isAdmin, isStaff } = useUserRole();
  const [selectedDate, setSelectedDate] = useState(new Date('2026-09-08'));
  const [viewMode, setViewMode] = useState<'day' | '3day' | 'week'>('day');
  const [selectedTurfFilter, setSelectedTurfFilter] = useState<string>('all');
  const [selectedSportFilter, setSelectedSportFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [selectedBooking, setSelectedBooking] = useState<CalendarBooking | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isOfflineOpen, setIsOfflineOpen] = useState(false);
  const [isBlockOpen, setIsBlockOpen] = useState(false);

  // Dynamic state from database
  const [turfs, setTurfs] = useState<any[]>([]);
  const [bookings, setBookings] = useState<CalendarBooking[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  const fetchLiveCalendarBookings = async () => {
    if (!isAuthenticated || (!isOwner && !isAdmin && !isStaff)) return;
    setLoading(true);
    try {
      const [bookRes, turfRes] = await Promise.all([
        getOwnerBookings(),
        getOwnerTurfs()
      ]);
      if (bookRes.data?.success && Array.isArray(bookRes.data?.data)) {
        setBookings(bookRes.data.data);
      } else {
        setBookings([]);
      }
      if (turfRes.data?.success && Array.isArray(turfRes.data?.data)) {
        setTurfs(turfRes.data.data.map((t: any) => ({
          id: t._id || t.id,
          name: t.name,
          sport: t.sports?.[0] || t.sport || 'Football',
          sports: t.sports || (t.sport ? [t.sport] : ['Football']),
          location: t.locationDetails || t.city || 'Facility',
          rating: t.rating || 0,
          reviewCount: t.reviewsCount || 0,
          pricePerHour: t.pricePerHour || 0,
          image: t.images?.[0] || 'https://images.unsplash.com/photo-1529900245534-47fbf82a0f61?auto=format&fit=crop&w=800&q=80',
          availableSlots: 0,
          amenities: t.facilities || []
        })));
      } else {
        setTurfs([]);
      }
    } catch (err) {
      console.error('fetchLiveCalendarBookings error:', err);
      setBookings([]);
      setTurfs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchLiveCalendarBookings();
    }
  }, [isAuthenticated, isOwner, isAdmin, isStaff]);

  const formatHour = (h: number) => {
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return `${hour} ${ampm}`;
  };

  // Change date
  const changeDay = (delta: number) => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + delta);
    setSelectedDate(next);
  };

  const handleOpenDetail = (b: CalendarBooking) => {
    setSelectedBooking(b);
    setIsDetailOpen(true);
  };

  const handleAddBooking = (newB: any) => {
    setBookings(prev => [newB, ...prev]);
    fetchLiveCalendarBookings();
  };

  const handleCancelBooking = async (bId: string) => {
    try {
      await updateBookingStatus(bId, { status: 'CANCELLED' });
      setBookings(prev => prev.map(b => b.id === bId ? { ...b, status: 'CANCELLED' as const } : b));
      await fetchLiveCalendarBookings();
    } catch (err) {
      console.error('Cancel booking error:', err);
    }
  };

  // Filtered turfs to display in columns
  const visibleTurfs = useMemo(() => {
    if (selectedTurfFilter === 'all') return turfs;
    return turfs.filter(t => t.id === selectedTurfFilter);
  }, [turfs, selectedTurfFilter]);

  // Filtered bookings
  const filteredBookings = useMemo(() => {
    const targetDateStr = selectedDate.toISOString().split('T')[0];
    return bookings.filter(b => {
      const matchDate = !b.date || b.date === targetDateStr;
      const matchSport = selectedSportFilter === 'all' || (b.sport || '').toLowerCase().includes(selectedSportFilter.toLowerCase());
      const matchSearch = !searchQuery || 
        (b.customerName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b.bookingCode || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchDate && matchSport && matchSearch;
    });
  }, [bookings, selectedDate, selectedSportFilter, searchQuery]);

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-3">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-muted-foreground font-semibold">Redirecting to login...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] space-y-4">
      
      {/* Top Control Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-card p-4 rounded-2xl border border-border">
        
        {/* Date Navigator */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-muted/50 border border-border rounded-xl overflow-hidden shadow-xs">
            <button 
              onClick={() => changeDay(-1)} 
              className="p-2 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              title="Previous Day"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="px-3 py-1.5 font-bold text-xs sm:text-sm text-foreground flex items-center border-x border-border">
              <CalendarIcon className="w-4 h-4 mr-2 text-primary" />
              {selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </div>
            <button 
              onClick={() => changeDay(1)} 
              className="p-2 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              title="Next Day"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => setSelectedDate(new Date('2026-09-08'))}
            className="px-3 py-1.5 rounded-xl border border-border text-xs font-bold hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          >
            Today
          </button>

          {/* View Mode Tabs */}
          <div className="hidden sm:flex items-center bg-muted/60 p-1 rounded-xl border border-border ml-2">
            {(['day', '3day', 'week'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={cn(
                  'px-3 py-1 rounded-lg text-xs font-bold capitalize transition-colors',
                  viewMode === mode ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {mode === '3day' ? '3 Days' : mode}
              </button>
            ))}
          </div>
        </div>

        {/* Filters & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Turf Filter */}
          <select
            value={selectedTurfFilter}
            onChange={(e) => setSelectedTurfFilter(e.target.value)}
            className="px-3 py-1.5 bg-background border border-border rounded-xl text-xs font-bold text-foreground outline-none"
          >
            <option value="all">All Turfs</option>
            {turfs.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>

          {/* Sport Filter */}
          <select
            value={selectedSportFilter}
            onChange={(e) => setSelectedSportFilter(e.target.value)}
            className="px-3 py-1.5 bg-background border border-border rounded-xl text-xs font-bold text-foreground outline-none"
          >
            <option value="all">All Sports</option>
            <option value="Football">⚽ Football</option>
            <option value="Cricket">🏏 Cricket</option>
            <option value="Badminton">🏸 Badminton</option>
          </select>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search team..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-none focus:border-primary w-32 sm:w-40"
            />
          </div>

          {/* Refresh Button */}
          <button
            onClick={fetchLiveCalendarBookings}
            disabled={loading}
            title="Refresh bookings"
            className="p-1.5 border border-border bg-muted/40 hover:bg-muted text-foreground rounded-xl text-xs transition-colors"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
          </button>

          <button 
            onClick={() => setIsOfflineOpen(true)}
            className="flex items-center px-3 py-1.5 bg-primary text-primary-foreground rounded-xl text-xs font-bold hover:bg-primary-hover transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Book Slot
          </button>

          <button 
            onClick={() => setIsBlockOpen(true)}
            className="flex items-center px-3 py-1.5 border border-border hover:bg-muted text-foreground rounded-xl text-xs font-bold transition-colors"
          >
            <AlertCircle className="w-3.5 h-3.5 mr-1 text-warning" />
            Block
          </button>
        </div>
      </div>

      {/* Calendar Grid Container */}
      <div className="flex-1 bg-card border border-border rounded-2xl shadow-xs overflow-hidden flex flex-col relative">
        
        {/* Arena Column Headers */}
        <div className="flex border-b border-border bg-muted/40 sticky top-0 z-20">
          <div className="w-20 shrink-0 border-r border-border flex items-center justify-center p-3 text-[11px] font-black text-muted-foreground uppercase tracking-wider">
            Time
          </div>
          {visibleTurfs.map(turf => (
            <div 
              key={turf.id} 
              className="flex-1 flex flex-col items-center justify-center p-3 border-r border-border last:border-r-0 min-w-[200px]"
            >
              <span className="text-xs sm:text-sm font-extrabold text-foreground truncate max-w-[220px]">
                {turf.name}
              </span>
              <span className="text-[10px] text-muted-foreground flex items-center mt-0.5">
                <MapPin className="w-3 h-3 mr-0.5" />
                {turf.location} · {turf.sports?.[0] || turf.sport || 'Facility'}
              </span>
            </div>
          ))}
        </div>

        {/* Scrollable Slots Grid */}
        <div className="flex-1 overflow-y-auto relative no-scrollbar">
          
          {/* Background Grid Lines & Hour labels */}
          <div className="absolute inset-0 pointer-events-none">
            {HOURS.map(hour => (
              <div key={`grid-${hour}`} className="flex h-24 w-full border-b border-border/50">
                <div className="w-20 shrink-0 border-r border-border flex items-start justify-end pr-3 pt-2 text-xs font-mono font-bold text-muted-foreground relative -top-3">
                  {formatHour(hour)}
                </div>
                {visibleTurfs.map(t => (
                  <div key={`cell-${t.id}-${hour}`} className="flex-1 border-r border-border/40 last:border-r-0 min-w-[200px]" />
                ))}
              </div>
            ))}
          </div>

          {/* Render Booked Slots on Turf Columns */}
          <div className="absolute inset-0 pl-20 pointer-events-auto">
            <div className="flex h-full w-full">
              {visibleTurfs.map(turf => {
                const turfBookings = filteredBookings.filter(b => b.turfId === turf.id);
                return (
                  <div key={`col-${turf.id}`} className="flex-1 relative h-full min-w-[200px]">
                    {turfBookings.map(booking => {
                      const top = ((booking.startTimeHour ?? 18) - HOURS[0]) * 96; // 96px per hour
                      const height = (booking.durationHours ?? 1) * 96;

                      const isMaintenance = booking.status === 'MAINTENANCE';
                      const isConfirmed = booking.status === 'CONFIRMED';
                      const isPending = booking.status === 'PENDING';

                      const getBg = () => {
                        if (isMaintenance) return 'bg-blue-500/15 border-blue-500/30 text-blue-400';
                        if (isConfirmed) return 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400';
                        if (isPending) return 'bg-amber-500/15 border-amber-500/30 text-amber-400';
                        return 'bg-rose-500/15 border-rose-500/30 text-rose-400';
                      };

                      return (
                        <div
                          key={booking.id}
                          onClick={() => handleOpenDetail(booking)}
                          className={cn(
                            'absolute left-1.5 right-1.5 rounded-xl border p-2.5 cursor-pointer transition-all hover:scale-[1.01] hover:z-10 shadow-sm overflow-hidden group flex flex-col justify-between backdrop-blur-xs',
                            getBg()
                          )}
                          style={{ top: `${top}px`, height: `${height}px` }}
                        >
                          <div>
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-extrabold text-xs sm:text-sm text-foreground truncate group-hover:text-primary transition-colors">
                                {booking.customerName}
                              </span>
                              <span className="text-[10px] font-mono font-extrabold uppercase px-1.5 py-0.5 rounded bg-card/60 border border-border">
                                {booking.sport}
                              </span>
                            </div>

                            <div className="text-[11px] opacity-80 mt-1 flex items-center gap-1 font-medium">
                              <Clock className="w-3 h-3" />
                              {booking.timeSlot}
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-[11px] font-bold pt-1 border-t border-current/10">
                            <span className="font-mono">₹{booking.amount}</span>
                            <StatusBadge status={booking.status} className="text-[9px] py-0 px-1.5" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* DRAWERS & MODALS */}
      <BookingDetailDrawer
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        booking={selectedBooking}
        onCancelBooking={handleCancelBooking}
      />

      <OfflineBookingDrawer
        isOpen={isOfflineOpen}
        onClose={() => setIsOfflineOpen(false)}
        onAddBooking={handleAddBooking}
        turfs={turfs}
      />

      <BlockSlotModal
        isOpen={isBlockOpen}
        onClose={() => setIsBlockOpen(false)}
      />
    </div>
  );
}
