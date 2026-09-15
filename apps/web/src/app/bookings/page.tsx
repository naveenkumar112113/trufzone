'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, Filter, Download, Plus, MapPin, 
  Clock, Calendar, User, Phone, IndianRupee,
  CheckCircle2, AlertCircle, ArrowUpDown, Eye,
  FileSpreadsheet, Sparkles, RefreshCw, Database
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { 
  getOwnerBookings, getMyBookings, updateBookingStatus, getOwnerTurfs, getPublicTurfs 
} from '@/services/api';
import { BookingDetailDrawer, IBookingDetail } from '@/components/BookingDetailDrawer';
import { OfflineBookingDrawer } from '@/components/OfflineBookingDrawer';
import { cn } from '@/lib/utils';
import { useUserRole } from '@/context/UserRoleContext';

export default function BookingsPage() {
  const { isAuthenticated, currentRole } = useUserRole();
  const [bookings, setBookings] = useState<IBookingDetail[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedTurf, setSelectedTurf] = useState<string>('ALL');
  const [selectedSport, setSelectedSport] = useState<string>('ALL');
  const [turfOptions, setTurfOptions] = useState<{ id: string; name: string; sports?: string[]; pricePerHour?: number }[]>([]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const loadTurfs = async () => {
      try {
        const res = (currentRole === 'PLAYER') ? await getPublicTurfs() : await getOwnerTurfs();
        if (res.data?.success && Array.isArray(res.data?.data)) {
          setTurfOptions(res.data.data.map((t: any) => ({
            id: t._id || t.id,
            name: t.name,
            sports: t.sports || (t.sport ? [t.sport] : ['Football']),
            facilities: t.facilities || [],
            location: t.locationDetails || t.city || 'Tirunelveli',
            pricePerHour: t.pricePerHour || 0
          })));
        }
      } catch (err) {
        console.warn('Failed to load turfs for bookings filter:', err);
      }
    };
    loadTurfs();
  }, [isAuthenticated, currentRole]);

  // Dynamically extract distinct sports from active turfs
  const availableSports = useMemo(() => {
    const set = new Set<string>();
    turfOptions.forEach(t => {
      (t.sports || []).forEach(s => {
        if (s && s.trim()) set.add(s.trim());
      });
    });
    return Array.from(set);
  }, [turfOptions]);

  // Filter turf dropdown options based on selectedSport
  const filteredTurfOptions = useMemo(() => {
    if (selectedSport === 'ALL') return turfOptions;
    const target = selectedSport.toLowerCase();
    return turfOptions.filter(t => 
      (t.sports || []).some(s => s.toLowerCase().includes(target))
    );
  }, [turfOptions, selectedSport]);

  // Handle sport change and clean up selected turf if not matching
  const handleSportFilterChange = (sport: string) => {
    setSelectedSport(sport);
    if (sport !== 'ALL' && selectedTurf !== 'ALL') {
      const match = turfOptions.find(t => t.id === selectedTurf);
      if (match && !match.sports?.some(s => s.toLowerCase().includes(sport.toLowerCase()))) {
        setSelectedTurf('ALL');
      }
    }
  };

  // Loading state
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Modals
  const [selectedBooking, setSelectedBooking] = useState<IBookingDetail | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isOfflineOpen, setIsOfflineOpen] = useState(false);

  // Fetch live bookings from database
  const fetchLiveBookings = async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      if (currentRole === 'PLAYER') {
        const res = await getMyBookings();
        if (res.data?.success && Array.isArray(res.data?.data)) {
          setBookings(res.data.data);
        }
      } else {
        const res = await getOwnerBookings({
          status: selectedStatus === 'ALL' ? undefined : selectedStatus,
          turfId: selectedTurf === 'ALL' ? undefined : selectedTurf,
          search: searchQuery || undefined
        });
        if (res.data?.success && Array.isArray(res.data?.data)) {
          setBookings(res.data.data);
        }
      }
    } catch (err) {
      console.error('fetchLiveBookings error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchLiveBookings();
    }
  }, [isAuthenticated, currentRole, selectedStatus, selectedTurf]);

  // Filter logic
  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      const matchSearch = !searchQuery || 
        b.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.bookingCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.customerPhone.includes(searchQuery);
      
      const matchStatus = selectedStatus === 'ALL' || b.status === selectedStatus;
      const matchTurf = selectedTurf === 'ALL' || b.turfId === selectedTurf;
      const matchSport = selectedSport === 'ALL' || (b.sport || '').toLowerCase().includes(selectedSport.toLowerCase());

      return matchSearch && matchStatus && matchTurf && matchSport;
    });
  }, [bookings, searchQuery, selectedStatus, selectedTurf, selectedSport]);

  // Statistics
  const totalAmount = useMemo(() => {
    return filteredBookings.reduce((sum, b) => sum + b.amount, 0);
  }, [filteredBookings]);

  const confirmedCount = useMemo(() => {
    return filteredBookings.filter(b => b.status === 'CONFIRMED').length;
  }, [filteredBookings]);

  const handleOpenDetail = (b: IBookingDetail) => {
    setSelectedBooking(b);
    setIsDetailOpen(true);
  };

  const handleAddBooking = (newB: any) => {
    setBookings(prev => [newB, ...prev]);
    fetchLiveBookings();
  };

  const handleCancelBooking = async (bId: string) => {
    try {
      await updateBookingStatus(bId, { status: 'CANCELLED' });
      setBookings(prev => prev.map(b => b.id === bId ? { ...b, status: 'CANCELLED' as const } : b));
      await fetchLiveBookings();
    } catch (err) {
      console.error('Cancel booking error:', err);
    }
  };

  const exportCSV = () => {
    const headers = 'BookingRef,Customer,Phone,Turf,Sport,Date,Time,Amount,Payment,Status\n';
    const rows = filteredBookings.map(b => 
      `"${b.bookingCode}","${b.customerName}","${b.customerPhone}","${b.turfName}","${b.sport}","${b.date}","${b.timeSlot}",${b.amount},"${b.paymentStatus}","${b.status}"`
    ).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `turfhub-bookings-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6 pb-12">

      {/* TOAST ALERT NOTIFICATION */}
      {toastMsg && (
        <div className="p-4 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-between shadow-lg animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMsg}</span>
          </div>
          <button 
            onClick={() => setToastMsg(null)} 
            className="text-emerald-400 hover:text-white px-2 py-0.5 rounded-lg text-xs"
          >
            ✕
          </button>
        </div>
      )}
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              Bookings Management
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs font-bold">
              {bookings.length} {bookings.length === 1 ? 'Booking' : 'Bookings'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Monitor court reservations, payments, and customer schedules.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Refresh button */}
          <button
            onClick={fetchLiveBookings}
            disabled={loading}
            title="Reload bookings"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-card hover:bg-muted text-foreground font-bold text-xs transition-colors shadow-xs"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
            Refresh
          </button>

          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border bg-card hover:bg-muted font-bold text-xs text-foreground transition-colors shadow-xs"
          >
            <Download className="w-4 h-4 text-muted-foreground" />
            Export CSV
          </button>
          <button
            onClick={() => setIsOfflineOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary-hover transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            New Booking
          </button>
        </div>
      </div>

      {/* Quick Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-card border border-border">
          <p className="text-xs font-bold text-muted-foreground uppercase">Filtered Count</p>
          <p className="text-2xl font-black text-foreground mt-1 font-mono">{filteredBookings.length}</p>
        </div>
        <div className="p-4 rounded-2xl bg-card border border-border">
          <p className="text-xs font-bold text-emerald-500 uppercase">Confirmed</p>
          <p className="text-2xl font-black text-emerald-500 mt-1 font-mono">{confirmedCount}</p>
        </div>
        <div className="p-4 rounded-2xl bg-card border border-border">
          <p className="text-xs font-bold text-amber-500 uppercase">Pending Review</p>
          <p className="text-2xl font-black text-amber-500 mt-1 font-mono">
            {filteredBookings.filter(b => b.status === 'PENDING').length}
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-card border border-border">
          <p className="text-xs font-bold text-muted-foreground uppercase">Total Volume</p>
          <p className="text-2xl font-black text-foreground mt-1 font-mono">
            ₹{totalAmount.toLocaleString('en-IN')}
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-card p-3 rounded-2xl border border-border">
        
        {/* Search input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search booking ref, player, or mobile..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-none focus:border-primary"
          />
        </div>

        {/* Filter dropdowns */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Status Tabs */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 bg-background border border-border rounded-xl text-xs font-bold text-foreground outline-none cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="PENDING">Pending</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          {/* Sport Filter */}
          <select
            value={selectedSport}
            onChange={(e) => handleSportFilterChange(e.target.value)}
            className="px-3 py-2 bg-background border border-border rounded-xl text-xs font-bold text-foreground outline-none cursor-pointer"
          >
            <option value="ALL">All Sports ({availableSports.length})</option>
            {availableSports.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          {/* Turf Filter (Coordinated with Sport) */}
          <select
            value={selectedTurf}
            onChange={(e) => setSelectedTurf(e.target.value)}
            className="px-3 py-2 bg-background border border-border rounded-xl text-xs font-bold text-foreground outline-none cursor-pointer"
          >
            <option value="ALL">
              {selectedSport === 'ALL' ? 'All Turfs' : `All ${selectedSport} Turfs`} ({filteredTurfOptions.length})
            </option>
            {filteredTurfOptions.length === 0 ? (
              <option disabled value="">No turfs available for {selectedSport}</option>
            ) : (
              filteredTurfOptions.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.sports?.join(', ') || 'Facility'})
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      {/* Bookings Table View */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">
                <th className="py-3.5 px-4">Ref Code</th>
                <th className="py-3.5 px-4">Player / Team</th>
                <th className="py-3.5 px-4">Venue & Sport</th>
                <th className="py-3.5 px-4">Schedule</th>
                <th className="py-3.5 px-4">Amount</th>
                <th className="py-3.5 px-4">Payment</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-xs">
              {filteredBookings.length > 0 ? (
                filteredBookings.map((booking) => (
                  <tr 
                    key={booking.id}
                    onClick={() => handleOpenDetail(booking)}
                    className="hover:bg-muted/30 transition-colors cursor-pointer group"
                  >
                    {/* Booking Code */}
                    <td className="py-3.5 px-4 font-mono font-bold text-foreground">
                      {booking.bookingCode}
                    </td>

                    {/* Customer */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-primary/15 text-primary font-bold flex items-center justify-center shrink-0">
                          {booking.customerName.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-foreground truncate group-hover:text-primary transition-colors">
                            {booking.customerName}
                          </p>
                          <p className="text-[11px] text-muted-foreground truncate">{booking.customerPhone}</p>
                        </div>
                      </div>
                    </td>

                    {/* Turf & Sport */}
                    <td className="py-3.5 px-4">
                      <div>
                        <p className="font-bold text-foreground truncate">{booking.turfName}</p>
                        <span className="inline-block mt-0.5 text-[10px] font-medium text-muted-foreground">
                          {booking.sport}
                        </span>
                      </div>
                    </td>

                    {/* Schedule */}
                    <td className="py-3.5 px-4">
                      <div>
                        <p className="font-semibold text-foreground flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-muted-foreground" />
                          {booking.date}
                        </p>
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          {booking.timeSlot}
                        </p>
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="py-3.5 px-4 font-mono font-bold text-foreground text-sm">
                      ₹{booking.amount}
                    </td>

                    {/* Payment Status */}
                    <td className="py-3.5 px-4">
                      <span className={cn(
                        'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border',
                        booking.paymentStatus === 'PAID' 
                          ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                          : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                      )}>
                        {booking.paymentStatus} ({booking.paymentMethod})
                      </span>
                    </td>

                    {/* Booking Status */}
                    <td className="py-3.5 px-4">
                      <StatusBadge status={booking.status} className="text-[10px]" />
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDetail(booking);
                        }}
                        className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1 text-xs font-bold"
                      >
                        <Eye className="w-4 h-4" />
                        <span className="hidden sm:inline">Details</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted-foreground">
                    <p className="text-sm font-semibold">No bookings match the selected filters.</p>
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedStatus('ALL');
                        setSelectedTurf('ALL');
                        setSelectedSport('ALL');
                      }}
                      className="text-xs font-bold text-primary mt-2 hover:underline"
                    >
                      Clear all filters
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DRAWERS */}
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
        turfs={turfOptions}
      />
    </div>
  );
}
