import mongoose, { Schema, Document } from 'mongoose';
import { ITurf } from '@turfhub/shared-types';

export interface ITurfDocument extends Omit<ITurf, '_id' | 'createdAt' | 'updatedAt'>, Document {}

const TurfSchema: Schema = new Schema({
    name: { type: String, required: true },
    description: { type: String },
    locationDetails: { type: String, required: true },
    city: { type: String, required: true },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            required: true,
            default: 'Point'
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            required: true
        }
    },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    sports: [{ type: String }],
    facilities: [{ type: String }],
    images: [{ type: String }],
    pricePerHour: { type: Number, default: 1000 },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE', 'MAINTENANCE'], default: 'ACTIVE' }
}, { timestamps: true });

// Crucial: 2dsphere index for geospatial searches
TurfSchema.index({ location: '2dsphere' });
TurfSchema.index({ city: 1 });

export default mongoose.model<ITurfDocument>('Turf', TurfSchema);
