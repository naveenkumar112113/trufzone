import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from '@turfhub/shared-types';

export interface IUserDocument extends Omit<IUser, '_id' | 'createdAt' | 'updatedAt'>, Document {
    password?: string;
    googleId?: string;
    avatar?: string;
    resetPasswordToken?: string;
    resetPasswordExpires?: Date;
    lastLogoutAt?: Date;
    tokenVersion: number;
}

const UserSchema: Schema = new Schema({
    name: { type: String, required: true },
    phone: { type: String, sparse: true },
    email: { type: String, sparse: true },
    password: { type: String },
    googleId: { type: String, sparse: true },
    avatar: { type: String },
    role: { type: String, enum: ['PLAYER', 'TURF_OWNER', 'TURF_ADMIN', 'ADMIN', 'ADVERTISER', 'STAFF'], default: 'PLAYER' },
    isVerified: { type: Boolean, default: false },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
    lastLogoutAt: { type: Date },
    tokenVersion: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model<IUserDocument>('User', UserSchema);

