'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, Plus, Phone, MapPin, Clock, 
  Shield, CheckCircle2, MoreVertical, Database, RefreshCw 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { getOwnerTurfs, getOwnerStaff } from '@/services/api';
import { useUserRole } from '@/context/UserRoleContext';
import { cn } from '@/lib/utils';

export default function StaffPage() {
  const { isAuthenticated, isOwner, isAdmin } = useUserRole();
  const [loading, setLoading] = useState(false);
  const [staffList, setStaffList] = useState<any[]>([]);

  const fetchLiveStaff = async () => {
    if (!isAuthenticated || (!isOwner && !isAdmin)) return;
    setLoading(true);
    try {
      const [staffRes, turfRes] = await Promise.all([
        getOwnerStaff(),
        getOwnerTurfs()
      ]);
      const turfs = turfRes.data?.data || [];
      if (staffRes.data?.success && Array.isArray(staffRes.data?.data) && staffRes.data.data.length > 0) {
        const staff = staffRes.data.data.map((u: any, idx: number) => ({
          id: u._id || `st-${idx}`,
          name: u.name,
          role: u.title || 'Ground Supervisor & Field Marshal',
          turf: turfs[idx % (turfs.length || 1)]?.name || 'Assigned Venue',
          shift: '07:00 AM – 03:00 PM (General Shift)',
          phone: u.phone,
          status: 'ON DUTY'
        }));
        setStaffList(staff);
      } else {
        setStaffList([]);
      }
    } catch (err) {
      console.error('fetchLiveStaff error:', err);
      setStaffList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveStaff();
  }, [isAuthenticated, isOwner, isAdmin]);

  return (
    <div className="space-y-6 max-w-5xl pb-16">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              Staff & Ground Marshals
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs font-bold">
              Active Team
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Manage venue caretakers, floodlight operators, and counter cashiers across your complexes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchLiveStaff}
            disabled={loading}
            title="Refresh staff"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-card hover:bg-muted font-bold text-xs text-foreground transition-colors shadow-xs"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
            Refresh
          </button>
          <button 
            onClick={() => alert('Add staff modal.')}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground font-bold text-xs rounded-xl hover:bg-primary-hover transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Staff Member
          </button>
        </div>
      </div>

      {/* Staff Grid */}
      {staffList.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <div className="max-w-md mx-auto space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto text-muted-foreground">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-foreground text-base">No Staff Members Assigned</h3>
            <p className="text-xs text-muted-foreground">
              No ground marshals or staff members assigned yet. Add a turf venue to assign caretakers and operational crew.
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {staffList.map(member => (
            <Card key={member.id} className="border-border">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-primary/10 border border-primary/20 text-primary font-black flex items-center justify-center">
                    {member.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-foreground">{member.name}</h3>
                    <p className="text-[11px] text-muted-foreground truncate max-w-[150px]">{member.role}</p>
                  </div>
                </div>
                <span className={cn(
                  'px-2 py-0.5 rounded-full text-[9px] font-black uppercase border',
                  member.status === 'ON DUTY' 
                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                    : 'bg-muted text-muted-foreground border-border'
                )}>
                  {member.status}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-muted/30 border border-border space-y-1.5 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="text-foreground font-medium truncate">{member.turf}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="truncate">{member.shift}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span>{member.phone}</span>
                </div>
              </div>

              <a
                href={`tel:${member.phone}`}
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-xs font-bold transition-colors"
              >
                <Phone className="w-3.5 h-3.5" /> Call Staff
              </a>
            </CardContent>
          </Card>
        ))}
      </div>
      )}

    </div>
  );
}
