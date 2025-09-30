const crypto = require("crypto");

// Security configuration with environment variable support
const SECURITY_CONFIG = {
  // Rate limiting configuration
  rateLimiting: {
    maxRequests: parseInt(process.env.OTP_RATE_LIMIT_MAX_REQUESTS) || 3,
    timeWindow:
      parseInt(process.env.OTP_RATE_LIMIT_TIME_WINDOW) || 5 * 60 * 1000,
    cooldownPeriod: parseInt(process.env.OTP_RATE_LIMIT_COOLDOWN) || 60 * 1000,
  },

  // Verification rate limiting
  verificationRateLimit: {
    maxAttempts:
      parseInt(process.env.VERIFICATION_RATE_LIMIT_MAX_ATTEMPTS) || 10,
    timeWindow:
      parseInt(process.env.VERIFICATION_RATE_LIMIT_TIME_WINDOW) ||
      15 * 60 * 1000,
    lockoutDuration:
      parseInt(process.env.VERIFICATION_LOCKOUT_DURATION) || 30 * 60 * 1000,
  },

  // Security headers
  securityHeaders: {
    forceHttps: process.env.FORCE_HTTPS === "true",
    allowedOrigins: process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(",")
      : ["*"],
  },
};

// Enhanced security headers with environment-based configuration
function getSecurityHeaders(origin = null) {
  const baseHeaders = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  };

  // Add HSTS only in production or when forced
  if (
    process.env.NODE_ENV === "production" ||
    SECURITY_CONFIG.securityHeaders.forceHttps
  ) {
    baseHeaders["Strict-Transport-Security"] =
      "max-age=31536000; includeSubDomains; preload";
  }

  // Handle CORS with environment configuration
  const allowedOrigins = SECURITY_CONFIG.securityHeaders.allowedOrigins;
  if (allowedOrigins.includes("*") || !origin) {
    baseHeaders["Access-Control-Allow-Origin"] = "*";
  } else if (allowedOrigins.includes(origin)) {
    baseHeaders["Access-Control-Allow-Origin"] = origin;
    baseHeaders["Access-Control-Allow-Credentials"] = "true";
  } else {
    // Origin not allowed
    baseHeaders["Access-Control-Allow-Origin"] = "null";
  }

  baseHeaders["Access-Control-Allow-Headers"] =
    "Content-Type, X-Requested-With, Authorization";
  baseHeaders["Access-Control-Allow-Methods"] = "POST, OPTIONS";
  baseHeaders["Access-Control-Max-Age"] = "86400"; // 24 hours

  return baseHeaders;
}

// Enhanced input sanitization
function sanitizeInput(input, maxLength = 1000) {
  if (typeof input !== "string") {
    return input;
  }

  // Remove control characters and limit length
  return input
    .replace(/[\x00-\x1F\x7F]/g, "") // Remove control characters
    .trim()
    .slice(0, maxLength);
}

// Email domain validation with configurable blocklist
const DEFAULT_BLOCKED_DOMAINS = [
  // Temporary email services
  "tempmail.com",
  "10minutemail.com",
  "guerrillamail.com",
  "mailinator.com",
  "yopmail.com",
  "temp-mail.org",
  "throwaway.email",
  "getnada.com",
  "0clickemail.com",
  "1secmail.com",
  "20minutemail.com",
  "2prong.com",
  // Add more as needed
];

function validateEmailDomain(email) {
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) {
    return { valid: false, error: "Invalid email format" };
  }

  // Check against blocked domains
  const blockedDomains = process.env.BLOCKED_EMAIL_DOMAINS
    ? process.env.BLOCKED_EMAIL_DOMAINS.split(",").map((d) =>
        d.trim().toLowerCase(),
      )
    : DEFAULT_BLOCKED_DOMAINS;

  if (blockedDomains.includes(domain)) {
    return { valid: false, error: "Temporary email addresses are not allowed" };
  }

  // Check allowed domains (if configured)
  const allowedDomains = process.env.ALLOWED_EMAIL_DOMAINS
    ? process.env.ALLOWED_EMAIL_DOMAINS.split(",").map((d) =>
        d.trim().toLowerCase(),
      )
    : [];

  if (allowedDomains.length > 0 && !allowedDomains.includes(domain)) {
    return { valid: false, error: "Email domain not allowed" };
  }

  return { valid: true };
}

// Secure random string generation
function generateSecureToken(length = 32) {
  return crypto.randomBytes(length).toString("hex");
}

// IP address validation and normalization
function normalizeIP(ip) {
  if (!ip || typeof ip !== "string") {
    return "unknown";
  }

  // Handle forwarded headers (comma-separated IPs)
  const firstIP = ip.split(",")[0].trim();

  // Basic IPv4/IPv6 validation
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;

  if (ipv4Regex.test(firstIP) || ipv6Regex.test(firstIP)) {
    return firstIP;
  }

  return "invalid";
}

// User agent validation and normalization
function normalizeUserAgent(userAgent) {
  if (!userAgent || typeof userAgent !== "string") {
    return "unknown";
  }

  // Sanitize and limit length
  return sanitizeInput(userAgent, 500);
}

// Database encryption key management
function getDatabaseEncryptionKey() {
  const key = process.env.DB_ENCRYPTION_KEY;
  if (!key && process.env.NODE_ENV === "production") {
    throw new Error("Database encryption key is required in production");
  }

  if (key && key.length < 32) {
    throw new Error("Database encryption key must be at least 32 characters");
  }

  return key || "development-key-not-for-production-use-32chars";
}

// Security event logging
function logSecurityEvent(eventType, details, severity = "medium") {
  const logEntry = {
    timestamp: new Date().toISOString(),
    eventType: eventType,
    severity: severity,
    details: details,
    environment: process.env.NODE_ENV || "unknown",
  };

  // In development, log to console
  if (process.env.NODE_ENV !== "production") {
    console.warn("Security Event:", JSON.stringify(logEntry, null, 2));
  }

  // In production, send to security monitoring system
  if (process.env.NODE_ENV === "production") {
    // Integrate with security monitoring service if available
    console.error("SECURITY_EVENT:", JSON.stringify(logEntry));
  }
}

// Content Security Policy header generation
function generateCSPHeader() {
  const policies = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://www.googletagmanager.com",
    "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
    "img-src 'self' data: https: http:",
    "font-src 'self' https://cdn.jsdelivr.net",
    "connect-src 'self' https:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ];

  return policies.join("; ");
}

module.exports = {
  SECURITY_CONFIG,
  getSecurityHeaders,
  sanitizeInput,
  validateEmailDomain,
  generateSecureToken,
  normalizeIP,
  normalizeUserAgent,
  getDatabaseEncryptionKey,
  logSecurityEvent,
  generateCSPHeader,
};
