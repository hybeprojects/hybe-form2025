const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files (prefer dist if present, else serve project root)
const distDir = path.join(__dirname, 'dist');
const staticRoot = fs.existsSync(distDir) ? distDir : __dirname;
app.use(express.static(staticRoot));

// Basic rate limiting
const requestCounts = new Map();
app.use((req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  const count = requestCounts.get(ip) || 0;
  if (count > 100) {
    return res.status(429).json({ error: 'Too many requests' });
  }
  requestCounts.set(ip, count + 1);
  setTimeout(() => requestCounts.delete(ip), 60000);
  next();
});

// For handling multipart/form-data (file uploads)
const upload = multer();

// Input sanitization helper
function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
}

// Simple form submission endpoint
app.post('/submit-form', upload.none(), (req, res) => {
  try {
    const sanitizedData = {};
    for (const [key, value] of Object.entries(req.body)) {
      sanitizedData[key] = typeof value === 'string' ? sanitizeInput(value) : value;
    }

    if (!sanitizedData['full-name'] || !sanitizedData.email) {
      return res.status(400).json({ success: false, message: 'Missing required fields: full-name, email' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sanitizedData.email)) {
      return res.status(400).json({ success: false, message: 'Invalid email format' });
    }

    console.log('Form submission received:', sanitizedData);

    setTimeout(() => {
      res.status(200).json({ success: true, message: 'Form submitted successfully.', timestamp: new Date().toISOString() });
    }, 1000);
  } catch (error) {
    console.error('Form processing error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// API routes replacing Netlify functions
const { sendOtp } = require(path.join(__dirname, 'lib/api/sendOtp.js'));
const { verifyOtp } = require(path.join(__dirname, 'lib/api/verifyOtp.js'));

app.options('/send-otp', (req, res) => res.sendStatus(200));
app.post('/send-otp', sendOtp);

app.options('/verify-otp', (req, res) => res.sendStatus(200));
app.post('/verify-otp', verifyOtp);

// Catch-all to serve index file
app.get('/*', (req, res) => {
  const indexPath = fs.existsSync(distDir)
    ? path.join(distDir, 'index.html')
    : path.join(__dirname, 'index.html');
  res.sendFile(indexPath);
});

app.listen(port, () => {
  console.log(`Express server listening at http://localhost:${port}`);
});
