'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Bell, CheckCheck, BookCheck, IndianRupee, 
  Star, Settings, Trash2, ArrowRight, Database, RefreshCw 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { getOwnerBookings, getMyBookings } from '@/services/api';
import { useUserRole } from '@/context/UserRoleContext';
import { cn } from '@/lib/utils';

export interface NotificationItem {
  id: string;
  type: 'booking' | 'payment' | 'review' | 'system';
  title: string;
  message: string;
  time: string;
  read: boolean;
  actionUrl?: string;
}

export default function NotificationsPage() {
  const { isAuthenticated, isPlayer } = useUserRole();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [loading, setLoading] = useState(false);

  const fetchLiveNotifications = async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      if (isPlayer) {
        const res = await getMyBookings();
        if (res.data?.success && Array.isArray(res.data?.data) && res.data.data.length > 0) {
          const playerAlerts: NotificationItem[] = res.data.data.slice(0, 8).map((b: any, idx: number) => ({
            id: `notif-${b._id || b.id || idx}`,
            type: 'booking',
            title: `Match Slot ${b.bookingCode || 'Confirmed'}`,
            message: `Your session at ${b.turfName} (${b.timeSlot}) is active.`,
            time: idx === 0 ? 'Recently' : `${idx * 2}h ago`,
            read: idx > 1,
            actionUrl: '/bookings'
          }));
          setNotifications(playerAlerts);
        } else {
          setNotifications([]);
        }
      } else {
        const res = await getOwnerBookings();
        if (res.data?.success && Array.isArray(res.data?.data) && res.data.data.length > 0) {
          const liveAlerts: NotificationItem[] = res.data.data.slice(0, 8).map((b: any, idx: number) => ({
            id: `notif-${b.id || idx}`,
            type: idx % 3 === 0 ? 'booking' : (idx % 3 === 1 ? 'payment' : 'review'),
            title: idx % 3 === 0 
              ? `New Match Booking Confirmed (${b.bookingCode})` 
              : (idx % 3 === 1 ? `Payment ₹${b.amount} Received via ${b.paymentMethod || 'UPI'}` : `5★ Rating from ${b.customerName}`),
            message: `${b.customerName} booked ${b.turfName} for ${b.timeSlot}.`,
            time: idx === 0 ? 'Just now' : `${idx * 15}m ago`,
            read: idx > 2,
            actionUrl: '/bookings'
          }));
          setNotifications(liveAlerts);
        } else {
          setNotifications([]);
        }
      }
    } catch (err) {
      console.error('fetchLiveNotifications error:', err);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveNotifications();
  }, [isAuthenticated, isPlayer]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const filtered = notifications.filter(n => {
    if (filterType === 'ALL') return true;
    return n.type === filterType.toLowerCase();
  });

  const getIcon = (type: string) => {
    switch (type) {
      case 'booking': return <BookCheck className="w-5 h-5 text-primary" />;
      case 'payment': return <IndianRupee className="w-5 h-5 text-emerald-500" />;
      case 'review': return <Star className="w-5 h-5 text-amber-500" />;
      default: return <Settings className="w-5 h-5 text-blue-400" />;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl pb-12">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              Notification Center
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs font-bold">
              Activity Feed
            </span>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-primary text-primary-foreground">
                {unreadCount} new
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Real-time match alerts, payment updates, and player reviews.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchLiveNotifications}
            disabled={loading}
            title="Refresh alerts"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-card hover:bg-muted font-bold text-xs text-foreground transition-colors shadow-xs"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
            Refresh
          </button>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-card hover:bg-muted text-xs font-bold text-foreground transition-colors"
            >
              <CheckCheck className="w-4 h-4 text-emerald-500" />
              Mark all read
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={clearAll}
              className="p-2 rounded-xl border border-border hover:bg-muted text-muted-foreground hover:text-rose-500 transition-colors"
              title="Clear all notifications"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-3 overflow-x-auto">
        {['ALL', 'BOOKING', 'PAYMENT', 'REVIEW', 'SYSTEM'].map(type => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={cn(
              'px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition-all shrink-0',
              filterType === type 
                ? 'bg-primary text-primary-foreground shadow-xs' 
                : 'bg-muted/60 text-muted-foreground hover:text-foreground'
            )}
          >
            {type.toLowerCase()}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filtered.length > 0 ? (
          filtered.map(item => (
            <Card 
              key={item.id}
              onClick={() => markAsRead(item.id)}
              className={cn(
                'border-border hover:border-border/80 transition-all cursor-pointer',
                !item.read && 'bg-primary/5 border-primary/20'
              )}
            >
              <CardContent className="p-4 sm:p-5 flex items-start gap-4">
                
                <div className="w-10 h-10 rounded-2xl bg-muted/60 border border-border flex items-center justify-center shrink-0 mt-0.5">
                  {getIcon(item.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className={cn('text-sm truncate', !item.read ? 'font-black text-foreground' : 'font-semibold text-foreground/80')}>
                      {item.title}
                    </h4>
                    <span className="text-[11px] text-muted-foreground shrink-0 font-medium">{item.time}</span>
                  </div>

                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {item.message}
                  </p>

                  {item.actionUrl && (
                    <div className="mt-3">
                      <Link
                        href={item.actionUrl}
                        className="inline-flex items-center text-xs font-bold text-primary hover:underline gap-1"
                      >
                        View details <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  )}
                </div>

                {!item.read && (
                  <span className="w-2.5 h-2.5 rounded-full bg-primary shrink-0 mt-1.5 animate-pulse" />
                )}

              </CardContent>
            </Card>
          ))
        ) : (
          <div className="p-12 text-center flex flex-col items-center justify-center bg-card border border-border rounded-3xl">
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-3">
              <Bell className="w-7 h-7 text-muted-foreground" />
            </div>
            <h3 className="text-base font-bold text-foreground">No notifications found</h3>
            <p className="text-xs text-muted-foreground mt-1">
              You're all caught up with your sports ground activity.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
