/**
 * Quick Email Status Checker
 * Run this to quickly check if email is configured
 */

import 'dotenv/config';
import fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf8');
const EMAIL_PASS = process.env.EMAIL_PASS || '';

console.log('\n' + '='.repeat(60));
console.log('📧 EMAIL CONFIGURATION STATUS');
console.log('='.repeat(60));

console.log('\n📋 Environment Variables:');
console.log(`   EMAIL_USER: ${process.env.EMAIL_USER || 'ronindesign123@gmail.com'}`);
console.log(`   EMAIL_PASS: ${EMAIL_PASS ? '✅ SET (' + EMAIL_PASS.length + ' chars)' : '❌ NOT SET'}`);
console.log(`   RECIPIENT_EMAIL: ${process.env.RECIPIENT_EMAIL || 'ronindesign123@gmail.com'}`);

if (!EMAIL_PASS) {
  console.log('\n❌ EMAIL_PASS is missing!');
  console.log('\n📝 TO FIX:');
  console.log('   1. Get Gmail App Password: https://myaccount.google.com/apppasswords');
  console.log('   2. Edit .env file');
  console.log('   3. Add: EMAIL_PASS=your_16_character_password');
  console.log('   4. Save and restart server');
} else {
  console.log('\n✅ Email password is configured!');
  console.log('   Run: node test-email-continuous.js to test');
}

console.log('\n' + '='.repeat(60) + '\n');
