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
const axios_1 = __importDefault(require("axios"));
const BASE_URL = 'http://localhost:5000/api';
const results = [];
function assert(condition, name, details) {
    if (condition) {
        results.push({ name, passed: true, details });
        console.log(`✅ PASS: ${name}`);
    }
    else {
        results.push({ name, passed: false, details });
        console.error(`❌ FAIL: ${name} — ${details || ''}`);
    }
}
function runTests() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10, _11, _12, _13, _14, _15, _16, _17, _18, _19, _20, _21, _22, _23, _24, _25, _26, _27, _28, _29, _30, _31, _32, _33, _34, _35, _36, _37, _38, _39, _40, _41, _42, _43, _44, _45, _46, _47, _48, _49, _50, _51, _52, _53, _54, _55, _56, _57, _58, _59, _60, _61, _62, _63, _64, _65, _66, _67, _68, _69, _70, _71;
        console.log('\n======================================================');
        console.log('TURFZONE COMPREHENSIVE PRODUCTION VERIFICATION SUITE');
        console.log('======================================================\n');
        // Test 1: Unauthenticated request to protected owner route must return 401
        try {
            yield axios_1.default.get(`${BASE_URL}/owner/turfs`);
            assert(false, 'Unauthenticated request to /api/owner/turfs must return 401', 'Got 200 instead of 401');
        }
        catch (err) {
            assert(((_a = err.response) === null || _a === void 0 ? void 0 : _a.status) === 401, 'Unauthenticated request to /api/owner/turfs returns 401', `Status: ${(_b = err.response) === null || _b === void 0 ? void 0 : _b.status}`);
        }
        // Test 2: Unauthenticated request to /api/bookings/my-bookings must return 401
        try {
            yield axios_1.default.get(`${BASE_URL}/bookings/my-bookings`);
            assert(false, 'Unauthenticated request to /api/bookings/my-bookings must return 401', 'Got 200 instead of 401');
        }
        catch (err) {
            assert(((_c = err.response) === null || _c === void 0 ? void 0 : _c.status) === 401, 'Unauthenticated request to /api/bookings/my-bookings returns 401', `Status: ${(_d = err.response) === null || _d === void 0 ? void 0 : _d.status}`);
        }
        // Test 3: Public turfs endpoint must work without authentication
        let publicTurfId = '';
        try {
            const publicRes = yield axios_1.default.get(`${BASE_URL}/turfs`);
            assert(publicRes.status === 200 && Array.isArray((_e = publicRes.data) === null || _e === void 0 ? void 0 : _e.data) && publicRes.data.data.length > 0, 'Public endpoint /api/turfs accessible without token', `Returned ${(_g = (_f = publicRes.data) === null || _f === void 0 ? void 0 : _f.data) === null || _g === void 0 ? void 0 : _g.length} turfs`);
            publicTurfId = publicRes.data.data[0]._id;
        }
        catch (err) {
            assert(false, 'Public endpoint /api/turfs accessible without token', err.message);
        }
        // Test 4: Production Signup with Role Security (Prevent SUPER_ADMIN privilege escalation)
        const testPhone = '99' + Math.floor(10000000 + Math.random() * 89999999);
        let playerToken = '';
        try {
            const signupRes = yield axios_1.default.post(`${BASE_URL}/auth/register`, {
                name: 'Priya Sharma',
                phone: testPhone,
                email: `priya_${Date.now()}@gmail.com`,
                password: 'password123',
                role: 'SUPER_ADMIN', // Attacker attempt to escalate to SUPER_ADMIN
            });
            playerToken = (_j = (_h = signupRes.data) === null || _h === void 0 ? void 0 : _h.data) === null || _j === void 0 ? void 0 : _j.token;
            const userRole = (_m = (_l = (_k = signupRes.data) === null || _k === void 0 ? void 0 : _k.data) === null || _l === void 0 ? void 0 : _l.user) === null || _m === void 0 ? void 0 : _m.role;
            assert(signupRes.status === 201 && Boolean(playerToken) && userRole === 'PLAYER', 'Public registration enforces PLAYER role and rejects role escalation', `Assigned Role: ${userRole}`);
        }
        catch (err) {
            assert(false, 'Public registration enforces PLAYER role', ((_p = (_o = err.response) === null || _o === void 0 ? void 0 : _o.data) === null || _p === void 0 ? void 0 : _p.message) || err.message);
        }
        // Test 5: Prevent duplicate phone registration
        try {
            yield axios_1.default.post(`${BASE_URL}/auth/register`, {
                name: 'Duplicate Player',
                phone: testPhone,
                password: 'password123',
            });
            assert(false, 'Duplicate mobile number registration must return 409/400', 'Registration succeeded with duplicate phone!');
        }
        catch (err) {
            assert(((_q = err.response) === null || _q === void 0 ? void 0 : _q.status) === 409 || ((_r = err.response) === null || _r === void 0 ? void 0 : _r.status) === 400, 'Duplicate mobile registration rejected with 409 Conflict', (_t = (_s = err.response) === null || _s === void 0 ? void 0 : _s.data) === null || _t === void 0 ? void 0 : _t.message);
        }
        // Test 6: Production Password Login for Player
        try {
            const loginRes = yield axios_1.default.post(`${BASE_URL}/auth/login`, {
                identifier: testPhone,
                password: 'password123',
            });
            assert(loginRes.status === 200 && Boolean((_v = (_u = loginRes.data) === null || _u === void 0 ? void 0 : _u.data) === null || _v === void 0 ? void 0 : _v.token), 'Player login with mobile number and password succeeds', `User: ${(_y = (_x = (_w = loginRes.data) === null || _w === void 0 ? void 0 : _w.data) === null || _x === void 0 ? void 0 : _x.user) === null || _y === void 0 ? void 0 : _y.name}`);
        }
        catch (err) {
            assert(false, 'Player login with mobile number and password succeeds', err.message);
        }
        // Test 7: Wrong password rejected with 401
        try {
            yield axios_1.default.post(`${BASE_URL}/auth/login`, {
                identifier: testPhone,
                password: 'wrongpassword',
            });
            assert(false, 'Login with incorrect password must return 401', 'Login succeeded with wrong password!');
        }
        catch (err) {
            assert(((_z = err.response) === null || _z === void 0 ? void 0 : _z.status) === 401, 'Login with incorrect password rejected with 401', (_1 = (_0 = err.response) === null || _0 === void 0 ? void 0 : _0.data) === null || _1 === void 0 ? void 0 : _1.message);
        }
        // Test 8: Forgot Password Token Generation
        let resetToken = '';
        try {
            const forgotRes = yield axios_1.default.post(`${BASE_URL}/auth/forgot-password`, {
                identifier: testPhone,
            });
            resetToken = (_3 = (_2 = forgotRes.data) === null || _2 === void 0 ? void 0 : _2.data) === null || _3 === void 0 ? void 0 : _3.resetToken;
            assert(forgotRes.status === 200 && Boolean(resetToken), 'Forgot password generates valid single-use reset token', `Reset Token: ${resetToken}`);
        }
        catch (err) {
            assert(false, 'Forgot password generates valid reset token', err.message);
        }
        // Test 9: Reset Password with Token
        try {
            const resetRes = yield axios_1.default.post(`${BASE_URL}/auth/reset-password`, {
                identifier: testPhone,
                token: resetToken,
                newPassword: 'newpassword123',
            });
            assert(resetRes.status === 200 && ((_4 = resetRes.data) === null || _4 === void 0 ? void 0 : _4.success), 'Reset password updates password using valid token', (_5 = resetRes.data) === null || _5 === void 0 ? void 0 : _5.message);
            // Verify login with new password
            const newLoginRes = yield axios_1.default.post(`${BASE_URL}/auth/login`, {
                identifier: testPhone,
                password: 'newpassword123',
            });
            playerToken = (_7 = (_6 = newLoginRes.data) === null || _6 === void 0 ? void 0 : _6.data) === null || _7 === void 0 ? void 0 : _7.token;
            assert(newLoginRes.status === 200 && Boolean(playerToken), 'Login with updated password succeeds', `User: ${(_10 = (_9 = (_8 = newLoginRes.data) === null || _8 === void 0 ? void 0 : _8.data) === null || _9 === void 0 ? void 0 : _9.user) === null || _10 === void 0 ? void 0 : _10.name}`);
        }
        catch (err) {
            assert(false, 'Reset password updates password using valid token', err.message);
        }
        // Test 10: Google OAuth Endpoint Verification
        try {
            const googleRes = yield axios_1.default.post(`${BASE_URL}/auth/google`, {
                googleId: 'google-uid-' + Date.now(),
                email: `googleuser_${Date.now()}@gmail.com`,
                name: 'Google Player',
                avatar: 'https://lh3.googleusercontent.com/a/test',
            });
            assert(googleRes.status === 200 && Boolean((_12 = (_11 = googleRes.data) === null || _11 === void 0 ? void 0 : _11.data) === null || _12 === void 0 ? void 0 : _12.token) && ((_15 = (_14 = (_13 = googleRes.data) === null || _13 === void 0 ? void 0 : _13.data) === null || _14 === void 0 ? void 0 : _14.user) === null || _15 === void 0 ? void 0 : _15.role) === 'PLAYER', 'Google authentication establishes normal session with correct PLAYER role', `Google User: ${(_18 = (_17 = (_16 = googleRes.data) === null || _16 === void 0 ? void 0 : _16.data) === null || _17 === void 0 ? void 0 : _17.user) === null || _18 === void 0 ? void 0 : _18.name}`);
        }
        catch (err) {
            assert(false, 'Google authentication establishes normal session', err.message);
        }
        // Test 11: Production Login for Turf Owner (John Doe - 9443182940)
        let ownerToken = '';
        try {
            const ownerLoginRes = yield axios_1.default.post(`${BASE_URL}/auth/login`, {
                identifier: '9443182940',
                password: 'password123',
            });
            ownerToken = (_20 = (_19 = ownerLoginRes.data) === null || _19 === void 0 ? void 0 : _19.data) === null || _20 === void 0 ? void 0 : _20.token;
            assert(ownerLoginRes.status === 200 && Boolean(ownerToken) && (((_23 = (_22 = (_21 = ownerLoginRes.data) === null || _21 === void 0 ? void 0 : _21.data) === null || _22 === void 0 ? void 0 : _22.user) === null || _23 === void 0 ? void 0 : _23.role) === 'TURF_OWNER' || ((_26 = (_25 = (_24 = ownerLoginRes.data) === null || _24 === void 0 ? void 0 : _24.data) === null || _25 === void 0 ? void 0 : _25.user) === null || _26 === void 0 ? void 0 : _26.role) === 'TURF_ADMIN'), 'Turf Owner production login with password succeeds', `Owner: ${(_29 = (_28 = (_27 = ownerLoginRes.data) === null || _27 === void 0 ? void 0 : _27.data) === null || _28 === void 0 ? void 0 : _28.user) === null || _29 === void 0 ? void 0 : _29.name}`);
        }
        catch (err) {
            assert(false, 'Turf Owner production login with password succeeds', err.message);
        }
        // Test 12: Production Login for Staff (Karthik R - 9842100001)
        let staffToken = '';
        try {
            const staffLoginRes = yield axios_1.default.post(`${BASE_URL}/auth/login`, {
                identifier: '9842100001',
                password: 'password123',
            });
            staffToken = (_31 = (_30 = staffLoginRes.data) === null || _30 === void 0 ? void 0 : _30.data) === null || _31 === void 0 ? void 0 : _31.token;
            assert(staffLoginRes.status === 200 && Boolean(staffToken) && ((_34 = (_33 = (_32 = staffLoginRes.data) === null || _32 === void 0 ? void 0 : _32.data) === null || _33 === void 0 ? void 0 : _33.user) === null || _34 === void 0 ? void 0 : _34.role) === 'STAFF', 'Staff production login with password succeeds', `Staff: ${(_37 = (_36 = (_35 = staffLoginRes.data) === null || _35 === void 0 ? void 0 : _35.data) === null || _36 === void 0 ? void 0 : _36.user) === null || _37 === void 0 ? void 0 : _37.name}`);
        }
        catch (err) {
            assert(false, 'Staff production login with password succeeds', err.message);
        }
        // Test 13: RBAC Isolation: Staff is forbidden from financial reports (403)
        try {
            yield axios_1.default.get(`${BASE_URL}/owner/reports`, {
                headers: { Authorization: `Bearer ${staffToken}` },
            });
            assert(false, 'Staff accessing /api/owner/reports must return 403 Forbidden', 'Staff received 200 on financial reports!');
        }
        catch (err) {
            assert(((_38 = err.response) === null || _38 === void 0 ? void 0 : _38.status) === 403, 'Staff accessing /api/owner/reports returns 403 Forbidden', `Status: ${(_39 = err.response) === null || _39 === void 0 ? void 0 : _39.status}`);
        }
        // Test 14: Owner accessing /api/owner/turfs returns their venues
        try {
            const ownerTurfsRes = yield axios_1.default.get(`${BASE_URL}/owner/turfs`, {
                headers: { Authorization: `Bearer ${ownerToken}` },
            });
            assert(ownerTurfsRes.status === 200 && Array.isArray((_40 = ownerTurfsRes.data) === null || _40 === void 0 ? void 0 : _40.data), 'Turf Owner calling /api/owner/turfs returns authorized owner turfs', `Count: ${(_42 = (_41 = ownerTurfsRes.data) === null || _41 === void 0 ? void 0 : _41.data) === null || _42 === void 0 ? void 0 : _42.length} turfs`);
        }
        catch (err) {
            assert(false, 'Turf Owner calling /api/owner/turfs returns authorized owner turfs', err.message);
        }
        // Test 15: Public Turf Booking — Status 201 Created with Structured Confirmation
        const testSlotTime = '6:00 PM – 7:00 PM';
        const testBookingDate = `2026-11-${String(Math.floor(10 + Math.random() * 18)).padStart(2, '0')}`;
        try {
            const bookingRes = yield axios_1.default.post(`${BASE_URL}/bookings/public`, {
                turfId: publicTurfId,
                customerName: 'Kavitha R',
                customerPhone: '9443198765',
                date: testBookingDate,
                timeSlot: testSlotTime,
                sport: 'Football',
                amount: 1200,
            });
            assert(bookingRes.status === 201 && Boolean((_44 = (_43 = bookingRes.data) === null || _43 === void 0 ? void 0 : _43.data) === null || _44 === void 0 ? void 0 : _44.bookingCode), 'Public turf booking confirms with 201 Created and bookingCode', `Booking Code: ${(_46 = (_45 = bookingRes.data) === null || _45 === void 0 ? void 0 : _45.data) === null || _46 === void 0 ? void 0 : _46.bookingCode}`);
        }
        catch (err) {
            assert(false, 'Public turf booking confirms with 201 Created', ((_48 = (_47 = err.response) === null || _47 === void 0 ? void 0 : _47.data) === null || _48 === void 0 ? void 0 : _48.message) || err.message);
        }
        // Test 16: Public Turf Booking Conflict — Status 409 Slot Already Booked
        try {
            yield axios_1.default.post(`${BASE_URL}/bookings/public`, {
                turfId: publicTurfId,
                customerName: 'Second Player',
                customerPhone: '9443198766',
                date: testBookingDate,
                timeSlot: testSlotTime,
                sport: 'Football',
                amount: 1200,
            });
            assert(false, 'Double booking same slot must return 409 Conflict', 'Duplicate booking succeeded!');
        }
        catch (err) {
            assert(((_49 = err.response) === null || _49 === void 0 ? void 0 : _49.status) === 409, 'Double booking same slot returns 409 Conflict with human-readable error', (_51 = (_50 = err.response) === null || _50 === void 0 ? void 0 : _50.data) === null || _51 === void 0 ? void 0 : _51.message);
        }
        // Test 17: Public Turf Booking Validation — Status 400 Invalid Mobile Number
        try {
            yield axios_1.default.post(`${BASE_URL}/bookings/public`, {
                turfId: publicTurfId,
                customerName: 'Invalid Player',
                customerPhone: '123', // Invalid phone
                date: testBookingDate,
                timeSlot: '9:00 PM – 10:00 PM',
                sport: 'Football',
            });
            assert(false, 'Invalid phone booking request must return 400', 'Got non-400 status!');
        }
        catch (err) {
            assert(((_52 = err.response) === null || _52 === void 0 ? void 0 : _52.status) === 400, 'Invalid booking request rejected with 400 Bad Request', (_54 = (_53 = err.response) === null || _53 === void 0 ? void 0 : _53.data) === null || _54 === void 0 ? void 0 : _54.message);
        }
        // Test 18: Tournament Creation — Backend verifies authenticated organizer
        let createdTournamentId = '';
        try {
            const tourRes = yield axios_1.default.post(`${BASE_URL}/owner/tournaments`, {
                title: 'Tirunelveli Super Cup 2026',
                sport: 'Football',
                venue: 'Tirunelveli Turf Arena',
                date: '2026-11-01',
                teamsLimit: 16,
                entryFee: 1500,
                prizePool: '₹25,000',
                rules: '7v7 Knockout format',
            }, { headers: { Authorization: `Bearer ${ownerToken}` } });
            createdTournamentId = (_56 = (_55 = tourRes.data) === null || _55 === void 0 ? void 0 : _55.data) === null || _56 === void 0 ? void 0 : _56._id;
            assert(tourRes.status === 201 && Boolean(createdTournamentId), 'Create tournament persists record in MongoDB with organizerId from token', `Tournament ID: ${createdTournamentId}`);
        }
        catch (err) {
            assert(false, 'Create tournament persists record in MongoDB', ((_58 = (_57 = err.response) === null || _57 === void 0 ? void 0 : _57.data) === null || _58 === void 0 ? void 0 : _58.message) || err.message);
        }
        // Test 19: Tournament Team Registration & Enrollment
        let registeredTeamId = '';
        try {
            const teamRes = yield axios_1.default.post(`${BASE_URL}/owner/tournaments/${createdTournamentId}/register-team`, {
                teamName: 'Nellai Strikers FC',
                captainName: 'Muthu Kumar',
                captainPhone: '9842155443',
                membersCount: 8,
            }, { headers: { Authorization: `Bearer ${playerToken}` } });
            const teams = (_60 = (_59 = teamRes.data) === null || _59 === void 0 ? void 0 : _59.data) === null || _60 === void 0 ? void 0 : _60.registeredTeams;
            registeredTeamId = (_61 = teams === null || teams === void 0 ? void 0 : teams[teams.length - 1]) === null || _61 === void 0 ? void 0 : _61._id;
            assert(teamRes.status === 201 && Boolean(registeredTeamId), 'Enroll squad into tournament registeredTeams array', `Team ID: ${registeredTeamId}`);
        }
        catch (err) {
            assert(false, 'Enroll squad into tournament registeredTeams array', ((_63 = (_62 = err.response) === null || _62 === void 0 ? void 0 : _62.data) === null || _63 === void 0 ? void 0 : _63.message) || err.message);
        }
        // Test 20: Tournament Team Status Approval by Organizer
        try {
            const statusRes = yield axios_1.default.patch(`${BASE_URL}/owner/tournaments/${createdTournamentId}/teams/${registeredTeamId}`, { status: 'APPROVED' }, { headers: { Authorization: `Bearer ${ownerToken}` } });
            const updatedTeams = (_65 = (_64 = statusRes.data) === null || _64 === void 0 ? void 0 : _64.data) === null || _65 === void 0 ? void 0 : _65.registeredTeams;
            const targetTeam = updatedTeams === null || updatedTeams === void 0 ? void 0 : updatedTeams.find((t) => t._id === registeredTeamId);
            assert(statusRes.status === 200 && (targetTeam === null || targetTeam === void 0 ? void 0 : targetTeam.status) === 'APPROVED', 'Organizer approves team registration status to APPROVED', `Status: ${targetTeam === null || targetTeam === void 0 ? void 0 : targetTeam.status}`);
        }
        catch (err) {
            assert(false, 'Organizer approves team registration status to APPROVED', ((_67 = (_66 = err.response) === null || _66 === void 0 ? void 0 : _66.data) === null || _67 === void 0 ? void 0 : _67.message) || err.message);
        }
        // Test 21: Server-Side Logout Token Revocation
        try {
            const logoutRes = yield axios_1.default.post(`${BASE_URL}/auth/logout`, {}, { headers: { Authorization: `Bearer ${ownerToken}` } });
            assert(logoutRes.status === 200 && ((_68 = logoutRes.data) === null || _68 === void 0 ? void 0 : _68.success), 'Server-side logout revokes token in Redis and increments tokenVersion in DB', (_69 = logoutRes.data) === null || _69 === void 0 ? void 0 : _69.message);
        }
        catch (err) {
            assert(false, 'Server-side logout revokes token', err.message);
        }
        // Test 22: Revoked Token Rejected with 401 on Reuse
        try {
            yield axios_1.default.get(`${BASE_URL}/owner/turfs`, {
                headers: { Authorization: `Bearer ${ownerToken}` },
            });
            assert(false, 'Revoked token must return 401 Unauthorized', 'Got 200 with revoked token!');
        }
        catch (err) {
            assert(((_70 = err.response) === null || _70 === void 0 ? void 0 : _70.status) === 401, 'Revoked token rejected with 401 Unauthorized on subsequent requests', `Status: ${(_71 = err.response) === null || _71 === void 0 ? void 0 : _71.status}`);
        }
        // Summary
        console.log('\n======================================================');
        console.log('TEST SUMMARY');
        console.log('======================================================');
        const passed = results.filter(r => r.passed).length;
        const failed = results.filter(r => !r.passed).length;
        console.log(`Total Tests: ${results.length} | Passed: ${passed} | Failed: ${failed}\n`);
        if (failed > 0) {
            process.exit(1);
        }
    });
}
runTests();
