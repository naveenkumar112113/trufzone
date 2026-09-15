'use client';

import React, { useState } from 'react';
import { X, Trophy, Calendar, MapPin, Users, IndianRupee, AlertCircle } from 'lucide-react';
import { createOwnerTournament } from '@/services/api';

interface CreateTournamentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTournamentCreated: () => void;
}

export function CreateTournamentModal({
  isOpen,
  onClose,
  onTournamentCreated,
}: CreateTournamentModalProps) {
  const [title, setTitle] = useState('');
  const [sport, setSport] = useState('Football');
  const [venue, setVenue] = useState('Tirunelveli Turf Arena');
  const [date, setDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [teamsLimit, setTeamsLimit] = useState(16);
  const [entryFee, setEntryFee] = useState(1500);
  const [prizePool, setPrizePool] = useState('₹25,000');
  const [rules, setRules] = useState('7v7 Knockout format. 25 mins per half. Official FIFA rules apply.');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim() || !venue.trim() || !date) {
      setError('Please provide Tournament Title, Venue, and Start Date.');
      return;
    }

    setLoading(true);
    try {
      const res = await createOwnerTournament({
        title: title.trim(),
        sport,
        venue: venue.trim(),
        date,
        endDate: endDate || undefined,
        teamsLimit: Number(teamsLimit) || 16,
        entryFee: Number(entryFee) || 0,
        prizePool: prizePool.trim(),
        rules: rules.trim(),
      });

      if (res.data?.success) {
        onTournamentCreated();
        onClose();
      } else {
        setError(res.data?.message || 'Failed to create tournament.');
      }
    } catch (err: any) {
      console.error('Create tournament error:', err);
      const msg = err.response?.data?.message || 'An error occurred while creating the tournament. Please check your inputs.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-card border border-border rounded-3xl p-6 shadow-2xl space-y-5 text-foreground">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight">Host New Tournament</h2>
              <p className="text-xs text-muted-foreground">Setup an official championship for teams to compete</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">
              Tournament Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Nellai Premier League 2026"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-xs sm:text-sm text-foreground focus:outline-none focus:border-primary"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                Sport
              </label>
              <select
                value={sport}
                onChange={(e) => setSport(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-xs sm:text-sm text-foreground focus:outline-none focus:border-primary"
              >
                <option value="Football">⚽ Football</option>
                <option value="Cricket">🏏 Cricket</option>
                <option value="Badminton">🏸 Badminton</option>
                <option value="Volleyball">🏐 Volleyball</option>
                <option value="Pickleball">🏓 Pickleball</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                Venue / Turf Arena *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Tirunelveli Turf Arena"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-xs sm:text-sm text-foreground focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                Start Date *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-xs sm:text-sm text-foreground focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                End Date (Optional)
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-xs sm:text-sm text-foreground focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                Max Teams
              </label>
              <input
                type="number"
                min={2}
                max={64}
                value={teamsLimit}
                onChange={(e) => setTeamsLimit(Number(e.target.value))}
                className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs sm:text-sm text-foreground focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                Entry Fee (₹)
              </label>
              <input
                type="number"
                min={0}
                value={entryFee}
                onChange={(e) => setEntryFee(Number(e.target.value))}
                className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs sm:text-sm text-foreground focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                Prize Pool
              </label>
              <input
                type="text"
                placeholder="₹25,000"
                value={prizePool}
                onChange={(e) => setPrizePool(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs sm:text-sm text-foreground focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">
              Rules & Tournament Details
            </label>
            <textarea
              rows={2}
              value={rules}
              onChange={(e) => setRules(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-none focus:border-primary resize-none"
            />
          </div>

          <div className="pt-3 border-t border-border flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-border hover:bg-muted text-xs font-bold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-primary text-primary-foreground font-bold text-xs rounded-xl hover:bg-primary-hover transition-colors shadow-sm disabled:opacity-50"
            >
              {loading ? 'Creating Championship...' : 'Publish Tournament'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
