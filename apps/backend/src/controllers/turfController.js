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
exports.getAllSports = exports.getTurfSlots = exports.getTurfDetails = exports.getTurfs = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Turf_1 = __importDefault(require("../models/Turf"));
const TurfSlot_1 = __importDefault(require("../models/TurfSlot"));
// GET /api/turfs?lat=77.71&lng=8.71&radius=10000
const getTurfs = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { lat, lng, radius, sport } = req.query;
        let query = { status: 'ACTIVE' };
        // MongoDB Geospatial $near query
        if (lat && lng) {
            query.location = {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [parseFloat(lng), parseFloat(lat)]
                    },
                    $maxDistance: radius ? parseInt(radius) : 15000 // default 15km
                }
            };
        }
        if (sport) {
            query.sports = { $in: [new RegExp(sport, 'i')] };
        }
        const turfs = yield Turf_1.default.find(query).limit(50);
        res.status(200).json({ success: true, data: turfs });
    }
    catch (error) {
        console.error('Error fetching turfs:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});
exports.getTurfs = getTurfs;
// GET /api/turfs/:id
const getTurfDetails = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!mongoose_1.default.isValidObjectId(req.params.id)) {
            return res.status(404).json({ success: false, message: 'Turf not found' });
        }
        const turf = yield Turf_1.default.findById(req.params.id);
        if (!turf) {
            return res.status(404).json({ success: false, message: 'Turf not found' });
        }
        res.status(200).json({ success: true, data: turf });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});
exports.getTurfDetails = getTurfDetails;
// GET /api/turfs/:id/slots?date=YYYY-MM-DD
const getTurfSlots = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!mongoose_1.default.isValidObjectId(req.params.id)) {
            return res.status(404).json({ success: false, message: 'Turf not found' });
        }
        const { date } = req.query;
        if (!date) {
            return res.status(400).json({ success: false, message: 'Date query parameter is required' });
        }
        const startDate = new Date(date);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 1);
        const slots = yield TurfSlot_1.default.find({
            turfId: req.params.id,
            startTime: { $gte: startDate, $lt: endDate },
            status: { $in: ['AVAILABLE', 'LOCKED'] }
        }).sort({ startTime: 1 });
        res.status(200).json({ success: true, data: slots });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});
exports.getTurfSlots = getTurfSlots;
// GET /api/turfs/sports/all
const getAllSports = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const sports = yield Turf_1.default.distinct('sports', { status: 'ACTIVE' });
        const cleanSports = sports.filter(Boolean);
        res.status(200).json({ success: true, data: cleanSports });
    }
    catch (error) {
        console.error('getAllSports error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch sports' });
    }
});
exports.getAllSports = getAllSports;
