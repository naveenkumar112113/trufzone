"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const bookingRoutes_1 = __importDefault(require("./routes/bookingRoutes"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const turfRoutes_1 = __importDefault(require("./routes/turfRoutes"));
const ownerRoutes_1 = __importDefault(require("./routes/ownerRoutes"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app = (0, express_1.default)();

const configuredOrigins = [
    process.env.FRONTEND_URL,
    process.env.CLIENT_URL,
    ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : []),
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5173',
]
    .filter(Boolean)
    .map((origin) => origin.trim().replace(/\/+$/, ''));

const corsOptions = {
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        const normalizedOrigin = origin.trim().replace(/\/+$/, '');
        if (configuredOrigins.includes(normalizedOrigin)) return callback(null, true);
        try {
            const parsed = new URL(normalizedOrigin);
            if (parsed.hostname.endsWith('.vercel.app')) return callback(null, true);
        } catch {}
        if (process.env.NODE_ENV !== 'production') return callback(null, true);
        console.warn(`[CORS Blocked] Origin not allowed: ${origin}`);
        return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
    optionsSuccessStatus: 200,
};

app.use((0, cors_1.default)(corsOptions));
app.use(express_1.default.json());
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
app.use('/api/bookings', bookingRoutes_1.default);
app.use('/api/auth', authRoutes_1.default);
app.use('/api/turfs', turfRoutes_1.default);
app.use('/api/owner', ownerRoutes_1.default);
exports.default = app;
