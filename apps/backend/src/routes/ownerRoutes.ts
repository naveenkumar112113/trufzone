import { Router } from 'express';
import { 
  getDashboardStats, createTurf, generateSlots, 
  getOwnerTurfs, getOwnerBookings, createOfflineBooking,
  blockSlot, updateBookingStatus, getOwnerCustomers,
  seedRandomMatches, getOwnerReviews, addReviewReply,
  getOwnerOffers, createOwnerOffer, deleteOwnerOffer, getOwnerTournaments,
  createOwnerTournament, registerTournamentTeam, updateTournamentTeamStatus,
  getOwnerReports, getOwnerStaff
} from '../controllers/ownerController';
import { requireAuth, requireRole } from '../middleware/authMiddleware';

const router = Router();

// Protect all routes with auth
router.use(requireAuth);

// 1. Dashboard & Stats (Owner, Admin, Staff only)
router.get('/dashboard', requireRole(['TURF_OWNER', 'TURF_ADMIN', 'ADMIN', 'STAFF']), getDashboardStats);

// 2. Turfs & Ground Operations
router.get('/turfs', requireRole(['TURF_OWNER', 'TURF_ADMIN', 'ADMIN', 'STAFF']), getOwnerTurfs);
router.post('/turfs', requireRole(['TURF_OWNER', 'TURF_ADMIN', 'ADMIN']), createTurf);
router.post('/slots', requireRole(['TURF_OWNER', 'TURF_ADMIN', 'ADMIN', 'STAFF']), generateSlots);
router.post('/slots/block', requireRole(['TURF_OWNER', 'TURF_ADMIN', 'ADMIN', 'STAFF']), blockSlot);

// 3. Bookings
router.get('/bookings', requireRole(['TURF_OWNER', 'TURF_ADMIN', 'ADMIN', 'STAFF']), getOwnerBookings);
router.post('/bookings/offline', requireRole(['TURF_OWNER', 'TURF_ADMIN', 'ADMIN', 'STAFF']), createOfflineBooking);
router.put('/bookings/:id/status', requireRole(['TURF_OWNER', 'TURF_ADMIN', 'ADMIN', 'STAFF']), updateBookingStatus);

// 4. Customers CRM
router.get('/customers', requireRole(['TURF_OWNER', 'TURF_ADMIN', 'ADMIN', 'STAFF']), getOwnerCustomers);

// 5. Dynamic Random Data Generator (Owner & Admin only)
router.post('/seed-random', requireRole(['TURF_OWNER', 'TURF_ADMIN', 'ADMIN']), seedRandomMatches);

// 6. Reviews
router.get('/reviews', requireRole(['TURF_OWNER', 'TURF_ADMIN', 'ADMIN', 'STAFF']), getOwnerReviews);
router.post('/reviews/:id/reply', requireRole(['TURF_OWNER', 'TURF_ADMIN', 'ADMIN', 'STAFF']), addReviewReply);

// 7. Offers & Promotions
router.get('/offers', requireRole(['TURF_OWNER', 'TURF_ADMIN', 'ADMIN', 'STAFF']), getOwnerOffers);
router.post('/offers', requireRole(['TURF_OWNER', 'TURF_ADMIN', 'ADMIN']), createOwnerOffer);
router.delete('/offers/:id', requireRole(['TURF_OWNER', 'TURF_ADMIN', 'ADMIN']), deleteOwnerOffer);

// 8. Tournaments (Viewable by all roles including Players; editable by Owner/Admin)
router.get('/tournaments', requireRole(['TURF_OWNER', 'TURF_ADMIN', 'ADMIN', 'STAFF', 'PLAYER']), getOwnerTournaments);
router.post('/tournaments', requireRole(['TURF_OWNER', 'TURF_ADMIN', 'ADMIN']), createOwnerTournament);
router.post('/tournaments/:id/register-team', requireRole(['PLAYER', 'TURF_OWNER', 'TURF_ADMIN', 'ADMIN', 'STAFF']), registerTournamentTeam);
router.patch('/tournaments/:id/teams/:teamId', requireRole(['TURF_OWNER', 'TURF_ADMIN', 'ADMIN']), updateTournamentTeamStatus);

// 9. Financial Reports & Analytics (Owner & Admin only)
router.get('/reports', requireRole(['TURF_OWNER', 'TURF_ADMIN', 'ADMIN']), getOwnerReports);

// 10. Staff Directory
router.get('/staff', requireRole(['TURF_OWNER', 'TURF_ADMIN', 'ADMIN']), getOwnerStaff);

export default router;

