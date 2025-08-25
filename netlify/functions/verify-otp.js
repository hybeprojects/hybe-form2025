const { getDatabase } = require('../../lib/database');
const crypto = require('crypto');

// Security configuration
const SECURITY = {
  maxEmailLength: 254,
  otpLength: 6,
  verificationTokenExpiry: 30 * 60 * 1000, // 30 minutes
  maxVerificationAttempts: 5, // Global attempts per IP
  verificationCooldown: 60 * 1000 // 1 minute cooldown after failed attempts
};

// Rate limiting for verification attempts
const VERIFICATION_RATE_LIMIT = {
  maxAttempts: 10, // Max verification attempts per IP per time window
  timeWindow: 15 * 60 * 1000, // 15 minutes
  lockoutDuration: 30 * 60 * 1000 // 30 minutes lockout after exceeding limit
};

// In-memory storage for verification attempt tracking (use Redis in production)
const verificationAttempts = new Map();
const ipLockouts = new Map();

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

    const { email, otp } = requestData;

    // Get client information for security logging
    const clientInfo = {
      ip: event.headers['x-forwarded-for'] || event.headers['x-real-ip'] || 'unknown',
      userAgent: event.headers['user-agent'] || 'unknown',
      timestamp: Date.now()
    };

    // Enhanced input validation
    const validationResult = validateVerificationInput(email, otp);
    if (!validationResult.valid) {
      await logFailedAttempt(clientInfo, 'validation_failed', email);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: validationResult.error })
      };
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Check IP-based rate limiting and lockouts
    const ipCheck = checkIPRateLimit(clientInfo.ip);
    if (!ipCheck.allowed) {
      await logFailedAttempt(clientInfo, 'rate_limited', normalizedEmail);
      return {
        statusCode: 429,
        headers: {
          ...headers,
          'Retry-After': Math.ceil(ipCheck.retryAfter / 1000)
        },
        body: JSON.stringify({ 
          error: 'Too many verification attempts. Please try again later.',
          retryAfter: ipCheck.retryAfter
        })
      };
    }

    // Initialize database
    database = getDatabase();
    await database.initialize();

    // Attempt to verify OTP
    console.log(`OTP verification attempt for email: ${normalizedEmail} from IP: ${clientInfo.ip}`);
    
    const verificationResult = await database.verifyOTP(normalizedEmail, otp);

    if (!verificationResult.success) {
      // Log failed verification attempt
      await logFailedAttempt(clientInfo, 'otp_failed', normalizedEmail);
      
      // Increment IP-based attempt counter
      incrementIPAttempts(clientInfo.ip);

      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: verificationResult.error,
          code: verificationResult.code,
          remainingAttempts: verificationResult.remainingAttempts
        })
      };
    }

    // Generate secure verification token
    const verificationToken = generateVerificationToken(normalizedEmail);

    // Log successful verification
    console.log(`Successful email verification for: ${normalizedEmail} from IP: ${clientInfo.ip}`);
    
    // Clear failed attempts for this IP
    clearIPAttempts(clientInfo.ip);

    // Performance logging
    const processingTime = Date.now() - startTime;
    console.log(`OTP verification processed in ${processingTime}ms for ${normalizedEmail}`);

    // Successful response
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Email verified successfully',
        verificationToken: verificationToken,
        verified: true,
        expiresIn: Math.floor(SECURITY.verificationTokenExpiry / 1000)
      })
    };

  } catch (error) {
    console.error('OTP verification error:', error);
    
    // Generic error response to prevent information disclosure
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Service temporarily unavailable. Please try again later.'
      })
    };
  } finally {
    // Cleanup expired attempts periodically
    cleanupExpiredAttempts();
  }
};

// Enhanced input validation
function validateVerificationInput(email, otp) {
  if (!email || !otp) {
    return { valid: false, error: 'Email and verification code are required' };
  }

  if (typeof email !== 'string' || typeof otp !== 'string') {
    return { valid: false, error: 'Invalid input format' };
  }

  if (email.length > SECURITY.maxEmailLength) {
    return { valid: false, error: 'Email address too long' };
  }

  // Validate email format
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Invalid email format' };
  }

  // Validate OTP format (exactly 6 digits)
  const otpRegex = new RegExp(`^\\d{${SECURITY.otpLength}}$`);
  if (!otpRegex.test(otp)) {
    return { valid: false, error: `Verification code must be exactly ${SECURITY.otpLength} digits` };
  }

  return { valid: true };
}

// Generate secure verification token
function generateVerificationToken(email) {
  const tokenData = {
    email: email,
    verified: true,
    timestamp: Date.now(),
    expires: Date.now() + SECURITY.verificationTokenExpiry,
    nonce: crypto.randomBytes(16).toString('hex') // Add randomness to prevent token prediction
  };

  const tokenString = JSON.stringify(tokenData);
  return Buffer.from(tokenString).toString('base64');
}

// IP-based rate limiting and lockout
function checkIPRateLimit(ip) {
  const now = Date.now();

  // Check if IP is locked out
  const lockout = ipLockouts.get(ip);
  if (lockout && now < lockout.until) {
    return {
      allowed: false,
      reason: 'ip_locked_out',
      retryAfter: lockout.until - now
    };
  }

  // Check attempt rate
  const attempts = verificationAttempts.get(ip) || { count: 0, windowStart: now };
  
  // Reset window if expired
  if (now - attempts.windowStart > VERIFICATION_RATE_LIMIT.timeWindow) {
    attempts.count = 0;
    attempts.windowStart = now;
  }

  if (attempts.count >= VERIFICATION_RATE_LIMIT.maxAttempts) {
    // Lock out the IP
    ipLockouts.set(ip, {
      until: now + VERIFICATION_RATE_LIMIT.lockoutDuration,
      reason: 'rate_limit_exceeded'
    });

    return {
      allowed: false,
      reason: 'rate_limit_exceeded',
      retryAfter: VERIFICATION_RATE_LIMIT.lockoutDuration
    };
  }

  return { allowed: true };
}

function incrementIPAttempts(ip) {
  const now = Date.now();
  const attempts = verificationAttempts.get(ip) || { count: 0, windowStart: now };
  
  // Reset window if expired
  if (now - attempts.windowStart > VERIFICATION_RATE_LIMIT.timeWindow) {
    attempts.count = 1;
    attempts.windowStart = now;
  } else {
    attempts.count++;
  }

  verificationAttempts.set(ip, attempts);
}

function clearIPAttempts(ip) {
  verificationAttempts.delete(ip);
  ipLockouts.delete(ip);
}

// Security logging function
async function logFailedAttempt(clientInfo, reason, email = null) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    ip: clientInfo.ip,
    userAgent: clientInfo.userAgent,
    reason: reason,
    email: email ? hashEmail(email) : null // Hash email for privacy
  };

  console.warn('Failed verification attempt:', JSON.stringify(logEntry));
  
  // In production, send to security monitoring system
  // await sendToSecurityMonitoring(logEntry);
}

// Hash email for privacy in logs
function hashEmail(email) {
  return crypto.createHash('sha256').update(email.toLowerCase()).digest('hex').substring(0, 8);
}

// Cleanup expired attempts and lockouts
function cleanupExpiredAttempts() {
  const now = Date.now();
  
  // Cleanup expired lockouts
  for (const [ip, lockout] of ipLockouts.entries()) {
    if (now > lockout.until) {
      ipLockouts.delete(ip);
    }
  }

  // Cleanup old attempt records
  for (const [ip, attempts] of verificationAttempts.entries()) {
    if (now - attempts.windowStart > VERIFICATION_RATE_LIMIT.timeWindow * 2) {
      verificationAttempts.delete(ip);
    }
  }
}

// Validation function for verification tokens (for use by other functions)
function validateVerificationToken(token) {
  try {
    const tokenData = JSON.parse(Buffer.from(token, 'base64').toString());
    
    if (!tokenData.verified || !tokenData.email || !tokenData.expires) {
      return { valid: false, error: 'Invalid token format' };
    }

    if (Date.now() > tokenData.expires) {
      return { valid: false, error: 'Token expired' };
    }

    return { 
      valid: true, 
      email: tokenData.email,
      timestamp: tokenData.timestamp 
    };
  } catch (error) {
    return { valid: false, error: 'Invalid token' };
  }
}

// Export for use by other functions
module.exports = {
  handler: exports.handler,
  validateVerificationToken
};
