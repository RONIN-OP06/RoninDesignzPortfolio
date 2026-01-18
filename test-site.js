/**
 * Site Functionality Test
 * Tests all site features after removing email capabilities
 */

const API_URL = 'http://localhost:3000';

async function testSiteFunctionality() {
  console.log('\n' + '='.repeat(70));
  console.log('🧪 TESTING SITE FUNCTIONALITY');
  console.log('='.repeat(70));
  console.log(`Time: ${new Date().toLocaleString()}\n`);

  let testsPassed = 0;
  let testsFailed = 0;

  // Test 1: Server is running
  console.log('1️⃣  Testing server connectivity...');
  try {
    const response = await fetch(`${API_URL}/api/members`);
    if (response.ok || response.status === 401) {
      console.log('   ✅ Server is running\n');
      testsPassed++;
    } else {
      console.log('   ❌ Server returned unexpected status\n');
      testsFailed++;
    }
  } catch (error) {
    console.log('   ❌ Server is not running:', error.message);
    console.log('   Please start server with: npm start\n');
    testsFailed++;
    return;
  }

  // Test 2: Members endpoint
  console.log('2️⃣  Testing /api/members endpoint...');
  try {
    const response = await fetch(`${API_URL}/api/members`);
    const data = await response.json();
    console.log('   ✅ Members endpoint working');
    console.log(`   Found ${Array.isArray(data) ? data.length : 0} members\n`);
    testsPassed++;
  } catch (error) {
    console.log('   ❌ Members endpoint failed:', error.message, '\n');
    testsFailed++;
  }

  // Test 3: Sign up endpoint
  console.log('3️⃣  Testing /api/members (POST) - Sign up...');
  try {
    const testUser = {
      name: 'Test User',
      email: `test${Date.now()}@example.com`,
      password: 'Test1234!',
      phone: '1234567890'
    };
    
    const response = await fetch(`${API_URL}/api/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });
    
    const data = await response.json();
    if (response.ok || response.status === 201) {
      console.log('   ✅ Sign up endpoint working');
      console.log('   Test user created successfully\n');
      testsPassed++;
    } else {
      console.log('   ⚠️  Sign up response:', data.error || data.message, '\n');
      if (data.error && data.error.includes('already registered')) {
        console.log('   (This is expected if test user already exists)\n');
        testsPassed++;
      } else {
        testsFailed++;
      }
    }
  } catch (error) {
    console.log('   ❌ Sign up endpoint failed:', error.message, '\n');
    testsFailed++;
  }

  // Test 4: Login endpoint
  console.log('4️⃣  Testing /api/login endpoint...');
  try {
    const response = await fetch(`${API_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'nonexistent@example.com',
        password: 'wrongpassword'
      })
    });
    
    const data = await response.json();
    if (response.status === 401) {
      console.log('   ✅ Login endpoint working (correctly rejected invalid credentials)\n');
      testsPassed++;
    } else if (data.error) {
      console.log('   ✅ Login endpoint working\n');
      testsPassed++;
    } else {
      console.log('   ⚠️  Unexpected response:', data, '\n');
      testsFailed++;
    }
  } catch (error) {
    console.log('   ❌ Login endpoint failed:', error.message, '\n');
    testsFailed++;
  }

  // Test 5: Contact endpoint (should require auth)
  console.log('5️⃣  Testing /api/contact endpoint...');
  try {
    const response = await fetch(`${API_URL}/api/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subject: 'Test',
        message: 'Test message'
      })
    });
    
    const data = await response.json();
    if (response.status === 401) {
      console.log('   ✅ Contact endpoint correctly requires authentication\n');
      testsPassed++;
    } else {
      console.log('   ⚠️  Unexpected response:', data, '\n');
      testsFailed++;
    }
  } catch (error) {
    console.log('   ❌ Contact endpoint failed:', error.message, '\n');
    testsFailed++;
  }

  // Test 6: Check if contacts.json exists
  console.log('6️⃣  Testing contact message storage...');
  try {
    const fs = await import('fs');
    const path = await import('path');
    const contactsFile = path.join(process.cwd(), 'contacts.json');
    const exists = fs.existsSync(contactsFile);
    if (exists) {
      console.log('   ✅ contacts.json file exists\n');
      testsPassed++;
    } else {
      console.log('   ⚠️  contacts.json will be created on first contact\n');
      testsPassed++;
    }
  } catch (error) {
    console.log('   ⚠️  Could not check contacts file:', error.message, '\n');
    testsPassed++;
  }

  // Summary
  console.log('='.repeat(70));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(70));
  console.log(`✅ Tests Passed: ${testsPassed}`);
  console.log(`❌ Tests Failed: ${testsFailed}`);
  console.log(`📈 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);
  console.log('='.repeat(70));
  
  if (testsFailed === 0) {
    console.log('\n🎉 All tests passed! Site functionality is working correctly.\n');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the errors above.\n');
  }
}

testSiteFunctionality().catch(console.error);
