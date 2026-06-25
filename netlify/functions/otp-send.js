const { createClient } = require("@supabase/supabase-js");
const { Resend } = require("resend");

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const resend = new Resend(process.env.RESEND_API_KEY);

const supabase = createClient(supabaseUrl, supabaseKey);

const blockedDomains = [
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
];

function validateEmailDomain(email) {
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return { valid: false, error: "Invalid email format" };
  if (blockedDomains.includes(domain)) {
    return { valid: false, error: "Temporary email addresses are not allowed" };
  }
  return { valid: true };
}

function generateOTP(length = 6) {
  return Math.floor(Math.random() * Math.pow(10, length))
    .toString()
    .padStart(length, "0");
}

async function sendOTPEmail(email, otp) {
  await resend.emails.send({
    from: process.env.EMAIL_FROM || "onboarding@resend.dev",
    to: email,
    subject: "Your HYBE Fan-Permit Verification Code",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #000;">Verify Your Email</h2>
        <p>Your verification code is:</p>
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; text-align: center;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #000;">${otp}</span>
        </div>
        <p style="color: #666; font-size: 14px;">This code will expire in 10 minutes.</p>
        <p style="color: #666; font-size: 12px;">If you did not request this code, please ignore this email.</p>
      </div>
    `,
  });
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ success: false, error: "Method Not Allowed" }),
    };
  }

  try {
    const { email } = JSON.parse(event.body || "{}");

    if (!email) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, error: "Email is required" }),
      };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, error: "Invalid email format" }),
      };
    }

    const domainValidation = validateEmailDomain(email);
    if (!domainValidation.valid) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, error: domainValidation.error }),
      };
    }

    const otp = generateOTP();
    const { data, error } = await supabase
      .from("otp_verifications")
      .upsert(
        {
          email,
          otp_code: otp,
          verified: false,
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
          attempts: 0,
          max_attempts: 3,
        },
        { onConflict: "email" }
      )
      .select();

    if (error) throw error;

    await sendOTPEmail(email, otp);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: "OTP sent to your email. Check your inbox and spam folder.",
        expiresAt: data[0].expires_at,
      }),
    };
  } catch (error) {
    console.error("OTP send error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: "Failed to send OTP" }),
    };
  }
};
