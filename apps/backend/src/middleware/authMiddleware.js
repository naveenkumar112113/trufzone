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
exports.requireRole = exports.requireAuth = exports.addToInMemoryBlacklist = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
const redis_1 = __importDefault(require("../config/redis"));
// In-memory blacklist for immediate cross-request revocation even if Redis has latency or is offline
const inMemoryRevokedTokens = new Set();
const addToInMemoryBlacklist = (token) => {
    if (token) {
        inMemoryRevokedTokens.add(token);
    }
};
exports.addToInMemoryBlacklist = addToInMemoryBlacklist;
const requireAuth = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, message: 'Unauthorized - No token provided' });
        }
        const token = authHeader.split(' ')[1];
        if (!token || token.trim() === '') {
            return res.status(401).json({ success: false, message: 'Unauthorized - Empty token' });
        }
        // 1. Fast in-memory check
        if (inMemoryRevokedTokens.has(token)) {
            return res.status(401).json({ success: false, message: 'Unauthorized - Token has been revoked / logged out' });
        }
        // 2. Redis distributed blacklist check
        try {
            const isBlacklisted = yield redis_1.default.get(`blacklist:token:${token}`);
            if (isBlacklisted) {
                inMemoryRevokedTokens.add(token);
                return res.status(401).json({ success: false, message: 'Unauthorized - Token has been revoked / logged out' });
            }
        }
        catch (redisErr) {
            console.warn('Redis blacklist check error:', redisErr);
        }
        const secret = process.env.JWT_SECRET || 'fallback_secret_for_dev_only';
        const decoded = jsonwebtoken_1.default.verify(token, secret);
        const user = yield User_1.default.findById(decoded.id);
        if (!user) {
            return res.status(401).json({ success: false, message: 'Unauthorized - User not found or inactive' });
        }
        // 3. Database session invalidation check via lastLogoutAt
        if (user.lastLogoutAt && decoded.iat) {
            const tokenIssuedAtMs = decoded.iat * 1000;
            const lastLogoutMs = new Date(user.lastLogoutAt).getTime();
            // Allow 1 second clock leeway
            if (tokenIssuedAtMs < (lastLogoutMs - 1000)) {
                inMemoryRevokedTokens.add(token);
                return res.status(401).json({ success: false, message: 'Unauthorized - Session has been terminated / logged out' });
            }
        }
        // 4. Token version invalidation check
        if (decoded.tokenVersion !== undefined && user.tokenVersion !== undefined) {
            if (decoded.tokenVersion < user.tokenVersion) {
                inMemoryRevokedTokens.add(token);
                return res.status(401).json({ success: false, message: 'Unauthorized - Session token expired by logout' });
            }
        }
        req.user = user;
        req.token = token;
        next();
    }
    catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ success: false, message: 'Unauthorized - Token expired' });
        }
        return res.status(401).json({ success: false, message: 'Unauthorized - Invalid token' });
    }
});
exports.requireAuth = requireAuth;
const requireRole = (roles) => {
    return (req, res, next) => {
        var _a;
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'Unauthorized - Authentication required' });
        }
        const userRole = (_a = req.user.role) === null || _a === void 0 ? void 0 : _a.toUpperCase();
        // Admins always have access
        if (userRole === 'ADMIN') {
            return next();
        }
        const normalizedRoles = roles.map(r => r.toUpperCase());
        // Treat TURF_OWNER and TURF_ADMIN interchangeably
        const isOwnerRole = userRole === 'TURF_OWNER' || userRole === 'TURF_ADMIN';
        const acceptsOwner = normalizedRoles.includes('TURF_OWNER') || normalizedRoles.includes('TURF_ADMIN');
        if (normalizedRoles.includes(userRole) || (isOwnerRole && acceptsOwner)) {
            return next();
        }
        return res.status(403).json({
            success: false,
            message: `Forbidden - Requires role in [${roles.join(', ')}]. Current role: ${userRole}`
        });
    };
};
exports.requireRole = requireRole;
