'use client';

import React, { useState, useEffect } from 'react';
import { 
  Tag, Plus, Sparkles, Percent, Calendar, 
  Trash2, Check, Clock, IndianRupee, Database, RefreshCw 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { CreateOfferModal } from '@/components/CreateOfferModal';
import { getOwnerOffers, deleteOwnerOffer } from '@/services/api';
import { useUserRole } from '@/context/UserRoleContext';
import { cn } from '@/lib/utils';

export default function OffersPage() {
  const { isAuthenticated, isOwner, isAdmin } = useUserRole();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [offers, setOffers] = useState<any[]>([]);

  const fetchLiveOffers = async () => {
    if (!isAuthenticated || (!isOwner && !isAdmin)) return;
    setLoading(true);
    try {
      const res = await getOwnerOffers();
      if (res.data?.success && Array.isArray(res.data?.data) && res.data.data.length > 0) {
        const mapped = res.data.data.map((o: any) => ({
          id: o._id || o.id,
          code: o.code,
          discount: o.discount,
          turf: o.turf,
          validHours: o.validHours,
          validUntil: o.validUntil,
          status: o.status,
          redemptions: o.redemptions || 0
        }));
        setOffers(mapped);
      } else {
        setOffers([]);
      }
    } catch (err) {
      console.error('fetchLiveOffers error:', err);
      setOffers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveOffers();
  }, [isAuthenticated, isOwner, isAdmin]);

  const handleDeleteOffer = async (id: string) => {
    if (!confirm('Are you sure you want to delete this promotional offer?')) return;
    try {
      await deleteOwnerOffer(id);
      fetchLiveOffers();
    } catch (err) {
      console.error('Failed to delete offer:', err);
      alert('Failed to delete offer from database.');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl pb-16">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              Promotional Coupons & Offers
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs font-bold">
              {offers.length} {offers.length === 1 ? 'Offer' : 'Offers'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Drive off-peak utilization and reward repeat squad bookings.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground font-bold text-xs rounded-xl hover:bg-primary-hover transition-colors shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          Create New Offer
        </button>
      </div>

      {/* Offers Grid */}
      {offers.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <div className="max-w-md mx-auto space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto text-muted-foreground">
              <Tag className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-foreground text-base">No Promotional Offers Active</h3>
            <p className="text-xs text-muted-foreground">
              Create seasonal coupon codes and floodlight discount deals to increase venue booking volume during off-peak hours.
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {offers.map(offer => (
            <Card key={offer.id} className="border-border flex flex-col justify-between">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Coupon Code</span>
                  <p className="text-lg font-mono font-black text-primary tracking-wide">{offer.code}</p>
                </div>
                <span className={cn(
                  'px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border',
                  offer.status === 'ACTIVE' 
                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                    : 'bg-muted text-muted-foreground border-border'
                )}>
                  {offer.status}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-muted/30 border border-border space-y-1.5 text-xs">
                <div className="flex justify-between font-bold text-foreground">
                  <span>Discount Value</span>
                  <span className="text-emerald-500 font-mono">{offer.discount}</span>
                </div>
                <div className="flex justify-between text-muted-foreground text-[11px]">
                  <span>Applies To</span>
                  <span className="truncate max-w-[130px]">{offer.turf}</span>
                </div>
                <div className="flex justify-between text-muted-foreground text-[11px]">
                  <span>Eligible Slot</span>
                  <span className="truncate max-w-[130px]">{offer.validHours}</span>
                </div>
                <div className="flex justify-between text-muted-foreground text-[11px]">
                  <span>Valid Until</span>
                  <span>{offer.validUntil}</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1 border-t border-border">
                <span className="text-muted-foreground">{offer.redemptions} times used</span>
                <button 
                  onClick={() => handleDeleteOffer(offer.id)}
                  title="Delete offer from MongoDB"
                  className="text-muted-foreground hover:text-rose-500 transition-colors p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      )}

      <CreateOfferModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchLiveOffers}
      />

    </div>
  );
}
