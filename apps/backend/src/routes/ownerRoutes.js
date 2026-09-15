"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ownerController_1 = require("../controllers/ownerController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
// Protect all routes with auth
router.use(authMiddleware_1.requireAuth);
// 1. Dashboard & Stats (Owner, Admin, Staff only)
router.get('/dashboard', (0, authMiddleware_1.requireRole)(['TURF_OWNER', 'TURF_ADMIN', 'ADMIN', 'STAFF']), ownerController_1.getDashboardStats);
// 2. Turfs & Ground Operations
router.get('/turfs', (0, authMiddleware_1.requireRole)(['TURF_OWNER', 'TURF_ADMIN', 'ADMIN', 'STAFF']), ownerController_1.getOwnerTurfs);
router.post('/turfs', (0, authMiddleware_1.requireRole)(['TURF_OWNER', 'TURF_ADMIN', 'ADMIN']), ownerController_1.createTurf);
router.post('/slots', (0, authMiddleware_1.requireRole)(['TURF_OWNER', 'TURF_ADMIN', 'ADMIN', 'STAFF']), ownerController_1.generateSlots);
router.post('/slots/block', (0, authMiddleware_1.requireRole)(['TURF_OWNER', 'TURF_ADMIN', 'ADMIN', 'STAFF']), ownerController_1.blockSlot);
// 3. Bookings
router.get('/bookings', (0, authMiddleware_1.requireRole)(['TURF_OWNER', 'TURF_ADMIN', 'ADMIN', 'STAFF']), ownerController_1.getOwnerBookings);
router.post('/bookings/offline', (0, authMiddleware_1.requireRole)(['TURF_OWNER', 'TURF_ADMIN', 'ADMIN', 'STAFF']), ownerController_1.createOfflineBooking);
router.put('/bookings/:id/status', (0, authMiddleware_1.requireRole)(['TURF_OWNER', 'TURF_ADMIN', 'ADMIN', 'STAFF']), ownerController_1.updateBookingStatus);
// 4. Customers CRM
router.get('/customers', (0, authMiddleware_1.requireRole)(['TURF_OWNER', 'TURF_ADMIN', 'ADMIN', 'STAFF']), ownerController_1.getOwnerCustomers);
// 5. Dynamic Random Data Generator (Owner & Admin only)
router.post('/seed-random', (0, authMiddleware_1.requireRole)(['TURF_OWNER', 'TURF_ADMIN', 'ADMIN']), ownerController_1.seedRandomMatches);
// 6. Reviews
router.get('/reviews', (0, authMiddleware_1.requireRole)(['TURF_OWNER', 'TURF_ADMIN', 'ADMIN', 'STAFF']), ownerController_1.getOwnerReviews);
router.post('/reviews/:id/reply', (0, authMiddleware_1.requireRole)(['TURF_OWNER', 'TURF_ADMIN', 'ADMIN', 'STAFF']), ownerController_1.addReviewReply);
// 7. Offers & Promotions
router.get('/offers', (0, authMiddleware_1.requireRole)(['TURF_OWNER', 'TURF_ADMIN', 'ADMIN', 'STAFF']), ownerController_1.getOwnerOffers);
router.post('/offers', (0, authMiddleware_1.requireRole)(['TURF_OWNER', 'TURF_ADMIN', 'ADMIN']), ownerController_1.createOwnerOffer);
router.delete('/offers/:id', (0, authMiddleware_1.requireRole)(['TURF_OWNER', 'TURF_ADMIN', 'ADMIN']), ownerController_1.deleteOwnerOffer);
// 8. Tournaments (Viewable by all roles including Players; editable by Owner/Admin)
router.get('/tournaments', (0, authMiddleware_1.requireRole)(['TURF_OWNER', 'TURF_ADMIN', 'ADMIN', 'STAFF', 'PLAYER']), ownerController_1.getOwnerTournaments);
router.post('/tournaments', (0, authMiddleware_1.requireRole)(['TURF_OWNER', 'TURF_ADMIN', 'ADMIN']), ownerController_1.createOwnerTournament);
router.post('/tournaments/:id/register-team', (0, authMiddleware_1.requireRole)(['PLAYER', 'TURF_OWNER', 'TURF_ADMIN', 'ADMIN', 'STAFF']), ownerController_1.registerTournamentTeam);
router.patch('/tournaments/:id/teams/:teamId', (0, authMiddleware_1.requireRole)(['TURF_OWNER', 'TURF_ADMIN', 'ADMIN']), ownerController_1.updateTournamentTeamStatus);
// 9. Financial Reports & Analytics (Owner & Admin only)
router.get('/reports', (0, authMiddleware_1.requireRole)(['TURF_OWNER', 'TURF_ADMIN', 'ADMIN']), ownerController_1.getOwnerReports);
// 10. Staff Directory
router.get('/staff', (0, authMiddleware_1.requireRole)(['TURF_OWNER', 'TURF_ADMIN', 'ADMIN']), ownerController_1.getOwnerStaff);
exports.default = router;
