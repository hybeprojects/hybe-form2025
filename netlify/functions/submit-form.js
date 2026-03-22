// Netlify Function: submit-form
// Handles subscription form submission with basic sanitization and validation.

// Complete HYBE Referral Code List
const referralCodeMap = {
  // BTS
  HYBE2025: "BTS (Group)",
  RMKING: "RM",
  JINLOVE: "Jin",
  YOONGI: "SUGA",
  HOPE23: "j-hope",
  NAMJOON: "RM",
  JIMIN24: "Jimin",
  TAEHYUNG: "V",
  JKGOLD: "Jung Kook",
  // TXT
  TXT2025: "TXT (Group)",
  SOOBIN05: "SOOBIN",
  YEONJUN05: "YEONJUN",
  BEOMGYU05: "BEOMGYU",
  TAEHYUN05: "TAEHYUN",
  HUENINGKAI: "HUENINGKAI",
  // SEVENTEEN
  SEVENTEEN17: "SEVENTEEN (Group)",
  SCOUPS17: "S.COUPS",
  JEONGHAN17: "JEONGHAN",
  JOSHUA17: "JOSHUA",
  JUN17: "JUN",
  HOSHI17: "HOSHI",
  WONWOO17: "WONWOO",
  WOOZI17: "WOOZI",
  THE817: "THE 8",
  MINGYU17: "MINGYU",
  DK17: "DK",
  SEUNGKWAN17: "SEUNGKWAN",
  VERNON17: "VERNON",
  DINO17: "DINO",
  // fromis_9
  FROMIS9: "fromis_9 (Group)",
  SAEROM9: "LEE SAEROM",
  HAYOUNG9: "SONG HAYOUNG",
  JIWON9: "PARK JIWON",
  JISUN9: "ROH JISUN",
  SEOYEON9: "LEE SEOYEON",
  CHAEYOUNG9: "LEE CHAEYOUNG",
  NAGYUNG9: "LEE NAGYUNG",
  JIHEON9: "BAEK JIHEON",
  // ENHYPEN
  ENHYPEN7: "ENHYPEN (Group)",
  HEESEUNG7: "HEESEUNG",
  JAY7: "JAY",
  JAKE7: "JAKE",
  SUNGHOON7: "SUNGHOON",
  SUNOO7: "SUNOO",
  JUNGWON7: "JUNGWON",
  NIKI7: "NI-KI",
  // ILLIT
  ILLIT5: "ILLIT (Group)",
  YUNAH5: "YUNAH",
  MINJU5: "MINJU",
  MOKA5: "MOKA",
  WONHEE5: "WONHEE",
  IROHA5: "IROHA",
  // ZICO
  ZICO1: "ZICO",
  // NewJeans
  NEWJEANS5: "NewJeans (Group)",
  MINJI: "MINJI",
  HANNI: "HANNI",
  DANIELLE: "DANIELLE",
  HAERIN: "HAERIN",
  HYEIN: "HYEIN",
  // &TEAM
  ANDTEAM9: "&TEAM (Group)",
  KTEAM: "K",
  FUMATEAM: "FUMA",
  NICHOLAS: "NICHOLAS",
  EJTEAM: "EJ",
  YUMATEAM: "YUMA",
  JOTEAM: "JO",
  HARUATEAM: "HARUA",
  TAKITEAM: "TAKI",
  MAKITEAM: "MAKI",
};

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

  // Validate referral code
  if (!data["referral-code"]) {
    errors.push("Missing required field: referral-code");
  } else {
    const referralCode = (data["referral-code"] || "").trim().toUpperCase();
    if (!referralCodeMap[referralCode]) {
      errors.push(`Invalid referral code: '${data["referral-code"]}'. Please enter a valid HYBE referral code.`);
    }
  }

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
