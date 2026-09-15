'use client';

import React, { useState, useEffect } from 'react';
import { 
  Settings, User, Building, Bell, CreditCard, 
  ShieldCheck, Save, CheckCircle2, IndianRupee, MapPin
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useUserRole } from '@/context/UserRoleContext';

export default function SettingsPage() {
  const { user, isOwner, isAdmin } = useUserRole();
  const [ownerName, setOwnerName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [businessName, setBusinessName] = useState('TurfHub Nellai Sports Network');
  const [upiId, setUpiId] = useState('turfhub@icici');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (user) {
      setOwnerName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-4xl pb-16">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
          {isOwner || isAdmin ? 'Owner & Venue Settings' : 'Account & Profile Settings'}
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
          {isOwner || isAdmin 
            ? 'Manage business credentials, payout UPI accounts, and system preferences.'
            : 'Manage personal contact information and notifications.'}
        </p>
      </div>

      {saved && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          Settings updated successfully!
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              {isOwner || isAdmin ? 'Owner Account Profile' : 'Player Account Profile'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-foreground block mb-1">Full Name</label>
                <input
                  type="text"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="font-bold text-foreground block mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:border-primary"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-foreground block mb-1">Mobile Contact</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="font-bold text-foreground block mb-1">Operating Region</label>
                <input
                  type="text"
                  disabled
                  value="Tirunelveli, Tamil Nadu, India (₹ INR)"
                  className="w-full px-3 py-2 bg-muted border border-border rounded-xl text-muted-foreground"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payout Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-500" />
              Direct Payout & Settlement Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-foreground block mb-1">Business Name</label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="font-bold text-foreground block mb-1">UPI VPA for Player QR Payments</label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground font-mono focus:outline-none focus:border-primary"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 bg-primary text-primary-foreground font-bold text-xs rounded-xl hover:bg-primary-hover transition-colors shadow-sm flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            Save Preferences
          </button>
        </div>

      </form>

    </div>
  );
}
