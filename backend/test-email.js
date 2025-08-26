const nodemailer = require('nodemailer');
require('dotenv').config();

// Create a test function to send an email
async function testEmail() {
  // Create a transporter using the same configuration as in index.js
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      ciphers: 'SSLv3'
    }
  });

  // Define the email options
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: 'recipient@example.com', // Replace with the recipient's email
    subject: 'Test Email from Meeting System',
    text: 'This is a test email from the Meeting System. If you received this, the email functionality is working correctly.',
  };

  try {
    // Send the email
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
  } catch (error) {
    console.error('Error sending email:', error);
  }
}

// Run the test function
testEmail().catch(console.error);

console.log('Testing email functionality...');
console.log('Check your email configuration in .env file:');
console.log(`SMTP_HOST: ${process.env.SMTP_HOST}`);
console.log(`SMTP_PORT: ${process.env.SMTP_PORT}`);
console.log(`EMAIL_USER: ${process.env.EMAIL_USER}`);
console.log(`EMAIL_PASS: ${process.env.EMAIL_PASS ? '******' : 'Not set'}`);
