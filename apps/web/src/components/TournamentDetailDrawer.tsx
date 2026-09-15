'use client';

import React, { useState } from 'react';
import { 
  X, Trophy, MapPin, Calendar, Users, IndianRupee, 
  ShieldCheck, AlertCircle, Plus, CheckCircle2, XCircle, Clock
} from 'lucide-react';
import { Drawer } from '@/components/ui/Drawer';
import { registerTournamentTeam, updateTournamentTeamStatus } from '@/services/api';
import { useUserRole } from '@/context/UserRoleContext';
import { cn } from '@/lib/utils';

export interface ITournamentTeam {
  _id?: string;
  id?: string;
  teamName: string;
  captainName: string;
  captainPhone: string;
  membersCount: number;
  registrationDate: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export interface ITournamentDetail {
  id: string;
  title: string;
  sport: string;
  venue: string;
  date: string;
  endDate?: string;
  teamsLimit: number;
  registeredCount: number;
  entryFee: number;
  prizePool: string;
  status: string;
  rules?: string;
  image?: string;
  registeredTeams?: ITournamentTeam[];
}

interface TournamentDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  tournament: ITournamentDetail | null;
  onRefresh: () => void;
}

export function TournamentDetailDrawer({
  isOpen,
  onClose,
  tournament,
  onRefresh,
}: TournamentDetailDrawerProps) {
  const { user, isOwner, isAdmin, isStaff } = useUserRole();
  const canManage = isOwner || isAdmin || isStaff;

  const [isRegistering, setIsRegistering] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [captainName, setCaptainName] = useState(user?.name || '');
  const [captainPhone, setCaptainPhone] = useState(user?.phone || '');
  const [membersCount, setMembersCount] = useState(7);
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'SUCCESS' | 'ERROR'; text: string } | null>(null);

  if (!tournament) return null;

  const teams = tournament.registeredTeams || [];

  const handleRegisterTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim() || !captainName.trim() || !captainPhone.trim()) {
      setStatusMessage({ type: 'ERROR', text: 'Team Name, Captain Name, and Phone are required.' });
      return;
    }

    setSubmitting(true);
    setStatusMessage(null);
    try {
      const res = await registerTournamentTeam(tournament.id, {
        teamName: teamName.trim(),
        captainName: captainName.trim(),
        captainPhone: captainPhone.trim(),
        membersCount: Number(membersCount) || 7,
      });

      if (res.data?.success) {
        setStatusMessage({ type: 'SUCCESS', text: 'Team successfully registered for tournament!' });
        setTeamName('');
        setIsRegistering(false);
        onRefresh();
      } else {
        setStatusMessage({ type: 'ERROR', text: res.data?.message || 'Registration failed.' });
      }
    } catch (err: any) {
      console.error('Register team error:', err);
      const msg = err.response?.data?.message || 'Failed to register team. Please try again.';
      setStatusMessage({ type: 'ERROR', text: msg });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (teamId: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      const res = await updateTournamentTeamStatus(tournament.id, teamId, status);
      if (res.data?.success) {
        onRefresh();
      }
    } catch (err) {
      console.error('Update team status error:', err);
    }
  };

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title={tournament.title} width="w-full max-w-2xl">
      <div className="space-y-6 pb-6">

        {/* Banner Card */}
        <div className="relative h-44 rounded-2xl overflow-hidden bg-muted border border-border">
          <img
            src={tournament.image || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80'}
            alt={tournament.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
            <div>
              <span className="px-2 py-0.5 rounded-md bg-primary/30 backdrop-blur-md text-white font-bold text-[10px] uppercase">
                {tournament.sport}
              </span>
              <h2 className="text-xl font-black text-white mt-1">{tournament.title}</h2>
              <p className="text-xs text-zinc-300 flex items-center gap-1.5 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-primary" />
                {tournament.venue} · <Calendar className="w-3.5 h-3.5 text-primary ml-1" /> {tournament.date}
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
              {tournament.status}
            </span>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 bg-muted/30 border border-border rounded-xl">
            <span className="text-[10px] uppercase font-bold text-muted-foreground block">Prize Pool</span>
            <span className="font-mono font-black text-amber-400 text-sm">{tournament.prizePool}</span>
          </div>
          <div className="p-3 bg-muted/30 border border-border rounded-xl">
            <span className="text-[10px] uppercase font-bold text-muted-foreground block">Entry Fee</span>
            <span className="font-mono font-black text-foreground text-sm">₹{tournament.entryFee}</span>
          </div>
          <div className="p-3 bg-muted/30 border border-border rounded-xl">
            <span className="text-[10px] uppercase font-bold text-muted-foreground block">Registered</span>
            <span className="font-mono font-black text-primary text-sm">{teams.length} / {tournament.teamsLimit}</span>
          </div>
          <div className="p-3 bg-muted/30 border border-border rounded-xl">
            <span className="text-[10px] uppercase font-bold text-muted-foreground block">Spots Left</span>
            <span className="font-mono font-black text-foreground text-sm">{Math.max(0, tournament.teamsLimit - teams.length)}</span>
          </div>
        </div>

        {/* Rules & Details */}
        {tournament.rules && (
          <div className="p-4 bg-muted/20 border border-border rounded-xl space-y-1.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tournament Rules & Guidelines</h4>
            <p className="text-xs text-foreground leading-relaxed">{tournament.rules}</p>
          </div>
        )}

        {statusMessage && (
          <div className={cn(
            "p-3 rounded-xl text-xs flex items-center gap-2",
            statusMessage.type === 'SUCCESS' ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-destructive/10 text-destructive border border-destructive/20"
          )}>
            {statusMessage.type === 'SUCCESS' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* REGISTERED TEAMS SECTION */}
        <div className="space-y-4 pt-2 border-t border-border">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-foreground flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                Registered Teams
              </h3>
              <p className="text-xs text-muted-foreground">Total squads enrolled: {teams.length}</p>
            </div>

            <button
              onClick={() => setIsRegistering(!isRegistering)}
              className="px-3 py-1.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary-hover transition-colors flex items-center gap-1 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              {isRegistering ? 'Close Form' : 'Register Team'}
            </button>
          </div>

          {/* Team Registration Form Drawer/Box */}
          {isRegistering && (
            <form onSubmit={handleRegisterTeam} className="p-4 bg-card border border-primary/30 rounded-2xl space-y-3 shadow-sm animate-in fade-in duration-150">
              <h4 className="text-xs font-extrabold text-foreground">Enroll New Squad</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-muted-foreground block mb-1">Team / Club Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Nellai Strikers FC"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-muted-foreground block mb-1">Captain Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Karthik R"
                    value={captainName}
                    onChange={(e) => setCaptainName(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-muted-foreground block mb-1">Captain Mobile *</label>
                  <input
                    type="tel"
                    required
                    placeholder="9876543210"
                    value={captainPhone}
                    onChange={(e) => setCaptainPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-muted-foreground block mb-1">Squad Members Count</label>
                  <input
                    type="number"
                    min={3}
                    max={25}
                    value={membersCount}
                    onChange={(e) => setMembersCount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary-hover transition-colors shadow-xs disabled:opacity-50"
                >
                  {submitting ? 'Registering...' : 'Submit Team Registration'}
                </button>
              </div>
            </form>
          )}

          {/* Teams Table / List */}
          {teams.length === 0 ? (
            <div className="p-8 text-center rounded-2xl border border-dashed border-border bg-muted/20">
              <Users className="w-8 h-8 mx-auto text-muted-foreground mb-2 opacity-50" />
              <p className="text-xs font-semibold text-muted-foreground">No teams registered yet.</p>
              <p className="text-[11px] text-muted-foreground">Be the first squad to register for this championship!</p>
            </div>
          ) : (
            <div className="border border-border rounded-2xl overflow-hidden divide-y divide-border">
              {teams.map((team, idx) => {
                const teamId = team._id || team.id || String(idx);
                return (
                  <div key={teamId} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card hover:bg-muted/30 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-xs sm:text-sm text-foreground">{team.teamName}</span>
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                          team.status === 'APPROVED' ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30" :
                          team.status === 'REJECTED' ? "bg-rose-500/15 text-rose-400 border border-rose-500/30" :
                          "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                        )}>
                          {team.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-muted-foreground flex flex-wrap items-center gap-3">
                        <span>Captain: <strong className="text-foreground">{team.captainName}</strong> ({team.captainPhone})</span>
                        <span>• Members: <strong className="text-foreground">{team.membersCount}</strong></span>
                        {team.registrationDate && (
                          <span>• Enrolled: {new Date(team.registrationDate).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>

                    {/* Organizer / Admin Actions */}
                    {canManage && (
                      <div className="flex items-center gap-1.5 self-end sm:self-center">
                        {team.status !== 'APPROVED' && (
                          <button
                            onClick={() => handleUpdateStatus(teamId, 'APPROVED')}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-colors"
                          >
                            Approve
                          </button>
                        )}
                        {team.status !== 'REJECTED' && (
                          <button
                            onClick={() => handleUpdateStatus(teamId, 'REJECTED')}
                            className="px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 text-xs font-bold transition-colors"
                          >
                            Reject
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

        </div>

      </div>
    </Drawer>
  );
}
