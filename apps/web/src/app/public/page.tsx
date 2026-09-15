'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  MapPin, Search, Star, Clock, IndianRupee, 
  Sparkles, ArrowRight, ShieldCheck, Filter, Loader2
} from 'lucide-react';
import { getPublicTurfs } from '@/services/api';
import { cn } from '@/lib/utils';

export default function PublicTurfDirectoryPage() {
  const [turfs, setTurfs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSport, setSelectedSport] = useState('ALL');

  useEffect(() => {
    getPublicTurfs()
      .then(res => {
        if (res.data?.success && Array.isArray(res.data?.data)) {
          setTurfs(res.data.data);
        }
      })
      .catch(err => {
        console.error('Error loading public turfs:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const sportsList = ['ALL', 'Football', 'Box Cricket', 'Badminton', 'Tennis'];

  const filteredTurfs = turfs.filter(t => {
    const matchesSearch = !search || 
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      (t.locationDetails && t.locationDetails.toLowerCase().includes(search.toLowerCase())) ||
      (t.city && t.city.toLowerCase().includes(search.toLowerCase()));

    const matchesSport = selectedSport === 'ALL' || 
      (t.sports && t.sports.includes(selectedSport));

    return matchesSearch && matchesSport;
  });

  return (
    <div className="min-h-screen bg-background text-foreground space-y-8 pb-16">
      {/* Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-emerald-900/60 via-slate-900/80 to-slate-950 p-8 sm:p-12 border border-emerald-500/20 shadow-2xl">
        <div className="max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Tirunelveli Sports Arena Network</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            Book Live Turfs, Futsal & Cricket Arenas
          </h1>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            Discover premier floodlit turfs in Tirunelveli. Instant booking confirmation, FIFA-grade turf surfaces, and real-time slot availability.
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by arena name, Vannarpettai, Palayamkottai..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-2xl text-xs sm:text-sm font-medium focus:outline-none focus:border-primary text-foreground"
          />
        </div>

        {/* Sports filter pill list */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full sm:w-auto pb-1 sm:pb-0">
          {sportsList.map(sport => (
            <button
              key={sport}
              onClick={() => setSelectedSport(sport)}
              className={cn(
                'px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0',
                selectedSport === sport
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground border border-border'
              )}
            >
              {sport === 'ALL' ? 'All Sports' : sport}
            </button>
          ))}
        </div>
      </div>

      {/* Turf Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-xs font-bold text-muted-foreground">Loading active sports venues...</p>
        </div>
      ) : filteredTurfs.length === 0 ? (
        <div className="py-20 text-center space-y-3 bg-card border border-border rounded-3xl p-8">
          <MapPin className="w-10 h-10 text-muted-foreground mx-auto" />
          <h3 className="text-base font-bold text-foreground">No Venues Found</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            No venues match your selected filters. Try searching for a different area or sport.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTurfs.map((t) => (
            <div
              key={t._id}
              className="group rounded-3xl bg-card border border-border hover:border-primary/40 overflow-hidden shadow-sm hover:shadow-xl transition-all flex flex-col justify-between"
            >
              <div>
                <div className="relative aspect-video overflow-hidden bg-muted">
                  <img
                    src={t.images?.[0] || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=800'}
                    alt={t.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-white/10 text-emerald-400 text-[11px] font-black flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Active</span>
                  </div>
                </div>

                <div className="p-5 space-y-3">
                  <div className="space-y-1">
                    <h3 className="text-lg font-black text-foreground group-hover:text-primary transition-colors">
                      {t.name}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span className="truncate">{t.locationDetails || t.city || 'Tirunelveli'}</span>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {t.description || 'Modern sports arena equipped with professional floodlights and synthetic turf.'}
                  </p>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {t.sports?.map((s: string) => (
                      <span
                        key={s}
                        className="px-2 py-0.5 rounded-lg bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-5 pt-0 border-t border-border/60 mt-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-medium text-muted-foreground block">Starting from</span>
                  <span className="text-base font-black text-foreground">₹1,000</span>
                  <span className="text-[10px] text-muted-foreground"> / hour</span>
                </div>

                <Link
                  href={`/public/turf/${t._id}`}
                  className="py-2 px-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <span>Book Slot</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
