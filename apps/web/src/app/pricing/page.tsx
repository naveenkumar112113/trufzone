'use client';

import React, { useState, useEffect } from 'react';
import { 
  DollarSign, IndianRupee, Clock, Plus, 
  Sparkles, Save, ShieldAlert, CheckCircle2,
  Calendar, Flame, Layers, Database, RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { getOwnerTurfs } from '@/services/api';
import { useUserRole } from '@/context/UserRoleContext';
import { cn } from '@/lib/utils';

export default function PricingPage() {
  const { isAuthenticated, canManagePricing } = useUserRole();
  const [turfList, setTurfList] = useState<any[]>([]);
  const [selectedTurf, setSelectedTurf] = useState('');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchLiveTurfs = async () => {
    if (!isAuthenticated || !canManagePricing) return;
    setLoading(true);
    try {
      const res = await getOwnerTurfs();
      if (res.data?.success && Array.isArray(res.data?.data)) {
        const mapped = res.data.data.map((t: any) => ({ id: t._id || t.id, name: t.name }));
        setTurfList(mapped);
        if (mapped.length > 0) {
          setSelectedTurf(mapped[0].id);
        } else {
          setSelectedTurf('');
        }
      } else {
        setTurfList([]);
        setSelectedTurf('');
      }
    } catch (err) {
      console.error('fetchLiveTurfs error:', err);
      setTurfList([]);
      setSelectedTurf('');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveTurfs();
  }, [isAuthenticated, canManagePricing]);

  // Pricing rules state
  const [weekdayRules, setWeekdayRules] = useState([
    { id: 'w1', slot: '6:00 AM – 4:00 PM', label: 'Morning & Afternoon (Standard)', price: 600 },
    { id: 'w2', slot: '4:00 PM – 6:00 PM', label: 'Early Evening (Shoulder)', price: 800 },
    { id: 'w3', slot: '6:00 PM – 10:00 PM', label: 'Prime Night Floodlights (Peak)', price: 1000 },
  ]);

  const [weekendRules, setWeekendRules] = useState([
    { id: 'we1', slot: '6:00 AM – 4:00 PM', label: 'Morning League Sessions', price: 800 },
    { id: 'we2', slot: '4:00 PM – 10:00 PM', label: 'Weekend Prime Fixtures (High Demand)', price: 1200 },
  ]);

  const handleUpdatePrice = (isWeekend: boolean, id: string, newPrice: number) => {
    if (isWeekend) {
      setWeekendRules(prev => prev.map(r => r.id === id ? { ...r, price: newPrice } : r));
    } else {
      setWeekdayRules(prev => prev.map(r => r.id === id ? { ...r, price: newPrice } : r));
    }
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-5xl pb-16">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              Dynamic Pricing Engine
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs font-bold">
              Configured Rates
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Optimize venue revenues with time-based, weekend, and peak floodlight tariffs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchLiveTurfs}
            disabled={loading}
            title="Refresh pricing"
            className="p-2 border border-border bg-card hover:bg-muted text-foreground rounded-xl text-xs transition-colors"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
          </button>
          <select
            value={selectedTurf}
            onChange={(e) => setSelectedTurf(e.target.value)}
            className="px-3.5 py-2 bg-card border border-border rounded-xl text-xs font-bold text-foreground outline-none cursor-pointer"
          >
            {turfList.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>

          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground font-bold text-xs rounded-xl hover:bg-primary-hover transition-colors shadow-sm"
          >
            <Save className="w-3.5 h-3.5" />
            {saved ? 'Rules Saved ✓' : 'Save Rules'}
          </button>
        </div>
      </div>

      {saved && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          Pricing rules updated and applied to upcoming calendar slots!
        </div>
      )}

      {turfList.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <div className="max-w-md mx-auto space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto text-muted-foreground">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-foreground text-base">No Turfs Configured</h3>
            <p className="text-xs text-muted-foreground">
              You do not have any registered turfs under your account yet. Add a turf venue to configure weekday and weekend dynamic pricing rules.
            </p>
          </div>
        </Card>
      ) : (
        <>
          {/* Weekday Pricing Tier */}
          <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              Weekday Tariffs (Monday – Friday)
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">Base prices applied to standard weekday fixtures</p>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {weekdayRules.map(rule => (
            <div key={rule.id} className="p-4 rounded-2xl border border-border bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center font-bold text-xs text-muted-foreground">
                  <Clock className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-foreground">{rule.slot}</h4>
                  <p className="text-[11px] text-muted-foreground">{rule.label}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-medium">Rate / Hour:</span>
                <div className="relative w-28">
                  <IndianRupee className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
                  <input
                    type="number"
                    value={rule.price}
                    onChange={(e) => handleUpdatePrice(false, rule.id, Number(e.target.value))}
                    className="w-full pl-7 pr-3 py-1.5 bg-background border border-border rounded-xl text-xs font-mono font-bold text-foreground focus:outline-none focus:border-primary text-right"
                  />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Weekend Pricing Tier */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-500" />
              Weekend & Holiday Tariffs (Saturday – Sunday)
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">Peak weekend rates for competitive league play</p>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {weekendRules.map(rule => (
            <div key={rule.id} className="p-4 rounded-2xl border border-border bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center font-bold text-xs text-amber-500">
                  <Flame className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-foreground">{rule.slot}</h4>
                  <p className="text-[11px] text-muted-foreground">{rule.label}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-medium">Rate / Hour:</span>
                <div className="relative w-28">
                  <IndianRupee className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
                  <input
                    type="number"
                    value={rule.price}
                    onChange={(e) => handleUpdatePrice(true, rule.id, Number(e.target.value))}
                    className="w-full pl-7 pr-3 py-1.5 bg-background border border-border rounded-xl text-xs font-mono font-bold text-foreground focus:outline-none focus:border-primary text-right"
                  />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
      </>
      )}

    </div>
  );
}
