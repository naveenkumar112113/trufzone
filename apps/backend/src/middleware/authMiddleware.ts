import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import redis from '../config/redis';

export interface AuthRequest extends Request {
    user?: any;
    token?: string;
}

// In-memory blacklist for immediate cross-request revocation even if Redis has latency or is offline
const inMemoryRevokedTokens = new Set<string>();

export const addToInMemoryBlacklist = (token: string) => {
    if (token) {
        inMemoryRevokedTokens.add(token);
    }
};

export const requireAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
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
            const isBlacklisted = await redis.get(`blacklist:token:${token}`);
            if (isBlacklisted) {
                inMemoryRevokedTokens.add(token);
                return res.status(401).json({ success: false, message: 'Unauthorized - Token has been revoked / logged out' });
            }
        } catch (redisErr) {
            console.warn('Redis blacklist check error:', redisErr);
        }

        const secret = process.env.JWT_SECRET || 'fallback_secret_for_dev_only';
        const decoded = jwt.verify(token, secret) as { id: string; role: string; iat?: number; tokenVersion?: number };

        const user = await User.findById(decoded.id);
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
    } catch (error: any) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ success: false, message: 'Unauthorized - Token expired' });
        }
        return res.status(401).json({ success: false, message: 'Unauthorized - Invalid token' });
    }
};

export const requireRole = (roles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'Unauthorized - Authentication required' });
        }

        const userRole = req.user.role?.toUpperCase();

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

