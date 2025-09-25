const { getDatabase } = require('../database');
const { getSecurityHeaders, normalizeIP, normalizeUserAgent, SECURITY_CONFIG } = require('../security');
const crypto = require('crypto');

const SECURITY = {
  maxEmailLength: 254,
  otpLength: 6,
  verificationTokenExpiry: 30 * 60 * 1000,
};

const VERIFICATION_RATE_LIMIT = SECURITY_CONFIG.verificationRateLimit;
const verificationAttempts = new Map();
const ipLockouts = new Map();

function validateVerificationInput(email, otp) {
  if (!email || !otp) return { valid: false, error: 'Email and verification code are required' };
  if (typeof email !== 'string' || typeof otp !== 'string') return { valid: false, error: 'Invalid input format' };
  if (email.length > SECURITY.maxEmailLength) return { valid: false, error: 'Email address too long' };
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  if (!emailRegex.test(email)) return { valid: false, error: 'Invalid email format' };
  const otpRegex = new RegExp(`^\\d{${SECURITY.otpLength}}$`);
  if (!otpRegex.test(otp)) return { valid: false, error: `Verification code must be exactly ${SECURITY.otpLength} digits` };
  return { valid: true };
}

function checkIPRateLimit(ip) {
  const now = Date.now();
  const lock = ipLockouts.get(ip);
  if (lock && now < lock.until) return { allowed: false, retryAfter: lock.until - now };
  const attempts = verificationAttempts.get(ip) || { count: 0, windowStart: now };
  if (now - attempts.windowStart > VERIFICATION_RATE_LIMIT.timeWindow) {
    attempts.count = 0; attempts.windowStart = now;
  }
  if (attempts.count >= VERIFICATION_RATE_LIMIT.maxAttempts) {
    ipLockouts.set(ip, { until: now + VERIFICATION_RATE_LIMIT.lockoutDuration });
    return { allowed: false, retryAfter: VERIFICATION_RATE_LIMIT.lockoutDuration };
  }
  return { allowed: true };
}

function incrementIPAttempts(ip) {
  const now = Date.now();
  const attempts = verificationAttempts.get(ip) || { count: 0, windowStart: now };
  if (now - attempts.windowStart > VERIFICATION_RATE_LIMIT.timeWindow) { attempts.count = 1; attempts.windowStart = now; }
  else { attempts.count++; }
  verificationAttempts.set(ip, attempts);
}

function clearIPAttempts(ip) {
  verificationAttempts.delete(ip);
  ipLockouts.delete(ip);
}

function generateVerificationToken(email) {
  const tokenData = {
    email,
    verified: true,
    timestamp: Date.now(),
    expires: Date.now() + SECURITY.verificationTokenExpiry,
    nonce: crypto.randomBytes(16).toString('hex'),
  };
  return Buffer.from(JSON.stringify(tokenData)).toString('base64');
}

async function verifyOtp(req, res) {
  const origin = req.headers.origin || req.headers.referer || null;
  const headers = getSecurityHeaders(origin);
  Object.entries(headers).forEach(([k, v]) => res.setHeader(k, v));

  if (req.method === 'OPTIONS') return res.sendStatus(200);
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { email, otp } = req.body || {};
    const clientInfo = { ip: normalizeIP(req.headers['x-forwarded-for'] || req.ip), userAgent: normalizeUserAgent(req.headers['user-agent']) };

    const validation = validateVerificationInput(email, otp);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const normalizedEmail = String(email).toLowerCase().trim();

    const ipCheck = checkIPRateLimit(clientInfo.ip);
    if (!ipCheck.allowed) {
      res.setHeader('Retry-After', Math.ceil(ipCheck.retryAfter / 1000));
      return res.status(429).json({ error: 'Too many verification attempts. Please try again later.', retryAfter: ipCheck.retryAfter });
    }

    const database = getDatabase();
    await database.initialize();

    const result = await database.verifyOTP(normalizedEmail, otp);
    if (!result.success) {
      incrementIPAttempts(clientInfo.ip);
      return res.status(400).json({ error: result.error, code: result.code, remainingAttempts: result.remainingAttempts });
    }

    const token = generateVerificationToken(normalizedEmail);
    clearIPAttempts(clientInfo.ip);

    return res.status(200).json({ success: true, message: 'Email verified successfully', verificationToken: token, verified: true, expiresIn: Math.floor(SECURITY.verificationTokenExpiry / 1000) });
  } catch (e) {
    console.error('OTP verification error:', e);
    return res.status(500).json({ error: 'Service temporarily unavailable. Please try again later.' });
  }
}

module.exports = { verifyOtp };
