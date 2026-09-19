import express from 'express';
import cors, { CorsOptions } from 'cors';
import dotenv from 'dotenv';

// Ensure environment variables are loaded
dotenv.config();

import bookingRoutes from './routes/bookingRoutes';
import authRoutes from './routes/authRoutes';
import turfRoutes from './routes/turfRoutes';
import ownerRoutes from './routes/ownerRoutes';

const app = express();

// Parse and normalize allowed origins from environment variables
const configuredOrigins = [
    process.env.FRONTEND_URL,
    process.env.CLIENT_URL,
    ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : []),
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5173',
]
    .filter(Boolean)
    .map((origin) => origin!.trim().replace(/\/+$/, ''));

const corsOptions: CorsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
        if (!origin) {
            return callback(null, true);
        }

        const normalizedOrigin = origin.trim().replace(/\/+$/, '');

        // Check if origin matches allowed origins list
        if (configuredOrigins.includes(normalizedOrigin)) {
            return callback(null, true);
        }

        // Allow any Vercel deployment (*.vercel.app) including preview URLs
        try {
            const parsed = new URL(normalizedOrigin);
            if (parsed.hostname.endsWith('.vercel.app')) {
                return callback(null, true);
            }
        } catch {
            // Invalid origin URL format
        }

        // In non-production environments, permit all origins for convenience
        if (process.env.NODE_ENV !== 'production') {
            return callback(null, true);
        }

        console.warn(`[CORS Blocked] Origin not allowed: ${origin}`);
        return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'Authorization',
    ],
    optionsSuccessStatus: 200,
};

// Enable CORS with preflight handling for all routes
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());

// Prevent browser and proxy caching of sensitive API responses (bfcache / back button security)
app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
    next();
});

app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date() });
});

app.use('/api/bookings', bookingRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/turfs', turfRoutes);
app.use('/api/owner', ownerRoutes);

export default app;

