import mongoose, { Schema, Document } from 'mongoose';

export interface IReview extends Document {
  turfId: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  authorName: string;
  turfName: string;
  sport: string;
  rating: number;
  date: string;
  comment: string;
  helpfulCount: number;
  reply?: {
    author: string;
    date: string;
    text: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>({
  turfId: { type: Schema.Types.ObjectId, ref: 'Turf', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  authorName: { type: String, required: true },
  turfName: { type: String, required: true },
  sport: { type: String, default: 'Football' },
  rating: { type: Number, required: true, min: 1, max: 5 },
  date: { type: String, default: 'Recently' },
  comment: { type: String, required: true },
  helpfulCount: { type: Number, default: 0 },
  reply: {
    author: { type: String },
    date: { type: String },
    text: { type: String }
  }
}, { timestamps: true });

export default mongoose.model<IReview>('Review', ReviewSchema);
