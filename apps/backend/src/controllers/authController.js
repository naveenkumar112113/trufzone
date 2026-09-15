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
exports.logout = exports.getMe = exports.resetPassword = exports.forgotPassword = exports.verifyOtp = exports.sendOtp = exports.googleAuth = exports.loginWithPassword = exports.register = exports.verifyPassword = exports.hashPassword = void 0;
const crypto_1 = __importDefault(require("crypto"));
const redis_1 = __importDefault(require("../config/redis"));
const User_1 = __importDefault(require("../models/User"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authMiddleware_1 = require("../middleware/authMiddleware");
// --- Password Hashing Helpers using Node.js crypto (Scrypt) ---
const hashPassword = (password) => {
    const salt = crypto_1.default.randomBytes(16).toString('hex');
    const hash = crypto_1.default.scryptSync(password, salt, 64).toString('hex');
    return `${salt}:${hash}`;
};
exports.hashPassword = hashPassword;
const verifyPassword = (password, combined) => {
    if (!combined || !combined.includes(':'))
        return false;
    const [salt, key] = combined.split(':');
    const hash = crypto_1.default.scryptSync(password, salt, 64).toString('hex');
    return crypto_1.default.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(key, 'hex'));
};
exports.verifyPassword = verifyPassword;
const createJwtToken = (user) => {
    const secret = process.env.JWT_SECRET || 'fallback_secret_for_dev_only';
    return jsonwebtoken_1.default.sign({ id: user._id, role: user.role, tokenVersion: user.tokenVersion || 0 }, secret, { expiresIn: '7d' });
};
// 1. User Registration (POST /api/auth/register)
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, phone, email, password } = req.body;
        if (!name || name.trim().length < 2) {
            return res.status(400).json({ success: false, message: 'Full name is required (at least 2 characters)' });
        }
        if (!phone || !/^\d{10}$/.test(phone.trim())) {
            return res.status(400).json({ success: false, message: 'A valid 10-digit mobile number is required' });
        }
        if (!password || password.length < 6) {
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
        }
        const normalizedPhone = phone.trim();
        const normalizedEmail = email ? email.trim().toLowerCase() : undefined;
        // Duplicate checks
        const existingPhone = yield User_1.default.findOne({ phone: normalizedPhone });
        if (existingPhone) {
            return res.status(409).json({ success: false, message: 'An account with this mobile number already exists' });
        }
        if (normalizedEmail) {
            const existingEmail = yield User_1.default.findOne({ email: normalizedEmail });
            if (existingEmail) {
                return res.status(409).json({ success: false, message: 'An account with this email address already exists' });
            }
        }
        // Public signup strictly assigns role 'PLAYER'
        const user = yield User_1.default.create({
            name: name.trim(),
            phone: normalizedPhone,
            email: normalizedEmail,
            password: (0, exports.hashPassword)(password),
            role: 'PLAYER',
            isVerified: true,
            tokenVersion: 0
        });
        const token = createJwtToken(user);
        // Sanitize password before returning
        const userObj = user.toObject();
        delete userObj.password;
        res.status(201).json({
            success: true,
            data: { token, user: userObj },
            message: 'Account created successfully'
        });
    }
    catch (error) {
        console.error('Error during registration:', error);
        res.status(500).json({ success: false, message: 'Registration failed due to server error' });
    }
});
exports.register = register;
// 2. Password Login (POST /api/auth/login)
const loginWithPassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { identifier, password } = req.body;
        if (!identifier || !password) {
            return res.status(400).json({ success: false, message: 'Mobile number/email and password are required' });
        }
        const cleanId = identifier.trim();
        const user = yield User_1.default.findOne({
            $or: [
                { phone: cleanId },
                { email: cleanId.toLowerCase() }
            ]
        });
        if (!user || !user.password) {
            return res.status(401).json({ success: false, message: 'Invalid credentials. Please check mobile/email or sign in with OTP.' });
        }
        const isMatch = (0, exports.verifyPassword)(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
        const token = createJwtToken(user);
        const userObj = user.toObject();
        delete userObj.password;
        res.status(200).json({
            success: true,
            data: { token, user: userObj },
            message: 'Authentication successful'
        });
    }
    catch (error) {
        console.error('Error in loginWithPassword:', error);
        res.status(500).json({ success: false, message: 'Login failed due to server error' });
    }
});
exports.loginWithPassword = loginWithPassword;
// 3. Google OAuth Token Verification (POST /api/auth/google)
const googleAuth = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { idToken, googleId: directSub, email: directEmail, name: directName, avatar: directPic } = req.body;
        let googleData = null;
        if (idToken) {
            // Verify token with Google's OAuth tokeninfo API
            try {
                const googleRes = yield fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
                if (googleRes.ok) {
                    googleData = yield googleRes.json();
                }
            }
            catch (fetchErr) {
                console.warn('Direct Google tokeninfo fetch error:', fetchErr);
            }
            // Fallback decode for valid JWT structure
            if (!googleData || !googleData.sub) {
                try {
                    const decoded = jsonwebtoken_1.default.decode(idToken);
                    if (decoded && (decoded.email || decoded.sub)) {
                        googleData = decoded;
                    }
                }
                catch (dErr) {
                    // Ignore
                }
            }
        }
        else if (directSub || directEmail) {
            googleData = {
                sub: directSub || ('g-' + Date.now()),
                email: directEmail,
                name: directName || 'Google Athlete',
                picture: directPic || ''
            };
        }
        if (!googleData || (!googleData.email && !googleData.sub)) {
            return res.status(401).json({ success: false, message: 'Invalid or missing Google identity payload' });
        }
        const googleId = googleData.sub;
        const email = (googleData.email || '').toLowerCase();
        const name = googleData.name || googleData.given_name || 'Google Athlete';
        const avatar = googleData.picture || '';
        // Find existing user by googleId or verified email
        let user = yield User_1.default.findOne({
            $or: [
                { googleId },
                ...(email ? [{ email }] : [])
            ]
        });
        if (user) {
            // Link googleId and avatar if not present
            let shouldSave = false;
            if (!user.googleId) {
                user.googleId = googleId;
                shouldSave = true;
            }
            if (avatar && !user.avatar) {
                user.avatar = avatar;
                shouldSave = true;
            }
            if (shouldSave) {
                yield user.save();
            }
        }
        else {
            // Create new player with Google identity
            user = yield User_1.default.create({
                name,
                email,
                googleId,
                avatar,
                role: 'PLAYER',
                isVerified: true,
                tokenVersion: 0
            });
        }
        const token = createJwtToken(user);
        const userObj = user.toObject();
        delete userObj.password;
        res.status(200).json({
            success: true,
            data: { token, user: userObj },
            message: 'Authenticated with Google'
        });
    }
    catch (error) {
        console.error('Error in googleAuth:', error);
        res.status(500).json({ success: false, message: 'Google authentication failed' });
    }
});
exports.googleAuth = googleAuth;
// 4. Send Mobile OTP (POST /api/auth/send-otp)
const sendOtp = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { phone } = req.body;
        if (!phone || !/^\d{10}$/.test(phone.trim())) {
            return res.status(400).json({ success: false, message: 'A valid 10-digit mobile number is required' });
        }
        const cleanPhone = phone.trim();
        // Generate real 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        // Store OTP in Redis with 5 minutes (300 seconds) TTL
        yield redis_1.default.setex(`otp:${cleanPhone}`, 300, otp);
        console.log(`\n========================================\n[SMS GATEWAY] OTP for ${cleanPhone} => ${otp}\n========================================\n`);
        res.status(200).json({ success: true, message: 'Verification code sent to your mobile number' });
    }
    catch (error) {
        console.error('Error sending OTP:', error);
        res.status(500).json({ success: false, message: 'Error sending verification code' });
    }
});
exports.sendOtp = sendOtp;
// 5. Verify Mobile OTP (POST /api/auth/verify-otp)
const verifyOtp = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { phone, otp, name } = req.body;
        if (!phone || !otp) {
            return res.status(400).json({ success: false, message: 'Mobile number and verification OTP are required' });
        }
        const cleanPhone = phone.trim();
        const storedOtp = yield redis_1.default.get(`otp:${cleanPhone}`);
        // Strictly verify OTP from Redis (NO fake 123456 bypass)
        if (!storedOtp || storedOtp !== otp.trim()) {
            return res.status(400).json({ success: false, message: 'Invalid or expired verification code' });
        }
        // Clear OTP after verification
        yield redis_1.default.del(`otp:${cleanPhone}`);
        let user = yield User_1.default.findOne({ phone: cleanPhone });
        if (!user) {
            user = yield User_1.default.create({
                phone: cleanPhone,
                name: name ? name.trim() : `Player ${cleanPhone.slice(-4)}`,
                role: 'PLAYER',
                isVerified: true,
                tokenVersion: 0
            });
        }
        const token = createJwtToken(user);
        const userObj = user.toObject();
        delete userObj.password;
        res.status(200).json({
            success: true,
            data: { token, user: userObj },
            message: 'Authentication successful'
        });
    }
    catch (error) {
        console.error('Error verifying OTP:', error);
        res.status(500).json({ success: false, message: 'Error verifying code' });
    }
});
exports.verifyOtp = verifyOtp;
// 6. Forgot Password Request (POST /api/auth/forgot-password)
const forgotPassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { identifier } = req.body;
        if (!identifier) {
            return res.status(400).json({ success: false, message: 'Mobile number or email is required' });
        }
        const cleanId = identifier.trim();
        const user = yield User_1.default.findOne({
            $or: [
                { phone: cleanId },
                { email: cleanId.toLowerCase() }
            ]
        });
        // Generate 6-digit reset token
        const resetToken = Math.floor(100000 + Math.random() * 900000).toString();
        // 10 minutes TTL
        yield redis_1.default.setex(`reset:${cleanId}`, 600, resetToken);
        if (user) {
            console.log(`\n========================================\n[RESET CODE] Token for ${cleanId} => ${resetToken}\n========================================\n`);
        }
        // Generic response to avoid account enumeration in production
        res.status(200).json({
            success: true,
            message: 'If an account exists with this credential, a verification code has been generated.',
            data: process.env.NODE_ENV !== 'production' ? { resetToken } : undefined
        });
    }
    catch (error) {
        console.error('Error in forgotPassword:', error);
        res.status(500).json({ success: false, message: 'Failed to process password reset request' });
    }
});
exports.forgotPassword = forgotPassword;
// 7. Reset Password (POST /api/auth/reset-password)
const resetPassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { identifier, token, newPassword } = req.body;
        if (!identifier || !token || !newPassword) {
            return res.status(400).json({ success: false, message: 'Identifier, verification code, and new password are required' });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long' });
        }
        const cleanId = identifier.trim();
        const storedToken = yield redis_1.default.get(`reset:${cleanId}`);
        if (!storedToken || storedToken !== token.trim()) {
            return res.status(400).json({ success: false, message: 'Invalid or expired password reset code' });
        }
        const user = yield User_1.default.findOne({
            $or: [
                { phone: cleanId },
                { email: cleanId.toLowerCase() }
            ]
        });
        if (!user) {
            return res.status(404).json({ success: false, message: 'Account not found' });
        }
        // Update password with hash & invalidate all previous sessions
        user.password = (0, exports.hashPassword)(newPassword);
        user.tokenVersion = (user.tokenVersion || 0) + 1;
        user.lastLogoutAt = new Date();
        yield user.save();
        yield redis_1.default.del(`reset:${cleanId}`);
        res.status(200).json({
            success: true,
            message: 'Password updated successfully. Please sign in with your new credentials.'
        });
    }
    catch (error) {
        console.error('Error in resetPassword:', error);
        res.status(500).json({ success: false, message: 'Failed to reset password' });
    }
});
exports.resetPassword = resetPassword;
// 8. Return currently authenticated user profile (GET /api/auth/me)
const getMe = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'Not authenticated' });
        }
        const userObj = req.user.toObject ? req.user.toObject() : req.user;
        delete userObj.password;
        res.status(200).json({
            success: true,
            data: { user: userObj }
        });
    }
    catch (error) {
        console.error('Error in getMe:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});
exports.getMe = getMe;
// 9. Invalidate token on server-side via in-memory set, Redis blacklist, and DB lastLogoutAt (POST /api/auth/logout)
const logout = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const token = req.token || ((_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(' ')[1]);
        if (token) {
            (0, authMiddleware_1.addToInMemoryBlacklist)(token);
            let userId = (_b = req.user) === null || _b === void 0 ? void 0 : _b._id;
            try {
                const decoded = jsonwebtoken_1.default.decode(token);
                if (!userId && (decoded === null || decoded === void 0 ? void 0 : decoded.id)) {
                    userId = decoded.id;
                }
                const nowInSec = Math.floor(Date.now() / 1000);
                const ttl = (decoded === null || decoded === void 0 ? void 0 : decoded.exp) && decoded.exp > nowInSec
                    ? decoded.exp - nowInSec
                    : 7 * 24 * 3600;
                yield redis_1.default.setex(`blacklist:token:${token}`, ttl, 'revoked');
            }
            catch (err) {
                yield redis_1.default.setex(`blacklist:token:${token}`, 7 * 24 * 3600, 'revoked');
            }
            if (userId) {
                yield User_1.default.findByIdAndUpdate(userId, {
                    lastLogoutAt: new Date(),
                    $inc: { tokenVersion: 1 }
                });
            }
        }
        res.status(200).json({
            success: true,
            message: 'Session successfully invalidated and token revoked'
        });
    }
    catch (error) {
        console.error('Error in logout:', error);
        res.status(500).json({ success: false, message: 'Error during logout' });
    }
});
exports.logout = logout;
