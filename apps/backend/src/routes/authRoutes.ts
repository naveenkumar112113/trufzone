import { Router } from 'express';
import { 
    register, 
    loginWithPassword, 
    googleAuth, 
    sendOtp, 
    verifyOtp, 
    forgotPassword, 
    resetPassword, 
    getMe, 
    logout 
} from '../controllers/authController';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();

// Public auth routes
router.post('/register', register);
router.post('/login', loginWithPassword);
router.post('/login-password', loginWithPassword);
router.post('/google', googleAuth);
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Authenticated session routes
router.get('/me', requireAuth, getMe);
router.post('/logout', requireAuth, logout);

export default router;
