'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { getOwnerTurfs } from '@/services/api';
import { ShieldAlert, Calendar, Clock, Wrench } from 'lucide-react';

interface BlockSlotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBlockSuccess?: (slotDetails: any) => void;
  turfs?: { id: string; name: string; location?: string }[];
}

export function BlockSlotModal({ isOpen, onClose, onBlockSuccess, turfs: propTurfs }: BlockSlotModalProps) {
  const [turfOptions, setTurfOptions] = useState<{ id: string; name: string; location?: string }[]>(propTurfs || []);
  const [turfId, setTurfId] = useState('');
  const [date, setDate] = useState('2026-09-08');
  const [timeSlot, setTimeSlot] = useState('2:00 PM – 4:00 PM');
  const [reason, setReason] = useState('Pitch Brushing & Turf Maintenance');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (propTurfs && propTurfs.length > 0) {
      setTurfOptions(propTurfs);
      if (!turfId) setTurfId(propTurfs[0].id);
    } else if (isOpen) {
      getOwnerTurfs().then(res => {
        if (res.data?.success && Array.isArray(res.data?.data) && res.data.data.length > 0) {
          const mapped = res.data.data.map((t: any) => ({
            id: t._id || t.id,
            name: t.name,
            location: t.locationDetails || t.city || 'Tirunelveli'
          }));
          setTurfOptions(mapped);
          if (!turfId) setTurfId(mapped[0].id);
        }
      }).catch(err => console.warn(err));
    }
  }, [isOpen, propTurfs]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onBlockSuccess?.({ turfId, date, timeSlot, reason, notes });
    alert(`Slot blocked successfully: ${timeSlot} on ${date} for ${reason}`);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Block Turf Slot"
      description="Temporarily disable online bookings for maintenance, bad weather, or private fixtures."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs font-semibold text-foreground block mb-1">Select Turf</label>
          <select
            value={turfId}
            onChange={(e) => setTurfId(e.target.value)}
            className="w-full px-3 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground focus:outline-none focus:border-primary"
          >
            {turfOptions.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.location || 'Tirunelveli'})
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-foreground block mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-foreground block mb-1">Time Slot</label>
            <select
              value={timeSlot}
              onChange={(e) => setTimeSlot(e.target.value)}
              className="w-full px-3 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground focus:outline-none focus:border-primary"
            >
              <option value="12:00 PM – 2:00 PM">12:00 PM – 2:00 PM</option>
              <option value="2:00 PM – 4:00 PM">2:00 PM – 4:00 PM</option>
              <option value="4:00 PM – 6:00 PM">4:00 PM – 6:00 PM</option>
              <option value="6:00 PM – 8:00 PM">6:00 PM – 8:00 PM</option>
              <option value="Full Day">Entire Day</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-foreground block mb-1">Reason for Blocking</label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full px-3 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground focus:outline-none focus:border-primary"
          >
            <option value="Pitch Brushing & Turf Maintenance">Pitch Brushing & Turf Maintenance</option>
            <option value="Floodlight Repairs / Electrical Works">Floodlight Repairs / Electrical Works</option>
            <option value="Heavy Rain / Monsoon Waterlogging">Heavy Rain / Monsoon Waterlogging</option>
            <option value="Private Club Championship / League">Private Club Championship / League</option>
            <option value="Holiday / Festival Closure">Holiday / Festival Closure</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold text-foreground block mb-1">Staff Note (Optional)</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Contractor arriving at 2:15 PM"
            className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-none focus:border-primary"
          />
        </div>

        <div className="pt-4 border-t border-border flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-border hover:bg-muted text-xs font-bold text-muted-foreground transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
          >
            Block Slot Now
          </button>
        </div>
      </form>
    </Modal>
  );
}

