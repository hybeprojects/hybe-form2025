const { getDatabase } = require('../database');
const { getEmailService } = require('../emailService');
const { getSecurityHeaders, normalizeIP, normalizeUserAgent, SECURITY_CONFIG } = require('../security');
const crypto = require('crypto');

// Local security config mirroring original function
const SECURITY = {
  maxEmailLength: 254,
  allowedDomains: [],
  blockedDomains: ['tempmail.com', '10minutemail.com', 'guerrillamail.com'],
  otpLength: 6,
  otpExpiry: 5 * 60 * 1000,
};

const RATE_LIMIT = SECURITY_CONFIG.rateLimiting;

function validateEmail(email) {
  if (!email || typeof email !== 'string') return { valid: false, error: 'Email address is required' };
  if (email.length > SECURITY.maxEmailLength) return { valid: false, error: 'Email address too long' };
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  if (!emailRegex.test(email)) return { valid: false, error: 'Invalid email format' };
  const domain = email.split('@')[1].toLowerCase();
  if (SECURITY.allowedDomains.length > 0 && !SECURITY.allowedDomains.includes(domain)) return { valid: false, error: 'Email domain not allowed' };
  if (SECURITY.blockedDomains.includes(domain)) return { valid: false, error: 'Temporary email addresses are not allowed' };
  return { valid: true };
}

function generateSecureOTP(length = 6) {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += digits[crypto.randomInt(0, digits.length)];
  }
  return otp;
}

async function checkRateLimit(database, email) {
  try {
    const info = await database.getRateLimitInfo(email, RATE_LIMIT.timeWindow);
    if (info.count >= RATE_LIMIT.maxRequests) {
      const retryAfter = Math.max(0, RATE_LIMIT.cooldownPeriod - (Date.now() - (Number(info.lastRequest) || 0)));
      return { allowed: false, retryAfter };
    }
    if (info.lastRequest && Date.now() - Number(info.lastRequest) < RATE_LIMIT.cooldownPeriod) {
      const retryAfter = RATE_LIMIT.cooldownPeriod - (Date.now() - Number(info.lastRequest));
      return { allowed: false, retryAfter };
    }
    return { allowed: true };
  } catch (e) {
    console.error('Rate limit check error:', e);
    return { allowed: true };
  }
}

async function sendOtp(req, res) {
  const origin = req.headers.origin || req.headers.referer || null;
  const headers = getSecurityHeaders(origin);
  Object.entries(headers).forEach(([k, v]) => res.setHeader(k, v));

  if (req.method === 'OPTIONS') return res.sendStatus(200);
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const start = Date.now();
  try {
    const { email } = req.body || {};
    const validation = validateEmail(email);
    if (!validation.valid) return res.status(400).json({ error: validation.error });

    const normalizedEmail = String(email).toLowerCase().trim();
    const clientInfo = {
      ip: normalizeIP(req.headers['x-forwarded-for'] || req.ip),
      userAgent: normalizeUserAgent(req.headers['user-agent']),
      timestamp: Date.now(),
      origin,
    };

    const database = getDatabase();
    await database.initialize();
    const emailService = getEmailService();

    const rl = await checkRateLimit(database, normalizedEmail);
    if (!rl.allowed) {
      res.setHeader('Retry-After', Math.ceil(rl.retryAfter / 1000));
      return res.status(429).json({ error: 'Too many requests. Please try again later.', retryAfter: rl.retryAfter });
    }

    const otp = generateSecureOTP(SECURITY.otpLength);
    const expirationTime = Date.now() + SECURITY.otpExpiry;

    await database.storeOTP(normalizedEmail, otp, expirationTime, clientInfo.ip, clientInfo.userAgent);

    let emailResult;
    try {
      emailResult = await emailService.sendOTPEmail(normalizedEmail, otp);
    } catch (err) {
      console.error('Email sending failed:', err.message);
      await database.cleanupExpiredOTPs(normalizedEmail);
      return res.status(500).json({ error: 'Failed to send verification email. Please try again.' });
    }

    const processing = Date.now() - start;
    console.log(`OTP request processed in ${processing}ms for ${normalizedEmail}`);

    const payload = {
      success: true,
      message: 'Verification code sent to your email',
      expiresIn: Math.floor(SECURITY.otpExpiry / 1000),
      resendAfter: Math.floor(RATE_LIMIT.cooldownPeriod / 1000),
      method: emailResult.method || 'email',
    };
    if (process.env.DEBUG_OTP === 'true') payload.debugOtp = otp;

    return res.status(200).json(payload);
  } catch (e) {
    console.error('OTP send error:', e);
    return res.status(500).json({ error: 'Service temporarily unavailable. Please try again later.' });
  }
}

module.exports = { sendOtp };
