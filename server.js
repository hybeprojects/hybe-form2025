const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Basic rate limiting
const requestCounts = new Map();
app.use((req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  const count = requestCounts.get(ip) || 0;
  if (count > 100) { // 100 requests per reset cycle
    return res.status(429).json({ error: 'Too many requests' });
  }
  requestCounts.set(ip, count + 1);
  setTimeout(() => requestCounts.delete(ip), 60000); // Reset after 1 minute
  next();
});

// For handling multipart/form-data (file uploads)
const upload = multer();

// Health check
app.get('/', (req, res) => {
  res.send('HYBE Form Express Backend is running.');
});

// Input sanitization helper
function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  return input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
              .replace(/javascript:/gi, '')
              .replace(/on\w+\s*=/gi, '')
              .trim();
}

// Form submission endpoint (mimics Netlify function)
app.post('/submit-form', upload.none(), (req, res) => {
  try {
    // Validate and sanitize input data
    const sanitizedData = {};
    for (const [key, value] of Object.entries(req.body)) {
      if (typeof value === 'string') {
        sanitizedData[key] = sanitizeInput(value);
      } else {
        sanitizedData[key] = value;
      }
    }

    // Basic validation
    if (!sanitizedData.firstName || !sanitizedData.lastName || !sanitizedData.email) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: firstName, lastName, email'
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sanitizedData.email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    console.log('Form submission received:', sanitizedData);

    // Simulate async processing
    setTimeout(() => {
      res.status(200).json({
        success: true,
        message: 'Form submitted successfully.',
        timestamp: new Date().toISOString()
      });
    }, 1000);

  } catch (error) {
    console.error('Form processing error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Express server listening at http://localhost:${port}`);
});
