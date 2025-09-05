const nodemailer = require('nodemailer');

const fs = require('fs');
const path = require('path');

class EmailService {
  constructor() {
    this.transporter = null;
    this.isConfigured = false;
    this.template = null;
    this.initializeTransporter();
    this.loadTemplate();
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

  loadTemplate() {
    try {
      const templatePath = path.join(__dirname, 'templates', 'otp-email.html');
      this.template = fs.readFileSync(templatePath, 'utf-8');
    } catch (error) {
      console.error('Failed to load email template:', error);
      this.template = 'Your verification code is: {{OTP}}'; // Fallback
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

  async sendOTPEmail(email, otp) {
    const expirationMinutes = 5;
    let htmlContent = this.template
      .replace(/{{OTP}}/g, otp)
      .replace(/{{expirationMinutes}}/g, expirationMinutes);

    if (!this.isConfigured) {
      // For development, log the OTP instead of sending email
      if (process.env.NODE_ENV !== 'production') {
        console.log('=== DEVELOPMENT: EMAIL OTP VERIFICATION ===');
        console.log(`To: ${email}`);
        console.log(`OTP Code: ${otp}`);
        console.log('--- Email HTML Content ---');
        console.log(htmlContent);
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
      html: htmlContent,
      text: `Your HYBE Fan-Permit verification code is: ${otp}. This code will expire in ${expirationMinutes} minutes.`,
      headers: {
        'List-Unsubscribe': `<mailto:${process.env.SUPPORT_EMAIL || 'support@hybecorp.com'}>`
      }
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
