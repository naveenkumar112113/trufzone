"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOwnerStaff = exports.getOwnerReports = exports.updateTournamentTeamStatus = exports.registerTournamentTeam = exports.createOwnerTournament = exports.getOwnerTournaments = exports.deleteOwnerOffer = exports.createOwnerOffer = exports.getOwnerOffers = exports.addReviewReply = exports.getOwnerReviews = exports.seedRandomMatches = exports.generateSlots = exports.getOwnerTurfs = exports.createTurf = exports.getOwnerCustomers = exports.updateBookingStatus = exports.blockSlot = exports.createOfflineBooking = exports.getOwnerBookings = exports.getDashboardStats = exports.getAuthorizedTurfsForUser = void 0;
const Turf_1 = __importDefault(require("../models/Turf"));
const TurfSlot_1 = __importDefault(require("../models/TurfSlot"));
const Booking_1 = __importDefault(require("../models/Booking"));
const User_1 = __importDefault(require("../models/User"));
const Review_1 = __importDefault(require("../models/Review"));
const Offer_1 = __importDefault(require("../models/Offer"));
const Tournament_1 = __importDefault(require("../models/Tournament"));
const seed_1 = require("../config/seed");
// Helper: Ensure Database has data, auto-seed if empty
const ensureDatabaseHasData = () => __awaiter(void 0, void 0, void 0, function* () {
    const turfsCount = yield Turf_1.default.countDocuments();
    if (turfsCount === 0) {
        console.log('Database empty. Auto-seeding initial sports data into MongoDB Atlas...');
        yield (0, seed_1.seedDatabase)();
    }
});
// Helper: Securely resolve turfs belonging to or accessible by the authenticated user
const getAuthorizedTurfsForUser = (user) => __awaiter(void 0, void 0, void 0, function* () {
    if (!user)
        return [];
    if (user.role === 'ADMIN') {
        return yield Turf_1.default.find();
    }
    if (user.role === 'STAFF') {
        const directTurfs = yield Turf_1.default.find({ ownerId: user._id });
        if (directTurfs.length > 0)
            return directTurfs;
        const primaryOwner = yield User_1.default.findOne({ role: { $in: ['TURF_OWNER', 'TURF_ADMIN'] } });
        if (primaryOwner) {
            return yield Turf_1.default.find({ ownerId: primaryOwner._id });
        }
        return yield Turf_1.default.find();
    }
    // TURF_OWNER / TURF_ADMIN
    return yield Turf_1.default.find({ ownerId: user._id });
});
exports.getAuthorizedTurfsForUser = getAuthorizedTurfsForUser;
// 1. Dashboard KPI & Summary
const getDashboardStats = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        yield ensureDatabaseHasData();
        const turfs = yield (0, exports.getAuthorizedTurfsForUser)(req.user);
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
        const activeBookings = yield Booking_1.default.countDocuments({
            turfId: { $in: turfIds },
            status: 'CONFIRMED'
        });
        const totalBookingsCount = yield Booking_1.default.countDocuments({
            turfId: { $in: turfIds }
        });
        // Calculate slots for today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const availableSlots = yield TurfSlot_1.default.countDocuments({
            turfId: { $in: turfIds },
            status: 'AVAILABLE',
            startTime: { $gte: today, $lt: tomorrow }
        });
        const totalTodaySlots = yield TurfSlot_1.default.countDocuments({
            turfId: { $in: turfIds },
            startTime: { $gte: today, $lt: tomorrow }
        });
        // Fetch all confirmed/completed bookings to aggregate revenue
        const allConfirmedBookings = yield Booking_1.default.find({
            turfId: { $in: turfIds },
            status: { $in: ['CONFIRMED', 'COMPLETED'] }
        }).populate('slotId');
        const totalRevenue = allConfirmedBookings.reduce((sum, b) => {
            var _a;
            return sum + (((_a = b.slotId) === null || _a === void 0 ? void 0 : _a.price) || 1000);
        }, 0);
        // Today revenue
        const todayBookingsRaw = yield Booking_1.default.find({
            turfId: { $in: turfIds },
            status: { $in: ['CONFIRMED', 'COMPLETED'] },
            createdAt: { $gte: today, $lt: tomorrow }
        }).populate('slotId');
        const todayRevenue = todayBookingsRaw.reduce((sum, b) => {
            var _a;
            return sum + (((_a = b.slotId) === null || _a === void 0 ? void 0 : _a.price) || 1000);
        }, 0);
        // Fetch recent bookings
        const recentBookingsRaw = yield Booking_1.default.find({ turfId: { $in: turfIds } })
            .sort({ createdAt: -1 })
            .limit(10)
            .populate('turfId', 'name locationDetails sports')
            .populate('userId', 'name phone email')
            .populate('slotId', 'startTime endTime price');
        const recentBookings = recentBookingsRaw.map((b) => { var _a, _b, _c, _d, _e, _f, _g, _h, _j; return ({
            id: b._id.toString(),
            bookingCode: b.bookingId,
            turf: ((_a = b.turfId) === null || _a === void 0 ? void 0 : _a.name) || 'Unknown Arena',
            turfId: (_c = (_b = b.turfId) === null || _b === void 0 ? void 0 : _b._id) === null || _c === void 0 ? void 0 : _c.toString(),
            sport: ((_e = (_d = b.turfId) === null || _d === void 0 ? void 0 : _d.sports) === null || _e === void 0 ? void 0 : _e[0]) || 'Football',
            user: ((_f = b.userId) === null || _f === void 0 ? void 0 : _f.name) || 'Player',
            phone: ((_g = b.userId) === null || _g === void 0 ? void 0 : _g.phone) || '',
            email: ((_h = b.userId) === null || _h === void 0 ? void 0 : _h.email) || '',
            time: b.slotId
                ? `${new Date(b.slotId.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – ${new Date(b.slotId.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                : 'Evening Slot',
            date: b.slotId ? new Date(b.slotId.startTime).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            amount: ((_j = b.slotId) === null || _j === void 0 ? void 0 : _j.price) || 1000,
            paymentMethod: b.paymentStatus === 'SUCCESS' ? 'UPI' : 'CASH',
            paymentStatus: b.paymentStatus,
            status: b.status.toLowerCase()
        }); });
        const bookedSlotsCount = Math.max(0, totalTodaySlots - availableSlots);
        const occupancy = totalTodaySlots > 0 ? Math.round((bookedSlotsCount / totalTodaySlots) * 100) : 0;
        const isStaff = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) === 'STAFF';
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
    }
    catch (error) {
        console.error('getDashboardStats error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});
exports.getDashboardStats = getDashboardStats;
// 2. Full Bookings Ledger
const getOwnerBookings = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield ensureDatabaseHasData();
        const turfs = yield (0, exports.getAuthorizedTurfsForUser)(req.user);
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
        const query = {
            turfId: (turfId && turfId !== 'ALL') ? turfId : { $in: turfIds }
        };
        if (status && status !== 'ALL') {
            query.status = status.toUpperCase();
        }
        const bookings = yield Booking_1.default.find(query)
            .sort({ createdAt: -1 })
            .populate('turfId', 'name locationDetails city sports')
            .populate('userId', 'name phone email')
            .populate('slotId', 'startTime endTime price');
        let formatted = bookings.map((b) => { var _a, _b, _c, _d, _e, _f, _g, _h, _j; return ({
            id: b._id.toString(),
            bookingCode: b.bookingId,
            turfId: (_b = (_a = b.turfId) === null || _a === void 0 ? void 0 : _a._id) === null || _b === void 0 ? void 0 : _b.toString(),
            turfName: ((_c = b.turfId) === null || _c === void 0 ? void 0 : _c.name) || 'Turf Arena',
            customerName: ((_d = b.userId) === null || _d === void 0 ? void 0 : _d.name) || 'Player',
            customerPhone: ((_e = b.userId) === null || _e === void 0 ? void 0 : _e.phone) || '',
            customerEmail: ((_f = b.userId) === null || _f === void 0 ? void 0 : _f.email) || '',
            sport: ((_h = (_g = b.turfId) === null || _g === void 0 ? void 0 : _g.sports) === null || _h === void 0 ? void 0 : _h[0]) || 'Football',
            date: b.slotId ? new Date(b.slotId.startTime).toISOString().split('T')[0] : '2026-09-08',
            timeSlot: b.slotId
                ? `${new Date(b.slotId.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – ${new Date(b.slotId.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                : '6:00 PM – 7:00 PM',
            startTimeHour: b.slotId ? new Date(b.slotId.startTime).getHours() : 18,
            durationHours: 1,
            amount: ((_j = b.slotId) === null || _j === void 0 ? void 0 : _j.price) || 1000,
            paymentMethod: b.paymentStatus === 'SUCCESS' ? 'UPI' : 'CASH',
            paymentStatus: b.paymentStatus === 'SUCCESS' ? 'PAID' : (b.paymentStatus === 'REFUNDED' ? 'REFUNDED' : 'PENDING'),
            status: b.status,
            createdAt: b.createdAt
        }); });
        if (search) {
            const q = search.toLowerCase();
            formatted = formatted.filter(b => b.customerName.toLowerCase().includes(q) ||
                b.bookingCode.toLowerCase().includes(q) ||
                b.customerPhone.includes(q));
        }
        res.status(200).json({ success: true, data: formatted });
    }
    catch (error) {
        console.error('getOwnerBookings error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch bookings' });
    }
});
exports.getOwnerBookings = getOwnerBookings;
// 3. Create Offline Booking (Counter)
const createOfflineBooking = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { turfId, customerName, customerPhone, date, timeSlot, amount, paymentMethod, sport, court, notes } = req.body;
        if (!customerName || !customerPhone) {
            return res.status(400).json({ success: false, message: 'Customer name and phone number are required' });
        }
        const numericAmount = Number(amount);
        if (!amount || isNaN(numericAmount) || numericAmount <= 0) {
            return res.status(400).json({ success: false, message: 'Booking amount must be a valid positive price' });
        }
        const turf = yield Turf_1.default.findById(turfId);
        if (!turf) {
            return res.status(404).json({ success: false, message: 'Turf arena not found' });
        }
        const authorizedTurfs = yield (0, exports.getAuthorizedTurfsForUser)(req.user);
        const hasAccess = authorizedTurfs.some(t => t._id.toString() === turf._id.toString());
        if (!hasAccess) {
            return res.status(403).json({ success: false, message: 'Forbidden - You do not have access to manage this turf' });
        }
        // Find or create customer
        let customer = yield User_1.default.findOne({ phone: customerPhone });
        if (!customer) {
            customer = yield User_1.default.create({
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
        const slot = yield TurfSlot_1.default.create({
            turfId,
            startTime: bookingDate,
            endTime: slotEndDate,
            price: numericAmount,
            pricingType: 'WEEKDAY',
            status: 'BOOKED'
        });
        const bookingRef = 'TH-' + Math.floor(1000 + Math.random() * 9000);
        const booking = yield Booking_1.default.create({
            bookingId: bookingRef,
            userId: customer._id,
            turfId,
            slotId: slot._id,
            paymentStatus: paymentMethod === 'PENDING' ? 'PENDING' : 'SUCCESS',
            status: 'CONFIRMED',
            paymentTransactionId: `OFFLINE-${paymentMethod}-${Date.now()}`,
            qrHash: `QR-${bookingRef}`
        });
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
    }
    catch (error) {
        console.error('createOfflineBooking error:', error);
        res.status(500).json({ success: false, message: 'Failed to create offline booking' });
    }
});
exports.createOfflineBooking = createOfflineBooking;
// 4. Block Slot for Maintenance / Weather
const blockSlot = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { turfId, date, timeSlot, reason } = req.body;
        const turf = yield Turf_1.default.findById(turfId);
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
        const slot = yield TurfSlot_1.default.create({
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
    }
    catch (error) {
        console.error('blockSlot error:', error);
        res.status(500).json({ success: false, message: 'Failed to block slot' });
    }
});
exports.blockSlot = blockSlot;
// 5. Update Booking Status (Cancel, Reschedule, Refund)
const updateBookingStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { id } = req.params;
        const { status, paymentStatus } = req.body;
        const booking = yield Booking_1.default.findById(id).populate('turfId');
        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }
        if (req.user.role !== 'ADMIN') {
            const turfOwnerId = (_b = (_a = booking.turfId) === null || _a === void 0 ? void 0 : _a.ownerId) === null || _b === void 0 ? void 0 : _b.toString();
            if (turfOwnerId && turfOwnerId !== req.user._id.toString()) {
                return res.status(403).json({ success: false, message: 'Forbidden - You do not own this turf booking' });
            }
        }
        if (status)
            booking.status = status.toUpperCase();
        if (paymentStatus)
            booking.paymentStatus = paymentStatus.toUpperCase();
        yield booking.save();
        // If cancelled, free up slot
        if (booking.status === 'CANCELLED' && booking.slotId) {
            yield TurfSlot_1.default.findByIdAndUpdate(booking.slotId, { status: 'AVAILABLE' });
        }
        res.status(200).json({
            success: true,
            message: `Booking status updated to ${booking.status}`,
            data: booking
        });
    }
    catch (error) {
        console.error('updateBookingStatus error:', error);
        res.status(500).json({ success: false, message: 'Failed to update booking' });
    }
});
exports.updateBookingStatus = updateBookingStatus;
// 6. Customers CRM Directory
const getOwnerCustomers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield ensureDatabaseHasData();
        const turfs = yield (0, exports.getAuthorizedTurfsForUser)(req.user);
        if (turfs.length === 0) {
            return res.status(200).json({ success: true, data: [] });
        }
        const turfIds = turfs.map(t => t._id);
        const bookings = yield Booking_1.default.find({ turfId: { $in: turfIds } })
            .populate('userId', 'name phone email')
            .populate('turfId', 'name sports')
            .populate('slotId', 'price');
        // Aggregate by user
        const customerMap = {};
        bookings.forEach((b) => {
            var _a, _b, _c, _d;
            if (!b.userId)
                return;
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
                    favoriteSport: ((_b = (_a = b.turfId) === null || _a === void 0 ? void 0 : _a.sports) === null || _b === void 0 ? void 0 : _b[0]) || 'Football',
                    favoriteTurf: ((_c = b.turfId) === null || _c === void 0 ? void 0 : _c.name) || 'Turf Arena',
                    rating: 4.9,
                    status: 'REGULAR'
                };
            }
            customerMap[uid].totalBookings += 1;
            customerMap[uid].totalSpent += (((_d = b.slotId) === null || _d === void 0 ? void 0 : _d.price) || 1000);
            if (customerMap[uid].totalBookings >= 4) {
                customerMap[uid].status = 'VIP';
            }
        });
        const customers = Object.values(customerMap);
        res.status(200).json({
            success: true,
            data: customers
        });
    }
    catch (error) {
        console.error('getOwnerCustomers error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch customers' });
    }
});
exports.getOwnerCustomers = getOwnerCustomers;
// 7. Turf CRUD
const createTurf = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const turfData = req.body;
        turfData.ownerId = req.user._id;
        const turf = new Turf_1.default(turfData);
        yield turf.save();
        res.status(201).json({ success: true, data: turf, message: 'Turf created successfully' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error creating turf' });
    }
});
exports.createTurf = createTurf;
const getOwnerTurfs = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield ensureDatabaseHasData();
        const { sport } = req.query;
        let turfs = yield (0, exports.getAuthorizedTurfsForUser)(req.user);
        if (sport && sport !== 'ALL') {
            const sportRegex = new RegExp(sport, 'i');
            turfs = turfs.filter(t => { var _a; return (_a = t.sports) === null || _a === void 0 ? void 0 : _a.some((s) => sportRegex.test(s)); });
        }
        res.status(200).json({ success: true, data: turfs });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error fetching owner turfs' });
    }
});
exports.getOwnerTurfs = getOwnerTurfs;
const generateSlots = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { turfId, date, startTime, endTime, intervalMinutes, price, pricingType } = req.body;
        const authorizedTurfs = yield (0, exports.getAuthorizedTurfsForUser)(req.user);
        const turf = authorizedTurfs.find(t => t._id.toString() === turfId.toString());
        if (!turf) {
            return res.status(403).json({ success: false, message: 'Forbidden: You do not own or have access to this turf' });
        }
        const slots = [];
        let current = new Date(`${date}T${startTime}`);
        const end = new Date(`${date}T${endTime}`);
        while (current < end) {
            const next = new Date(current.getTime() + (intervalMinutes || 60) * 60000);
            if (next > end)
                break;
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
        const createdSlots = yield TurfSlot_1.default.insertMany(slots);
        res.status(201).json({ success: true, data: createdSlots, message: `${createdSlots.length} slots generated successfully` });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error generating slots' });
    }
});
exports.generateSlots = generateSlots;
// 8. Dynamic Random Data Seeder Endpoint (POST /api/owner/seed-random)
const seedRandomMatches = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const count = parseInt(req.body.count) || 5;
        const createdBookings = yield (0, seed_1.generateRandomBookings)(count);
        res.status(201).json({
            success: true,
            message: `Successfully generated and added ${createdBookings.length} random matches in database`,
            count: createdBookings.length,
            data: createdBookings
        });
    }
    catch (error) {
        console.error('seedRandomMatches error:', error);
        res.status(500).json({ success: false, message: 'Failed to seed random data' });
    }
});
exports.seedRandomMatches = seedRandomMatches;
// 9. Reviews Endpoint (GET /api/owner/reviews, POST /api/owner/reviews/:id/reply)
const getOwnerReviews = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield ensureDatabaseHasData();
        const count = yield Review_1.default.countDocuments();
        if (count === 0) {
            yield (0, seed_1.seedDatabase)();
        }
        const reviews = yield Review_1.default.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: reviews });
    }
    catch (error) {
        console.error('getOwnerReviews error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch reviews' });
    }
});
exports.getOwnerReviews = getOwnerReviews;
const addReviewReply = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { text, author } = req.body;
        const review = yield Review_1.default.findByIdAndUpdate(id, {
            reply: {
                author: author || 'John (TurfHub Owner)',
                date: 'Just now',
                text
            }
        }, { new: true });
        res.status(200).json({ success: true, data: review, message: 'Reply posted to database' });
    }
    catch (error) {
        console.error('addReviewReply error:', error);
        res.status(500).json({ success: false, message: 'Failed to add reply' });
    }
});
exports.addReviewReply = addReviewReply;
// 10. Offers Endpoint (GET /api/owner/offers, POST /api/owner/offers)
const getOwnerOffers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const count = yield Offer_1.default.countDocuments();
        if (count === 0) {
            yield (0, seed_1.seedDatabase)();
        }
        const offers = yield Offer_1.default.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: offers });
    }
    catch (error) {
        console.error('getOwnerOffers error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch offers' });
    }
});
exports.getOwnerOffers = getOwnerOffers;
const createOwnerOffer = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const offer = yield Offer_1.default.create(req.body);
        res.status(201).json({ success: true, data: offer, message: 'Offer saved to database' });
    }
    catch (error) {
        console.error('createOwnerOffer error:', error);
        res.status(500).json({ success: false, message: 'Failed to create offer' });
    }
});
exports.createOwnerOffer = createOwnerOffer;
const deleteOwnerOffer = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        yield Offer_1.default.findByIdAndDelete(id);
        res.status(200).json({ success: true, message: 'Offer deleted successfully' });
    }
    catch (error) {
        console.error('deleteOwnerOffer error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete offer' });
    }
});
exports.deleteOwnerOffer = deleteOwnerOffer;
// 11. Tournaments Endpoint (GET /api/owner/tournaments, POST /api/owner/tournaments)
const getOwnerTournaments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const count = yield Tournament_1.default.countDocuments();
        if (count === 0) {
            yield (0, seed_1.seedDatabase)();
        }
        const tournaments = yield Tournament_1.default.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: tournaments });
    }
    catch (error) {
        console.error('getOwnerTournaments error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch tournaments' });
    }
});
exports.getOwnerTournaments = getOwnerTournaments;
const createOwnerTournament = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { title, sport, venue, date, teamsLimit, entryFee, prizePool, image } = req.body;
        if (!title || !date) {
            return res.status(400).json({ success: false, message: 'Tournament title and date are required' });
        }
        const tournament = yield Tournament_1.default.create({
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
    }
    catch (error) {
        console.error('createOwnerTournament error:', error);
        res.status(500).json({ success: false, message: 'Failed to create tournament' });
    }
});
exports.createOwnerTournament = createOwnerTournament;
const registerTournamentTeam = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { teamName, captainName, captainPhone, membersCount } = req.body;
        if (!teamName || !captainName || !captainPhone) {
            return res.status(400).json({ success: false, message: 'Team name, captain name, and captain mobile number are required' });
        }
        const tournament = yield Tournament_1.default.findById(id);
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
        const exists = tournament.registeredTeams.some(t => t.teamName.toLowerCase() === teamName.trim().toLowerCase());
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
        yield tournament.save();
        res.status(201).json({
            success: true,
            message: `Squad "${teamName}" registered successfully!`,
            data: tournament
        });
    }
    catch (error) {
        console.error('registerTournamentTeam error:', error);
        res.status(500).json({ success: false, message: 'Failed to register team' });
    }
});
exports.registerTournamentTeam = registerTournamentTeam;
const updateTournamentTeamStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id, teamId } = req.params;
        const { status } = req.body;
        const tournament = yield Tournament_1.default.findById(id);
        if (!tournament) {
            return res.status(404).json({ success: false, message: 'Tournament not found' });
        }
        const team = tournament.registeredTeams.id
            ? tournament.registeredTeams.id(teamId)
            : tournament.registeredTeams.find((t) => { var _a; return ((_a = t._id) === null || _a === void 0 ? void 0 : _a.toString()) === teamId.toString(); });
        if (!team) {
            return res.status(404).json({ success: false, message: 'Registered team not found' });
        }
        team.status = status;
        tournament.registeredCount = tournament.registeredTeams.filter(t => t.status === 'CONFIRMED' || t.status === 'APPROVED').length;
        yield tournament.save();
        res.status(200).json({ success: true, message: `Team status updated to ${status}`, data: tournament });
    }
    catch (error) {
        console.error('updateTournamentTeamStatus error:', error);
        res.status(500).json({ success: false, message: 'Failed to update team status' });
    }
});
exports.updateTournamentTeamStatus = updateTournamentTeamStatus;
// 12. Reports & Analytics (GET /api/owner/reports)
const getOwnerReports = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield ensureDatabaseHasData();
        const turfs = yield (0, exports.getAuthorizedTurfsForUser)(req.user);
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
        const bookings = yield Booking_1.default.find({ turfId: { $in: turfIds } })
            .populate('turfId', 'name sports')
            .populate('slotId', 'price startTime');
        // Group by turf
        const turfRevenueMap = {};
        const sportDistributionMap = {};
        let totalRevenue = 0;
        let totalBookings = bookings.length;
        bookings.forEach((b) => {
            var _a, _b, _c, _d;
            const price = ((_a = b.slotId) === null || _a === void 0 ? void 0 : _a.price) || 0;
            const turfName = ((_b = b.turfId) === null || _b === void 0 ? void 0 : _b.name) || 'Turf Arena';
            const sport = ((_d = (_c = b.turfId) === null || _c === void 0 ? void 0 : _c.sports) === null || _d === void 0 ? void 0 : _d[0]) || 'Football';
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
    }
    catch (error) {
        console.error('getOwnerReports error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch reports' });
    }
});
exports.getOwnerReports = getOwnerReports;
const getOwnerStaff = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const staffMembers = yield User_1.default.find({ role: 'STAFF' }).select('-password');
        res.status(200).json({ success: true, data: staffMembers });
    }
    catch (error) {
        console.error('getOwnerStaff error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch staff' });
    }
});
exports.getOwnerStaff = getOwnerStaff;
