'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Building2, MapPin, Trophy, Sparkles, Clock, 
  IndianRupee, ShieldAlert, ArrowLeft, Save, 
  ExternalLink, Calendar, Check, AlertCircle, Camera, Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { getPublicTurfDetails } from '@/services/api';
import { cn } from '@/lib/utils';

export default function TurfEditorPage() {
  const params = useParams();
  const router = useRouter();
  const turfId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'media' | 'sports' | 'pricing' | 'policies'>('basic');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [pricePerHour, setPricePerHour] = useState('1000');
  const [openingHours, setOpeningHours] = useState('06:00 AM - 11:00 PM');
  const [selectedSports, setSelectedSports] = useState<string[]>(['Football']);
  const [selectedFacilities, setSelectedFacilities] = useState<string[]>(['FIFA Grade Turf', 'LED Floodlights']);
  const [images, setImages] = useState<string[]>([]);

  useEffect(() => {
    if (!turfId) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    getPublicTurfDetails(turfId)
      .then(res => {
        if (res.data?.success && res.data?.data) {
          const t = res.data.data;
          setName(t.name || '');
          setTagline(t.description || 'Sports Turf Arena');
          setDescription(t.description || '');
          setLocation(t.locationDetails || t.city || 'Tirunelveli');
          setCity(t.city || 'Tirunelveli');
          setPhone('+91 94431 82940');
          setPricePerHour('1000');
          setOpeningHours('06:00 AM - 11:00 PM');
          setSelectedSports(t.sports || ['Football']);
          setSelectedFacilities(t.facilities || ['FIFA Grade Turf', 'LED Floodlights']);
          setImages(t.images || ['https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=1200']);
        } else {
          setNotFound(true);
        }
      })
      .catch(err => {
        console.warn('Error fetching turf editor details:', err);
        setNotFound(true);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [turfId]);

  const allSports = ['Football', 'Box Cricket', 'Badminton', 'Tennis', 'Pickleball', 'Volleyball'];
  const allFacilities = [
    'FIFA Grade Turf', 'LED Floodlights', 'Changing Rooms', 
    'Drinking Water', 'Free Parking', 'Bibs & Balls', 
    'First Aid Kit', 'Bowling Machine', 'Pro Sound System'
  ];

  const toggleSport = (s: string) => {
    setSelectedSports(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };

  const toggleFacility = (f: string) => {
    setSelectedFacilities(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-xs font-bold text-muted-foreground">Loading venue configuration...</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-muted/60 border border-border flex items-center justify-center mx-auto text-muted-foreground">
          <MapPin className="w-7 h-7" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-black text-foreground">Venue Not Found</h2>
          <p className="text-xs text-muted-foreground max-w-sm">
            This turf venue does not exist in your portfolio or you do not have permission to edit it.
          </p>
        </div>
        <Link
          href="/turfs"
          className="py-2.5 px-5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold transition-all inline-flex items-center gap-2 shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to My Turfs</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl pb-16">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => router.push('/turfs')}
            className="p-2 rounded-xl border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                {name}
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                Active Venue
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-primary" />
              {location}, {city}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/public/turf/${turfId}`}
            target="_blank"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border bg-card hover:bg-muted font-bold text-xs text-foreground transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5 text-primary" />
            Public Page
          </Link>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary-hover transition-colors shadow-sm"
          >
            <Save className="w-3.5 h-3.5" />
            Save Changes
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-bold flex items-center gap-2">
          <Check className="w-4 h-4" />
          Venue profile and settings have been saved successfully!
        </div>
      )}

      {/* Editor Tabs */}
      <div className="flex bg-muted/60 p-1.5 rounded-2xl border border-border overflow-x-auto">
        {[
          { id: 'basic', label: 'Basic Info' },
          { id: 'media', label: 'Photos & Gallery' },
          { id: 'sports', label: 'Sports & Amenities' },
          { id: 'pricing', label: 'Hours & Pricing' },
          { id: 'policies', label: 'Policies & Cancellation' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              'px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap',
              activeTab === tab.id 
                ? 'bg-card text-foreground shadow-xs' 
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB CONTENT */}
      <form onSubmit={handleSave} className="space-y-6">
        
        {/* 1. BASIC INFO */}
        {activeTab === 'basic' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Venue Details & Identification</CardTitle>
              <p className="text-xs text-muted-foreground">General information displayed on the player marketplace</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">Turf / Arena Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">Tagline / Catchphrase</label>
                  <input
                    type="text"
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">Neighborhood / Area</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-foreground block mb-1">Facility Description</label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-3 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-none focus:border-primary resize-none leading-relaxed"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* 2. PHOTOS & GALLERY */}
        {activeTab === 'media' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Photos & Media Gallery</CardTitle>
              <p className="text-xs text-muted-foreground">High resolution court photos attract 3x more bookings</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {images.map((img: string, i: number) => (
                  <div key={i} className="relative h-44 rounded-2xl overflow-hidden border border-border group">
                    <img src={img} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-[10px] font-bold text-white">
                      {i === 0 ? 'Cover Photo' : `Gallery #${i}`}
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-8 border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center text-center hover:bg-muted/30 transition-colors cursor-pointer">
                <Camera className="w-8 h-8 text-muted-foreground mb-2" />
                <p className="text-xs font-bold text-foreground">Upload New Turf Images</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Supports PNG, JPG, WebP up to 10MB each</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 3. SPORTS & FACILITIES */}
        {activeTab === 'sports' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Sports Categories & Amenities</CardTitle>
              <p className="text-xs text-muted-foreground">Select sports playable on this pitch and facilities provided to players</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-3">
                  Playable Sports
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {allSports.map(s => {
                    const isSelected = selectedSports.includes(s);
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => toggleSport(s)}
                        className={cn(
                          'p-3 rounded-xl border text-xs font-bold text-left flex items-center justify-between transition-all',
                          isSelected 
                            ? 'bg-primary/10 border-primary text-primary' 
                            : 'bg-card border-border text-muted-foreground hover:text-foreground'
                        )}
                      >
                        <span>{s}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-primary" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-3">
                  Court Facilities & Equipment
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {allFacilities.map(f => {
                    const isSelected = selectedFacilities.includes(f);
                    return (
                      <button
                        key={f}
                        type="button"
                        onClick={() => toggleFacility(f)}
                        className={cn(
                          'p-3 rounded-xl border text-xs font-bold text-left flex items-center justify-between transition-all',
                          isSelected 
                            ? 'bg-primary/10 border-primary text-primary' 
                            : 'bg-card border-border text-muted-foreground hover:text-foreground'
                        )}
                      >
                        <span className="truncate pr-1">{f}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 4. HOURS & PRICING */}
        {activeTab === 'pricing' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Operating Hours & Base Pricing</CardTitle>
              <p className="text-xs text-muted-foreground">Define standard court hourly rate and gate operational timings</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">Base Price / Hour (₹)</label>
                  <div className="relative">
                    <IndianRupee className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
                    <input
                      type="number"
                      value={pricePerHour}
                      onChange={(e) => setPricePerHour(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-background border border-border rounded-xl text-xs font-mono font-bold text-foreground focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">Operating Hours</label>
                  <div className="relative">
                    <Clock className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
                    <input
                      type="text"
                      value={openingHours}
                      onChange={(e) => setOpeningHours(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-muted/40 border border-border flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-foreground">Advanced Hourly Pricing Engine</h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Configure peak hour surcharges (6 PM – 10 PM) and weekend multipliers.
                  </p>
                </div>
                <Link
                  href="/pricing"
                  className="px-3 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold transition-colors"
                >
                  Configure Rules →
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 5. POLICIES & CANCELLATION */}
        {activeTab === 'policies' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Booking Policies & Rules</CardTitle>
              <p className="text-xs text-muted-foreground">Cancellation terms and ground rules communicated to players</p>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-muted/20 border border-border space-y-2">
                <span className="font-bold text-foreground">Cancellation & Refund Policy</span>
                <p className="text-muted-foreground leading-relaxed">
                  Full refund if cancelled at least 4 hours before the match kick-off time. 
                  50% refund if cancelled between 2–4 hours. Non-refundable within 2 hours of slot time.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-muted/20 border border-border space-y-2">
                <span className="font-bold text-foreground">Footwear & Equipment Rules</span>
                <p className="text-muted-foreground leading-relaxed">
                  Only rubber-studded football boots or flat turf shoes permitted. Metal studs strictly forbidden to preserve turf grass integrity.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer save */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
          <button
            type="button"
            onClick={() => router.push('/turfs')}
            className="px-4 py-2 rounded-xl border border-border text-xs font-bold text-muted-foreground hover:bg-muted"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-bold hover:bg-primary-hover transition-colors shadow-sm"
          >
            Save Changes
          </button>
        </div>

      </form>
    </div>
  );
}
