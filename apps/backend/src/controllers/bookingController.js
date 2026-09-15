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
exports.publicBookTurf = exports.getMyBookings = exports.verifyBooking = exports.initiateBooking = void 0;
const TurfSlot_1 = __importDefault(require("../models/TurfSlot"));
const Booking_1 = __importDefault(require("../models/Booking"));
const Turf_1 = __importDefault(require("../models/Turf"));
const User_1 = __importDefault(require("../models/User"));
const redis_1 = __importDefault(require("../config/redis"));
const initiateBooking = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { slotId } = req.body;
    const userId = req.user._id;
    if (!slotId) {
        res.status(400).json({ error: 'slotId is required' });
        return;
    }
    const lockKey = `lock:slot:${slotId}`;
    const lockTTL = 600; // 10 minutes payment window
    try {
        // Attempt to acquire Redis lock
        const acquired = yield redis_1.default.set(lockKey, userId.toString(), 'EX', lockTTL, 'NX');
        if (!acquired) {
            res.status(409).json({ error: 'Slot is currently being booked by someone else' });
            return;
        }
        try {
            const slot = yield TurfSlot_1.default.findById(slotId);
            if (!slot || slot.status !== 'AVAILABLE') {
                res.status(409).json({ error: 'Slot is unavailable' });
                return;
            }
            const orderId = 'ORD_' + Math.floor(Math.random() * 1000000000);
            const booking = new Booking_1.default({
                bookingId: orderId,
                userId,
                turfId: slot.turfId,
                slotId,
                paymentStatus: 'PENDING',
                status: 'PAYMENT_PENDING'
            });
            yield booking.save();
            slot.status = 'LOCKED';
            yield slot.save();
            res.status(201).json({ success: true, orderId, bookingId: booking._id });
        }
        catch (error) {
            yield redis_1.default.del(lockKey);
            throw error;
        }
    }
    catch (error) {
        console.error('Error initiating booking:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
exports.initiateBooking = initiateBooking;
const verifyBooking = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { orderId, paymentId, slotId } = req.body;
    const userId = req.user._id;
    try {
        const booking = yield Booking_1.default.findOne({ bookingId: orderId, userId });
        if (!booking) {
            res.status(404).json({ error: 'Booking not found' });
            return;
        }
        if (!paymentId) {
            res.status(400).json({ error: 'Payment signature required' });
            return;
        }
        booking.paymentStatus = 'SUCCESS';
        booking.status = 'CONFIRMED';
        yield booking.save();
        const slot = yield TurfSlot_1.default.findById(slotId);
        if (slot) {
            slot.status = 'BOOKED';
            yield slot.save();
        }
        const lockKey = `lock:slot:${slotId}`;
        const script = `
            if redis.call("get", KEYS[1]) == ARGV[1] then
                return redis.call("del", KEYS[1])
            else
                return 0
            end
        `;
        yield redis_1.default.eval(script, 1, lockKey, userId.toString());
        res.status(200).json({ success: true, message: 'Booking confirmed' });
    }
    catch (error) {
        console.error('Error verifying booking:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
exports.verifyBooking = verifyBooking;
const getMyBookings = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user._id;
        const bookings = yield Booking_1.default.find({ userId })
            .sort({ createdAt: -1 })
            .populate('turfId', 'name locationDetails city sports images')
            .populate('slotId', 'startTime endTime price');
        const formatted = bookings.map((b) => { var _a, _b, _c, _d, _e, _f; return ({
            id: b._id.toString(),
            bookingCode: b.bookingId,
            turfId: (_b = (_a = b.turfId) === null || _a === void 0 ? void 0 : _a._id) === null || _b === void 0 ? void 0 : _b.toString(),
            turfName: ((_c = b.turfId) === null || _c === void 0 ? void 0 : _c.name) || 'Turf Arena',
            customerName: req.user.name,
            customerPhone: req.user.phone,
            customerEmail: req.user.email || '',
            sport: ((_e = (_d = b.turfId) === null || _d === void 0 ? void 0 : _d.sports) === null || _e === void 0 ? void 0 : _e[0]) || 'Football',
            date: b.slotId ? new Date(b.slotId.startTime).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            timeSlot: b.slotId
                ? `${new Date(b.slotId.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – ${new Date(b.slotId.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                : 'Evening Slot',
            startTimeHour: b.slotId ? new Date(b.slotId.startTime).getHours() : 18,
            durationHours: 1,
            amount: ((_f = b.slotId) === null || _f === void 0 ? void 0 : _f.price) || 1000,
            paymentMethod: b.paymentStatus === 'SUCCESS' ? 'UPI' : 'CASH',
            paymentStatus: b.paymentStatus === 'SUCCESS' ? 'PAID' : (b.paymentStatus === 'REFUNDED' ? 'REFUNDED' : 'PENDING'),
            status: b.status,
            qrHash: b.qrHash,
            createdAt: b.createdAt
        }); });
        res.status(200).json({ success: true, data: formatted });
    }
    catch (error) {
        console.error('Error in getMyBookings:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch personal bookings' });
    }
});
exports.getMyBookings = getMyBookings;
const publicBookTurf = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { turfId, date, timeSlot, customerName, customerPhone, sport, paymentMethod } = req.body;
        if (!turfId || !customerName || !customerPhone || !timeSlot) {
            return res.status(400).json({
                success: false,
                message: 'Missing required booking fields: turf, customer name, mobile number, and time slot are required.'
            });
        }
        const cleanPhone = customerPhone.trim();
        if (!/^\d{10}$/.test(cleanPhone)) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid 10-digit mobile number for booking confirmation.'
            });
        }
        const turf = yield Turf_1.default.findById(turfId);
        if (!turf) {
            return res.status(404).json({
                success: false,
                message: 'The selected turf arena does not exist or has been deactivated.'
            });
        }
        // Check for double booking conflict on this turf and time slot
        const bookingDate = new Date(date || Date.now());
        const [startPart] = (timeSlot || '18:00').split('–');
        const slotHour = parseInt(startPart) || 18;
        bookingDate.setHours(slotHour, 0, 0, 0);
        const existingSlot = yield TurfSlot_1.default.findOne({
            turfId,
            startTime: bookingDate,
            status: { $in: ['BOOKED', 'LOCKED', 'BLOCKED'] }
        });
        if (existingSlot) {
            return res.status(409).json({
                success: false,
                message: `The ${timeSlot} slot on ${date} is already booked. Please choose an alternative time slot.`
            });
        }
        // Calculate authentic amount based on turf base price and time tier
        const basePrice = turf.pricePerHour || 1000;
        const isPeak = timeSlot.includes('6:00 PM') || timeSlot.includes('7:00 PM') || timeSlot.includes('8:00 PM');
        const calculatedAmount = isPeak ? basePrice + 200 : basePrice;
        // Find or create customer
        let customer = yield User_1.default.findOne({ phone: cleanPhone });
        if (!customer) {
            customer = yield User_1.default.create({
                name: customerName.trim(),
                phone: cleanPhone,
                role: 'PLAYER',
                isVerified: true,
                tokenVersion: 0
            });
        }
        const slotEndDate = new Date(bookingDate);
        slotEndDate.setHours(slotHour + 1, 0, 0, 0);
        const slot = yield TurfSlot_1.default.create({
            turfId,
            startTime: bookingDate,
            endTime: slotEndDate,
            price: calculatedAmount,
            pricingType: isPeak ? 'PEAK' : 'WEEKDAY',
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
            paymentTransactionId: `ONLINE-${Date.now()}`,
            qrHash: `QR-${bookingRef}`
        });
        res.status(201).json({
            success: true,
            message: `Match booked successfully for ${turf.name}!`,
            data: {
                id: booking._id ? booking._id.toString() : bookingRef,
                bookingCode: bookingRef,
                turfName: turf.name,
                date: bookingDate.toISOString().split('T')[0],
                timeSlot,
                amount: calculatedAmount,
                status: 'CONFIRMED'
            }
        });
    }
    catch (error) {
        console.error('Error in publicBookTurf:', error);
        res.status(500).json({ success: false, message: 'Server error while processing your booking request. Please try again.' });
    }
});
exports.publicBookTurf = publicBookTurf;
