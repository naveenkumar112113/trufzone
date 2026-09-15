import mongoose, { Schema, Document } from 'mongoose';
import { ITurfSlot } from '@turfhub/shared-types';

export interface ITurfSlotDocument extends Omit<ITurfSlot, '_id' | 'createdAt' | 'updatedAt'>, Document {}

const TurfSlotSchema: Schema = new Schema({
    turfId: { type: Schema.Types.ObjectId, ref: 'Turf', required: true },
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

export default mongoose.model<ITurfSlotDocument>('TurfSlot', TurfSlotSchema);
