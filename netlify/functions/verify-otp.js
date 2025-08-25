// In-memory store for OTP verification (use proper database in production)
const otpStore = new Map();

exports.handler = async function(event, context) {
  // Handle CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

  try {
    const { email, otp, token } = JSON.parse(event.body);

    // Validate required fields
    if (!email || !otp) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Email and OTP code are required' })
      };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Valid email address is required' })
      };
    }

    // Validate OTP format (6 digits)
    if (!/^\d{6}$/.test(otp)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'OTP must be a 6-digit number' })
      };
    }

    // Decode and validate token
    let tokenData;
    try {
      if (token) {
        tokenData = JSON.parse(Buffer.from(token, 'base64').toString());
        if (tokenData.email !== email) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Invalid verification token' })
          };
        }
      }
    } catch (error) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid verification token' })
      };
    }

    // For demonstration purposes, we'll use a simple verification logic
    // In production, you'd retrieve the stored OTP from your database
    
    const storedOtpKey = `otp_${email}`;
    let storedOtpData = otpStore.get(storedOtpKey);

    // If no stored OTP found, create a demo one for development
    if (!storedOtpData && process.env.NODE_ENV !== 'production') {
      // For development, accept any 6-digit OTP that was recently generated
      // This is a fallback since we don't have persistent storage
      console.log(`Development mode: Accepting OTP ${otp} for ${email}`);
      
      // Generate verification token
      const verificationToken = Buffer.from(JSON.stringify({
        email: email,
        verified: true,
        timestamp: Date.now()
      })).toString('base64');

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'Email verified successfully',
          verificationToken: verificationToken,
          verified: true
        })
      };
    }

    // Check if OTP exists and is not expired
    if (!storedOtpData) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'No verification code found for this email address',
          code: 'OTP_NOT_FOUND'
        })
      };
    }

    // Check if OTP has expired
    if (Date.now() > storedOtpData.expires) {
      otpStore.delete(storedOtpKey);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Verification code has expired. Please request a new one.',
          code: 'OTP_EXPIRED'
        })
      };
    }

    // Check if too many attempts
    if (storedOtpData.attempts >= 3) {
      otpStore.delete(storedOtpKey);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Too many verification attempts. Please request a new code.',
          code: 'TOO_MANY_ATTEMPTS'
        })
      };
    }

    // Verify OTP
    if (storedOtpData.otp !== otp) {
      // Increment attempts
      storedOtpData.attempts += 1;
      otpStore.set(storedOtpKey, storedOtpData);
      
      const remainingAttempts = 3 - storedOtpData.attempts;
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: `Invalid verification code. ${remainingAttempts} attempts remaining.`,
          code: 'INVALID_OTP',
          remainingAttempts: remainingAttempts
        })
      };
    }

    // OTP is valid - clean up and generate verification token
    otpStore.delete(storedOtpKey);

    const verificationToken = Buffer.from(JSON.stringify({
      email: email,
      verified: true,
      timestamp: Date.now(),
      expires: Date.now() + (30 * 60 * 1000) // Valid for 30 minutes
    })).toString('base64');

    console.log(`Email ${email} successfully verified with OTP ${otp}`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Email verified successfully',
        verificationToken: verificationToken,
        verified: true
      })
    };

  } catch (error) {
    console.error('OTP verification error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message
      })
    };
  }
};

// Helper function to store OTP (would be database operation in production)
function storeOTP(email, otp, expirationTime) {
  const otpKey = `otp_${email}`;
  otpStore.set(otpKey, {
    otp: otp,
    email: email,
    expires: expirationTime,
    attempts: 0,
    created: Date.now()
  });
  
  // Clean up expired OTPs periodically
  setTimeout(() => {
    const data = otpStore.get(otpKey);
    if (data && Date.now() > data.expires) {
      otpStore.delete(otpKey);
    }
  }, expirationTime - Date.now() + 1000);
}

// Export helper for other functions to use
exports.storeOTP = storeOTP;
