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
const RegisteredTeamSchema = new mongoose_1.Schema({
    teamName: { type: String, required: true },
    captainName: { type: String, required: true },
    captainPhone: { type: String, required: true },
    membersCount: { type: Number, default: 7 },
    registeredAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['PENDING', 'CONFIRMED', 'APPROVED', 'REJECTED'], default: 'CONFIRMED' }
});
const TournamentSchema = new mongoose_1.Schema({
    title: { type: String, required: true },
    sport: { type: String, default: 'Football 7v7' },
    venue: { type: String, default: 'ABC Football Arena' },
    date: { type: String, required: true },
    teamsLimit: { type: Number, default: 16 },
    registeredCount: { type: Number, default: 0 },
    registeredTeams: { type: [RegisteredTeamSchema], default: [] },
    organizerId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    entryFee: { type: Number, default: 2000 },
    prizePool: { type: String, default: '₹50,000 + Trophy' },
    status: { type: String, enum: ['REGISTRATION OPEN', 'IN PROGRESS', 'COMPLETED'], default: 'REGISTRATION OPEN' },
    image: { type: String, default: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80' }
}, { timestamps: true });
exports.default = mongoose_1.default.model('Tournament', TournamentSchema);
