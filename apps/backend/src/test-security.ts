import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

interface TestResult {
  name: string;
  passed: boolean;
  details?: string;
}

const results: TestResult[] = [];

function assert(condition: boolean, name: string, details?: string) {
  if (condition) {
    results.push({ name, passed: true, details });
    console.log(`✅ PASS: ${name}`);
  } else {
    results.push({ name, passed: false, details });
    console.error(`❌ FAIL: ${name} — ${details || ''}`);
  }
}

async function runTests() {
  console.log('\n======================================================');
  console.log('TURFZONE COMPREHENSIVE PRODUCTION VERIFICATION SUITE');
  console.log('======================================================\n');

  // Test 1: Unauthenticated request to protected owner route must return 401
  try {
    await axios.get(`${BASE_URL}/owner/turfs`);
    assert(false, 'Unauthenticated request to /api/owner/turfs must return 401', 'Got 200 instead of 401');
  } catch (err: any) {
    assert(
      err.response?.status === 401,
      'Unauthenticated request to /api/owner/turfs returns 401',
      `Status: ${err.response?.status}`
    );
  }

  // Test 2: Unauthenticated request to /api/bookings/my-bookings must return 401
  try {
    await axios.get(`${BASE_URL}/bookings/my-bookings`);
    assert(false, 'Unauthenticated request to /api/bookings/my-bookings must return 401', 'Got 200 instead of 401');
  } catch (err: any) {
    assert(
      err.response?.status === 401,
      'Unauthenticated request to /api/bookings/my-bookings returns 401',
      `Status: ${err.response?.status}`
    );
  }

  // Test 3: Public turfs endpoint must work without authentication
  let publicTurfId = '';
  try {
    const publicRes = await axios.get(`${BASE_URL}/turfs`);
    assert(
      publicRes.status === 200 && Array.isArray(publicRes.data?.data) && publicRes.data.data.length > 0,
      'Public endpoint /api/turfs accessible without token',
      `Returned ${publicRes.data?.data?.length} turfs`
    );
    publicTurfId = publicRes.data.data[0]._id;
  } catch (err: any) {
    assert(false, 'Public endpoint /api/turfs accessible without token', err.message);
  }

  // Test 4: Production Signup with Role Security (Prevent SUPER_ADMIN privilege escalation)
  const testPhone = '99' + Math.floor(10000000 + Math.random() * 89999999);
  let playerToken = '';
  try {
    const signupRes = await axios.post(`${BASE_URL}/auth/register`, {
      name: 'Priya Sharma',
      phone: testPhone,
      email: `priya_${Date.now()}@gmail.com`,
      password: 'password123',
      role: 'SUPER_ADMIN', // Attacker attempt to escalate to SUPER_ADMIN
    });

    playerToken = signupRes.data?.data?.token;
    const userRole = signupRes.data?.data?.user?.role;
    assert(
      signupRes.status === 201 && Boolean(playerToken) && userRole === 'PLAYER',
      'Public registration enforces PLAYER role and rejects role escalation',
      `Assigned Role: ${userRole}`
    );
  } catch (err: any) {
    assert(false, 'Public registration enforces PLAYER role', err.response?.data?.message || err.message);
  }

  // Test 5: Prevent duplicate phone registration
  try {
    await axios.post(`${BASE_URL}/auth/register`, {
      name: 'Duplicate Player',
      phone: testPhone,
      password: 'password123',
    });
    assert(false, 'Duplicate mobile number registration must return 409/400', 'Registration succeeded with duplicate phone!');
  } catch (err: any) {
    assert(
      err.response?.status === 409 || err.response?.status === 400,
      'Duplicate mobile registration rejected with 409 Conflict',
      err.response?.data?.message
    );
  }

  // Test 6: Production Password Login for Player
  try {
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      identifier: testPhone,
      password: 'password123',
    });
    assert(
      loginRes.status === 200 && Boolean(loginRes.data?.data?.token),
      'Player login with mobile number and password succeeds',
      `User: ${loginRes.data?.data?.user?.name}`
    );
  } catch (err: any) {
    assert(false, 'Player login with mobile number and password succeeds', err.message);
  }

  // Test 7: Wrong password rejected with 401
  try {
    await axios.post(`${BASE_URL}/auth/login`, {
      identifier: testPhone,
      password: 'wrongpassword',
    });
    assert(false, 'Login with incorrect password must return 401', 'Login succeeded with wrong password!');
  } catch (err: any) {
    assert(
      err.response?.status === 401,
      'Login with incorrect password rejected with 401',
      err.response?.data?.message
    );
  }

  // Test 8: Forgot Password Token Generation
  let resetToken = '';
  try {
    const forgotRes = await axios.post(`${BASE_URL}/auth/forgot-password`, {
      identifier: testPhone,
    });
    resetToken = forgotRes.data?.data?.resetToken;
    assert(
      forgotRes.status === 200 && Boolean(resetToken),
      'Forgot password generates valid single-use reset token',
      `Reset Token: ${resetToken}`
    );
  } catch (err: any) {
    assert(false, 'Forgot password generates valid reset token', err.message);
  }

  // Test 9: Reset Password with Token
  try {
    const resetRes = await axios.post(`${BASE_URL}/auth/reset-password`, {
      identifier: testPhone,
      token: resetToken,
      newPassword: 'newpassword123',
    });
    assert(
      resetRes.status === 200 && resetRes.data?.success,
      'Reset password updates password using valid token',
      resetRes.data?.message
    );

    // Verify login with new password
    const newLoginRes = await axios.post(`${BASE_URL}/auth/login`, {
      identifier: testPhone,
      password: 'newpassword123',
    });
    playerToken = newLoginRes.data?.data?.token;
    assert(
      newLoginRes.status === 200 && Boolean(playerToken),
      'Login with updated password succeeds',
      `User: ${newLoginRes.data?.data?.user?.name}`
    );
  } catch (err: any) {
    assert(false, 'Reset password updates password using valid token', err.message);
  }

  // Test 10: Google OAuth Endpoint Verification
  try {
    const googleRes = await axios.post(`${BASE_URL}/auth/google`, {
      googleId: 'google-uid-' + Date.now(),
      email: `googleuser_${Date.now()}@gmail.com`,
      name: 'Google Player',
      avatar: 'https://lh3.googleusercontent.com/a/test',
    });
    assert(
      googleRes.status === 200 && Boolean(googleRes.data?.data?.token) && googleRes.data?.data?.user?.role === 'PLAYER',
      'Google authentication establishes normal session with correct PLAYER role',
      `Google User: ${googleRes.data?.data?.user?.name}`
    );
  } catch (err: any) {
    assert(false, 'Google authentication establishes normal session', err.message);
  }

  // Test 11: Production Login for Turf Owner (John Doe - 9443182940)
  let ownerToken = '';
  try {
    const ownerLoginRes = await axios.post(`${BASE_URL}/auth/login`, {
      identifier: '9443182940',
      password: 'password123',
    });
    ownerToken = ownerLoginRes.data?.data?.token;
    assert(
      ownerLoginRes.status === 200 && Boolean(ownerToken) && (ownerLoginRes.data?.data?.user?.role === 'TURF_OWNER' || ownerLoginRes.data?.data?.user?.role === 'TURF_ADMIN'),
      'Turf Owner production login with password succeeds',
      `Owner: ${ownerLoginRes.data?.data?.user?.name}`
    );
  } catch (err: any) {
    assert(false, 'Turf Owner production login with password succeeds', err.message);
  }

  // Test 12: Production Login for Staff (Karthik R - 9842100001)
  let staffToken = '';
  try {
    const staffLoginRes = await axios.post(`${BASE_URL}/auth/login`, {
      identifier: '9842100001',
      password: 'password123',
    });
    staffToken = staffLoginRes.data?.data?.token;
    assert(
      staffLoginRes.status === 200 && Boolean(staffToken) && staffLoginRes.data?.data?.user?.role === 'STAFF',
      'Staff production login with password succeeds',
      `Staff: ${staffLoginRes.data?.data?.user?.name}`
    );
  } catch (err: any) {
    assert(false, 'Staff production login with password succeeds', err.message);
  }

  // Test 13: RBAC Isolation: Staff is forbidden from financial reports (403)
  try {
    await axios.get(`${BASE_URL}/owner/reports`, {
      headers: { Authorization: `Bearer ${staffToken}` },
    });
    assert(false, 'Staff accessing /api/owner/reports must return 403 Forbidden', 'Staff received 200 on financial reports!');
  } catch (err: any) {
    assert(
      err.response?.status === 403,
      'Staff accessing /api/owner/reports returns 403 Forbidden',
      `Status: ${err.response?.status}`
    );
  }

  // Test 14: Owner accessing /api/owner/turfs returns their venues
  try {
    const ownerTurfsRes = await axios.get(`${BASE_URL}/owner/turfs`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    assert(
      ownerTurfsRes.status === 200 && Array.isArray(ownerTurfsRes.data?.data),
      'Turf Owner calling /api/owner/turfs returns authorized owner turfs',
      `Count: ${ownerTurfsRes.data?.data?.length} turfs`
    );
  } catch (err: any) {
    assert(false, 'Turf Owner calling /api/owner/turfs returns authorized owner turfs', err.message);
  }

  // Test 15: Public Turf Booking — Status 201 Created with Structured Confirmation
  const testSlotTime = '6:00 PM – 7:00 PM';
  const testBookingDate = `2026-11-${String(Math.floor(10 + Math.random() * 18)).padStart(2, '0')}`;
  try {
    const bookingRes = await axios.post(`${BASE_URL}/bookings/public`, {
      turfId: publicTurfId,
      customerName: 'Kavitha R',
      customerPhone: '9443198765',
      date: testBookingDate,
      timeSlot: testSlotTime,
      sport: 'Football',
      amount: 1200,
    });

    assert(
      bookingRes.status === 201 && Boolean(bookingRes.data?.data?.bookingCode),
      'Public turf booking confirms with 201 Created and bookingCode',
      `Booking Code: ${bookingRes.data?.data?.bookingCode}`
    );
  } catch (err: any) {
    assert(false, 'Public turf booking confirms with 201 Created', err.response?.data?.message || err.message);
  }

  // Test 16: Public Turf Booking Conflict — Status 409 Slot Already Booked
  try {
    await axios.post(`${BASE_URL}/bookings/public`, {
      turfId: publicTurfId,
      customerName: 'Second Player',
      customerPhone: '9443198766',
      date: testBookingDate,
      timeSlot: testSlotTime,
      sport: 'Football',
      amount: 1200,
    });
    assert(false, 'Double booking same slot must return 409 Conflict', 'Duplicate booking succeeded!');
  } catch (err: any) {
    assert(
      err.response?.status === 409,
      'Double booking same slot returns 409 Conflict with human-readable error',
      err.response?.data?.message
    );
  }

  // Test 17: Public Turf Booking Validation — Status 400 Invalid Mobile Number
  try {
    await axios.post(`${BASE_URL}/bookings/public`, {
      turfId: publicTurfId,
      customerName: 'Invalid Player',
      customerPhone: '123', // Invalid phone
      date: testBookingDate,
      timeSlot: '9:00 PM – 10:00 PM',
      sport: 'Football',
    });
    assert(false, 'Invalid phone booking request must return 400', 'Got non-400 status!');
  } catch (err: any) {
    assert(
      err.response?.status === 400,
      'Invalid booking request rejected with 400 Bad Request',
      err.response?.data?.message
    );
  }

  // Test 18: Tournament Creation — Backend verifies authenticated organizer
  let createdTournamentId = '';
  try {
    const tourRes = await axios.post(
      `${BASE_URL}/owner/tournaments`,
      {
        title: 'Tirunelveli Super Cup 2026',
        sport: 'Football',
        venue: 'Tirunelveli Turf Arena',
        date: '2026-11-01',
        teamsLimit: 16,
        entryFee: 1500,
        prizePool: '₹25,000',
        rules: '7v7 Knockout format',
      },
      { headers: { Authorization: `Bearer ${ownerToken}` } }
    );

    createdTournamentId = tourRes.data?.data?._id;
    assert(
      tourRes.status === 201 && Boolean(createdTournamentId),
      'Create tournament persists record in MongoDB with organizerId from token',
      `Tournament ID: ${createdTournamentId}`
    );
  } catch (err: any) {
    assert(false, 'Create tournament persists record in MongoDB', err.response?.data?.message || err.message);
  }

  // Test 19: Tournament Team Registration & Enrollment
  let registeredTeamId = '';
  try {
    const teamRes = await axios.post(
      `${BASE_URL}/owner/tournaments/${createdTournamentId}/register-team`,
      {
        teamName: 'Nellai Strikers FC',
        captainName: 'Muthu Kumar',
        captainPhone: '9842155443',
        membersCount: 8,
      },
      { headers: { Authorization: `Bearer ${playerToken}` } }
    );

    const teams = teamRes.data?.data?.registeredTeams;
    registeredTeamId = teams?.[teams.length - 1]?._id;
    assert(
      teamRes.status === 201 && Boolean(registeredTeamId),
      'Enroll squad into tournament registeredTeams array',
      `Team ID: ${registeredTeamId}`
    );
  } catch (err: any) {
    assert(false, 'Enroll squad into tournament registeredTeams array', err.response?.data?.message || err.message);
  }

  // Test 20: Tournament Team Status Approval by Organizer
  try {
    const statusRes = await axios.patch(
      `${BASE_URL}/owner/tournaments/${createdTournamentId}/teams/${registeredTeamId}`,
      { status: 'APPROVED' },
      { headers: { Authorization: `Bearer ${ownerToken}` } }
    );

    const updatedTeams = statusRes.data?.data?.registeredTeams;
    const targetTeam = updatedTeams?.find((t: any) => t._id === registeredTeamId);
    assert(
      statusRes.status === 200 && targetTeam?.status === 'APPROVED',
      'Organizer approves team registration status to APPROVED',
      `Status: ${targetTeam?.status}`
    );
  } catch (err: any) {
    assert(false, 'Organizer approves team registration status to APPROVED', err.response?.data?.message || err.message);
  }

  // Test 21: Server-Side Logout Token Revocation
  try {
    const logoutRes = await axios.post(
      `${BASE_URL}/auth/logout`,
      {},
      { headers: { Authorization: `Bearer ${ownerToken}` } }
    );
    assert(
      logoutRes.status === 200 && logoutRes.data?.success,
      'Server-side logout revokes token in Redis and increments tokenVersion in DB',
      logoutRes.data?.message
    );
  } catch (err: any) {
    assert(false, 'Server-side logout revokes token', err.message);
  }

  // Test 22: Revoked Token Rejected with 401 on Reuse
  try {
    await axios.get(`${BASE_URL}/owner/turfs`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    assert(false, 'Revoked token must return 401 Unauthorized', 'Got 200 with revoked token!');
  } catch (err: any) {
    assert(
      err.response?.status === 401,
      'Revoked token rejected with 401 Unauthorized on subsequent requests',
      `Status: ${err.response?.status}`
    );
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
}

runTests();
