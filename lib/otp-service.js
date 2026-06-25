const crypto = require("crypto");
const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

function generateOTP(length = 6) {
  return crypto.randomInt(10 ** (length - 1), 10 ** length).toString();
}

async function sendOTPEmail(email, otp) {
  try {
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
    return { success: true };
  } catch (error) {
    console.error("Failed to send OTP email:", error);
    throw error;
  }
}

async function createOTPRecord(email, supabase) {
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
  return { otp, record: data?.[0] };
}

async function verifyOTP(email, code, supabase) {
  const { data: records, error } = await supabase
    .from("otp_verifications")
    .select("*")
    .eq("email", email)
    .single();

  if (error || !records) {
    return { success: false, error: "OTP record not found" };
  }

  if (records.verified) {
    return { success: false, error: "Email already verified" };
  }

  if (new Date(records.expires_at) < new Date()) {
    return { success: false, error: "OTP code has expired" };
  }

  if (records.attempts >= records.max_attempts) {
    return { success: false, error: "Maximum attempts exceeded. Please request a new code." };
  }

  if (records.otp_code !== code) {
    const { error: updateError } = await supabase
      .from("otp_verifications")
      .update({ attempts: records.attempts + 1 })
      .eq("email", email);

    if (updateError) console.error("Failed to update attempts:", updateError);
    return { success: false, error: "Invalid OTP code" };
  }

  const { error: verifyError } = await supabase
    .from("otp_verifications")
    .update({ verified: true })
    .eq("email", email);

  if (verifyError) {
    return { success: false, error: "Failed to verify OTP" };
  }

  return { success: true, email };
}

async function cleanupExpiredOTPs(supabase) {
  const { error } = await supabase
    .from("otp_verifications")
    .delete()
    .lt("expires_at", new Date().toISOString());

  if (error) console.error("Failed to cleanup expired OTPs:", error);
}

module.exports = {
  generateOTP,
  sendOTPEmail,
  createOTPRecord,
  verifyOTP,
  cleanupExpiredOTPs,
};
