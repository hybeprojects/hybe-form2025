const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ success: false, error: "Method Not Allowed" }),
    };
  }

  try {
    const { email, otp_code } = JSON.parse(event.body || "{}");

    if (!email || !otp_code) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, error: "Email and OTP code are required" }),
      };
    }

    const { data: records, error } = await supabase
      .from("otp_verifications")
      .select("*")
      .eq("email", email)
      .single();

    if (error || !records) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, error: "OTP record not found" }),
      };
    }

    if (records.verified) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, error: "Email already verified" }),
      };
    }

    if (new Date(records.expires_at) < new Date()) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, error: "OTP code has expired" }),
      };
    }

    if (records.attempts >= records.max_attempts) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, error: "Maximum attempts exceeded. Please request a new code." }),
      };
    }

    if (records.otp_code !== otp_code) {
      await supabase
        .from("otp_verifications")
        .update({ attempts: records.attempts + 1 })
        .eq("email", email);

      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, error: "Invalid OTP code" }),
      };
    }

    const { error: verifyError } = await supabase
      .from("otp_verifications")
      .update({ verified: true })
      .eq("email", email);

    if (verifyError) {
      return {
        statusCode: 500,
        body: JSON.stringify({ success: false, error: "Failed to verify OTP" }),
      };
    }

    const token = Buffer.from(
      JSON.stringify({ email, verified: true, timestamp: Date.now() })
    ).toString("base64");

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: "Email verified successfully",
        token,
      }),
    };
  } catch (error) {
    console.error("OTP verify error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: "Failed to verify OTP" }),
    };
  }
};
