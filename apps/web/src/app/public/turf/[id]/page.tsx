'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Star, MapPin, Phone, ShieldCheck, Clock, Check,
  Calendar, IndianRupee, ArrowLeft, Share2, Heart,
  Flame, Award, Car, Droplets, Zap, Shield, Sparkles, Loader2,
  XCircle, CheckCircle2, AlertTriangle
} from 'lucide-react';
import { getPublicTurfDetails, getPublicTurfs, publicBookTurf } from '@/services/api';
import { useUserRole } from '@/context/UserRoleContext';
import { cn } from '@/lib/utils';

export interface PublicTurfDetails {
  id: string;
  name: string;
  tagline: string;
  sports: string[];
  facilities: string[];
  location: string;
  city: string;
  rating: number;
  reviewsCount: number;
  status: string;
  image: string;
  images: string[];
  pricePerHour: number;
  openingHours: string;
  description: string;
  phone: string;
  reviews?: Array<{
    id: string;
    customerName: string;
    date: string;
    rating: number;
    comment: string;
  }>;
}

export default function PublicTurfMarketplacePage() {
  const params = useParams();
  const router = useRouter();
  const turfId = params?.id as string;

  const [turf, setTurf] = useState<PublicTurfDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [selectedSport, setSelectedSport] = useState('Football');

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
          const found = res.data.data;
          setTurf({
            id: found._id || found.id,
            name: found.name,
            tagline: found.description || 'Sports Turf Arena',
            sports: found.sports && found.sports.length > 0 ? found.sports : ['Football'],
            facilities: found.facilities && found.facilities.length > 0 ? found.facilities : ['Floodlights', 'Changing Rooms'],
            location: found.locationDetails || found.city || 'Tirunelveli',
            city: found.city || 'Tirunelveli',
            rating: found.rating || 0,
            reviewsCount: found.reviewsCount || 0,
            status: found.status || 'ACTIVE',
            image: found.images?.[0] || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=1200',
            images: found.images && found.images.length > 0 ? found.images : ['https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=1200'],
            pricePerHour: found.pricePerHour || 800,
            openingHours: found.openingHours || '06:00 AM - 11:00 PM',
            description: found.description || '',
            phone: found.phone || '',
            reviews: found.reviews || []
          });
          if (found.sports && found.sports.length > 0) {
            setSelectedSport(found.sports[0]);
          }
        } else {
          setNotFound(true);
        }
      })
      .catch(err => {
        console.warn('Public turf fetch error:', err);
        setNotFound(true);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [turfId]);

  const { user } = useUserRole();
  const [selectedDate, setSelectedDate] = useState('2026-09-08');
  const [selectedSlot, setSelectedSlot] = useState('6:00 PM – 7:00 PM');
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [bookingStatusModal, setBookingStatusModal] = useState<{
    type: 'SUCCESS' | 'CONFLICT' | 'ERROR';
    title: string;
    message: string;
    bookingCode?: string;
    amount?: number;
  } | null>(null);

  useEffect(() => {
    if (user) {
      if (user.name && !customerName) setCustomerName(user.name);
      if (user.phone && !customerPhone) setCustomerPhone(user.phone);
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
        <p className="text-xs font-bold text-zinc-400">Loading arena details...</p>
      </div>
    );
  }

  if (notFound || !turf) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-zinc-400">
          <MapPin className="w-7 h-7" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-black text-white">Venue Not Found</h2>
          <p className="text-xs text-zinc-400 max-w-sm">
            The sports arena you are looking for does not exist or may have been removed.
          </p>
        </div>
        <Link
          href="/public"
          className="py-2.5 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all inline-flex items-center gap-2 shadow-md"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Browse All Available Turfs</span>
        </Link>
      </div>
    );
  }

  const basePrice = turf.pricePerHour || 800;
  const availableSlots = [
    { time: '6:00 AM – 7:00 AM', price: basePrice, peak: false },
    { time: '7:00 AM – 8:00 AM', price: basePrice, peak: false },
    { time: '4:00 PM – 5:00 PM', price: basePrice, peak: false },
    { time: '5:00 PM – 6:00 PM', price: basePrice + 100, peak: true },
    { time: '6:00 PM – 7:00 PM', price: basePrice + 200, peak: true },
    { time: '7:00 PM – 8:00 PM', price: basePrice + 200, peak: true },
    { time: '8:00 PM – 9:00 PM', price: basePrice + 200, peak: true },
    { time: '9:00 PM – 10:00 PM', price: basePrice + 100, peak: true },
  ];

  const currentPrice = availableSlots.find(s => s.time === selectedSlot)?.price || basePrice;

  const handleBooking = async () => {
    if (!customerName.trim()) {
      setBookingStatusModal({
        type: 'ERROR',
        title: 'Player Name Required',
        message: 'Please enter your name to complete the booking.'
      });
      return;
    }

    const cleanPhone = customerPhone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setBookingStatusModal({
        type: 'ERROR',
        title: 'Valid Mobile Required',
        message: 'Please provide a valid 10-digit mobile number for booking confirmation.'
      });
      return;
    }

    setBookingSuccess(true);
    try {
      const res = await publicBookTurf({
        turfId: turf.id,
        customerName: customerName.trim(),
        customerPhone: cleanPhone,
        date: selectedDate,
        timeSlot: selectedSlot,
        amount: currentPrice,
        sport: selectedSport,
        paymentMethod: 'UPI'
      });

      if (res.data?.success) {
        setBookingStatusModal({
          type: 'SUCCESS',
          title: 'Booking Confirmed!',
          message: `Your booking for ${turf.name} on ${selectedDate} (${selectedSlot}) is confirmed.`,
          bookingCode: res.data.data?.bookingCode,
          amount: res.data.data?.amount || currentPrice
        });
      } else {
        setBookingStatusModal({
          type: 'ERROR',
          title: 'Booking Notice',
          message: res.data?.message || 'Unable to confirm booking. Please try again.'
        });
      }
    } catch (err: any) {
      console.error('Online booking error:', err);
      const status = err.response?.status;
      const msg = err.response?.data?.message;

      if (status === 409) {
        setBookingStatusModal({
          type: 'CONFLICT',
          title: 'Slot Already Booked',
          message: msg || `The ${selectedSlot} slot on ${selectedDate} is already reserved by another player. Please select an alternative slot.`
        });
      } else if (status === 400) {
        setBookingStatusModal({
          type: 'ERROR',
          title: 'Invalid Booking Request',
          message: msg || 'Please verify all booking details and try again.'
        });
      } else if (status === 404) {
        setBookingStatusModal({
          type: 'ERROR',
          title: 'Turf Unavailable',
          message: 'This turf arena could not be found or is temporarily closed.'
        });
      } else {
        setBookingStatusModal({
          type: 'ERROR',
          title: 'Booking System Error',
          message: msg || 'A server error occurred while processing your booking. Please try again in a few moments.'
        });
      }
    } finally {
      setBookingSuccess(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans antialiased pb-24 selection:bg-emerald-500 selection:text-black">
      
      {/* Consumer Navigation Bar */}
      <header className="sticky top-0 z-50 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800/80 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => router.back()}
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center font-black text-black text-xs">
              TH
            </span>
            <span className="font-black text-lg tracking-tight">TurfHub Marketplace</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition-colors">
            <Share2 className="w-4 h-4" />
          </button>
          <button className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-rose-400 border border-zinc-800 transition-colors">
            <Heart className="w-4 h-4" />
          </button>
          <Link
            href="/"
            className="hidden sm:inline-flex items-center px-3.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-xs font-bold border border-zinc-800 text-zinc-300"
          >
            Owner Dashboard →
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-8">
        
        {/* Photo Gallery Hero */}
        <div className="space-y-3">
          <div className="relative h-72 sm:h-[420px] rounded-3xl overflow-hidden border border-zinc-800 shadow-2xl">
            <img 
              src={turf.images[activePhotoIdx] || turf.image} 
              alt={turf.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />
            
            <div className="absolute top-4 left-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/90 text-zinc-950 font-black text-xs uppercase tracking-wide">
                <Sparkles className="w-3.5 h-3.5" /> FIFA Approved Turf
              </span>
            </div>

            <div className="absolute bottom-6 left-6 right-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight drop-shadow-md">
                  {turf.name}
                </h1>
                <p className="text-zinc-300 text-sm flex items-center gap-1.5 mt-1">
                  <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                  {turf.location}, {turf.city}, Tamil Nadu
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="bg-zinc-900/90 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-zinc-700/60 flex items-center gap-2">
                  <div className="flex items-center text-amber-400 font-black text-base">
                    <Star className="w-4 h-4 fill-amber-400 mr-1" />
                    {turf.rating}
                  </div>
                  <span className="text-xs text-zinc-400">({turf.reviewsCount} verified reviews)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Thumbnail Strip */}
          <div className="flex gap-3 overflow-x-auto pb-1">
            {turf.images.map((img, i) => (
              <button
                key={i}
                onClick={() => setActivePhotoIdx(i)}
                className={cn(
                  'w-24 h-16 rounded-xl overflow-hidden border-2 shrink-0 transition-all',
                  activePhotoIdx === i ? 'border-emerald-500 scale-105' : 'border-zinc-800 opacity-60 hover:opacity-100'
                )}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* Content & Booking Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left 2 Cols: Details, Facilities, Description, Reviews */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Sports Offered */}
            <div className="p-6 rounded-3xl bg-zinc-900/60 border border-zinc-800/80 space-y-3">
              <h2 className="text-xs font-black uppercase tracking-wider text-zinc-400">
                Sports Available
              </h2>
              <div className="flex flex-wrap gap-2">
                {turf.sports.map(sport => (
                  <button
                    key={sport}
                    onClick={() => setSelectedSport(sport)}
                    className={cn(
                      'px-4 py-2 rounded-xl text-xs font-bold transition-all',
                      selectedSport === sport
                        ? 'bg-emerald-500 text-black shadow-md'
                        : 'bg-zinc-800/80 text-zinc-300 hover:bg-zinc-800'
                    )}
                  >
                    {sport}
                  </button>
                ))}
              </div>
            </div>

            {/* Facilities & Amenities */}
            <div className="p-6 rounded-3xl bg-zinc-900/60 border border-zinc-800/80 space-y-4">
              <h2 className="text-xs font-black uppercase tracking-wider text-zinc-400">
                Arena Amenities
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                {turf.facilities.map(facility => (
                  <div key={facility} className="flex items-center gap-2 p-2.5 rounded-xl bg-zinc-800/40 border border-zinc-800 text-zinc-300">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{facility}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Arena Overview */}
            <div className="p-6 rounded-3xl bg-zinc-900/60 border border-zinc-800/80 space-y-3">
              <h2 className="text-xs font-black uppercase tracking-wider text-zinc-400">
                About the Facility
              </h2>
              <p className="text-zinc-300 text-sm leading-relaxed">
                {turf.description}
              </p>
              <div className="flex items-center gap-4 text-xs text-zinc-400 pt-2 border-t border-zinc-800">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-emerald-400" />
                  {turf.openingHours}
                </span>
                <span className="flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-emerald-400" />
                  {turf.phone}
                </span>
              </div>
            </div>

            {/* Player Reviews */}
            <div className="p-6 rounded-3xl bg-zinc-900/60 border border-zinc-800/80 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-black uppercase tracking-wider text-zinc-400">
                  Player Reviews ({turf.reviews?.length || turf.reviewsCount})
                </h2>
                {turf.rating > 0 && (
                  <span className="text-xs font-bold text-emerald-400">★ {turf.rating.toFixed(1)} Rating</span>
                )}
              </div>

              <div className="space-y-3">
                {turf.reviews && turf.reviews.length > 0 ? (
                  turf.reviews.map(r => (
                    <div key={r.id} className="p-4 rounded-2xl bg-zinc-800/30 border border-zinc-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-xs">
                            {r.customerName.charAt(0)}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-white">{r.customerName}</p>
                            <p className="text-[10px] text-zinc-400">{r.date}</p>
                          </div>
                        </div>
                        <div className="flex text-amber-400 text-xs">
                          {'★'.repeat(Math.max(1, Math.floor(r.rating)))}
                        </div>
                      </div>
                      <p className="text-xs text-zinc-300 leading-relaxed">{r.comment}</p>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-zinc-500 text-xs border border-zinc-800/60 rounded-2xl">
                    No player reviews yet for this arena. Book a slot and be the first to leave feedback!
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Right 1 Col: Sticky Booking Box */}
          <div className="space-y-6">
            <div className="sticky top-20 p-6 rounded-3xl bg-zinc-900 border border-zinc-800 shadow-2xl space-y-5">
              <div className="flex items-baseline justify-between border-b border-zinc-800 pb-4">
                <div>
                  <span className="text-2xl sm:text-3xl font-black text-white font-mono">
                    ₹{currentPrice}
                  </span>
                  <span className="text-xs text-zinc-400 ml-1">/ hour</span>
                </div>
                <span className="text-xs font-extrabold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                  Instant Confirmation
                </span>
              </div>

              {/* Date Selection */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 block mb-2">
                  Select Date
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Today', date: '2026-09-08', day: 'Tue' },
                    { label: 'Tomorrow', date: '2026-09-09', day: 'Wed' },
                  ].map(d => (
                    <button
                      key={d.date}
                      onClick={() => setSelectedDate(d.date)}
                      className={cn(
                        'p-2.5 rounded-xl border text-center transition-all',
                        selectedDate === d.date
                          ? 'bg-emerald-500 text-black border-emerald-500 font-extrabold shadow-sm'
                          : 'bg-zinc-800/60 border-zinc-700 text-zinc-300 hover:bg-zinc-800'
                      )}
                    >
                      <p className="text-xs font-bold">{d.label}</p>
                      <p className="text-[10px] opacity-80">{d.day}, Sep {d.date.split('-')[2]}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Slot Selection */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 block mb-2">
                  Select Available Time Slot
                </label>
                <div className="grid grid-cols-1 gap-2 max-h-56 overflow-y-auto pr-1 no-scrollbar">
                  {availableSlots.map(slot => (
                    <button
                      key={slot.time}
                      onClick={() => setSelectedSlot(slot.time)}
                      className={cn(
                        'p-3 rounded-xl border text-left flex items-center justify-between transition-all',
                        selectedSlot === slot.time
                          ? 'bg-emerald-500/15 border-emerald-500 text-white font-bold'
                          : 'bg-zinc-800/40 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                      )}
                    >
                      <span className="text-xs flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-emerald-400" />
                        {slot.time}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {slot.peak && (
                          <span className="text-[10px] text-amber-400 flex items-center">
                            <Flame className="w-3 h-3 mr-0.5" /> Peak
                          </span>
                        )}
                        <span className="text-xs font-mono font-bold text-white">₹{slot.price}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Customer Contact Details */}
              <div className="space-y-3 pt-2 border-t border-zinc-800">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                    Your Name
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full px-3 py-2 bg-zinc-800/80 border border-zinc-700 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                    Mobile Number (10 Digits)
                  </label>
                  <input
                    type="tel"
                    maxLength={10}
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="9876543210"
                    className="w-full px-3 py-2 bg-zinc-800/80 border border-zinc-700 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Price Calculation */}
              <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800 space-y-2 text-xs">
                <div className="flex justify-between text-zinc-400">
                  <span>Slot Fee (1 Hour)</span>
                  <span className="font-mono text-white">₹{currentPrice}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Court Floodlights & Balls</span>
                  <span className="text-emerald-400 font-bold">FREE</span>
                </div>
                <div className="pt-2 border-t border-zinc-800 flex justify-between items-center text-sm font-bold text-white">
                  <span>Total Payable</span>
                  <span className="text-xl font-black text-emerald-400 font-mono">₹{currentPrice}</span>
                </div>
              </div>

              {/* Primary CTA */}
              <button
                onClick={handleBooking}
                disabled={bookingSuccess}
                className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-sm uppercase tracking-wider transition-transform active:scale-95 shadow-xl shadow-emerald-500/20 disabled:opacity-50"
              >
                {bookingSuccess ? 'Securing Your Slot...' : 'BOOK THIS TURF NOW'}
              </button>

              <p className="text-[11px] text-center text-zinc-400">
                🔒 Free cancellation up to 4 hours before match kick-off.
              </p>
            </div>
          </div>

        </div>

      </main>

      {/* Structured Status Alert Modal */}
      {bookingStatusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-4 text-center">
            <div className="flex justify-center">
              {bookingStatusModal.type === 'SUCCESS' && (
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
              )}
              {bookingStatusModal.type === 'CONFLICT' && (
                <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <AlertTriangle className="w-8 h-8" />
                </div>
              )}
              {bookingStatusModal.type === 'ERROR' && (
                <div className="w-14 h-14 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
                  <XCircle className="w-8 h-8" />
                </div>
              )}
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-black text-white">{bookingStatusModal.title}</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">{bookingStatusModal.message}</p>
            </div>

            {bookingStatusModal.bookingCode && (
              <div className="p-3 bg-zinc-950/70 border border-zinc-800 rounded-2xl flex items-center justify-between text-xs">
                <span className="text-zinc-400">Booking Code</span>
                <span className="font-mono font-bold text-emerald-400 text-sm">{bookingStatusModal.bookingCode}</span>
              </div>
            )}

            <button
              onClick={() => setBookingStatusModal(null)}
              className={cn(
                "w-full py-3 rounded-xl font-bold text-xs transition-colors",
                bookingStatusModal.type === 'SUCCESS' 
                  ? "bg-emerald-500 hover:bg-emerald-400 text-slate-950" 
                  : "bg-zinc-800 hover:bg-zinc-700 text-white"
              )}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

