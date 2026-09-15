'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { getOwnerTurfs, createOwnerOffer } from '@/services/api';
import { Tag, Sparkles, Percent, Calendar, Loader2 } from 'lucide-react';

interface CreateOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  turfs?: { id: string; name: string }[];
}

export function CreateOfferModal({ isOpen, onClose, onSuccess, turfs: propTurfs }: CreateOfferModalProps) {
  const [promoCode, setPromoCode] = useState('AFTERNOON20');
  const [discountPercent, setDiscountPercent] = useState('20');
  const [turfId, setTurfId] = useState('all');
  const [validUntil, setValidUntil] = useState('2026-09-30');
  const [applicableHours, setApplicableHours] = useState('12:00 PM – 4:00 PM (Off-Peak)');
  const [turfOptions, setTurfOptions] = useState<{ id: string; name: string }[]>(propTurfs || []);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (propTurfs && propTurfs.length > 0) {
      setTurfOptions(propTurfs);
    } else if (isOpen) {
      getOwnerTurfs().then(res => {
        if (res.data?.success && Array.isArray(res.data?.data)) {
          setTurfOptions(res.data.data.map((t: any) => ({ id: t._id || t.id, name: t.name })));
        }
      }).catch(err => console.warn(err));
    }
  }, [isOpen, propTurfs]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const selectedTurfObj = turfOptions.find(t => t.id === turfId);
      const turfName = turfId === 'all' ? 'All Turfs in Portfolio' : (selectedTurfObj?.name || 'Assigned Turf');

      await createOwnerOffer({
        code: promoCode.trim().toUpperCase(),
        discount: `${discountPercent}% OFF`,
        turf: turfName,
        validHours: applicableHours,
        validUntil: validUntil || '30 Sep 2026',
        status: 'ACTIVE',
        redemptions: 0
      });

      onSuccess?.();
      onClose();
    } catch (err: any) {
      console.error('createOwnerOffer error:', err);
      setError(err?.response?.data?.message || 'Failed to save offer to database. Please check permissions.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Promotional Offer"
      description="Fill idle slots and boost off-peak bookings with targeted promo codes."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold">
            {error}
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-foreground block mb-1">Coupon / Promo Code</label>
            <div className="relative">
              <Tag className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
              <input
                type="text"
                required
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                className="w-full pl-9 pr-3 py-2.5 bg-background border border-border rounded-xl text-sm font-mono font-bold text-primary focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground block mb-1">Discount (%)</label>
            <div className="relative">
              <Percent className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
              <input
                type="number"
                min="5"
                max="75"
                required
                value={discountPercent}
                onChange={(e) => setDiscountPercent(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-background border border-border rounded-xl text-sm font-bold text-foreground focus:outline-none focus:border-primary"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-foreground block mb-1">Applicable Turfs</label>
          <select
            value={turfId}
            onChange={(e) => setTurfId(e.target.value)}
            className="w-full px-3 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground focus:outline-none focus:border-primary"
          >
            <option value="all">All Turfs in Portfolio</option>
            {turfOptions.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-foreground block mb-1">Time Restriction</label>
            <select
              value={applicableHours}
              onChange={(e) => setApplicableHours(e.target.value)}
              className="w-full px-3 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground focus:outline-none focus:border-primary"
            >
              <option value="12:00 PM – 4:00 PM (Off-Peak)">12:00 PM – 4:00 PM (Off-Peak)</option>
              <option value="6:00 AM – 8:00 AM (Early Bird)">6:00 AM – 8:00 AM (Early Bird)</option>
              <option value="All Day Slots">All Day Slots</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground block mb-1">Valid Until</label>
            <input
              type="date"
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
              className="w-full px-3 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-border flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2.5 rounded-xl border border-border hover:bg-muted text-xs font-bold text-muted-foreground transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-xs font-bold hover:bg-primary-hover transition-colors shadow-sm flex items-center gap-1.5 disabled:opacity-60"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Launch Offer</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}

