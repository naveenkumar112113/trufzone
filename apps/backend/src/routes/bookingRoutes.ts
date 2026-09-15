import { Router } from 'express';
import { initiateBooking, verifyBooking, getMyBookings, publicBookTurf } from '../controllers/bookingController';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();

// Public booking endpoint (open to players / guests)
router.post('/public', publicBookTurf);

// Protected routes (require user authentication)
router.use(requireAuth);
router.get('/my-bookings', getMyBookings);
router.post('/initiate', initiateBooking);
router.post('/verify', verifyBooking);

export default router;
