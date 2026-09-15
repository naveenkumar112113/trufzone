'use client';

import React, { useState, useEffect } from 'react';
import { 
  BarChart3, TrendingUp, TrendingDown, Download, 
  Calendar, IndianRupee, Users, ArrowUpRight, 
  Percent, FileSpreadsheet, Printer, Award, Flame, Database, RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, 
  Tooltip, CartesianGrid, AreaChart, Area, PieChart, Pie, Cell 
} from 'recharts';
import { getOwnerReports } from '@/services/api';

import { useUserRole } from '@/context/UserRoleContext';

export default function ReportsPage() {
  const { isAuthenticated, canViewFinancials } = useUserRole();
  const [range, setRange] = useState<'7d' | '30d' | '3m' | '12m'>('30d');
  const [loading, setLoading] = useState(false);
  const [dbReports, setDbReports] = useState<any>(null);

  const fetchLiveReports = async () => {
    if (!isAuthenticated || !canViewFinancials) return;
    setLoading(true);
    try {
      const res = await getOwnerReports();
      if (res.data?.success && res.data?.data) {
        setDbReports(res.data.data);
      }
    } catch (err) {
      console.error('fetchLiveReports error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && canViewFinancials) {
      fetchLiveReports();
    }
  }, [isAuthenticated, canViewFinancials]);

  const chartData = React.useMemo(() => {
    const totalRev = dbReports?.totalRevenue || 0;
    const totalBooks = dbReports?.totalBookings || 0;

    if (range === '7d') {
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      return days.map((day, idx) => {
        const bookings = Math.round((totalBooks / 7) * (0.6 + (idx * 0.1)));
        return {
          name: day,
          revenue: Math.round((totalRev / 7) * (0.6 + (idx * 0.1))),
          bookings,
          occupancy: totalBooks > 0 ? Math.min(100, Math.round((bookings / totalBooks) * 100)) : 0,
        };
      });
    }
    if (range === '30d') {
      return ['Week 1', 'Week 2', 'Week 3', 'Week 4'].map((w, idx) => {
        const bookings = Math.round((totalBooks / 4) * (0.8 + (idx * 0.15)));
        return {
          name: w,
          revenue: Math.round((totalRev / 4) * (0.8 + (idx * 0.15))),
          bookings,
          occupancy: totalBooks > 0 ? Math.min(100, Math.round((bookings / totalBooks) * 100)) : 0,
        };
      });
    }
    if (range === '3m') {
      return ['Month 1', 'Month 2', 'Month 3'].map((m, idx) => {
        const bookings = Math.round((totalBooks / 3) * (0.9 + (idx * 0.1)));
        return {
          name: m,
          revenue: Math.round((totalRev / 3) * (0.9 + (idx * 0.1))),
          bookings,
          occupancy: totalBooks > 0 ? Math.min(100, Math.round((bookings / totalBooks) * 100)) : 0,
        };
      });
    }
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months.map(m => {
      const bookings = Math.round(totalBooks / 12);
      return {
        name: m,
        revenue: Math.round(totalRev / 12),
        bookings,
        occupancy: totalBooks > 0 ? Math.min(100, Math.round((bookings / totalBooks) * 100)) : 0,
      };
    });
  }, [range, dbReports]);

  const turfContributions = dbReports?.turfContributions && dbReports.turfContributions.length > 0
    ? dbReports.turfContributions.map((t: any, idx: number) => ({
        ...t,
        fill: idx === 0 ? 'hsl(var(--primary))' : (idx === 1 ? '#3b82f6' : '#f59e0b')
      }))
    : [];

  const sportDistribution = dbReports?.sportDistribution && dbReports.sportDistribution.length > 0
    ? dbReports.sportDistribution.map((s: any, idx: number) => ({
        ...s,
        color: idx === 0 ? '#10b981' : (idx === 1 ? '#3b82f6' : '#f59e0b')
      }))
    : [];

  const handleExportCSV = () => {
    const csvContent = 'Period,Revenue,Bookings,Occupancy\n' + 
      chartData.map(d => `"${d.name}",${d.revenue},${d.bookings},${d.occupancy}%`).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `turfhub-analytics-report-${range}.csv`;
    a.click();
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div className="space-y-8 pb-12">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              Financial & Arena Analytics
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs font-bold">
              Analytics Overview
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Comprehensive business performance, court utilization, and revenue distribution.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={fetchLiveReports}
            disabled={loading}
            title="Refresh analytics"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-card hover:bg-muted font-bold text-xs text-foreground transition-colors shadow-xs"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
            Refresh
          </button>
          {/* Time Filter Pills */}
          <div className="flex bg-muted/60 p-1 rounded-xl border border-border">
            {(['7d', '30d', '3m', '12m'] as const).map(t => (
              <button
                key={t}
                onClick={() => setRange(t)}
                className={cn(
                  'px-3 py-1 text-xs font-bold rounded-lg transition-colors uppercase',
                  range === t ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {t}
              </button>
            ))}
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border bg-card hover:bg-muted font-bold text-xs text-foreground transition-colors shadow-xs"
          >
            <Download className="w-4 h-4 text-muted-foreground" />
            CSV Export
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border bg-card hover:bg-muted font-bold text-xs text-foreground transition-colors shadow-xs"
          >
            <Printer className="w-4 h-4 text-muted-foreground" />
            Print Report
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { title: 'Gross Revenue', value: '₹3,85,000', change: '+21.4%', up: true, note: 'vs previous period' },
          { title: 'Total Bookings', value: '440', change: '+14.2%', up: true, note: '388 online · 52 counter' },
          { title: 'Avg Booking Value', value: '₹1,280', change: '+6.1%', up: true, note: 'Peak slots leading' },
          { title: 'Cancellation Rate', value: '2.1%', change: '-0.8%', up: false, note: 'Lowest in 6 months' }
        ].map((kpi, idx) => (
          <Card key={idx}>
            <CardContent className="p-5">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {kpi.title}
              </span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-2xl sm:text-3xl font-black text-foreground font-mono">
                  {kpi.value}
                </span>
                <span className={cn(
                  'text-xs font-bold px-2 py-0.5 rounded-full border',
                  kpi.up 
                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                    : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                )}>
                  {kpi.change}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-2 pt-2 border-t border-border">
                {kpi.note}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue Growth Trend & Arena Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Revenue Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Revenue Trajectory</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Gross sales generated across all sports complexes
            </p>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="reportGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} dy={8} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} tickFormatter={(v) => `₹${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '12px', border: '1px solid hsl(var(--border))' }}
                    formatter={(val: any) => [`₹${val.toLocaleString('en-IN')}`, 'Revenue']}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#reportGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Sport Categories Share */}
        <Card className="flex flex-col justify-between">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Revenue by Sport</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">Share of court hours booked</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="h-44 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sportDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {sportDistribution.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                    formatter={(val: any) => [`${val}%`, 'Share']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2 border-t border-border pt-4 text-xs">
              {sportDistribution.map((s: any) => (
                <div key={s.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
                    <span className="font-bold text-foreground">{s.name}</span>
                  </div>
                  <span className="font-mono font-bold text-muted-foreground">{s.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue by Facility Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Revenue Contribution by Arena</CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">Individual performance breakdown for owner venues in Tirunelveli</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {turfContributions.map((tc: any) => (
              <div key={tc.name} className="p-4 rounded-2xl border border-border bg-muted/20 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-foreground text-sm truncate">{tc.name}</h4>
                  <span className="text-xs font-mono font-bold text-primary">
                    ₹{tc.revenue.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${(tc.revenue / 198000) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground pt-1">
                  <span>{tc.bookings} matches played</span>
                  <span>Avg ₹{(tc.revenue / tc.bookings).toFixed(0)}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
