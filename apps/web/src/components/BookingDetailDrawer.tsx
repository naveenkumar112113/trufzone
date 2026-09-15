'use client';

import React from 'react';
import { Drawer } from '@/components/ui/Drawer';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { 
  Calendar, Clock, MapPin, Phone, Mail, User, 
  IndianRupee, QrCode, AlertTriangle, CheckCircle2,
  Share2, RefreshCw, XCircle, MessageSquare
} from 'lucide-react';

export interface IBookingDetail {
  id: string;
  bookingCode: string;
  turfId: string;
  turfName: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerAvatar?: string;
  sport?: string;
  date: string;
  timeSlot: string;
  startTimeHour?: number;
  durationHours?: number;
  amount: number;
  paymentMethod?: string;
  paymentStatus: string;
  status: string;
  createdAt?: string;
  notes?: string;
}

interface BookingDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  booking: IBookingDetail | null;
  onCancelBooking?: (id: string) => void;
}

export function BookingDetailDrawer({
  isOpen,
  onClose,
  booking,
  onCancelBooking
}: BookingDetailDrawerProps) {
  if (!booking) return null;

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Booking Details"
      width="w-full max-w-lg"
    >
      <div className="space-y-6">
        {/* Header Strip with Code & Badges */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/40 border border-border">
          <div>
            <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider block">
              Booking Ref
            </span>
            <span className="text-xl font-extrabold text-foreground font-mono">
              {booking.bookingCode}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={booking.status} />
            <StatusBadge status={booking.paymentStatus === 'PAID' ? 'paid' : 'pending'} />
          </div>
        </div>

        {/* QR Code Check-in card */}
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-primary/5 border border-primary/20">
          <div className="w-16 h-16 rounded-xl bg-card border border-border p-1.5 flex items-center justify-center shrink-0 shadow-sm">
            <QrCode className="w-full h-full text-primary" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-foreground flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              Venue Check-in QR
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Scan this at the turf reception counter to verify check-in and turn on court floodlights.
            </p>
          </div>
        </div>

        {/* Match / Turf Schedule Details */}
        <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Schedule & Arena
          </h4>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Turf Arena</p>
              <p className="text-sm font-bold text-foreground mt-0.5">{booking.turfName}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Sport Category</p>
              <p className="text-sm font-bold text-primary mt-0.5">{booking.sport}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Date</p>
              <p className="text-sm font-semibold text-foreground mt-0.5 flex items-center">
                <Calendar className="w-3.5 h-3.5 mr-1 text-muted-foreground" />
                {booking.date}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Timing & Duration</p>
              <p className="text-sm font-semibold text-foreground mt-0.5 flex items-center">
                <Clock className="w-3.5 h-3.5 mr-1 text-muted-foreground" />
                {booking.timeSlot} ({booking.durationHours} hr)
              </p>
            </div>
          </div>

          {booking.notes && (
            <div className="pt-3 border-t border-border">
              <p className="text-xs text-muted-foreground">Customer Notes</p>
              <p className="text-xs font-medium text-foreground mt-1 bg-muted/30 p-2.5 rounded-lg border border-border">
                {booking.notes}
              </p>
            </div>
          )}
        </div>

        {/* Customer Information */}
        <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Customer Contact
            </h4>
            <span className="text-xs font-medium text-primary">Verified Player</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-base">
              {booking.customerName.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground truncate">{booking.customerName}</p>
              <p className="text-xs text-muted-foreground truncate">{booking.customerPhone}</p>
            </div>
          </div>

          {/* Quick contact actions */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            <a
              href={`tel:${booking.customerPhone}`}
              className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold border border-border transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-primary" />
              Call Player
            </a>
            <a
              href={`https://wa.me/${booking.customerPhone.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 text-xs font-semibold border border-emerald-500/20 transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              WhatsApp
            </a>
          </div>
        </div>

        {/* Payment Breakdown */}
        <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Payment Breakdown
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Court Slot Base Fee</span>
              <span>₹{booking.amount}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Lighting & Equipment Charges</span>
              <span className="text-emerald-500 font-medium">Included</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Payment Mode</span>
              <span className="font-semibold text-foreground uppercase">{booking.paymentMethod}</span>
            </div>
            <div className="pt-2 border-t border-border flex justify-between items-center text-base font-bold text-foreground">
              <span>Total Paid</span>
              <span className="text-xl text-primary font-mono">₹{booking.amount}</span>
            </div>
          </div>
        </div>

        {/* Operational Actions */}
        <div className="space-y-3 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => alert(`Reschedule request sent for booking ${booking.bookingCode}`)}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-border hover:bg-muted font-bold text-xs text-foreground transition-colors"
            >
              <RefreshCw className="w-4 h-4 text-muted-foreground" />
              Reschedule Slot
            </button>
            <button
              onClick={() => {
                if (confirm(`Are you sure you want to cancel booking ${booking.bookingCode}?`)) {
                  onCancelBooking?.(booking.id);
                  onClose();
                }
              }}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 font-bold text-xs text-rose-500 transition-colors"
            >
              <XCircle className="w-4 h-4" />
              Cancel & Refund
            </button>
          </div>
        </div>
      </div>
    </Drawer>
  );
}
