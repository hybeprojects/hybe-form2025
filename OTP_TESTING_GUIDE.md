# HYBE Email OTP Testing Guide

## Overview
This guide provides comprehensive testing procedures for the HYBE Fan-Permit email OTP verification system.

## Test Environment Setup

### Prerequisites
- Node.js and npm installed
- SQLite3 dependency installed
- Netlify CLI configured
- Development server running on port 3000

### Starting the Test Environment
```bash
npm install
npx netlify dev
```

## Testing Methods

### Method 1: Browser Console Testing

1. **Open the application** in your browser: `http://localhost:3000`
2. **Open Developer Tools** (F12)
3. **Go to Console tab**
4. **Run the test suite**:
   ```javascript
   testEmailOTP()
   ```

### Method 2: Manual UI Testing

1. **Fill out the form** with valid information
2. **Enter an email address** in the email field
3. **Click the "Verify" button** next to the email field
4. **Follow the OTP verification modal**

### Method 3: Direct API Testing

Use any HTTP client to test the endpoints directly:

```bash
# Send OTP
POST http://localhost:3000/.netlify/functions/send-otp
Content-Type: application/json
{
  "email": "test@example.com"
}

# Verify OTP
POST http://localhost:3000/.netlify/functions/verify-otp
Content-Type: application/json
{
  "email": "test@example.com",
  "otp": "123456"
}
```

## Test Cases

### 1. OTP Generation and Sending
**Expected Behavior:**
- ✅ Valid email addresses should receive OTP
- ✅ Invalid email formats should be rejected
- ✅ Temporary email domains should be blocked
- ✅ Rate limiting should prevent spam (3 requests per 5 minutes)

**Test Steps:**
1. Send OTP to valid email
2. Send OTP to invalid email format
3. Send OTP to blocked domain (e.g., tempmail.com)
4. Send multiple OTPs rapidly to test rate limiting

### 2. OTP Verification
**Expected Behavior:**
- ✅ Correct OTP should verify successfully
- ✅ Incorrect OTP should be rejected
- ✅ Expired OTP should be rejected (5 minutes)
- ✅ Too many attempts should lock the OTP (3 attempts)

**Test Steps:**
1. Verify with correct OTP
2. Verify with incorrect OTP
3. Wait 5+ minutes and try to verify
4. Make 4+ incorrect attempts

### 3. Security Features
**Expected Behavior:**
- ✅ Rate limiting prevents abuse
- ✅ IP-based lockouts work correctly
- ✅ Security headers are present
- ✅ Input validation prevents injection

**Test Steps:**
1. Make rapid OTP requests (should hit rate limit)
2. Make rapid verification attempts (should hit IP lockout)
3. Check response headers for security headers
4. Try malicious inputs (XSS, SQL injection)

### 4. Database Integration
**Expected Behavior:**
- ✅ OTPs are stored securely (hashed)
- ✅ Expired OTPs are cleaned up
- ✅ Database connections are managed properly
- ✅ Concurrent access works correctly

**Test Steps:**
1. Check database file is created
2. Verify OTP data is hashed, not plaintext
3. Check automatic cleanup of expired records
4. Test concurrent OTP operations

### 5. Form Integration
**Expected Behavior:**
- ✅ Email verification status updates correctly
- ✅ Submit button is disabled until verification
- ✅ Progress bar includes verification status
- ✅ Modal flows work properly

**Test Steps:**
1. Fill form without email verification
2. Try to submit (should be blocked)
3. Verify email and check UI updates
4. Submit form after verification

## Development Mode Testing

In development mode (NODE_ENV !== 'production'):
- ✅ OTPs are logged to console instead of sent via email
- ✅ Any 6-digit OTP should work for verification
- ✅ Look for console messages like "=== DEVELOPMENT: EMAIL OTP VERIFICATION ==="

## Production Testing Checklist

### Email Configuration
- [ ] SMTP credentials are configured
- [ ] Email service is working (SendGrid, Gmail, etc.)
- [ ] Email templates render correctly
- [ ] Email delivery is reliable

### Security Configuration
- [ ] Environment variables are set securely
- [ ] Database encryption is enabled
- [ ] Rate limiting is properly configured
- [ ] Security headers are present

### Performance Testing
- [ ] OTP generation is fast (< 1 second)
- [ ] Database operations are efficient
- [ ] Memory usage is stable
- [ ] No memory leaks under load

## Common Issues and Solutions

### 1. 404 Errors on OTP Endpoints
**Solution:** Ensure Netlify CLI is running (`npx netlify dev`)

### 2. Database Connection Errors
**Solution:** Check file permissions and SQLite3 installation

### 3. Email Not Sending
**Solution:** 
- Check SMTP configuration in environment variables
- Verify email service credentials
- Check console logs for error messages

### 4. Rate Limiting Too Aggressive
**Solution:** Adjust rate limiting configuration in environment variables

### 5. OTP Verification Always Fails
**Solution:** 
- Check if you're in development mode
- Verify database connectivity
- Check OTP expiration times

## Monitoring and Logs

### Key Log Messages to Monitor
- `OTP generation request for email: xxx`
- `OTP verification attempt for email: xxx`
- `Successful email verification for: xxx`
- `Failed verification attempt:` (security events)
- `Database maintenance: Cleaned up X expired OTPs`

### Performance Metrics
- OTP generation time
- Email delivery time
- Database query performance
- Memory usage patterns

## Security Events to Watch
- Repeated failed verification attempts
- Rate limiting activations
- Blocked domain attempts
- Suspicious IP activity

## Testing Automation

For automated testing, use the provided test functions:
```javascript
// Run all tests
await testEmailOTP();

// Test specific functionality
testFormIntegration();
```

## Conclusion

This testing framework ensures the HYBE Email OTP system is:
- ✅ Secure against common attacks
- ✅ Reliable under normal usage
- ✅ User-friendly and accessible
- ✅ Performance optimized
- ✅ Production ready

Regular testing should be performed to maintain system integrity and security.
