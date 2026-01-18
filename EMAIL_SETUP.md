# Email Setup Instructions

## Quick Fix for Email Not Working

The email functionality requires a Gmail App Password. Follow these steps:

### Step 1: Get Your Gmail App Password

1. Go to: https://myaccount.google.com/apppasswords
   - Or navigate: Google Account → Security → 2-Step Verification → App Passwords

2. **Enable 2-Step Verification** (if not already enabled)
   - This is required to generate App Passwords

3. **Generate App Password**
   - Click "Select app" → Choose "Mail"
   - Click "Select device" → Choose "Other" → Type "Website Server"
   - Click "Generate"
   - **Copy the 16-character password** (it looks like: `abcd efgh ijkl mnop`)

### Step 2: Add Password to .env File

1. Open the `.env` file in your project root
2. Find the line: `EMAIL_PASS=`
3. Replace it with: `EMAIL_PASS=abcdefghijklmnop` (your 16-character password, **no spaces**)

Example:
```
EMAIL_USER=ronindesignz123@gmail.com
EMAIL_PASS=abcdefghijklmnop
RECIPIENT_EMAIL=ronindesignz123@gmail.com
```

### Step 3: Restart the Server

1. Stop the current server (close the PowerShell window)
2. Start it again: `npm start`
3. You should see: `✅ Email configuration verified successfully!`

### Step 4: Test Email

1. Make sure you're logged in
2. Go to the Contact page
3. Send a test message
4. Check your email inbox at `ronindesignz123@gmail.com`

## Troubleshooting

### Error: "EAUTH" or "Authentication failed"
- Your App Password is incorrect
- Make sure there are no spaces in the password
- Generate a new App Password and try again

### Error: "EMAIL_PASS not configured"
- The .env file is not being read
- Make sure the .env file is in the project root directory
- Restart the server after editing .env

### Error: "Connection failed"
- Check your internet connection
- Gmail servers might be temporarily unavailable

### Test Email Endpoint

You can test the email configuration by making a POST request to:
```
http://localhost:3000/api/test-email
```

This will send a test email to verify everything is working.

## Current Configuration

- **Recipient Email**: ronindesignz123@gmail.com
- **Sender Email**: roninsyoutub123@gmail.com
- **All contact form messages** are sent to: ronindesignz123@gmail.com

## Important Notes

- Never commit your `.env` file to version control
- The App Password is different from your regular Gmail password
- If you change your Gmail password, you'll need to generate a new App Password
