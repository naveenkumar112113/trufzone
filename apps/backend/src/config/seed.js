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
exports.generateRandomBookings = exports.seedDatabase = void 0;
const User_1 = __importDefault(require("../models/User"));
const Turf_1 = __importDefault(require("../models/Turf"));
const TurfSlot_1 = __importDefault(require("../models/TurfSlot"));
const Booking_1 = __importDefault(require("../models/Booking"));
const Review_1 = __importDefault(require("../models/Review"));
const Offer_1 = __importDefault(require("../models/Offer"));
const Tournament_1 = __importDefault(require("../models/Tournament"));
const authController_1 = require("../controllers/authController");
const SEED_PLAYERS = [
    { name: 'Arun Kumar', phone: '9876543210', email: 'arun.football@gmail.com' },
    { name: 'Suresh (Nellai Strikers FC)', phone: '9988776655', email: 'suresh.strikers@nellai.in' },
    { name: 'Karthik Ramasamy', phone: '9123456789', email: 'karthik.warriors@outlook.com' },
    { name: 'Rajesh Kannan (Friends United)', phone: '9442233445', email: 'rajesh.fu@gmail.com' },
    { name: 'Pradeep S', phone: '9888111222', email: 'pradeep.sports@yahoo.com' },
    { name: 'Vijay Murugan', phone: '9840199887', email: 'vijay.cup@gmail.com' },
    { name: 'Mohamed Riaz', phone: '9771122334', email: 'riaz.tigers@gmail.com' },
    { name: 'Palai Smashers Team', phone: '9944155667', email: 'smashers.badminton@live.com' },
    { name: 'Ashwin Kumar', phone: '9488123456', email: 'ashwin.k@gmail.com' },
    { name: 'Venkatesh M', phone: '9842198765', email: 'venkat.sports@gmail.com' },
    { name: 'Dinesh Babu', phone: '9791122334', email: 'dinesh.babu@outlook.com' },
    { name: 'Manikandan P', phone: '9443156789', email: 'mani.football@gmail.com' },
];
const RANDOM_PLAYER_NAMES = [
    'Gokul Nath', 'Vigneshwaran P', 'Praveen Kumar', 'Mohan Sundaram',
    'Naveen Raj', 'Ajith Kumar', 'Dhanush S', 'Saravanan K',
    'Balaji Raman', 'Vijay Antony', 'Kabilan M', 'Surya Prakash',
    'Anand Babu', 'Silambarasan', 'Senthil Nathan'
];
const seedDatabase = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const defaultPassword = (0, authController_1.hashPassword)('password123');
        // 1. Seed or find Owner John Doe
        let owner = yield User_1.default.findOne({ phone: '9443182940' });
        if (!owner) {
            owner = yield User_1.default.create({
                name: 'John Doe',
                phone: '9443182940',
                email: 'john.doe@turfhub.in',
                password: defaultPassword,
                role: 'TURF_OWNER',
                isVerified: true
            });
            console.log('Seeded Owner: John Doe');
        }
        else if (!owner.password) {
            owner.password = defaultPassword;
            yield owner.save();
        }
        // 1b. Seed Staff Supervisor
        let staffUser = yield User_1.default.findOne({ phone: '9842100001' });
        if (!staffUser) {
            staffUser = yield User_1.default.create({
                name: 'Karthik R (Ground Supervisor)',
                phone: '9842100001',
                email: 'karthik.staff@turfhub.in',
                password: defaultPassword,
                role: 'STAFF',
                isVerified: true
            });
            console.log('Seeded Staff: Karthik R');
        }
        else if (!staffUser.password) {
            staffUser.password = defaultPassword;
            yield staffUser.save();
        }
        // 1c. Seed Platform Admin
        let adminUser = yield User_1.default.findOne({ phone: '9443100002' });
        if (!adminUser) {
            adminUser = yield User_1.default.create({
                name: 'Sundar Raman (Platform Admin)',
                phone: '9443100002',
                email: 'admin@turfhub.in',
                password: defaultPassword,
                role: 'ADMIN',
                isVerified: true
            });
            console.log('Seeded Admin: Sundar Raman');
        }
        else if (!adminUser.password) {
            adminUser.password = defaultPassword;
            yield adminUser.save();
        }
        // 2. Seed Players
        const createdPlayers = [];
        for (const p of SEED_PLAYERS) {
            let player = yield User_1.default.findOne({ phone: p.phone });
            if (!player) {
                player = yield User_1.default.create({
                    name: p.name,
                    phone: p.phone,
                    email: p.email,
                    password: defaultPassword,
                    role: 'PLAYER',
                    isVerified: true
                });
            }
            else if (!player.password) {
                player.password = defaultPassword;
                yield player.save();
            }
            createdPlayers.push(player);
        }
        // 3. Seed Turfs
        const existingTurfs = yield Turf_1.default.find({ ownerId: owner._id });
        let turfs = existingTurfs;
        if (existingTurfs.length === 0) {
            const turf1 = yield Turf_1.default.create({
                name: 'ABC Football Arena',
                description: 'FIFA Pro Artificial Turf with 400W Stadium Floodlights in Vannarpettai.',
                locationDetails: 'Vannarpettai, Near Railway Station',
                city: 'Tirunelveli',
                location: {
                    type: 'Point',
                    coordinates: [77.7567, 8.7139]
                },
                ownerId: owner._id,
                sports: ['Football', 'Box Cricket'],
                facilities: ['FIFA Grade Turf', 'LED Floodlights', 'Changing Rooms', 'Drinking Water', 'Free Parking', 'Bibs & Balls'],
                images: [
                    'https://images.unsplash.com/photo-1529900241470-349ff08ca3cf?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80'
                ],
                status: 'ACTIVE'
            });
            const turf2 = yield Turf_1.default.create({
                name: 'Nellai Cricket Ground',
                description: 'All-Weather Box Cricket & Bowling Machine Facility in Palayamkottai.',
                locationDetails: 'Palayamkottai, Near High Ground',
                city: 'Tirunelveli',
                location: {
                    type: 'Point',
                    coordinates: [77.7400, 8.7100]
                },
                ownerId: owner._id,
                sports: ['Box Cricket', 'Tennis'],
                facilities: ['High Netting Enclosure', 'Bowling Machine', 'LED Lighting', 'Seating Dugouts'],
                images: [
                    'https://images.unsplash.com/photo-1531415074868-036b1c575351?auto=format&fit=crop&w=1200&q=80'
                ],
                status: 'ACTIVE'
            });
            const turf3 = yield Turf_1.default.create({
                name: 'GreenField Multisport Arena',
                description: 'Dual Turf Complex for Football & Badminton in Perumalpuram.',
                locationDetails: 'Perumalpuram, Near St. Xavier College',
                city: 'Tirunelveli',
                location: {
                    type: 'Point',
                    coordinates: [77.7200, 8.7000]
                },
                ownerId: owner._id,
                sports: ['Football', 'Badminton'],
                facilities: ['Dual Court Layout', 'Indoor Badminton Court', 'Solar Heated Showers', 'Filtered Water'],
                images: [
                    'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?auto=format&fit=crop&w=1200&q=80'
                ],
                status: 'ACTIVE'
            });
            turfs = [turf1, turf2, turf3];
            console.log('Seeded 3 Turfs in Tirunelveli');
        }
        // 4. Generate Slots for Past 2 Days and Next 5 Days (Week coverage)
        const baseDate = new Date();
        baseDate.setHours(0, 0, 0, 0);
        for (let dayOffset = -2; dayOffset <= 5; dayOffset++) {
            const currentDay = new Date(baseDate);
            currentDay.setDate(baseDate.getDate() + dayOffset);
            const nextDay = new Date(currentDay);
            nextDay.setDate(currentDay.getDate() + 1);
            for (const turf of turfs) {
                const slotsCount = yield TurfSlot_1.default.countDocuments({
                    turfId: turf._id,
                    startTime: { $gte: currentDay, $lt: nextDay }
                });
                if (slotsCount === 0) {
                    const slotsToInsert = [];
                    for (let h = 6; h < 23; h++) {
                        const start = new Date(currentDay);
                        start.setHours(h, 0, 0, 0);
                        const end = new Date(currentDay);
                        end.setHours(h + 1, 0, 0, 0);
                        const isPeak = h >= 18 && h <= 21;
                        const price = isPeak ? 1200 : (turf.name.includes('Cricket') ? 800 : 1000);
                        slotsToInsert.push({
                            turfId: turf._id,
                            startTime: start,
                            endTime: end,
                            price,
                            pricingType: isPeak ? 'PEAK' : 'WEEKDAY',
                            status: 'AVAILABLE'
                        });
                    }
                    yield TurfSlot_1.default.insertMany(slotsToInsert);
                }
            }
        }
        // 5. Check if at least 15 bookings exist in MongoDB; if not, seed realistic matches!
        const totalBookingsCount = yield Booking_1.default.countDocuments();
        if (totalBookingsCount < 15) {
            console.log('Seeding rich booking matches in MongoDB...');
            // Find available slots
            const allSlots = yield TurfSlot_1.default.find({ status: 'AVAILABLE' })
                .sort({ startTime: 1 })
                .limit(40);
            const bookingTemplates = [
                { playerIdx: 0, turfIdx: 0, status: 'CONFIRMED', payment: 'SUCCESS', method: 'UPI' },
                { playerIdx: 1, turfIdx: 0, status: 'CONFIRMED', payment: 'SUCCESS', method: 'UPI' },
                { playerIdx: 2, turfIdx: 1, status: 'CONFIRMED', payment: 'SUCCESS', method: 'CASH' },
                { playerIdx: 3, turfIdx: 0, status: 'CONFIRMED', payment: 'SUCCESS', method: 'UPI' },
                { playerIdx: 4, turfIdx: 2, status: 'CONFIRMED', payment: 'SUCCESS', method: 'UPI' },
                { playerIdx: 5, turfIdx: 0, status: 'CONFIRMED', payment: 'PENDING', method: 'CASH' },
                { playerIdx: 6, turfIdx: 1, status: 'CONFIRMED', payment: 'SUCCESS', method: 'UPI' },
                { playerIdx: 7, turfIdx: 2, status: 'CONFIRMED', payment: 'SUCCESS', method: 'UPI' },
                { playerIdx: 8, turfIdx: 0, status: 'COMPLETED', payment: 'SUCCESS', method: 'UPI' },
                { playerIdx: 9, turfIdx: 1, status: 'COMPLETED', payment: 'SUCCESS', method: 'CASH' },
                { playerIdx: 10, turfIdx: 0, status: 'CONFIRMED', payment: 'SUCCESS', method: 'UPI' },
                { playerIdx: 11, turfIdx: 2, status: 'CONFIRMED', payment: 'SUCCESS', method: 'UPI' },
                { playerIdx: 0, turfIdx: 0, status: 'COMPLETED', payment: 'SUCCESS', method: 'UPI' },
                { playerIdx: 1, turfIdx: 0, status: 'COMPLETED', payment: 'SUCCESS', method: 'UPI' },
                { playerIdx: 2, turfIdx: 1, status: 'CANCELLED', payment: 'REFUNDED', method: 'UPI' },
                { playerIdx: 3, turfIdx: 0, status: 'CONFIRMED', payment: 'SUCCESS', method: 'UPI' },
                { playerIdx: 4, turfIdx: 2, status: 'CONFIRMED', payment: 'SUCCESS', method: 'UPI' },
            ];
            let slotIdx = 0;
            for (let i = 0; i < bookingTemplates.length && slotIdx < allSlots.length; i++) {
                const tmpl = bookingTemplates[i];
                const slot = allSlots[slotIdx++];
                const player = createdPlayers[tmpl.playerIdx % createdPlayers.length];
                const turf = turfs[tmpl.turfIdx % turfs.length];
                const bookingRef = `TH-${Math.floor(8000 + i * 111)}`;
                if (tmpl.status !== 'CANCELLED') {
                    yield TurfSlot_1.default.updateOne({ _id: slot._id }, { status: 'BOOKED' });
                }
                yield Booking_1.default.create({
                    bookingId: bookingRef,
                    userId: player._id,
                    turfId: turf._id,
                    slotId: slot._id,
                    paymentStatus: tmpl.payment,
                    status: tmpl.status,
                    paymentTransactionId: `${tmpl.method}-${Date.now()}-${i}`,
                    qrHash: `QR-${bookingRef}`
                });
            }
            console.log(`Seeded ${bookingTemplates.length} matches across all turfs in MongoDB!`);
        }
        // 6. Seed Reviews if empty
        const reviewCount = yield Review_1.default.countDocuments();
        if (reviewCount === 0) {
            console.log('Seeding customer reviews in MongoDB...');
            yield Review_1.default.create([
                {
                    turfId: turfs[0]._id,
                    authorName: 'Arun Kumar',
                    turfName: 'ABC Football Arena',
                    sport: 'Football',
                    rating: 5.0,
                    date: 'Yesterday, 8:40 PM',
                    comment: 'Best artificial turf in Tirunelveli! Floodlights are top notch and the pitch bounce is very consistent.',
                    helpfulCount: 14,
                    reply: {
                        author: 'John (Owner)',
                        date: 'Yesterday',
                        text: 'Thank you Arun! We just upgraded the LED stadium floodlights last month. Looking forward to your next match!'
                    }
                },
                {
                    turfId: turfs[1]._id,
                    authorName: 'Karthik Ramasamy',
                    turfName: 'Nellai Cricket Ground',
                    sport: 'Box Cricket',
                    rating: 4.8,
                    date: '2 days ago',
                    comment: 'Great box cricket facility. Bowling machine speed options are excellent for practice sessions.',
                    helpfulCount: 9
                },
                {
                    turfId: turfs[2]._id,
                    authorName: 'Palai Smashers Team',
                    turfName: 'GreenField Multisport Arena',
                    sport: 'Badminton',
                    rating: 5.0,
                    date: '4 days ago',
                    comment: 'The wooden synthetic hybrid badminton court is very gentle on knees. Super clean changing rooms!',
                    helpfulCount: 6
                },
                {
                    turfId: turfs[0]._id,
                    authorName: 'Suresh Kumar (Nellai FC)',
                    turfName: 'ABC Football Arena',
                    sport: 'Football',
                    rating: 4.5,
                    date: 'Last week',
                    comment: 'Very good pitch condition. Drinking water filter is cold and refreshing after intense 90 mins matches.',
                    helpfulCount: 11
                }
            ]);
        }
        // 7. Seed Offers if empty
        const offerCount = yield Offer_1.default.countDocuments();
        if (offerCount === 0) {
            console.log('Seeding promo offers in MongoDB...');
            yield Offer_1.default.create([
                {
                    code: 'AFTERNOON20',
                    discount: '20% OFF',
                    turf: 'All Turfs in Portfolio',
                    validHours: '12:00 PM – 4:00 PM (Off-Peak)',
                    validUntil: '30 Sep 2026',
                    status: 'ACTIVE',
                    redemptions: 24
                },
                {
                    code: 'WEEKENDPLAY',
                    discount: '₹150 Flat OFF',
                    turf: 'Nellai Cricket Ground',
                    validHours: '6:00 AM – 9:00 AM (Early Bird)',
                    validUntil: '15 Oct 2026',
                    status: 'ACTIVE',
                    redemptions: 48
                },
                {
                    code: 'RAINYDAYS',
                    discount: '25% OFF',
                    turf: 'ABC Football Arena',
                    validHours: 'Monsoon Flash Discount',
                    validUntil: 'Expired',
                    status: 'EXPIRED',
                    redemptions: 42
                }
            ]);
        }
        // 8. Seed Tournaments if empty
        const tourCount = yield Tournament_1.default.countDocuments();
        if (tourCount === 0) {
            console.log('Seeding tournaments in MongoDB...');
            yield Tournament_1.default.create([
                {
                    title: 'Nellai Premier Night Cup 2026',
                    sport: 'Football 7v7',
                    venue: 'ABC Football Arena',
                    date: '20 Sep – 22 Sep 2026',
                    teamsLimit: 16,
                    registeredCount: 14,
                    entryFee: 2500,
                    prizePool: '₹50,000 + Trophy',
                    status: 'REGISTRATION OPEN',
                    image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80'
                },
                {
                    title: 'Tirunelveli Corporate Box Cricket Trophy',
                    sport: 'Box Cricket 6v6',
                    venue: 'Nellai Cricket Ground',
                    date: '27 Sep – 28 Sep 2026',
                    teamsLimit: 12,
                    registeredCount: 8,
                    entryFee: 2000,
                    prizePool: '₹30,000',
                    status: 'REGISTRATION OPEN',
                    image: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=800&q=80'
                },
                {
                    title: 'Independence Day Monsoon Cup',
                    sport: 'Football 7v7',
                    venue: 'GreenField Multisport Arena',
                    date: '15 Aug 2026',
                    teamsLimit: 16,
                    registeredCount: 16,
                    entryFee: 2000,
                    prizePool: '₹40,000',
                    status: 'COMPLETED',
                    image: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80'
                }
            ]);
        }
        console.log('Database seeding verified successfully');
    }
    catch (err) {
        console.error('Database seeding error:', err);
    }
});
exports.seedDatabase = seedDatabase;
// Generator to insert N random new bookings dynamically into MongoDB Atlas
const generateRandomBookings = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (count = 5) {
    try {
        const owner = yield User_1.default.findOne({ phone: '9443182940' });
        if (!owner) {
            yield (0, exports.seedDatabase)();
        }
        const turfs = yield Turf_1.default.find();
        if (turfs.length === 0) {
            yield (0, exports.seedDatabase)();
            return [];
        }
        const createdBookings = [];
        const paymentMethods = ['UPI', 'CASH', 'UPI', 'UPI'];
        const statuses = ['CONFIRMED', 'CONFIRMED', 'COMPLETED', 'CONFIRMED'];
        for (let i = 0; i < count; i++) {
            // Pick or create random player
            const randName = RANDOM_PLAYER_NAMES[Math.floor(Math.random() * RANDOM_PLAYER_NAMES.length)];
            const randPhone = '98' + Math.floor(10000000 + Math.random() * 89999999);
            let player = yield User_1.default.findOne({ name: randName });
            if (!player) {
                player = yield User_1.default.create({
                    name: randName,
                    phone: randPhone,
                    email: `${randName.toLowerCase().replace(/\s+/g, '')}@gmail.com`,
                    role: 'PLAYER',
                    isVerified: true
                });
            }
            // Pick turf
            const turf = turfs[Math.floor(Math.random() * turfs.length)];
            // Pick date (today, tomorrow, or 2 days from now)
            const dayOffset = Math.floor(Math.random() * 4);
            const slotDate = new Date();
            slotDate.setDate(slotDate.getDate() + dayOffset);
            const hour = 6 + Math.floor(Math.random() * 16); // 6 AM to 10 PM
            slotDate.setHours(hour, 0, 0, 0);
            const slotEndDate = new Date(slotDate);
            slotEndDate.setHours(hour + 1, 0, 0, 0);
            const price = hour >= 18 ? 1200 : (turf.name.includes('Cricket') ? 800 : 1000);
            // Create slot
            const slot = yield TurfSlot_1.default.create({
                turfId: turf._id,
                startTime: slotDate,
                endTime: slotEndDate,
                price,
                pricingType: hour >= 18 ? 'PEAK' : 'WEEKDAY',
                status: 'BOOKED'
            });
            const bookingRef = `TH-${Math.floor(1000 + Math.random() * 8999)}`;
            const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
            const status = statuses[Math.floor(Math.random() * statuses.length)];
            const booking = yield Booking_1.default.create({
                bookingId: bookingRef,
                userId: player._id,
                turfId: turf._id,
                slotId: slot._id,
                paymentStatus: status === 'CANCELLED' ? 'REFUNDED' : 'SUCCESS',
                status,
                paymentTransactionId: `${paymentMethod}-${Date.now()}-${i}`,
                qrHash: `QR-${bookingRef}`
            });
            createdBookings.push(booking);
        }
        console.log(`Generated and inserted ${createdBookings.length} random bookings directly into MongoDB!`);
        return createdBookings;
    }
    catch (error) {
        console.error('generateRandomBookings error:', error);
        return [];
    }
});
exports.generateRandomBookings = generateRandomBookings;
