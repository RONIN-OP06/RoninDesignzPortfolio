/**
 * Test Server Email Endpoint
 * Tests the actual server API endpoint for email functionality
 */

const API_URL = 'http://localhost:3000';

async function testServerEmail() {
  console.log('\n' + '='.repeat(70));
  console.log('🧪 TESTING SERVER EMAIL ENDPOINT');
  console.log('='.repeat(70));
  console.log(`Server: ${API_URL}`);
  console.log(`Time: ${new Date().toLocaleString()}\n`);

  // Test 1: Check if server is running
  console.log('1️⃣  Checking if server is running...');
  try {
    const healthCheck = await fetch(`${API_URL}/api/members`);
    if (healthCheck.ok || healthCheck.status === 401) {
      console.log('✅ Server is running!\n');
    } else {
      console.log('⚠️  Server responded but with unexpected status\n');
    }
  } catch (error) {
    console.log('❌ Server is not running or not accessible!');
    console.log(`   Error: ${error.message}\n`);
    console.log('   Please start the server with: npm start\n');
    return;
  }

  // Test 2: Test email endpoint (requires auth, but we can check the response)
  console.log('2️⃣  Testing email endpoint configuration...');
  console.log('   (This requires authentication - testing error handling)\n');
  
  try {
    const response = await fetch(`${API_URL}/api/contact`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subject: 'Test',
        message: 'Test message'
      })
    });

    const data = await response.json();
    
    if (response.status === 401) {
      console.log('✅ Endpoint is accessible (authentication required as expected)');
      console.log('   This means the server is configured correctly\n');
    } else if (response.status === 500 && data.error) {
      if (data.error.includes('EMAIL_PASS') || data.error.includes('not configured')) {
        console.log('❌ Email service is not configured!');
        console.log('   Error:', data.error);
        console.log('\n📝 TO FIX:');
        console.log('   1. Add EMAIL_PASS to your .env file');
        console.log('   2. Restart the server');
        console.log('   3. Run this test again\n');
      } else {
        console.log('⚠️  Server error:', data.error);
        console.log('   This might be an email configuration issue\n');
      }
    } else {
      console.log('✅ Endpoint responded:', data);
    }
  } catch (error) {
    console.log('❌ Failed to test endpoint:', error.message);
  }

  // Test 3: Test email test endpoint
  console.log('3️⃣  Testing /api/test-email endpoint...');
  try {
    const response = await fetch(`${API_URL}/api/test-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('🎉 EMAIL IS WORKING!');
      console.log('   Message ID:', data.messageId);
      console.log('   Check your inbox at ronindesign123@gmail.com\n');
    } else {
      console.log('❌ Email test failed:', data.error);
      if (data.error.includes('EMAIL_PASS')) {
        console.log('\n📝 TO FIX:');
        console.log('   1. Get Gmail App Password: https://myaccount.google.com/apppasswords');
        console.log('   2. Edit .env file and add: EMAIL_PASS=your_password');
        console.log('   3. Restart server: npm start');
        console.log('   4. Run this test again\n');
      }
    }
  } catch (error) {
    console.log('❌ Failed to test email:', error.message);
  }

  console.log('='.repeat(70));
  console.log('💡 TIP: Run this test again after adding EMAIL_PASS to .env');
  console.log('='.repeat(70) + '\n');
}

// Run test
testServerEmail().catch(console.error);
