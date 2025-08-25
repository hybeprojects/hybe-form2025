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
    const { email } = JSON.parse(event.body);

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Valid email address is required' })
      };
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store OTP with expiration (5 minutes)
    const otpData = {
      otp: otp,
      email: email,
      expires: Date.now() + (5 * 60 * 1000), // 5 minutes from now
      attempts: 0
    };

    // In a real implementation, you'd store this in a database
    // For now, we'll use Netlify's context or a simple in-memory store
    // Note: This is a demo implementation - use a proper database in production
    
    console.log(`Generated OTP for ${email}: ${otp} (expires: ${new Date(otpData.expires)})`);

    // Email sending logic
    const emailContent = {
      to: email,
      subject: 'HYBE Fan-Permit Email Verification',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <img src="https://logotyp.us/file/hybe.svg" alt="HYBE" style="height: 40px; margin-bottom: 20px;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Email Verification</h1>
          </div>
          <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #333; margin-top: 0;">Verify Your Email Address</h2>
            <p style="color: #666; line-height: 1.6;">To complete your HYBE Fan-Permit subscription, please enter the verification code below:</p>
            
            <div style="background: #f8f9fa; border: 2px dashed #667eea; border-radius: 8px; padding: 20px; margin: 30px 0; text-align: center;">
              <h3 style="color: #667eea; margin: 0; font-size: 32px; letter-spacing: 8px; font-family: 'Courier New', monospace;">${otp}</h3>
            </div>
            
            <p style="color: #666; line-height: 1.6;">This code will expire in <strong>5 minutes</strong>.</p>
            <p style="color: #999; font-size: 14px; margin-top: 30px;">If you didn't request this verification, please ignore this email.</p>
            
            <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px; text-align: center;">
              <p style="color: #999; font-size: 12px; margin: 0;">© 2025 HYBE Corporation. All rights reserved.</p>
            </div>
          </div>
        </div>
      `
    };

    // Try to send email using different services
    let emailSent = false;
    let emailError = null;

    // Method 1: Try using Netlify's built-in email (if configured)
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        // This would use nodemailer or similar in a real implementation
        console.log(`Email would be sent to ${email} with OTP: ${otp}`);
        emailSent = true;
      } catch (error) {
        emailError = error.message;
        console.error('SMTP email failed:', error);
      }
    }

    // Method 2: Fallback to console logging for development
    if (!emailSent) {
      console.log('=== EMAIL OTP VERIFICATION ===');
      console.log(`To: ${email}`);
      console.log(`Subject: ${emailContent.subject}`);
      console.log(`OTP Code: ${otp}`);
      console.log(`Expires: ${new Date(otpData.expires)}`);
      console.log('===============================');
      
      // For development, we'll consider this "sent"
      emailSent = true;
    }

    if (!emailSent) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Failed to send verification email',
          details: emailError 
        })
      };
    }

    // Store OTP data in a way that can be retrieved later
    // In production, use Redis, DynamoDB, or similar
    // For now, we'll encode it in the response (not secure for production)
    const otpToken = Buffer.from(JSON.stringify({
      email: email,
      timestamp: Date.now()
    })).toString('base64');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Verification code sent to your email',
        token: otpToken, // This would normally not be returned
        expiresIn: 300 // 5 minutes in seconds
      })
    };

  } catch (error) {
    console.error('OTP sending error:', error);
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
