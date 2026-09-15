import { Response } from 'express';
import Turf from '../models/Turf';
import TurfSlot from '../models/TurfSlot';
import Booking from '../models/Booking';
import User from '../models/User';
import Review from '../models/Review';
import Offer from '../models/Offer';
import Tournament from '../models/Tournament';
import { AuthRequest } from '../middleware/authMiddleware';
import { seedDatabase, generateRandomBookings } from '../config/seed';

// Helper: Ensure Database has data, auto-seed if empty
const ensureDatabaseHasData = async () => {
  const turfsCount = await Turf.countDocuments();
  if (turfsCount === 0) {
    console.log('Database empty. Auto-seeding initial sports data into MongoDB Atlas...');
    await seedDatabase();
  }
};

// Helper: Securely resolve turfs belonging to or accessible by the authenticated user
export const getAuthorizedTurfsForUser = async (user: any) => {
  if (!user) return [];
  if (user.role === 'ADMIN') {
    return await Turf.find();
  }
  if (user.role === 'STAFF') {
    const directTurfs = await Turf.find({ ownerId: user._id });
    if (directTurfs.length > 0) return directTurfs;
    const primaryOwner = await User.findOne({ role: { $in: ['TURF_OWNER', 'TURF_ADMIN'] } });
    if (primaryOwner) {
      return await Turf.find({ ownerId: primaryOwner._id } as any);
    }
    return await Turf.find();
  }
  // TURF_OWNER / TURF_ADMIN
  return await Turf.find({ ownerId: user._id });
};

// 1. Dashboard KPI & Summary
export const getDashboardStats = async (req: AuthRequest, res: Response) => {
  try {
    await ensureDatabaseHasData();

    const turfs = await getAuthorizedTurfsForUser(req.user);
    const turfIds = turfs.map(t => t._id);

    if (turfs.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          totalTurfs: 0,
          activeBookings: 0,
          totalBookings: 0,
          availableSlots: 0,
          occupancy: 0,
          todayRevenue: 0,
          totalRevenue: 0,
          recentBookings: []
        }
      });
    }

    const activeBookings = await Booking.countDocuments({
      turfId: { $in: turfIds },
      status: 'CONFIRMED'
    } as any);

    const totalBookingsCount = await Booking.countDocuments({
      turfId: { $in: turfIds }
    } as any);

    // Calculate slots for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const availableSlots = await TurfSlot.countDocuments({
      turfId: { $in: turfIds },
      status: 'AVAILABLE',
      startTime: { $gte: today, $lt: tomorrow }
    } as any);

    const totalTodaySlots = await TurfSlot.countDocuments({
      turfId: { $in: turfIds },
      startTime: { $gte: today, $lt: tomorrow }
    } as any);

    // Fetch all confirmed/completed bookings to aggregate revenue
    const allConfirmedBookings = await Booking.find({
      turfId: { $in: turfIds },
      status: { $in: ['CONFIRMED', 'COMPLETED'] }
    } as any).populate('slotId');

    const totalRevenue = allConfirmedBookings.reduce((sum: number, b: any) => {
      return sum + (b.slotId?.price || 1000);
    }, 0);

    // Today revenue
    const todayBookingsRaw = await Booking.find({
      turfId: { $in: turfIds },
      status: { $in: ['CONFIRMED', 'COMPLETED'] },
      createdAt: { $gte: today, $lt: tomorrow }
    } as any).populate('slotId');

    const todayRevenue = todayBookingsRaw.reduce((sum: number, b: any) => {
      return sum + (b.slotId?.price || 1000);
    }, 0);

    // Fetch recent bookings
    const recentBookingsRaw = await Booking.find({ turfId: { $in: turfIds } } as any)
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('turfId', 'name locationDetails sports')
      .populate('userId', 'name phone email')
      .populate('slotId', 'startTime endTime price');

    const recentBookings = recentBookingsRaw.map((b: any) => ({
      id: b._id.toString(),
      bookingCode: b.bookingId,
      turf: b.turfId?.name || 'Unknown Arena',
      turfId: b.turfId?._id?.toString(),
      sport: b.turfId?.sports?.[0] || 'Football',
      user: b.userId?.name || 'Player',
      phone: b.userId?.phone || '',
      email: b.userId?.email || '',
      time: b.slotId 
        ? `${new Date(b.slotId.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – ${new Date(b.slotId.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
        : 'Evening Slot',
      date: b.slotId ? new Date(b.slotId.startTime).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      amount: b.slotId?.price || 1000,
      paymentMethod: b.paymentStatus === 'SUCCESS' ? 'UPI' : 'CASH',
      paymentStatus: b.paymentStatus,
      status: b.status.toLowerCase()
    }));

    const bookedSlotsCount = Math.max(0, totalTodaySlots - availableSlots);
    const occupancy = totalTodaySlots > 0 ? Math.round((bookedSlotsCount / totalTodaySlots) * 100) : 0;

    const isStaff = req.user?.role === 'STAFF';

    res.status(200).json({
      success: true,
      data: {
        totalTurfs: turfs.length,
        activeBookings: activeBookings,
        totalBookings: totalBookingsCount,
        availableSlots: availableSlots,
        occupancy: occupancy,
        todayRevenue: isStaff ? 0 : todayRevenue,
        totalRevenue: isStaff ? 0 : totalRevenue,
        recentBookings
      }
    });
  } catch (error) {
    console.error('getDashboardStats error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// 2. Full Bookings Ledger
export const getOwnerBookings = async (req: AuthRequest, res: Response) => {
  try {
    await ensureDatabaseHasData();

    const turfs = await getAuthorizedTurfsForUser(req.user);
    if (turfs.length === 0) {
      return res.status(200).json({ success: true, data: [] });
    }
    const turfIds = turfs.map(t => t._id);

    const { status, turfId, search } = req.query;

    // Verify turf ownership if turfId is provided
    if (turfId && turfId !== 'ALL') {
      const isAuthorized = turfIds.some(id => id.toString() === turfId.toString());
      if (!isAuthorized) {
        return res.status(403).json({ success: false, message: 'Forbidden: Not authorized for this turf' });
      }
    }

    const query: any = {
      turfId: (turfId && turfId !== 'ALL') ? turfId : { $in: turfIds }
    };

    if (status && status !== 'ALL') {
      query.status = (status as string).toUpperCase();
    }

    const bookings = await Booking.find(query)
      .sort({ createdAt: -1 })
      .populate('turfId', 'name locationDetails city sports')
      .populate('userId', 'name phone email')
      .populate('slotId', 'startTime endTime price');

    let formatted = bookings.map((b: any) => ({
      id: b._id.toString(),
      bookingCode: b.bookingId,
      turfId: b.turfId?._id?.toString(),
      turfName: b.turfId?.name || 'Turf Arena',
      customerName: b.userId?.name || 'Player',
      customerPhone: b.userId?.phone || '',
      customerEmail: b.userId?.email || '',
      sport: b.turfId?.sports?.[0] || 'Football',
      date: b.slotId ? new Date(b.slotId.startTime).toISOString().split('T')[0] : '2026-09-08',
      timeSlot: b.slotId 
        ? `${new Date(b.slotId.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – ${new Date(b.slotId.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
        : '6:00 PM – 7:00 PM',
      startTimeHour: b.slotId ? new Date(b.slotId.startTime).getHours() : 18,
      durationHours: 1,
      amount: b.slotId?.price || 1000,
      paymentMethod: b.paymentStatus === 'SUCCESS' ? 'UPI' : 'CASH',
      paymentStatus: b.paymentStatus === 'SUCCESS' ? 'PAID' : (b.paymentStatus === 'REFUNDED' ? 'REFUNDED' : 'PENDING'),
      status: b.status,
      createdAt: b.createdAt
    }));

    if (search) {
      const q = (search as string).toLowerCase();
      formatted = formatted.filter(b => 
        b.customerName.toLowerCase().includes(q) ||
        b.bookingCode.toLowerCase().includes(q) ||
        b.customerPhone.includes(q)
      );
    }

    res.status(200).json({ success: true, data: formatted });
  } catch (error) {
    console.error('getOwnerBookings error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch bookings' });
  }
};

// 3. Create Offline Booking (Counter)
export const createOfflineBooking = async (req: AuthRequest, res: Response) => {
  try {
    const { 
      turfId, customerName, customerPhone, date, 
      timeSlot, amount, paymentMethod, sport, court, notes 
    } = req.body;

    if (!customerName || !customerPhone) {
      return res.status(400).json({ success: false, message: 'Customer name and phone number are required' });
    }

    const numericAmount = Number(amount);
    if (!amount || isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Booking amount must be a valid positive price' });
    }

    const turf = await Turf.findById(turfId);
    if (!turf) {
      return res.status(404).json({ success: false, message: 'Turf arena not found' });
    }
    const authorizedTurfs = await getAuthorizedTurfsForUser(req.user);
    const hasAccess = authorizedTurfs.some(t => t._id.toString() === turf._id.toString());
    if (!hasAccess) {
      return res.status(403).json({ success: false, message: 'Forbidden - You do not have access to manage this turf' });
    }

    // Find or create customer
    let customer = await User.findOne({ phone: customerPhone });
    if (!customer) {
      customer = await User.create({
        name: customerName,
        phone: customerPhone,
        email: `${customerName.toLowerCase().replace(/\s+/g, '')}@gmail.com`,
        role: 'PLAYER',
        isVerified: true
      });
    }

    // Create a slot for this booking
    const bookingDate = new Date(date || Date.now());
    const [startPart] = (timeSlot || '19:00').split('–');
    const slotHour = parseInt(startPart) || 19;
    
    bookingDate.setHours(slotHour, 0, 0, 0);
    const slotEndDate = new Date(bookingDate);
    slotEndDate.setHours(slotHour + 1, 0, 0, 0);

    const slot = await TurfSlot.create({
      turfId,
      startTime: bookingDate,
      endTime: slotEndDate,
      price: numericAmount,
      pricingType: 'WEEKDAY',
      status: 'BOOKED'
    });

    const bookingRef = 'TH-' + Math.floor(1000 + Math.random() * 9000);
    const booking: any = await Booking.create({
      bookingId: bookingRef,
      userId: customer._id,
      turfId,
      slotId: slot._id,
      paymentStatus: paymentMethod === 'PENDING' ? 'PENDING' : 'SUCCESS',
      status: 'CONFIRMED',
      paymentTransactionId: `OFFLINE-${paymentMethod}-${Date.now()}`,
      qrHash: `QR-${bookingRef}`
    } as any);

    res.status(201).json({
      success: true,
      message: 'Offline counter booking confirmed in database',
      data: {
        id: booking._id.toString(),
        bookingCode: bookingRef,
        slotId: slot._id.toString(),
        status: 'CONFIRMED'
      }
    });
  } catch (error) {
    console.error('createOfflineBooking error:', error);
    res.status(500).json({ success: false, message: 'Failed to create offline booking' });
  }
};

// 4. Block Slot for Maintenance / Weather
export const blockSlot = async (req: AuthRequest, res: Response) => {
  try {
    const { turfId, date, timeSlot, reason } = req.body;

    const turf = await Turf.findById(turfId);
    if (!turf) {
      return res.status(404).json({ success: false, message: 'Turf not found' });
    }
    if (req.user.role !== 'ADMIN' && turf.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Forbidden - You do not own this turf' });
    }

    const blockDate = new Date(date || Date.now());
    blockDate.setHours(14, 0, 0, 0);
    const blockEnd = new Date(blockDate);
    blockEnd.setHours(16, 0, 0, 0);

    const slot = await TurfSlot.create({
      turfId,
      startTime: blockDate,
      endTime: blockEnd,
      price: 0,
      pricingType: 'WEEKDAY',
      status: 'BLOCKED'
    });

    res.status(201).json({
      success: true,
      message: `Slot successfully blocked for ${reason || 'Maintenance'}`,
      data: slot
    });
  } catch (error) {
    console.error('blockSlot error:', error);
    res.status(500).json({ success: false, message: 'Failed to block slot' });
  }
};

// 5. Update Booking Status (Cancel, Reschedule, Refund)
export const updateBookingStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, paymentStatus } = req.body;

    const booking = await Booking.findById(id).populate('turfId');
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (req.user.role !== 'ADMIN') {
      const turfOwnerId = (booking.turfId as any)?.ownerId?.toString();
      if (turfOwnerId && turfOwnerId !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Forbidden - You do not own this turf booking' });
      }
    }

    if (status) booking.status = status.toUpperCase() as any;
    if (paymentStatus) booking.paymentStatus = paymentStatus.toUpperCase() as any;
    await booking.save();

    // If cancelled, free up slot
    if (booking.status === 'CANCELLED' && booking.slotId) {
      await TurfSlot.findByIdAndUpdate(booking.slotId, { status: 'AVAILABLE' });
    }

    res.status(200).json({
      success: true,
      message: `Booking status updated to ${booking.status}`,
      data: booking
    });
  } catch (error) {
    console.error('updateBookingStatus error:', error);
    res.status(500).json({ success: false, message: 'Failed to update booking' });
  }
};

// 6. Customers CRM Directory
export const getOwnerCustomers = async (req: AuthRequest, res: Response) => {
  try {
    await ensureDatabaseHasData();

    const turfs = await getAuthorizedTurfsForUser(req.user);
    if (turfs.length === 0) {
      return res.status(200).json({ success: true, data: [] });
    }
    const turfIds = turfs.map(t => t._id);

    const bookings = await Booking.find({ turfId: { $in: turfIds } } as any)
      .populate('userId', 'name phone email')
      .populate('turfId', 'name sports')
      .populate('slotId', 'price');

    // Aggregate by user
    const customerMap: Record<string, any> = {};

    bookings.forEach((b: any) => {
      if (!b.userId) return;
      const uid = b.userId._id.toString();
      if (!customerMap[uid]) {
        customerMap[uid] = {
          id: uid,
          name: b.userId.name,
          phone: b.userId.phone,
          email: b.userId.email || '',
          totalBookings: 0,
          totalSpent: 0,
          lastVisit: 'Recently',
          favoriteSport: b.turfId?.sports?.[0] || 'Football',
          favoriteTurf: b.turfId?.name || 'Turf Arena',
          rating: 4.9,
          status: 'REGULAR'
        };
      }
      customerMap[uid].totalBookings += 1;
      customerMap[uid].totalSpent += (b.slotId?.price || 1000);
      if (customerMap[uid].totalBookings >= 4) {
        customerMap[uid].status = 'VIP';
      }
    });

    const customers = Object.values(customerMap);

    res.status(200).json({
      success: true,
      data: customers
    });
  } catch (error) {
    console.error('getOwnerCustomers error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch customers' });
  }
};

// 7. Turf CRUD
export const createTurf = async (req: AuthRequest, res: Response) => {
  try {
    const turfData = req.body;
    turfData.ownerId = req.user._id;
    const turf = new Turf(turfData);
    await turf.save();
    res.status(201).json({ success: true, data: turf, message: 'Turf created successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error creating turf' });
  }
};

export const getOwnerTurfs = async (req: AuthRequest, res: Response) => {
  try {
    await ensureDatabaseHasData();

    const { sport } = req.query;
    let turfs = await getAuthorizedTurfsForUser(req.user);

    if (sport && sport !== 'ALL') {
      const sportRegex = new RegExp(sport as string, 'i');
      turfs = turfs.filter(t => t.sports?.some((s: string) => sportRegex.test(s)));
    }

    res.status(200).json({ success: true, data: turfs });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error fetching owner turfs' });
  }
};

export const generateSlots = async (req: AuthRequest, res: Response) => {
  try {
    const { turfId, date, startTime, endTime, intervalMinutes, price, pricingType } = req.body;
    const authorizedTurfs = await getAuthorizedTurfsForUser(req.user);
    const turf = authorizedTurfs.find(t => t._id.toString() === turfId.toString());
    if (!turf) {
      return res.status(403).json({ success: false, message: 'Forbidden: You do not own or have access to this turf' });
    }

    const slots = [];
    let current = new Date(`${date}T${startTime}`);
    const end = new Date(`${date}T${endTime}`);

    while (current < end) {
      const next = new Date(current.getTime() + (intervalMinutes || 60) * 60000);
      if (next > end) break;

      slots.push({
        turfId,
        startTime: new Date(current),
        endTime: new Date(next),
        price: Number(price) || 1000,
        pricingType: pricingType || 'WEEKDAY',
        status: 'AVAILABLE'
      });

      current = next;
    }

    const createdSlots = await TurfSlot.insertMany(slots);
    res.status(201).json({ success: true, data: createdSlots, message: `${createdSlots.length} slots generated successfully` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error generating slots' });
  }
};

// 8. Dynamic Random Data Seeder Endpoint (POST /api/owner/seed-random)
export const seedRandomMatches = async (req: AuthRequest, res: Response) => {
  try {
    const count = parseInt(req.body.count) || 5;
    const createdBookings = await generateRandomBookings(count);

    res.status(201).json({
      success: true,
      message: `Successfully generated and added ${createdBookings.length} random matches in database`,
      count: createdBookings.length,
      data: createdBookings
    });
  } catch (error) {
    console.error('seedRandomMatches error:', error);
    res.status(500).json({ success: false, message: 'Failed to seed random data' });
  }
};

// 9. Reviews Endpoint (GET /api/owner/reviews, POST /api/owner/reviews/:id/reply)
export const getOwnerReviews = async (req: AuthRequest, res: Response) => {
  try {
    await ensureDatabaseHasData();

    const count = await Review.countDocuments();
    if (count === 0) {
      await seedDatabase();
    }

    const reviews = await Review.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: reviews });
  } catch (error) {
    console.error('getOwnerReviews error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch reviews' });
  }
};

export const addReviewReply = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { text, author } = req.body;

    const review = await Review.findByIdAndUpdate(
      id,
      {
        reply: {
          author: author || 'John (TurfHub Owner)',
          date: 'Just now',
          text
        }
      },
      { new: true }
    );

    res.status(200).json({ success: true, data: review, message: 'Reply posted to database' });
  } catch (error) {
    console.error('addReviewReply error:', error);
    res.status(500).json({ success: false, message: 'Failed to add reply' });
  }
};

// 10. Offers Endpoint (GET /api/owner/offers, POST /api/owner/offers)
export const getOwnerOffers = async (req: AuthRequest, res: Response) => {
  try {
    const count = await Offer.countDocuments();
    if (count === 0) {
      await seedDatabase();
    }

    const offers = await Offer.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: offers });
  } catch (error) {
    console.error('getOwnerOffers error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch offers' });
  }
};

export const createOwnerOffer = async (req: AuthRequest, res: Response) => {
  try {
    const offer = await Offer.create(req.body);
    res.status(201).json({ success: true, data: offer, message: 'Offer saved to database' });
  } catch (error) {
    console.error('createOwnerOffer error:', error);
    res.status(500).json({ success: false, message: 'Failed to create offer' });
  }
};

export const deleteOwnerOffer = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await Offer.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: 'Offer deleted successfully' });
  } catch (error) {
    console.error('deleteOwnerOffer error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete offer' });
  }
};

// 11. Tournaments Endpoint (GET /api/owner/tournaments, POST /api/owner/tournaments)
export const getOwnerTournaments = async (req: AuthRequest, res: Response) => {
  try {
    const count = await Tournament.countDocuments();
    if (count === 0) {
      await seedDatabase();
    }

    const tournaments = await Tournament.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: tournaments });
  } catch (error) {
    console.error('getOwnerTournaments error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch tournaments' });
  }
};

export const createOwnerTournament = async (req: AuthRequest, res: Response) => {
  try {
    const { title, sport, venue, date, teamsLimit, entryFee, prizePool, image } = req.body;

    if (!title || !date) {
      return res.status(400).json({ success: false, message: 'Tournament title and date are required' });
    }

    const tournament = await Tournament.create({
      title: title.trim(),
      sport: sport || 'Football 7v7',
      venue: venue || 'ABC Football Arena',
      date,
      teamsLimit: Number(teamsLimit) || 16,
      registeredCount: 0,
      registeredTeams: [],
      organizerId: req.user._id,
      entryFee: Number(entryFee) || 0,
      prizePool: prizePool || 'Trophy & Medals',
      status: 'REGISTRATION OPEN',
      image: image || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80'
    });

    res.status(201).json({ success: true, data: tournament, message: 'Tournament created successfully' });
  } catch (error) {
    console.error('createOwnerTournament error:', error);
    res.status(500).json({ success: false, message: 'Failed to create tournament' });
  }
};

export const registerTournamentTeam = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { teamName, captainName, captainPhone, membersCount } = req.body;

    if (!teamName || !captainName || !captainPhone) {
      return res.status(400).json({ success: false, message: 'Team name, captain name, and captain mobile number are required' });
    }

    const tournament = await Tournament.findById(id);
    if (!tournament) {
      return res.status(404).json({ success: false, message: 'Tournament not found' });
    }

    if (tournament.status !== 'REGISTRATION OPEN') {
      return res.status(400).json({ success: false, message: 'Registrations are closed for this tournament' });
    }

    if (tournament.registeredTeams.length >= tournament.teamsLimit) {
      return res.status(409).json({ success: false, message: 'Tournament registration is full' });
    }

    // Check duplicate team name
    const exists = tournament.registeredTeams.some(
      t => t.teamName.toLowerCase() === teamName.trim().toLowerCase()
    );
    if (exists) {
      return res.status(409).json({ success: false, message: 'A team with this name is already registered' });
    }

    tournament.registeredTeams.push({
      teamName: teamName.trim(),
      captainName: captainName.trim(),
      captainPhone: captainPhone.trim(),
      membersCount: Number(membersCount) || 7,
      registeredAt: new Date(),
      status: 'CONFIRMED'
    });

    tournament.registeredCount = tournament.registeredTeams.filter(t => t.status !== 'REJECTED').length;
    await tournament.save();

    res.status(201).json({
      success: true,
      message: `Squad "${teamName}" registered successfully!`,
      data: tournament
    });
  } catch (error) {
    console.error('registerTournamentTeam error:', error);
    res.status(500).json({ success: false, message: 'Failed to register team' });
  }
};

export const updateTournamentTeamStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id, teamId } = req.params;
    const { status } = req.body;

    const tournament = await Tournament.findById(id);
    if (!tournament) {
      return res.status(404).json({ success: false, message: 'Tournament not found' });
    }

    const team = (tournament.registeredTeams as any).id 
      ? (tournament.registeredTeams as any).id(teamId) 
      : (tournament.registeredTeams as any[]).find((t: any) => t._id?.toString() === teamId.toString());

    if (!team) {
      return res.status(404).json({ success: false, message: 'Registered team not found' });
    }

    team.status = status;
    tournament.registeredCount = tournament.registeredTeams.filter(t => t.status === 'CONFIRMED' || t.status === 'APPROVED').length;
    await tournament.save();

    res.status(200).json({ success: true, message: `Team status updated to ${status}`, data: tournament });
  } catch (error) {
    console.error('updateTournamentTeamStatus error:', error);
    res.status(500).json({ success: false, message: 'Failed to update team status' });
  }
};

// 12. Reports & Analytics (GET /api/owner/reports)
export const getOwnerReports = async (req: AuthRequest, res: Response) => {
  try {
    await ensureDatabaseHasData();

    const turfs = await getAuthorizedTurfsForUser(req.user);
    if (turfs.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          totalRevenue: 0,
          totalBookings: 0,
          turfContributions: [],
          sportDistribution: []
        }
      });
    }

    const turfIds = turfs.map(t => t._id);

    const bookings = await Booking.find({ turfId: { $in: turfIds } } as any)
      .populate('turfId', 'name sports')
      .populate('slotId', 'price startTime');

    // Group by turf
    const turfRevenueMap: Record<string, { name: string; revenue: number; bookings: number }> = {};
    const sportDistributionMap: Record<string, number> = {};

    let totalRevenue = 0;
    let totalBookings = bookings.length;

    bookings.forEach((b: any) => {
      const price = b.slotId?.price || 0;
      const turfName = b.turfId?.name || 'Turf Arena';
      const sport = b.turfId?.sports?.[0] || 'Football';

      if (b.status === 'CONFIRMED' || b.status === 'COMPLETED') {
        totalRevenue += price;
      }

      if (!turfRevenueMap[turfName]) {
        turfRevenueMap[turfName] = { name: turfName, revenue: 0, bookings: 0 };
      }
      turfRevenueMap[turfName].revenue += price;
      turfRevenueMap[turfName].bookings += 1;

      sportDistributionMap[sport] = (sportDistributionMap[sport] || 0) + 1;
    });

    const turfContributions = Object.values(turfRevenueMap);
    const sportDistribution = Object.entries(sportDistributionMap).map(([name, count]) => ({
      name,
      value: Math.round((count / (totalBookings || 1)) * 100)
    }));

    res.status(200).json({
      success: true,
      data: {
        totalRevenue,
        totalBookings,
        turfContributions,
        sportDistribution
      }
    });
  } catch (error) {
    console.error('getOwnerReports error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch reports' });
  }
};

export const getOwnerStaff = async (req: AuthRequest, res: Response) => {
  try {
    const staffMembers = await User.find({ role: 'STAFF' }).select('-password');
    res.status(200).json({ success: true, data: staffMembers });
  } catch (error) {
    console.error('getOwnerStaff error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch staff' });
  }
};

