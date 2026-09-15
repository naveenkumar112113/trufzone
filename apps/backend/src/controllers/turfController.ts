import mongoose from 'mongoose';
import { Request, Response } from 'express';
import Turf from '../models/Turf';
import TurfSlot from '../models/TurfSlot';

// GET /api/turfs?lat=77.71&lng=8.71&radius=10000
export const getTurfs = async (req: Request, res: Response) => {
    try {
        const { lat, lng, radius, sport } = req.query;
        let query: any = { status: 'ACTIVE' };

        // MongoDB Geospatial $near query
        if (lat && lng) {
            query.location = {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [parseFloat(lng as string), parseFloat(lat as string)]
                    },
                    $maxDistance: radius ? parseInt(radius as string) : 15000 // default 15km
                }
            };
        }

        if (sport) {
            query.sports = { $in: [new RegExp(sport as string, 'i')] };
        }

        const turfs = await Turf.find(query).limit(50);
        res.status(200).json({ success: true, data: turfs });
    } catch (error) {
        console.error('Error fetching turfs:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// GET /api/turfs/:id
export const getTurfDetails = async (req: Request, res: Response) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(404).json({ success: false, message: 'Turf not found' });
        }
        const turf = await Turf.findById(req.params.id);
        if (!turf) {
            return res.status(404).json({ success: false, message: 'Turf not found' });
        }
        res.status(200).json({ success: true, data: turf });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// GET /api/turfs/:id/slots?date=YYYY-MM-DD
export const getTurfSlots = async (req: Request, res: Response) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(404).json({ success: false, message: 'Turf not found' });
        }
        const { date } = req.query;
        if (!date) {
            return res.status(400).json({ success: false, message: 'Date query parameter is required' });
        }

        const startDate = new Date(date as string);
        startDate.setHours(0, 0, 0, 0);
        
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 1);

        const slots = await TurfSlot.find({
            turfId: req.params.id,
            startTime: { $gte: startDate, $lt: endDate },
            status: { $in: ['AVAILABLE', 'LOCKED'] }
        }).sort({ startTime: 1 });

        res.status(200).json({ success: true, data: slots });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// GET /api/turfs/sports/all
export const getAllSports = async (req: Request, res: Response) => {
    try {
        const sports = await Turf.distinct('sports', { status: 'ACTIVE' });
        const cleanSports = sports.filter(Boolean);
        res.status(200).json({ success: true, data: cleanSports });
    } catch (error) {
        console.error('getAllSports error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch sports' });
    }
};
