import mongoose, { Schema, Document } from 'mongoose';

export interface IOffer extends Document {
  code: string;
  discount: string;
  turf: string;
  validHours: string;
  validUntil: string;
  status: 'ACTIVE' | 'EXPIRED' | 'PAUSED';
  redemptions: number;
  createdAt: Date;
  updatedAt: Date;
}

const OfferSchema = new Schema<IOffer>({
  code: { type: String, required: true, uppercase: true, unique: true },
  discount: { type: String, required: true },
  turf: { type: String, default: 'All Turfs in Portfolio' },
  validHours: { type: String, default: '12:00 PM – 4:00 PM (Off-Peak)' },
  validUntil: { type: String, default: '30 Sep 2026' },
  status: { type: String, enum: ['ACTIVE', 'EXPIRED', 'PAUSED'], default: 'ACTIVE' },
  redemptions: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model<IOffer>('Offer', OfferSchema);
