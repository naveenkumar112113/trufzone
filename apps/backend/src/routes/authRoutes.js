"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
// Public auth routes
router.post('/register', authController_1.register);
router.post('/login', authController_1.loginWithPassword);
router.post('/login-password', authController_1.loginWithPassword);
router.post('/google', authController_1.googleAuth);
router.post('/send-otp', authController_1.sendOtp);
router.post('/verify-otp', authController_1.verifyOtp);
router.post('/forgot-password', authController_1.forgotPassword);
router.post('/reset-password', authController_1.resetPassword);
// Authenticated session routes
router.get('/me', authMiddleware_1.requireAuth, authController_1.getMe);
router.post('/logout', authMiddleware_1.requireAuth, authController_1.logout);
exports.default = router;
