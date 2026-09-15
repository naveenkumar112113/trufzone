process.env.NODE_ENV = 'test';
process.env.PORT = '5001';

import { connectDB, closeDB } from './src/config/db';
import app from './src/app';
import User from './src/models/User';
import Turf from './src/models/Turf';
import TurfSlot from './src/models/TurfSlot';
import jwt from 'jsonwebtoken';

const runTest = async () => {
    await connectDB();

    const server = app.listen(5001, () => {
        console.log('Test Server running on port 5001');
    });

    // Seed Data
    const user1 = await User.create({ name: 'User 1', phone: '1234567890', role: 'PLAYER' });
    const user2 = await User.create({ name: 'User 2', phone: '0987654321', role: 'PLAYER' });
    const owner = await User.create({ name: 'Owner', phone: '1122334455', role: 'TURF_OWNER' });
    
    const turf = await Turf.create({ 
        name: 'Test Turf', 
        locationDetails: 'City Center', 
        city: 'Tirunelveli',
        location: { type: 'Point', coordinates: [77.71, 8.71] },
        ownerId: owner._id.toString()
    });
    
    const slot = await TurfSlot.create({
        turfId: turf._id.toString(),
        startTime: new Date(),
        endTime: new Date(Date.now() + 3600000),
        price: 100,
        pricingType: 'WEEKDAY',
        status: 'AVAILABLE'
    });

    console.log(`Created Slot ID: ${slot._id}`);
    console.log('Firing simultaneous booking requests...');
    
    const token1 = jwt.sign({ userId: user1._id, role: user1.role }, process.env.JWT_SECRET || 'secret');
    const token2 = jwt.sign({ userId: user2._id, role: user2.role }, process.env.JWT_SECRET || 'secret');

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

    const [res1, res2] = await Promise.all([req1, req2]);
    const body1 = await res1.json();
    const body2 = await res2.json();

    console.log(`Request 1 Status: ${res1.status}, Response:`, body1);
    console.log(`Request 2 Status: ${res2.status}, Response:`, body2);

    if ((res1.status === 201 && res2.status === 409) || (res1.status === 409 && res2.status === 201)) {
        console.log('✅ Concurrency test PASSED! Redis lock successfully prevented double booking.');
    } else {
        console.error('❌ Concurrency test FAILED.');
    }

    server.close();
    await closeDB();
    process.exit(0);
};

runTest().catch(console.error);
