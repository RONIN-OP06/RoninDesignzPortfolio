/**
 * Continuous Email Test Script
 * Monitors .env file and tests email functionality continuously
 */

import 'dotenv/config';
import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ENV_FILE = path.join(__dirname, '.env');

let lastEnvModified = 0;
let testCount = 0;
let successCount = 0;

function checkEnvFile() {
  try {
    const stats = fs.statSync(ENV_FILE);
    return stats.mtimeMs;
  } catch {
    return 0;
  }
}

function getEnvValue(key) {
  try {
    const content = fs.readFileSync(ENV_FILE, 'utf8');
    const match = content.match(new RegExp(`^${key}=(.+)$`, 'm'));
    return match ? match[1].trim() : '';
  } catch {
    return '';
  }
}

async function testEmail() {
  testCount++;
  console.clear();
  console.log('\n' + '='.repeat(70));
  console.log('📧 CONTINUOUS EMAIL FUNCTIONALITY TEST');
  console.log('='.repeat(70));
  console.log(`Test #${testCount} | ${new Date().toLocaleString()}`);
  console.log(`Successful tests: ${successCount}`);
  console.log('='.repeat(70));

  // Reload environment variables
  delete require.cache[require.resolve('dotenv/config')];
  const EMAIL_USER = getEnvValue('EMAIL_USER') || 'ronindesign123@gmail.com';
  const EMAIL_PASS = getEnvValue('EMAIL_PASS') || '';
  const RECIPIENT_EMAIL = getEnvValue('RECIPIENT_EMAIL') || 'ronindesign123@gmail.com';

  console.log('\n📋 Configuration Status:');
  console.log(`   EMAIL_USER: ${EMAIL_USER ? '✅ ' + EMAIL_USER : '❌ Not set'}`);
  console.log(`   EMAIL_PASS: ${EMAIL_PASS ? '✅ Set (' + EMAIL_PASS.length + ' characters)' : '❌ NOT SET'}`);
  console.log(`   RECIPIENT_EMAIL: ${RECIPIENT_EMAIL ? '✅ ' + RECIPIENT_EMAIL : '❌ Not set'}`);

  if (!EMAIL_PASS) {
    console.log('\n❌ EMAIL_PASS is missing!');
    console.log('\n📝 TO FIX THIS:');
    console.log('   1. Go to: https://myaccount.google.com/apppasswords');
    console.log('   2. Enable 2-Step Verification (if not already)');
    console.log('   3. Generate App Password for "Mail"');
    console.log('   4. Copy the 16-character password');
    console.log('   5. Edit .env file and add: EMAIL_PASS=your_password_here');
    console.log('   6. Save the file - this script will detect the change automatically');
    console.log('\n⏳ Monitoring .env file for changes... (Press Ctrl+C to stop)');
    return false;
  }

  console.log('\n🔍 Testing Email Connection...');
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS
    }
  });

  try {
    await transporter.verify();
    console.log('✅ Connection verified!');
  } catch (error) {
    console.log('❌ Connection verification failed!');
    console.log(`   Error: ${error.message}`);
    if (error.code === 'EAUTH') {
      console.log('   ⚠️  Your Gmail App Password may be incorrect.');
      console.log('   Generate a new one from: https://myaccount.google.com/apppasswords');
    }
    return false;
  }

  console.log('\n📨 Sending Test Email...');
  try {
    const info = await transporter.sendMail({
      from: EMAIL_USER,
      to: RECIPIENT_EMAIL,
      subject: `✅ Email Test #${testCount} - ${new Date().toLocaleTimeString()}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5;">
          <div style="background: white; padding: 30px; border-radius: 8px; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4CAF50;">✅ Email Test Successful!</h2>
            <p>Test #${testCount} completed at ${new Date().toLocaleString()}</p>
            <p>Your email configuration is working correctly!</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #666; font-size: 12px;">
              This is an automated test email from your website server.
            </p>
          </div>
        </div>
      `,
      text: `Email Test #${testCount} - ${new Date().toLocaleString()}\n\nYour email configuration is working correctly!`
    });

    successCount++;
    console.log('✅ EMAIL SENT SUCCESSFULLY!');
    console.log(`   Message ID: ${info.messageId}`);
    console.log(`   Check inbox: ${RECIPIENT_EMAIL}`);
    console.log('\n🎉 EMAIL FUNCTIONALITY IS WORKING! 🎉');
    console.log('\n✅ Your contact form will now work correctly!');
    console.log('   You can stop this test script (Ctrl+C)');
    return true;
  } catch (error) {
    console.log('❌ Failed to send email!');
    console.log(`   Error Code: ${error.code}`);
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

async function runContinuousTest() {
  console.log('🚀 Starting Continuous Email Test');
  console.log('   This will test every 3 seconds until email is working...\n');

  while (true) {
    const currentModified = checkEnvFile();
    
    // Reload env if file changed
    if (currentModified !== lastEnvModified) {
      lastEnvModified = currentModified;
      // Force reload of dotenv
      process.env = {};
      await import('dotenv/config');
    }

    const success = await testEmail();
    
    if (success) {
      console.log('\n✅ Email functionality confirmed working!');
      console.log('   Keeping test running to monitor...');
      console.log('   Press Ctrl+C to stop\n');
    }

    await new Promise(resolve => setTimeout(resolve, 3000));
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n👋 Test stopped by user');
  process.exit(0);
});

runContinuousTest().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
