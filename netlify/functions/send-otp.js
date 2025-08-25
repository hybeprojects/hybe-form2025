const { getDatabase } = require('../../lib/database');
const { getEmailService } = require('../../lib/emailService');
const crypto = require('crypto');

// Rate limiting configuration
const RATE_LIMIT = {
  maxRequests: 3, // Maximum OTP requests per time window
  timeWindow: 5 * 60 * 1000, // 5 minutes
  cooldownPeriod: 60 * 1000 // 1 minute between requests
};

// Security configuration
const SECURITY = {
  maxEmailLength: 254, // RFC 5321 limit
  allowedDomains: [], // Empty means all domains allowed
  blockedDomains: ['tempmail.com', '10minutemail.com', 'guerrillamail.com'], // Add known temp email domains
  otpLength: 6,
  otpExpiry: 5 * 60 * 1000 // 5 minutes
};

exports.handler = async function(event, context) {
  // Enhanced CORS headers with security
  const headers = {
    'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGINS || '*',
    'Access-Control-Allow-Headers': 'Content-Type, X-Requested-With',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  const startTime = Date.now();
  let database = null;
  let emailService = null;

  try {
    // Parse and validate request body
    let requestData;
    try {
      requestData = JSON.parse(event.body);
    } catch (error) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid request format' })
      };
    }

    const { email } = requestData;

    // Enhanced email validation
    const validationResult = validateEmail(email);
    if (!validationResult.valid) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: validationResult.error })
      };
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Get client information for security logging
    const clientInfo = {
      ip: event.headers['x-forwarded-for'] || event.headers['x-real-ip'] || 'unknown',
      userAgent: event.headers['user-agent'] || 'unknown',
      timestamp: Date.now()
    };

    // Initialize database and email service
    database = getDatabase();
    await database.initialize();
    emailService = getEmailService();

    // Check rate limiting
    const rateLimitCheck = await checkRateLimit(database, normalizedEmail, clientInfo.ip);
    if (!rateLimitCheck.allowed) {
      return {
        statusCode: 429,
        headers: {
          ...headers,
          'Retry-After': Math.ceil(rateLimitCheck.retryAfter / 1000)
        },
        body: JSON.stringify({ 
          error: 'Too many requests. Please try again later.',
          retryAfter: rateLimitCheck.retryAfter
        })
      };
    }

    // Generate secure OTP
    const otp = generateSecureOTP(SECURITY.otpLength);
    const expirationTime = Date.now() + SECURITY.otpExpiry;

    // Store OTP in database with security metadata
    await database.storeOTP(
      normalizedEmail, 
      otp, 
      expirationTime, 
      clientInfo.ip, 
      clientInfo.userAgent
    );

    console.log(`OTP generation request for email: ${normalizedEmail} from IP: ${clientInfo.ip}`);

    // Send email
    let emailResult;
    try {
      emailResult = await emailService.sendOTPEmail(normalizedEmail, otp);
    } catch (error) {
      console.error('Email sending failed:', error.message);
      
      // Clean up stored OTP if email failed
      await database.cleanupExpiredOTPs(normalizedEmail);
      
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Failed to send verification email. Please try again.' 
        })
      };
    }

    // Performance logging
    const processingTime = Date.now() - startTime;
    console.log(`OTP request processed in ${processingTime}ms for ${normalizedEmail}`);

    // Successful response (no sensitive data included)
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Verification code sent to your email',
        expiresIn: Math.floor(SECURITY.otpExpiry / 1000), // in seconds
        method: emailResult.method || 'email'
      })
    };

  } catch (error) {
    console.error('OTP sending error:', error);
    
    // Generic error response to prevent information disclosure
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Service temporarily unavailable. Please try again later.'
      })
    };
  } finally {
    // Cleanup database connection if needed
    // Note: In serverless environments, connections are typically reused
  }
};

// Enhanced email validation function
function validateEmail(email) {
  if (!email) {
    return { valid: false, error: 'Email address is required' };
  }

  if (typeof email !== 'string') {
    return { valid: false, error: 'Invalid email format' };
  }

  if (email.length > SECURITY.maxEmailLength) {
    return { valid: false, error: 'Email address too long' };
  }

  // RFC 5322 compliant email regex (simplified)
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Invalid email format' };
  }

  // Check domain restrictions
  const domain = email.split('@')[1].toLowerCase();
  
  if (SECURITY.allowedDomains.length > 0 && !SECURITY.allowedDomains.includes(domain)) {
    return { valid: false, error: 'Email domain not allowed' };
  }

  if (SECURITY.blockedDomains.includes(domain)) {
    return { valid: false, error: 'Temporary email addresses are not allowed' };
  }

  return { valid: true };
}

// Secure OTP generation using crypto
function generateSecureOTP(length = 6) {
  const digits = '0123456789';
  let otp = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = crypto.randomInt(0, digits.length);
    otp += digits[randomIndex];
  }
  
  return otp;
}

// Rate limiting implementation
async function checkRateLimit(database, email, ipAddress) {
  try {
    // Check email-based rate limiting
    const emailRateLimit = await database.getRateLimitInfo(email, RATE_LIMIT.timeWindow);
    
    if (emailRateLimit.count >= RATE_LIMIT.maxRequests) {
      const timeSinceLastRequest = Date.now() - emailRateLimit.lastRequest;
      const retryAfter = Math.max(0, RATE_LIMIT.cooldownPeriod - timeSinceLastRequest);
      
      return {
        allowed: false,
        reason: 'email_rate_limit',
        retryAfter: retryAfter
      };
    }

    // Check if too recent (cooldown)
    if (emailRateLimit.lastRequest && Date.now() - emailRateLimit.lastRequest < RATE_LIMIT.cooldownPeriod) {
      const retryAfter = RATE_LIMIT.cooldownPeriod - (Date.now() - emailRateLimit.lastRequest);
      return {
        allowed: false,
        reason: 'cooldown',
        retryAfter: retryAfter
      };
    }

    return { allowed: true };
  } catch (error) {
    console.error('Rate limit check error:', error);
    // In case of error, allow the request (fail open for availability)
    return { allowed: true };
  }
}
