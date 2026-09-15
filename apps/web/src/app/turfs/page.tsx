'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Plus, MapPin, Star, Users, IndianRupee, Clock,
  Settings, Calendar, ExternalLink, Sparkles,
  ShieldCheck, CheckCircle2, ChevronRight, Database, RefreshCw
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Skeleton } from '@/components/ui/Skeleton';
import { getOwnerTurfs } from '@/services/api';
import { useUserRole } from '@/context/UserRoleContext';
import { cn } from '@/lib/utils';

export interface TurfDisplayItem {
  id: string;
  name: string;
  tagline: string;
  sports: string[];
  facilities: string[];
  location: string;
  city: string;
  rating: number;
  reviewsCount: number;
  revenueToday: number;
  occupancy: number;
  bookingsToday: number;
  avgBooking: number;
  repeatCustomers: number;
  status: 'ACTIVE' | 'MAINTENANCE';
  image: string;
  images: string[];
  pricePerHour: number;
  openingHours: string;
  description: string;
  phone: string;
}

export default function TurfsHubPage() {
  const router = useRouter();
  const { isAuthenticated, isOwner, isAdmin } = useUserRole();
  const [turfs, setTurfs] = useState<TurfDisplayItem[]>([]);
  const [loading, setLoading] = useState(true);

  const formatTurfData = (data: any[]): TurfDisplayItem[] => {
    return data.map((t: any, idx: number) => ({
      id: t._id || `t-${idx}`,
      name: t.name,
      tagline: t.description || 'Sports Turf Arena',
      sports: t.sports && t.sports.length > 0 ? t.sports : ['General Sports'],
      facilities: t.facilities && t.facilities.length > 0 ? t.facilities : ['Standard Amenities'],
      location: t.locationDetails || t.city || 'Tirunelveli',
      city: t.city || 'Tirunelveli',
      rating: t.rating || 0,
      reviewsCount: t.reviewsCount || 0,
      revenueToday: t.revenueToday || 0,
      occupancy: t.occupancy || 0,
      bookingsToday: t.bookingsToday || 0,
      avgBooking: t.avgBooking || 0,
      repeatCustomers: t.repeatCustomers || 0,
      status: (t.status === 'MAINTENANCE' ? 'MAINTENANCE' : 'ACTIVE') as 'ACTIVE' | 'MAINTENANCE',
      image: t.images?.[0] || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=1200',
      images: t.images || [],
      pricePerHour: t.pricePerHour || 0,
      openingHours: t.openingHours || 'Daily Slots',
      description: t.description || '',
      phone: t.phone || ''
    }));
  };

  const fetchTurfs = () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    setLoading(true);
    getOwnerTurfs()
      .then(res => {
        if (res.data?.success && Array.isArray(res.data?.data) && res.data.data.length > 0) {
          setTurfs(formatTurfData(res.data.data));
        } else {
          setTurfs([]);
        }
      })
      .catch((err) => {
        console.error('Error fetching turfs:', err);
        setTurfs([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTurfs();
  }, [isAuthenticated]);

  return (
    <div className="flex flex-col h-full pb-12 space-y-8">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              My Sports Turfs
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs font-bold">
              {turfs.length} {turfs.length === 1 ? 'Arena' : 'Arenas'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Manage your arena profiles, pricing tiers, operating hours, and public marketplace listing.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={fetchTurfs}
            disabled={loading}
            title="Refresh Arenas"
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-border bg-card hover:bg-muted font-bold text-xs text-foreground transition-colors shadow-xs"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
            Refresh
          </button>
          <button 
            onClick={() => router.push('/turfs/create')}
            className="flex items-center px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-xs sm:text-sm font-bold hover:bg-primary-hover transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New Turf
          </button>
        </div>
      </div>

      {/* Turf Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-96 rounded-3xl" />)}
        </div>
      ) : turfs.length === 0 ? (
        <div className="p-12 text-center bg-card border border-border rounded-3xl space-y-4 max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-black text-foreground">No Venues Registered</h3>
            <p className="text-xs text-muted-foreground mt-1">
              You haven't listed any sports turfs or arenas under your management yet.
            </p>
          </div>
          <Link
            href="/turfs/create"
            className="inline-flex items-center gap-2 py-2 px-4 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 transition-all shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add Your First Turf</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {turfs.map(turf => (
            <div 
              key={turf.id} 
              className="group flex flex-col bg-card border border-border rounded-3xl overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300"
            >
              {/* Hero Image */}
              <div className="relative h-52 w-full overflow-hidden bg-muted">
                <img 
                  src={turf.image}
                  alt={turf.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                
                {/* Top Badges */}
                <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                  <div className="flex flex-wrap gap-1.5">
                    {turf.sports.map(s => (
                      <span key={s} className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-black/60 backdrop-blur-md text-white border border-white/20">
                        {s}
                      </span>
                    ))}
                  </div>
                  <StatusBadge status={turf.status.toLowerCase()} className="text-[10px] bg-black/60 backdrop-blur-md" />
                </div>

                {/* Bottom title & location */}
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-lg sm:text-xl font-black text-white truncate drop-shadow-sm">
                    {turf.name}
                  </h3>
                  <p className="text-xs text-white/80 flex items-center mt-1">
                    <MapPin className="w-3.5 h-3.5 mr-1 shrink-0 text-emerald-400" />
                    {turf.location}, {turf.city}
                  </p>
                </div>
              </div>

              {/* Stats Strip */}
              <div className="grid grid-cols-3 divide-x divide-border border-b border-border bg-muted/20">
                <div className="p-3 text-center">
                  <div className="flex items-center justify-center text-amber-400 font-black text-sm">
                    {turf.rating > 0 ? (
                      <>
                        <Star className="w-3.5 h-3.5 mr-1 fill-amber-400" /> {turf.rating.toFixed(1)}
                      </>
                    ) : (
                      <span className="text-xs text-muted-foreground font-bold">Unrated</span>
                    )}
                  </div>
                  <span className="text-[10px] uppercase text-muted-foreground font-bold mt-0.5 block">
                    {turf.reviewsCount > 0 ? `${turf.reviewsCount} Reviews` : 'No Reviews'}
                  </span>
                </div>
                <div className="p-3 text-center">
                  <div className="flex items-center justify-center text-foreground font-black text-sm font-mono">
                    {turf.occupancy}%
                  </div>
                  <span className="text-[10px] uppercase text-muted-foreground font-bold mt-0.5 block">
                    Occupancy
                  </span>
                </div>
                <div className="p-3 text-center">
                  <div className="flex items-center justify-center text-primary font-black text-sm font-mono">
                    ₹{turf.revenueToday.toLocaleString('en-IN')}
                  </div>
                  <span className="text-[10px] uppercase text-muted-foreground font-bold mt-0.5 block">
                    Today's Rev
                  </span>
                </div>
              </div>

              {/* Details & Facilities */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                    <span className="flex items-center gap-1 font-medium">
                      <Clock className="w-3.5 h-3.5" />
                      {turf.openingHours}
                    </span>
                    <span className="font-mono font-bold text-foreground">
                      ₹{turf.pricePerHour}/hr
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {turf.tagline}
                  </p>
                </div>

                {/* Actions Grid */}
                <div className="space-y-2 pt-2 border-t border-border">
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => router.push(`/turfs/${turf.id}/slots`)}
                      className="flex items-center justify-center px-3 py-2 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground font-bold rounded-xl text-xs transition-colors"
                    >
                      <Calendar className="w-3.5 h-3.5 mr-1.5" />
                      Slot Schedule
                    </button>
                    <button 
                      onClick={() => router.push(`/turfs/${turf.id}/pricing`)}
                      className="flex items-center justify-center px-3 py-2 border border-border text-foreground hover:bg-muted font-bold rounded-xl text-xs transition-colors"
                    >
                      <Settings className="w-3.5 h-3.5 mr-1.5" />
                      Pricing Rules
                    </button>
                  </div>

                  {/* Public Marketplace Preview Link */}
                  <Link
                    href={`/public/turf/${turf.id}`}
                    target="_blank"
                    className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-muted/60 hover:bg-muted text-foreground text-xs font-bold border border-border transition-colors group/link"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-primary group-hover/link:scale-110 transition-transform" />
                    <span>View Public Marketplace Page</span>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
