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
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
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
