import mongoose, { Schema, Document } from 'mongoose';
import { IBooking } from '@turfhub/shared-types';

export interface IBookingDocument extends Omit<IBooking, '_id' | 'createdAt' | 'updatedAt'>, Document {}

const BookingSchema: Schema = new Schema({
    bookingId: { type: String, required: true, unique: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    turfId: { type: Schema.Types.ObjectId, ref: 'Turf', required: true },
    slotId: { type: Schema.Types.ObjectId, ref: 'TurfSlot', required: true },
    paymentStatus: { type: String, enum: ['PENDING', 'PROCESSING', 'SUCCESS', 'FAILED', 'REFUNDED'], default: 'PENDING' },
    status: { type: String, enum: ['PAYMENT_PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'EXPIRED', 'REFUNDED'], default: 'PAYMENT_PENDING' },
    paymentTransactionId: { type: String },
    qrHash: { type: String }
}, { timestamps: true });

BookingSchema.index({ userId: 1 });
BookingSchema.index({ turfId: 1, status: 1 });

export default mongoose.model<IBookingDocument>('Booking', BookingSchema);
