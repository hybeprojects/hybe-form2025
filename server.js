const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// For handling multipart/form-data (file uploads)
const upload = multer();

// Health check
app.get('/', (req, res) => {
  res.send('HYBE Form Express Backend is running.');
});

// Form submission endpoint (mimics Netlify function)
app.post('/submit-form', upload.none(), (req, res) => {
  // You can add validation, logging, or database logic here
  // For now, just echo the form data
  console.log('Form submission received:', req.body);
  // Simulate async processing
  setTimeout(() => {
    res.status(200).json({ success: true, message: 'Form submitted successfully.' });
  }, 1000);
});

// Start server
app.listen(port, () => {
  console.log(`Express server listening at http://localhost:${port}`);
});
