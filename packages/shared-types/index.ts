export interface IUser {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  password?: string;
  googleId?: string;
  avatar?: string;
  role: 'PLAYER' | 'TURF_OWNER' | 'TURF_ADMIN' | 'ADMIN' | 'ADVERTISER' | 'STAFF';
  isVerified: boolean;
  lastLogoutAt?: Date;
  tokenVersion?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IRegisteredTeam {
  _id?: string;
  teamName: string;
  captainName: string;
  captainPhone: string;
  membersCount?: number;
  registeredAt: Date;
  status: 'PENDING' | 'CONFIRMED' | 'REJECTED';
}

export interface ITournament {
  _id: string;
  title: string;
  sport: string;
  venue: string;
  date: string;
  teamsLimit: number;
  registeredCount: number;
  registeredTeams?: IRegisteredTeam[];
  organizerId?: string;
  entryFee: number;
  prizePool: string;
  status: 'REGISTRATION OPEN' | 'IN PROGRESS' | 'COMPLETED';
  image: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ILocation {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

export interface ITurf {
  _id: string;
  name: string;
  description?: string;
  locationDetails: string;
  city: string;
  location: ILocation;
  ownerId: string;
  sports: string[];
  facilities: string[];
  images: string[];
  pricePerHour?: number;
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
  createdAt: Date;
  updatedAt: Date;
}

export interface ITurfSlot {
  _id: string;
  turfId: string;
  startTime: Date;
  endTime: Date;
  price: number;
  pricingType: 'WEEKDAY' | 'WEEKEND' | 'PEAK' | 'HOLIDAY';
  status: 'AVAILABLE' | 'LOCKED' | 'BOOKED' | 'BLOCKED';
  lockExpiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IBooking {
  _id: string;
  bookingId: string;
  userId: string;
  turfId: string;
  slotId: string;
  paymentStatus: 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';
  status: 'PAYMENT_PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'EXPIRED' | 'REFUNDED';
  paymentTransactionId?: string;
  qrHash?: string;
  createdAt: Date;
  updatedAt: Date;
}

