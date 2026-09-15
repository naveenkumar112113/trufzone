'use client';

import React, { useState, useEffect } from 'react';
import { 
  Trophy, Plus, Calendar, MapPin, Users, 
  IndianRupee, Sparkles, CheckCircle2, ArrowRight, RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { getOwnerTournaments } from '@/services/api';
import { useUserRole } from '@/context/UserRoleContext';
import { CreateTournamentModal } from '@/components/CreateTournamentModal';
import { TournamentDetailDrawer } from '@/components/TournamentDetailDrawer';
import { cn } from '@/lib/utils';

export default function TournamentsPage() {
  const { isAuthenticated, isOwner, isAdmin, isStaff } = useUserRole();
  const [loading, setLoading] = useState(false);
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState<any | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const fetchLiveTournaments = async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const res = await getOwnerTournaments();
      if (res.data?.success && Array.isArray(res.data?.data)) {
        const mapped = res.data.data.map((t: any) => {
          const registeredTeams = t.registeredTeams || [];
          return {
            id: t._id || t.id,
            title: t.title,
            sport: t.sport,
            venue: t.venue,
            date: t.date,
            endDate: t.endDate,
            teamsLimit: t.teamsLimit || 16,
            registeredCount: registeredTeams.length > 0 ? registeredTeams.length : (t.registeredCount || 0),
            entryFee: t.entryFee || 0,
            prizePool: t.prizePool || '₹0',
            status: t.status || 'REGISTRATION OPEN',
            rules: t.rules || '',
            image: t.image || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80',
            registeredTeams: registeredTeams
          };
        });
        setTournaments(mapped);

        // Keep selected tournament updated if drawer is open
        if (selectedTournament) {
          const updated = mapped.find(m => m.id === selectedTournament.id);
          if (updated) setSelectedTournament(updated);
        }
      } else {
        setTournaments([]);
      }
    } catch (err) {
      console.error('fetchLiveTournaments error:', err);
      setTournaments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveTournaments();
  }, [isAuthenticated, isOwner, isAdmin, isStaff]);

  const handleOpenDetail = (tour: any) => {
    setSelectedTournament(tour);
    setIsDetailOpen(true);
  };

  return (
    <div className="space-y-6 max-w-6xl pb-16">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              Tournaments & Leagues
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs font-bold">
              <Trophy className="w-3.5 h-3.5" />
              {tournaments.length} {tournaments.length === 1 ? 'Tournament' : 'Tournaments'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Host regional knockout championships, manage squad enrollments, and track prize pools.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchLiveTournaments}
            disabled={loading}
            title="Refresh Tournaments"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border bg-card hover:bg-muted font-bold text-xs text-foreground transition-colors shadow-xs"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
            Refresh
          </button>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground font-bold text-xs rounded-xl hover:bg-primary-hover transition-colors shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Host New Tournament
          </button>
        </div>
      </div>

      {/* Tournaments Grid */}
      {tournaments.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <div className="max-w-md mx-auto space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto text-muted-foreground">
              <Trophy className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-foreground text-base">No Tournaments Scheduled</h3>
            <p className="text-xs text-muted-foreground">
              Host knockout cups and corporate tournaments to boost venue participation and prize competition.
            </p>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground font-bold text-xs rounded-xl hover:bg-primary-hover transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Host Your First Tournament
            </button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tournaments.map(tour => (
            <Card 
              key={tour.id} 
              onClick={() => handleOpenDetail(tour)}
              className="overflow-hidden border-border group hover:shadow-xl transition-all cursor-pointer hover:border-primary/40"
            >
              <div className="relative h-44 w-full overflow-hidden bg-muted">
                <img 
                  src={tour.image} 
                  alt={tour.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                
                <div className="absolute top-3 right-3">
                  <span className={cn(
                    'px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide border backdrop-blur-md',
                    tour.status === 'REGISTRATION OPEN' 
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                      : 'bg-muted/80 text-muted-foreground border-border'
                  )}>
                    {tour.status}
                  </span>
                </div>

                <div className="absolute bottom-3 left-3 right-3">
                  <span className="px-2 py-0.5 rounded-md bg-primary/20 text-primary font-bold text-[10px] uppercase">
                    {tour.sport}
                  </span>
                  <h3 className="text-base font-black text-white mt-1 truncate">{tour.title}</h3>
                </div>
              </div>

              <CardContent className="p-5 space-y-4 text-xs">
                <div className="space-y-1.5 text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-primary" />
                    <span className="text-foreground font-medium">{tour.venue}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-primary" />
                    <span>{tour.date}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 p-3 rounded-2xl bg-muted/30 border border-border">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">Prize Pool</span>
                    <span className="font-mono font-black text-amber-400 text-xs">{tour.prizePool}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">Entry Fee</span>
                    <span className="font-mono font-black text-foreground text-xs">₹{tour.entryFee} / squad</span>
                  </div>
                </div>

                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-[11px] font-bold">
                    <span className="text-muted-foreground">Registered Teams</span>
                    <span className="text-primary font-mono">{tour.registeredCount} / {tour.teamsLimit}</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${Math.min(100, (tour.registeredCount / tour.teamsLimit) * 100)}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Host New Tournament Modal */}
      <CreateTournamentModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onTournamentCreated={fetchLiveTournaments}
      />

      {/* Tournament Details & Registered Teams Drawer */}
      <TournamentDetailDrawer
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        tournament={selectedTournament}
        onRefresh={fetchLiveTournaments}
      />

    </div>
  );
}
