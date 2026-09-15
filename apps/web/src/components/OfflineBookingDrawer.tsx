'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Drawer } from '@/components/ui/Drawer';
import { IBookingDetail } from '@/components/BookingDetailDrawer';
import { createOfflineBooking, getOwnerTurfs, getPublicTurfs, getPublicTurfSlots } from '@/services/api';
import { IndianRupee, Calendar, Clock, User, Phone, CheckCircle, AlertCircle, RefreshCw, Layers, ShieldCheck, MapPin } from 'lucide-react';

export interface TurfOption {
  id: string;
  name: string;
  sports?: string[];
  facilities?: string[];
  location?: string;
  pricePerHour?: number;
}

interface OfflineBookingDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onAddBooking: (booking: IBookingDetail) => void;
  turfs?: TurfOption[];
}

export function OfflineBookingDrawer({
  isOpen,
  onClose,
  onAddBooking,
  turfs: propTurfs,
}: OfflineBookingDrawerProps) {
  const [turfOptions, setTurfOptions] = useState<TurfOption[]>(propTurfs || []);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  
  // Step 1: Sport Selection
  const [selectedSport, setSelectedSport] = useState<string>('ALL');

  // Step 2: Turf Selection
  const [turfId, setTurfId] = useState<string>('');

  // Step 3: Court Selection
  const [court, setCourt] = useState<string>('Main Court / Pitch 1');

  // Step 4: Date Selection
  const [date, setDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  // Step 5: Slot Selection
  const [timeSlot, setTimeSlot] = useState<string>('6:00 PM – 7:00 PM');
  const [liveSlots, setLiveSlots] = useState<Array<{ id: string; time: string; price: number; status: string }>>([]);
  const [loadingSlots, setLoadingSlots] = useState<boolean>(false);

  // Step 6: Pricing & Payment
  const [amount, setAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'CASH' | 'PENDING'>('CASH');
  const [notes, setNotes] = useState('');

  // States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingTurfs, setLoadingTurfs] = useState(false);
  const [turfError, setTurfError] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load turfs on open
  const loadTurfs = async () => {
    setLoadingTurfs(true);
    setTurfError(null);
    try {
      let res = await getOwnerTurfs();
      if (res.data?.success && Array.isArray(res.data?.data) && res.data.data.length > 0) {
        const mapped = res.data.data.map((t: any) => ({
          id: t._id || t.id,
          name: t.name,
          sports: t.sports || (t.sport ? [t.sport] : ['Football']),
          facilities: t.facilities || [],
          location: t.locationDetails || t.city || 'Tirunelveli',
          pricePerHour: t.pricePerHour || 0
        }));
        setTurfOptions(mapped);
      } else {
        const pubRes = await getPublicTurfs();
        if (pubRes.data?.success && Array.isArray(pubRes.data?.data)) {
          const mapped = pubRes.data.data.map((t: any) => ({
            id: t._id || t.id,
            name: t.name,
            sports: t.sports || (t.sport ? [t.sport] : ['Football']),
            facilities: t.facilities || [],
            location: t.locationDetails || t.city || 'Tirunelveli',
            pricePerHour: t.pricePerHour || 0
          }));
          setTurfOptions(mapped);
        }
      }
    } catch (err: any) {
      console.warn('Failed to load turfs in drawer:', err);
      setTurfError('Failed to load available turfs. Please click retry.');
    } finally {
      setLoadingTurfs(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      if (propTurfs && propTurfs.length > 0) {
        setTurfOptions(propTurfs);
      } else {
        loadTurfs();
      }
    }
  }, [isOpen, propTurfs]);

  // Extract distinct sports dynamically from active turfs
  const availableSports = useMemo(() => {
    const sportsSet = new Set<string>();
    turfOptions.forEach(t => {
      (t.sports || []).forEach(s => {
        if (s && s.trim()) sportsSet.add(s.trim());
      });
    });
    return Array.from(sportsSet);
  }, [turfOptions]);

  // Filter turfs based on selectedSport
  const matchingTurfs = useMemo(() => {
    if (selectedSport === 'ALL') {
      return turfOptions;
    }
    const target = selectedSport.toLowerCase();
    return turfOptions.filter(t => 
      (t.sports || []).some(s => s.toLowerCase().includes(target))
    );
  }, [turfOptions, selectedSport]);

  // Keep turfId in sync with matchingTurfs
  useEffect(() => {
    if (matchingTurfs.length > 0) {
      if (!turfId || !matchingTurfs.some(t => t.id === turfId)) {
        setTurfId(matchingTurfs[0].id);
      }
    } else {
      setTurfId('');
    }
  }, [matchingTurfs, turfId]);

  // Current selected turf object
  const activeTurf = useMemo(() => {
    return turfOptions.find(t => t.id === turfId) || matchingTurfs[0] || null;
  }, [turfOptions, matchingTurfs, turfId]);

  // Courts derived from the active turf
  const courtOptions = useMemo(() => {
    if (!activeTurf) return ['Main Court / Pitch 1'];
    const courts: string[] = [];
    
    // Check facilities for court descriptions
    if (activeTurf.facilities && activeTurf.facilities.length > 0) {
      activeTurf.facilities.forEach(f => {
        if (f.toLowerCase().includes('court') || f.toLowerCase().includes('pitch') || f.toLowerCase().includes('layout')) {
          courts.push(f);
        }
      });
    }

    if (courts.length === 0) {
      const sportName = selectedSport !== 'ALL' ? selectedSport : (activeTurf.sports?.[0] || 'Sports');
      courts.push(`Main ${sportName} Court (Pitch 1)`);
      courts.push(`Practice Court (Pitch 2)`);
    }

    return courts;
  }, [activeTurf, selectedSport]);

  // Default court when courtOptions changes
  useEffect(() => {
    if (courtOptions.length > 0 && !courtOptions.includes(court)) {
      setCourt(courtOptions[0]);
    }
  }, [courtOptions, court]);

  // Fetch live slots for active turf and selected date
  useEffect(() => {
    if (!turfId || !date) {
      setLiveSlots([]);
      return;
    }

    setLoadingSlots(true);
    getPublicTurfSlots(turfId, date)
      .then(res => {
        if (res.data?.success && Array.isArray(res.data?.data) && res.data.data.length > 0) {
          const mapped = res.data.data.map((s: any) => {
            const start = new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const end = new Date(s.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            return {
              id: s._id || s.id,
              time: `${start} – ${end}`,
              price: s.price || activeTurf?.pricePerHour || 0,
              status: s.status || 'AVAILABLE'
            };
          });
          setLiveSlots(mapped);
          
          // Select first available slot
          const available = mapped.find(s => s.status === 'AVAILABLE');
          if (available) {
            setTimeSlot(available.time);
          } else if (mapped[0]) {
            setTimeSlot(mapped[0].time);
          }
        } else {
          // No slots in DB for this date -> generate standard hourly availability with dynamic pricing
          setLiveSlots([]);
        }
      })
      .catch(err => {
        console.warn('Could not fetch live slots:', err);
        setLiveSlots([]);
      })
      .finally(() => {
        setLoadingSlots(false);
      });
  }, [turfId, date, activeTurf?.pricePerHour]);

  // Dynamic pricing calculation based on turf base price, peak hour, and day
  const calculateSlotPrice = (
    turfObj: TurfOption | null,
    slot: string,
    slotDate: string
  ): number => {
    if (!turfObj || turfObj.pricePerHour === undefined || turfObj.pricePerHour === null) return 0;
    const base = Number(turfObj.pricePerHour);
    if (base <= 0) return 0;

    const isPeak = slot.includes('6:00 PM') || slot.includes('7:00 PM') || slot.includes('8:00 PM') || slot.includes('9:00 PM');
    const day = new Date(slotDate).getDay();
    const isWeekend = day === 0 || day === 6;

    let total = base;
    if (isPeak) total += 200;
    if (isWeekend) total += 100;
    return total;
  };

  // Keep price updated when turf, slot, date, or live slots change
  useEffect(() => {
    if (liveSlots.length > 0) {
      const match = liveSlots.find(s => s.time === timeSlot);
      if (match && match.price > 0) {
        setAmount(String(match.price));
        return;
      }
    }

    if (activeTurf) {
      const calculated = calculateSlotPrice(activeTurf, timeSlot, date);
      setAmount(calculated > 0 ? String(calculated) : '');
    } else {
      setAmount('');
    }
  }, [activeTurf, timeSlot, date, liveSlots]);

  // Handlers
  const handleSportChange = (sportVal: string) => {
    setSelectedSport(sportVal);
    // Find first turf matching the new sport
    if (sportVal !== 'ALL') {
      const target = sportVal.toLowerCase();
      const firstMatch = turfOptions.find(t => 
        (t.sports || []).some(s => s.toLowerCase().includes(target))
      );
      if (firstMatch) {
        setTurfId(firstMatch.id);
      }
    }
  };

  const handleTurfChange = (newTurfId: string) => {
    setTurfId(newTurfId);
    const chosen = turfOptions.find(t => t.id === newTurfId);
    if (chosen && chosen.sports && chosen.sports.length > 0) {
      // If chosen turf does not support current selectedSport, auto-align to turf's primary sport
      if (selectedSport !== 'ALL' && !chosen.sports.some(s => s.toLowerCase().includes(selectedSport.toLowerCase()))) {
        setSelectedSport(chosen.sports[0]);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!customerName.trim() || !customerPhone.trim()) {
      setErrorMessage('Please provide customer name and mobile number.');
      return;
    }

    const cleanPhone = customerPhone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (!activeTurf) {
      setErrorMessage('No turf arena selected. Please select a valid turf facility.');
      return;
    }

    const numericAmount = Number(amount);
    if (!amount || isNaN(numericAmount) || numericAmount <= 0) {
      setErrorMessage('Price unavailable. Please select an arena with configured pricing or enter a valid price.');
      return;
    }

    setIsSubmitting(true);
    try {
      const chosenSport = selectedSport !== 'ALL' ? selectedSport : (activeTurf.sports?.[0] || 'Football');
      const res = await createOfflineBooking({
        turfId: activeTurf.id,
        customerName: customerName.trim(),
        customerPhone: cleanPhone,
        date,
        timeSlot,
        amount: numericAmount,
        paymentMethod,
        sport: chosenSport,
        notes: `Court: ${court}${notes ? ` | ${notes}` : ''}`
      });

      const newBooking: IBookingDetail = {
        id: res.data?.data?.id || ('b-' + Date.now()),
        bookingCode: res.data?.data?.bookingCode || ('TH-' + Math.floor(1000 + Math.random() * 9000)),
        turfId: activeTurf.id,
        turfName: activeTurf.name,
        customerName: customerName.trim(),
        customerPhone: cleanPhone,
        customerEmail: `${customerName.toLowerCase().replace(/\s+/g, '')}@gmail.com`,
        sport: chosenSport,
        date,
        timeSlot,
        startTimeHour: parseInt(timeSlot) || 18,
        durationHours: 1,
        amount: numericAmount,
        paymentMethod,
        paymentStatus: paymentMethod === 'PENDING' ? 'PENDING' : 'PAID',
        status: 'CONFIRMED',
        createdAt: 'Just now',
        notes: `Court: ${court}${notes ? ` | ${notes}` : ''}`
      };

      onAddBooking(newBooking);
      onClose();
    } catch (err: any) {
      console.error('Create offline booking error:', err);
      const msg = err.response?.data?.message || 'Failed to confirm booking. Please try again.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const STANDARD_SLOTS = [
    { time: '06:00 AM – 07:00 AM', label: '6:00 AM – 7:00 AM (Morning Normal)' },
    { time: '07:00 AM – 08:00 AM', label: '7:00 AM – 8:00 AM (Morning Normal)' },
    { time: '08:00 AM – 09:00 AM', label: '8:00 AM – 9:00 AM (Morning Normal)' },
    { time: '04:00 PM – 05:00 PM', label: '4:00 PM – 5:00 PM (Afternoon)' },
    { time: '05:00 PM – 06:00 PM', label: '5:00 PM – 6:00 PM (Peak +₹200)' },
    { time: '06:00 PM – 07:00 PM', label: '6:00 PM – 7:00 PM (Peak +₹200)' },
    { time: '07:00 PM – 08:00 PM', label: '7:00 PM – 8:00 PM (Peak +₹200)' },
    { time: '08:00 PM – 9:00 PM', label: '8:00 PM – 9:00 PM (Peak +₹200)' },
    { time: '09:00 PM – 10:00 PM', label: '9:00 PM – 10:00 PM (Late Peak +₹200)' },
  ];

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="New Walk-In / Offline Booking">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-xs text-muted-foreground">
          Record counter reservations with live pricing from the facility's real configured rates.
        </p>

        {errorMessage && (
          <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {turfError && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{turfError}</span>
            </div>
            <button
              type="button"
              onClick={loadTurfs}
              className="text-xs font-bold underline hover:no-underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Customer Information */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-foreground font-medium block mb-1">Customer / Team Name *</label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Arun Kumar or Nellai FC"
                className="w-full pl-9 pr-3 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-foreground font-medium block mb-1">10-Digit Mobile Number *</label>
            <div className="relative">
              <Phone className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
              <input
                type="tel"
                required
                maxLength={10}
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, ''))}
                placeholder="9876543210"
                className="w-full pl-9 pr-3 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Dependent Flow: 1. Select Sport -> 2. Select Turf */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* STEP 1: SPORT */}
          <div>
            <label className="text-xs text-foreground font-medium block mb-1">
              1. Select Sport *
            </label>
            <select
              value={selectedSport}
              onChange={(e) => handleSportChange(e.target.value)}
              className="w-full px-3 py-2.5 bg-background border border-border rounded-xl text-sm font-medium text-foreground focus:outline-none focus:border-primary"
            >
              <option value="ALL">All Available Sports ({availableSports.length})</option>
              {availableSports.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* STEP 2: TURF */}
          <div>
            <label className="text-xs text-foreground font-medium block mb-1">
              2. Select Turf Arena *
            </label>
            {loadingTurfs ? (
              <div className="w-full px-3 py-2.5 bg-muted/30 border border-border rounded-xl text-xs text-muted-foreground flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-primary" />
                <span>Loading available turfs...</span>
              </div>
            ) : matchingTurfs.length === 0 ? (
              <div className="w-full px-3 py-2.5 bg-amber-500/10 border border-amber-500/25 rounded-xl text-xs text-amber-500">
                No turfs available for {selectedSport}
              </div>
            ) : (
              <select
                value={turfId}
                onChange={(e) => handleTurfChange(e.target.value)}
                className="w-full px-3 py-2.5 bg-background border border-border rounded-xl text-sm font-medium text-foreground focus:outline-none focus:border-primary"
              >
                {matchingTurfs.map((turf) => (
                  <option key={turf.id} value={turf.id}>
                    {turf.name} ({turf.sports?.join(', ') || 'Facility'}) {turf.pricePerHour ? `· ₹${turf.pricePerHour}/hr` : ''}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Dependent Flow: 3. Select Court -> 4. Select Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* STEP 3: COURT */}
          <div>
            <label className="text-xs text-foreground font-medium block mb-1">
              3. Select Court / Pitch
            </label>
            <div className="relative">
              <select
                value={court}
                onChange={(e) => setCourt(e.target.value)}
                className="w-full px-3 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground focus:outline-none focus:border-primary"
              >
                {courtOptions.map((c, i) => (
                  <option key={i} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* STEP 4: DATE */}
          <div>
            <label className="text-xs text-foreground font-medium block mb-1">
              4. Select Booking Date *
            </label>
            <div className="relative">
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground focus:outline-none focus:border-primary"
              />
            </div>
          </div>
        </div>

        {/* Dependent Flow: 5. Select Slot (Live from DB or venue schedule) */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs text-foreground font-medium">
              5. Select Time Slot *
            </label>
            {loadingSlots && (
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <RefreshCw className="w-3 h-3 animate-spin text-primary" />
                Checking slot availability...
              </span>
            )}
          </div>

          {liveSlots.length > 0 ? (
            <select
              value={timeSlot}
              onChange={(e) => setTimeSlot(e.target.value)}
              className="w-full px-3 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground focus:outline-none focus:border-primary"
            >
              {liveSlots.map((slot) => (
                <option 
                  key={slot.id} 
                  value={slot.time}
                  disabled={slot.status === 'BOOKED' || slot.status === 'BLOCKED'}
                >
                  {slot.time} — ₹{slot.price} {slot.status === 'BOOKED' ? '(Already Booked)' : (slot.status === 'BLOCKED' ? '(Blocked)' : '(Available)')}
                </option>
              ))}
            </select>
          ) : (
            <select
              value={timeSlot}
              onChange={(e) => setTimeSlot(e.target.value)}
              className="w-full px-3 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground focus:outline-none focus:border-primary"
            >
              {STANDARD_SLOTS.map((slot, i) => (
                <option key={i} value={slot.time}>
                  {slot.label}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Dependent Flow: 6. Dynamic Pricing Calculation */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-foreground font-medium block mb-1">
              6. Calculated Payable Fee (₹) *
            </label>
            <div className="relative">
              <IndianRupee className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
              <input
                type="number"
                required
                value={amount}
                placeholder="Price unavailable"
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-background border border-border rounded-xl text-sm font-bold text-foreground focus:outline-none focus:border-primary"
              />
            </div>
            {(!amount || Number(amount) <= 0) ? (
              <span className="text-[10px] text-amber-500 block mt-1">
                ⚠️ Price unavailable for this venue. Please enter the authorized rate.
              </span>
            ) : (
              <span className="text-[10px] text-emerald-500 block mt-1 font-medium">
                ✓ Dynamic pricing calculated for {activeTurf?.name} ({timeSlot.includes('PM') ? 'Evening rate' : 'Standard rate'})
              </span>
            )}
          </div>

          <div>
            <label className="text-xs text-foreground font-medium block mb-1">Payment Method</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as any)}
              className="w-full px-3 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground focus:outline-none focus:border-primary"
            >
              <option value="CASH">💵 Cash at Front Desk</option>
              <option value="UPI">📱 Direct UPI QR Code</option>
              <option value="PENDING">⏳ Pay After Match</option>
            </select>
          </div>
        </div>

        {/* Optional Notes */}
        <div>
          <label className="text-xs text-foreground font-medium block mb-1">Booking Notes (Optional)</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Needs referee / practice bibs / corporate reservation"
            className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-none focus:border-primary"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2.5 rounded-xl border border-border text-foreground hover:bg-muted text-xs font-bold transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !turfId || !amount || Number(amount) <= 0}
            className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary-hover text-xs font-bold transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Confirming Booking...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>Confirm & Reserve Slot</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Drawer>
  );
}
