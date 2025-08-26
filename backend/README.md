# Email Functionality Setup

This document provides instructions on how to set up and use the email functionality in the Meeting System.

## Prerequisites

- Node.js and npm installed
- A Gmail account (or another email provider)
- If using Gmail, you'll need to create an App Password

## Setup Instructions

1. **Configure Environment Variables**

   Edit the `.env` file in the backend directory with your email credentials:

   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   PORT=5000
   ```

   Replace `your-email@gmail.com` with your actual email address and `your-app-password` with your app password.

2. **Creating a Gmail App Password**

   If you're using Gmail, you'll need to create an App Password:

   1. Go to your Google Account settings: https://myaccount.google.com/
   2. Select "Security" from the left menu
   3. Under "Signing in to Google," select "2-Step Verification" (you must have this enabled)
   4. At the bottom of the page, select "App passwords"
   5. Select "Mail" as the app and "Other" as the device
   6. Enter a name (e.g., "Meeting System")
   7. Click "Generate"
   8. Copy the 16-character password that appears
   9. Paste this password as the `EMAIL_PASS` value in your `.env` file

3. **Testing Email Functionality**

   Run the test script to verify your email configuration:

   ```
   cd backend
   node test-email.js
   ```

   Before running the test, edit the `test-email.js` file to replace `'recipient@example.com'` with the actual recipient email address.

## Using Email in the Application

The application has two email endpoints:

1. **General Email** (`/send-email`)

   This endpoint sends a general email with a custom subject and text.

   Example frontend code:
   ```javascript
   fetch('http://localhost:5000/send-email', {
     method: 'POST',
     headers: {
       'Content-Type': 'application/json',
     },
     body: JSON.stringify({
       to: 'recipient@example.com',
       subject: 'Meeting Notification',
       text: 'This is a notification about an upcoming meeting.',
     }),
   })
   .then(response => response.text())
   .then(data => console.log(data))
   .catch(error => console.error('Error:', error));
   ```

2. **Meeting Reminder** (`/send-reminder`)

   This endpoint sends a meeting reminder email with a predefined template.

   Example frontend code:
   ```javascript
   fetch('http://localhost:5000/send-reminder', {
     method: 'POST',
     headers: {
       'Content-Type': 'application/json',
     },
     body: JSON.stringify({
       to: 'recipient@example.com',
       meetingDate: '2025-04-20',
     }),
   })
   .then(response => response.text())
   .then(data => console.log(data))
   .catch(error => console.error('Error:', error));
   ```

## Troubleshooting

- **Authentication Failed**: Check that your email and app password are correct
- **Connection Refused**: Check that your SMTP host and port are correct
- **Timeout**: Check your network connection and firewall settings
- **Gmail Security**: Make sure you have 2-Step Verification enabled and are using an App Password

## Adding Email Functionality to the LTI Master List

To add email functionality to the LTI Master List page, you can modify the `LTIMasterListPage.jsx` component to include a button or feature that sends emails. For example, you could add a button to send notifications about changes to the LTI Master List.
