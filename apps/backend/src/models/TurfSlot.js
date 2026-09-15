"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const TurfSlotSchema = new mongoose_1.Schema({
    turfId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Turf', required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    price: { type: Number, required: true },
    pricingType: { type: String, enum: ['WEEKDAY', 'WEEKEND', 'PEAK', 'HOLIDAY'], default: 'WEEKDAY' },
    status: { type: String, enum: ['AVAILABLE', 'LOCKED', 'BOOKED', 'BLOCKED'], default: 'AVAILABLE' },
    lockExpiresAt: { type: Date }
}, { timestamps: true });
// Indexes to quickly find available slots for a turf on a specific day
TurfSlotSchema.index({ turfId: 1, startTime: 1, status: 1 });
// Index for automatic lock expiration in DB (TTL index as backup to Redis)
TurfSlotSchema.index({ lockExpiresAt: 1 }, { expireAfterSeconds: 0, partialFilterExpression: { status: 'LOCKED' } });
exports.default = mongoose_1.default.model('TurfSlot', TurfSlotSchema);
