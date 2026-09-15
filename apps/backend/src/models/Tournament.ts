import mongoose, { Schema, Document } from 'mongoose';

export interface IRegisteredTeamItem {
  _id?: string;
  teamName: string;
  captainName: string;
  captainPhone: string;
  membersCount?: number;
  registeredAt: Date;
  status: 'PENDING' | 'CONFIRMED' | 'APPROVED' | 'REJECTED';
}

export interface ITournament extends Document {
  title: string;
  sport: string;
  venue: string;
  date: string;
  teamsLimit: number;
  registeredCount: number;
  registeredTeams: IRegisteredTeamItem[];
  organizerId?: mongoose.Types.ObjectId;
  entryFee: number;
  prizePool: string;
  status: 'REGISTRATION OPEN' | 'IN PROGRESS' | 'COMPLETED';
  image: string;
  createdAt: Date;
  updatedAt: Date;
}

const RegisteredTeamSchema = new Schema({
  teamName: { type: String, required: true },
  captainName: { type: String, required: true },
  captainPhone: { type: String, required: true },
  membersCount: { type: Number, default: 7 },
  registeredAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['PENDING', 'CONFIRMED', 'APPROVED', 'REJECTED'], default: 'CONFIRMED' }
});

const TournamentSchema = new Schema<ITournament>({
  title: { type: String, required: true },
  sport: { type: String, default: 'Football 7v7' },
  venue: { type: String, default: 'ABC Football Arena' },
  date: { type: String, required: true },
  teamsLimit: { type: Number, default: 16 },
  registeredCount: { type: Number, default: 0 },
  registeredTeams: { type: [RegisteredTeamSchema], default: [] },
  organizerId: { type: Schema.Types.ObjectId, ref: 'User' },
  entryFee: { type: Number, default: 2000 },
  prizePool: { type: String, default: '₹50,000 + Trophy' },
  status: { type: String, enum: ['REGISTRATION OPEN', 'IN PROGRESS', 'COMPLETED'], default: 'REGISTRATION OPEN' },
  image: { type: String, default: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80' }
}, { timestamps: true });

export default mongoose.model<ITournament>('Tournament', TournamentSchema);
