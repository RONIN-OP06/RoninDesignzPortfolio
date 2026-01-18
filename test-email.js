/**
 * Email Functionality Test Script
 * Tests email configuration and functionality
 */

import 'dotenv/config';
import nodemailer from 'nodemailer';

const EMAIL_USER = process.env.EMAIL_USER || 'ronindesign123@gmail.com';
const EMAIL_PASS = process.env.EMAIL_PASS || '';
const RECIPIENT_EMAIL = process.env.RECIPIENT_EMAIL || 'ronindesign123@gmail.com';

let testCount = 0;
const maxTests = 10;
const testInterval = 5000; // 5 seconds

async function testEmailConfig() {
  testCount++;
  console.log(`\n${'='.repeat(60)}`);
  console.log(`TEST #${testCount} - ${new Date().toLocaleTimeString()}`);
  console.log('='.repeat(60));

  // Check 1: Environment variables
  console.log('\n📋 Checking Environment Variables:');
  console.log(`   EMAIL_USER: ${EMAIL_USER ? '✅ Set' : '❌ Missing'}`);
  console.log(`   EMAIL_PASS: ${EMAIL_PASS ? '✅ Set (' + EMAIL_PASS.length + ' chars)' : '❌ Missing'}`);
  console.log(`   RECIPIENT_EMAIL: ${RECIPIENT_EMAIL ? '✅ Set' : '❌ Missing'}`);

  if (!EMAIL_PASS) {
    console.log('\n❌ EMAIL_PASS is not set!');
    console.log('   Please add your Gmail App Password to the .env file');
    console.log('   Get it from: https://myaccount.google.com/apppasswords');
    return false;
  }

  // Check 2: Create transporter
  console.log('\n📧 Creating Email Transporter...');
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS
    }
  });

  // Check 3: Verify connection
  console.log('🔍 Verifying email connection...');
  try {
    await transporter.verify();
    console.log('✅ Email connection verified successfully!');
  } catch (error) {
    console.log('❌ Email verification failed!');
    console.log(`   Error: ${error.message}`);
    if (error.code === 'EAUTH') {
      console.log('   This means your Gmail App Password is incorrect.');
      console.log('   Please generate a new one from: https://myaccount.google.com/apppasswords');
    }
    return false;
  }

  // Check 4: Test sending email
  console.log('\n📨 Attempting to send test email...');
  const testMailOptions = {
    from: EMAIL_USER,
    to: RECIPIENT_EMAIL,
    subject: `Test Email #${testCount} - ${new Date().toLocaleString()}`,
    text: `This is test email #${testCount} to verify email functionality is working.`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Test Email #${testCount}</h2>
        <p>This is a test email sent at ${new Date().toLocaleString()}</p>
        <p>If you received this, your email configuration is working correctly! ✅</p>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(testMailOptions);
    console.log('✅ Test email sent successfully!');
    console.log(`   Message ID: ${info.messageId}`);
    console.log(`   Response: ${info.response}`);
    console.log(`   Check your inbox at: ${RECIPIENT_EMAIL}`);
    console.log('\n🎉 EMAIL FUNCTIONALITY IS WORKING! 🎉');
    return true;
  } catch (error) {
    console.log('❌ Failed to send test email!');
    console.log(`   Error Code: ${error.code}`);
    console.log(`   Error Message: ${error.message}`);
    if (error.code === 'EAUTH') {
      console.log('   Fix: Check your Gmail App Password');
    } else if (error.code === 'ECONNECTION') {
      console.log('   Fix: Check your internet connection');
    }
    return false;
  }
}

async function runTests() {
  console.log('\n🚀 Starting Email Functionality Tests');
  console.log('   This will test every 5 seconds until email is working...\n');

  while (testCount < maxTests) {
    const success = await testEmailConfig();
    
    if (success) {
      console.log('\n✅ All tests passed! Email functionality is working.');
      console.log('   You can now use the contact form on your website.');
      process.exit(0);
    }

    if (testCount < maxTests) {
      console.log(`\n⏳ Waiting 5 seconds before next test... (${testCount}/${maxTests})`);
      await new Promise(resolve => setTimeout(resolve, testInterval));
    }
  }

  console.log('\n❌ Tests completed but email is still not working.');
  console.log('   Please check the errors above and fix the configuration.');
  console.log('   See EMAIL_SETUP.md for detailed instructions.');
  process.exit(1);
}

// Run tests
runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
