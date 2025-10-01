// Netlify Function: submit-form
// Handles subscription form submission with basic sanitization and validation.

function sanitizeInput(input) {
  if (typeof input !== "string") return input;
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=/gi, "")
    .trim();
}

function validate(data) {
  const errors = [];
  if (!data["full-name"]) errors.push("Missing required field: full-name");
  if (!data.email) errors.push("Missing required field: email");
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (data.email && !emailRegex.test(String(data.email))) {
    errors.push("Invalid email format");
  }
  return errors;
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: {
        "Content-Type": "application/json",
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "X-XSS-Protection": "1; mode=block",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
      },
      body: JSON.stringify({ success: false, message: "Method Not Allowed" }),
    };
  }

  let body = {};
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ success: false, message: "Invalid JSON body" }),
    };
  }

  // Sanitize inputs
  const sanitized = {};
  for (const [k, v] of Object.entries(body)) {
    sanitized[k] = typeof v === "string" ? sanitizeInput(v) : v;
  }

  // Validate
  const errors = validate(sanitized);
  if (errors.length) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ success: false, message: errors.join(", ") }),
    };
  }

  // Non-destructive processing (no DB/email here)
  const response = {
    success: true,
    message: "Form submitted successfully.",
    timestamp: new Date().toISOString(),
  };

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "X-XSS-Protection": "1; mode=block",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    },
    body: JSON.stringify(response),
  };
};
