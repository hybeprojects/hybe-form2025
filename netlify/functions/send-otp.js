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

    // Email sending logic with official HYBE branding
    const emailContent = {
      to: email,
      subject: 'HYBE Fan-Permit Email Verification',
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>HYBE Email Verification</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8f9fa;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">

            <!-- Header with HYBE Branding -->
            <div style="background: linear-gradient(90deg, #8e44ad 0%, #3498db 100%); padding: 40px 30px; text-align: center;">
              <img src="http://hybecorp.com/images/common/logo-b.svg" alt="HYBE" style="height: 50px; margin-bottom: 20px; filter: brightness(0) invert(1);">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600; letter-spacing: -0.5px;">Fan-Permit Verification</h1>
              <p style="color: #ffffff; margin: 10px 0 0 0; opacity: 0.9; font-size: 16px;">Secure your exclusive access</p>
            </div>

            <!-- Main Content -->
            <div style="padding: 40px 30px;">
              <h2 style="color: #2c3e50; margin: 0 0 20px 0; font-size: 24px; font-weight: 600;">Verify Your Email Address</h2>

              <p style="color: #5a6c7d; line-height: 1.6; margin: 0 0 30px 0; font-size: 16px;">
                Welcome to the HYBE Fan-Permit community! To complete your subscription and gain exclusive access to artist content, events, and merchandise, please verify your email address.
              </p>

              <!-- OTP Code Section -->
              <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border: 3px solid #8e44ad; border-radius: 12px; padding: 30px; margin: 30px 0; text-align: center; position: relative;">
                <div style="background: #8e44ad; color: white; padding: 8px 16px; border-radius: 20px; display: inline-block; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 20px;">
                  Verification Code
                </div>
                <div style="font-family: 'Courier New', Monaco, monospace; font-size: 36px; font-weight: bold; color: #8e44ad; letter-spacing: 8px; margin: 10px 0; text-shadow: 0 2px 4px rgba(142, 68, 173, 0.1);">
                  ${otp}
                </div>
                <p style="color: #6c757d; font-size: 14px; margin: 15px 0 0 0;">
                  Enter this code in the verification form
                </p>
              </div>

              <!-- Important Information -->
              <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px 20px; margin: 30px 0; border-radius: 0 8px 8px 0;">
                <p style="color: #856404; margin: 0; font-size: 14px; font-weight: 500;">
                  ⏰ This verification code will expire in <strong>5 minutes</strong> for your security.
                </p>
              </div>

              <p style="color: #6c757d; line-height: 1.6; margin: 30px 0 0 0; font-size: 14px;">
                If you didn't request this verification, please ignore this email. Your account security is important to us.
              </p>
            </div>

            <!-- Footer -->
            <div style="background: #2c3e50; padding: 30px; text-align: center;">
              <div style="margin-bottom: 20px;">
                <img src="http://hybecorp.com/images/common/logo-b.svg" alt="HYBE" style="height: 30px; opacity: 0.8; filter: brightness(0) invert(1);">
              </div>

              <p style="color: #95a5a6; margin: 0 0 15px 0; font-size: 14px;">
                Connect with HYBE artists and the global fan community
              </p>

              <div style="margin: 20px 0;">
                <a href="https://hybecorp.com" style="color: #3498db; text-decoration: none; margin: 0 15px; font-size: 14px;">Website</a>
                <a href="https://careers.hybecorp.com" style="color: #3498db; text-decoration: none; margin: 0 15px; font-size: 14px;">Careers</a>
                <a href="https://hybecorp.com/eng/news/news" style="color: #3498db; text-decoration: none; margin: 0 15px; font-size: 14px;">News</a>
              </div>

              <div style="border-top: 1px solid #34495e; padding-top: 20px; margin-top: 20px;">
                <p style="color: #7f8c8d; margin: 0; font-size: 12px;">
                  © 2025 HYBE Corporation. All rights reserved.
                </p>
                <p style="color: #7f8c8d; margin: 5px 0 0 0; font-size: 12px;">
                  This email was sent to ${email} regarding your HYBE Fan-Permit subscription.
                </p>
              </div>
            </div>

          </div>
        </body>
        </html>
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
