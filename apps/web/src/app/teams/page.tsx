'use client';

import React, { useState, useEffect } from 'react';
import { 
  ShieldHalf, Users, Trophy, Star, Phone, 
  MapPin, MessageSquare, Search, Plus, Database, RefreshCw 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { getOwnerCustomers, getMyBookings } from '@/services/api';
import { useUserRole } from '@/context/UserRoleContext';
import { cn } from '@/lib/utils';

export default function TeamsPage() {
  const { user, isAuthenticated, isPlayer, isOwner, isStaff, isAdmin } = useUserRole();
  const [loading, setLoading] = useState(false);
  const [teams, setTeams] = useState<any[]>([]);

  const fetchLiveTeams = async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      if (isPlayer) {
        // Player squad view
        const res = await getMyBookings();
        if (res.data?.success && Array.isArray(res.data?.data) && res.data.data.length > 0) {
          const bookings = res.data.data;
          const playerSquad = {
            id: `squad-${bookings[0]?._id || '1'}`,
            name: `${user?.name || 'Player'} Squad`,
            captain: user?.name || 'Player',
            phone: user?.phone || '',
            sport: bookings[0]?.sport || 'Football',
            rosterCount: bookings.length > 3 ? 11 : 7,
            homeVenue: bookings[0]?.turfName || 'Home Venue',
            matchesPlayed: bookings.length,
            status: 'VERIFIED CLUB'
          };
          setTeams([playerSquad]);
        } else {
          setTeams([]);
        }
      } else {
        // Owner / Staff / Admin view
        const res = await getOwnerCustomers();
        if (res.data?.success && Array.isArray(res.data?.data) && res.data.data.length > 0) {
          const mapped = res.data.data.map((c: any, idx: number) => ({
            id: `tm-${c.id || idx}`,
            name: c.name.includes('(') ? c.name.split('(')[1].replace(')', '') : `${c.name} Squad`,
            captain: c.name.split('(')[0].trim(),
            phone: c.phone || '',
            sport: c.favoriteSport || 'Football',
            rosterCount: (c.totalBookings || 0) > 5 ? 11 : 7,
            homeVenue: c.favoriteTurf || 'Registered Venue',
            matchesPlayed: c.totalBookings || 0,
            status: c.status === 'VIP' ? 'VERIFIED CLUB' : 'COMMUNITY SQUAD'
          }));
          setTeams(mapped);
        } else {
          setTeams([]);
        }
      }
    } catch (err) {
      console.error('fetchLiveTeams error:', err);
      setTeams([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveTeams();
  }, [isAuthenticated, isPlayer, isOwner, isStaff, isAdmin, user]);

  return (
    <div className="space-y-6 max-w-6xl pb-16">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              Teams & Sports Clubs
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs font-bold">
              {teams.length} {teams.length === 1 ? 'Team' : 'Teams'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Registered team squads that play regularly across your turf complexes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchLiveTeams}
            disabled={loading}
            title="Refresh teams"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-card hover:bg-muted font-bold text-xs text-foreground transition-colors shadow-xs"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
            Refresh
          </button>
          <button 
            onClick={() => alert('Add team modal.')}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground font-bold text-xs rounded-xl hover:bg-primary-hover transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            Register Team
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {teams.map(team => (
          <Card key={team.id} className="border-border hover:border-primary/40 transition-colors">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-black">
                    <ShieldHalf className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-foreground">{team.name}</h3>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">{team.sport}</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  {team.status}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-muted/30 border border-border space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Captain</span>
                  <span className="font-bold text-foreground">{team.captain}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Squad Roster</span>
                  <span className="font-mono font-bold text-foreground">{team.rosterCount} Players</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Matches Booked</span>
                  <span className="font-mono font-bold text-primary">{team.matchesPlayed} Matches</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Home Venue</span>
                  <span className="font-medium text-foreground truncate max-w-[150px]">{team.homeVenue}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border">
                <a
                  href={`tel:${team.phone}`}
                  className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-xs font-bold transition-colors"
                >
                  <Phone className="w-3.5 h-3.5" /> Call
                </a>
                <a
                  href={`https://wa.me/${team.phone.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 text-xs font-bold transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
                </a>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

    </div>
  );
}
