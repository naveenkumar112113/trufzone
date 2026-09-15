import express from 'express';
import cors from 'cors';
import bookingRoutes from './routes/bookingRoutes';
import authRoutes from './routes/authRoutes';
import turfRoutes from './routes/turfRoutes';
import ownerRoutes from './routes/ownerRoutes';

const app = express();

app.use(cors());
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

