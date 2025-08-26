const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.isConfigured = false;
    this.initializeTransporter();
  }

  initializeTransporter() {
    // Check for email configuration
    const emailConfig = {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    };

    // Alternative configurations for different providers
    if (process.env.EMAIL_PROVIDER === 'gmail') {
      emailConfig.service = 'gmail';
      emailConfig.auth = {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD // App-specific password
      };
    } else if (process.env.EMAIL_PROVIDER === 'sendgrid') {
      emailConfig.host = 'smtp.sendgrid.net';
      emailConfig.port = 587;
      emailConfig.auth = {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY
      };
    }

    // Only create transporter if we have valid config
    if (emailConfig.host && emailConfig.auth.user && emailConfig.auth.pass) {
      try {
        this.transporter = nodemailer.createTransport(emailConfig);
        this.isConfigured = true;
        console.log('Email service configured successfully');
      } catch (error) {
        console.error('Email service configuration error:', error);
        this.isConfigured = false;
      }
    } else {
      console.warn('Email service not configured - missing SMTP credentials');
      this.isConfigured = false;
    }
  }

  async verifyConnection() {
    if (!this.isConfigured) {
      throw new Error('Email service not configured');
    }

    try {
      await this.transporter.verify();
      console.log('Email service connection verified');
      return true;
    } catch (error) {
      console.error('Email service verification failed:', error);
      throw error;
    }
  }

  generateOTPEmailHTML(otp, email) {
    return `
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
    `;
  }

  async sendOTPEmail(email, otp) {
    if (!this.isConfigured) {
      // For development, log the OTP instead of sending email
      if (process.env.NODE_ENV !== 'production') {
        console.log('=== DEVELOPMENT: EMAIL OTP VERIFICATION ===');
        console.log(`To: ${email}`);
        console.log(`OTP Code: ${otp}`);
        console.log('==========================================');
        return { success: true, method: 'console' };
      } else {
        throw new Error('Email service not configured');
      }
    }

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.SMTP_USER,
      to: email,
      subject: 'HYBE Fan-Permit Email Verification',
      html: this.generateOTPEmailHTML(otp, email),
      text: `Your HYBE Fan-Permit verification code is: ${otp}. This code will expire in 5 minutes.`
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log(`OTP email sent successfully to ${email}`);
      
      return {
        success: true,
        messageId: info.messageId,
        method: 'smtp'
      };
    } catch (error) {
      console.error('Email sending error:', error);
      throw error;
    }
  }
}

// Singleton instance
let emailServiceInstance = null;

function getEmailService() {
  if (!emailServiceInstance) {
    emailServiceInstance = new EmailService();
  }
  return emailServiceInstance;
}

module.exports = {
  getEmailService,
  EmailService
};
