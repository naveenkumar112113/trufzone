"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
process.env.NODE_ENV = 'test';
process.env.PORT = '5001';
const db_1 = require("./src/config/db");
const app_1 = __importDefault(require("./src/app"));
const User_1 = __importDefault(require("./src/models/User"));
const Turf_1 = __importDefault(require("./src/models/Turf"));
const TurfSlot_1 = __importDefault(require("./src/models/TurfSlot"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const runTest = () => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, db_1.connectDB)();
    const server = app_1.default.listen(5001, () => {
        console.log('Test Server running on port 5001');
    });
    // Seed Data
    const user1 = yield User_1.default.create({ name: 'User 1', phone: '1234567890', role: 'PLAYER' });
    const user2 = yield User_1.default.create({ name: 'User 2', phone: '0987654321', role: 'PLAYER' });
    const owner = yield User_1.default.create({ name: 'Owner', phone: '1122334455', role: 'TURF_OWNER' });
    const turf = yield Turf_1.default.create({
        name: 'Test Turf',
        locationDetails: 'City Center',
        city: 'Tirunelveli',
        location: { type: 'Point', coordinates: [77.71, 8.71] },
        ownerId: owner._id.toString()
    });
    const slot = yield TurfSlot_1.default.create({
        turfId: turf._id.toString(),
        startTime: new Date(),
        endTime: new Date(Date.now() + 3600000),
        price: 100,
        pricingType: 'WEEKDAY',
        status: 'AVAILABLE'
    });
    console.log(`Created Slot ID: ${slot._id}`);
    console.log('Firing simultaneous booking requests...');
    const token1 = jsonwebtoken_1.default.sign({ userId: user1._id, role: user1.role }, process.env.JWT_SECRET || 'secret');
    const token2 = jsonwebtoken_1.default.sign({ userId: user2._id, role: user2.role }, process.env.JWT_SECRET || 'secret');
    const req1 = fetch('http://localhost:5001/api/bookings/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token1}` },
        body: JSON.stringify({ slotId: slot._id })
    });
    const req2 = fetch('http://localhost:5001/api/bookings/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token2}` },
        body: JSON.stringify({ slotId: slot._id })
    });
    const [res1, res2] = yield Promise.all([req1, req2]);
    const body1 = yield res1.json();
    const body2 = yield res2.json();
    console.log(`Request 1 Status: ${res1.status}, Response:`, body1);
    console.log(`Request 2 Status: ${res2.status}, Response:`, body2);
    if ((res1.status === 201 && res2.status === 409) || (res1.status === 409 && res2.status === 201)) {
        console.log('✅ Concurrency test PASSED! Redis lock successfully prevented double booking.');
    }
    else {
        console.error('❌ Concurrency test FAILED.');
    }
    server.close();
    yield (0, db_1.closeDB)();
    process.exit(0);
});
runTest().catch(console.error);
