const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const bodyParser = require('body-parser');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const validator = require('validator');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const emailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit each IP to 10 email requests per hour
  message: 'Too many email requests from this IP, please try again later.',
});

app.use(limiter);

// CORS configuration - Allow multiple frontend URLs for different environments
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'http://localhost:3000',
  'http://localhost:3001', 
  'https://localhost:3000',
  'https://localhost:3001'
];

// Add SharePoint URLs if in SharePoint mode
if (process.env.SHAREPOINT_SITE_URL) {
  allowedOrigins.push(process.env.SHAREPOINT_SITE_URL);
}

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    // Check if origin is allowed
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      // In development, allow all origins for testing
      if (process.env.NODE_ENV === 'development') {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true
}));

// Body parser with size limits
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path} - IP: ${req.ip}`);
  next();
});

// Input validation middleware
const validateEmailInput = (req, res, next) => {
  const { to, subject, text } = req.body;
  
  if (!to || !subject || !text) {
    return res.status(400).json({ 
      error: 'Missing required fields: to, subject, text' 
    });
  }
  
  if (!validator.isEmail(to)) {
    return res.status(400).json({ 
      error: 'Invalid email address' 
    });
  }
  
  if (subject.length > 200) {
    return res.status(400).json({ 
      error: 'Subject line too long (max 200 characters)' 
    });
  }
  
  if (text.length > 5000) {
    return res.status(400).json({ 
      error: 'Message too long (max 5000 characters)' 
    });
  }
  
  // Sanitize inputs
  req.body.to = validator.normalizeEmail(to);
  req.body.subject = validator.escape(subject);
  req.body.text = validator.escape(text);
  
  next();
};

// Email transporter configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    ciphers: 'SSLv3'
  }
});

// Verify transporter configuration
transporter.verify((error, success) => {
  if (error) {
    console.error('Email transporter configuration error:', error);
  } else {
    console.log('Email server is ready to send messages');
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Enhanced send email endpoint
app.post('/send-email', emailLimiter, validateEmailInput, async (req, res) => {
  try {
    const { to, subject, text } = req.body;
    const timestamp = new Date().toISOString();

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      text,
      headers: {
        'X-Meeting-System': 'true',
        'X-Timestamp': timestamp
      }
    };

    console.log(`[${timestamp}] Sending email to: ${to}`);
    
    const info = await transporter.sendMail(mailOptions);
    
    console.log(`[${timestamp}] Email sent successfully:`, info.messageId);
    
    res.status(200).json({ 
      success: true,
      message: 'Email sent successfully',
      messageId: info.messageId,
      timestamp
    });
    
  } catch (error) {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] Error sending email:`, error);
    
    res.status(500).json({ 
      success: false,
      error: 'Failed to send email',
      timestamp
    });
  }
});

// Enhanced send reminder endpoint
app.post('/send-reminder', emailLimiter, async (req, res) => {
  try {
    const { to, meetingDate } = req.body;
    const timestamp = new Date().toISOString();
    
    // Validate inputs
    if (!to || !meetingDate) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing required fields: to, meetingDate' 
      });
    }
    
    if (!validator.isEmail(to)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid email address' 
      });
    }
    
    const sanitizedEmail = validator.normalizeEmail(to);
    const sanitizedDate = validator.escape(meetingDate);

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: sanitizedEmail,
      subject: `Reminder: Upcoming LTI Meeting on ${sanitizedDate}`,
      text: `Reminder: The LTI Meeting is scheduled for ${sanitizedDate}. Please ensure PermitVision isolations are updated.`,
      headers: {
        'X-Meeting-System': 'reminder',
        'X-Timestamp': timestamp
      }
    };

    console.log(`[${timestamp}] Sending reminder to: ${sanitizedEmail}`);
    
    const info = await transporter.sendMail(mailOptions);
    
    console.log(`[${timestamp}] Reminder sent successfully:`, info.messageId);
    
    res.status(200).json({ 
      success: true,
      message: 'Reminder email sent successfully',
      messageId: info.messageId,
      timestamp
    });
    
  } catch (error) {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] Error sending reminder:`, error);
    
    res.status(500).json({ 
      success: false,
      error: 'Failed to send reminder',
      timestamp
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] Unhandled error:`, error);
  
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    timestamp
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    timestamp: new Date().toISOString()
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`Meeting backend server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
