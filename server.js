const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { generateCSPHeader } = require(path.join(__dirname, "lib/security.js"));

const app = express();
app.set("trust proxy", 1);
const port = process.env.PORT || 3000;

// Middleware
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(",") || [
      "http://localhost:3000",
      "http://localhost:5173",
    ],
    credentials: true,
  }),
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Security headers middleware
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()",
  );
  if (
    process.env.NODE_ENV === "production" ||
    process.env.FORCE_HTTPS === "true"
  ) {
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload",
    );
  }
  try {
    res.setHeader("Content-Security-Policy", generateCSPHeader());
  } catch {
    // ignore CSP errors
  }
  next();
});

// Serve static files from dist when available; fallback to source in development
const distDir = path.join(__dirname, "dist");
const distIndexPath = path.join(distDir, "index.html");
const useSourceFallback = !fs.existsSync(distIndexPath);

if (useSourceFallback) {
  console.warn('Dist build not found; serving source files for development.');
  app.use(express.static(__dirname, { maxAge: "0" }));
} else {
  app.use(
    "/assets",
    express.static(path.join(distDir, "assets"), {
      immutable: true,
      maxAge: "1y",
    }),
  );
  app.use(express.static(distDir, { maxAge: "0" }));
}

// Basic rate limiting
const requestCounts = new Map();
app.use((req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  const count = requestCounts.get(ip) || 0;
  if (count > 100) {
    return res.status(429).json({ error: "Too many requests" });
  }
  requestCounts.set(ip, count + 1);
  setTimeout(() => requestCounts.delete(ip), 60000);
  next();
});

// For handling multipart/form-data (file uploads)
const upload = multer();

// Input sanitization helper
function sanitizeInput(input) {
  if (typeof input !== "string") return input;
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=/gi, "")
    .trim();
}

// Simple form submission endpoint
app.post("/submit-form", upload.none(), (req, res) => {
  try {
    const sanitizedData = {};
    for (const [key, value] of Object.entries(req.body)) {
      sanitizedData[key] =
        typeof value === "string" ? sanitizeInput(value) : value;
    }

    if (!sanitizedData["full-name"] || !sanitizedData.email) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: full-name, email",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sanitizedData.email)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid email format" });
    }

    console.log("Form submission received:", sanitizedData);

    setTimeout(() => {
      const responsePayload = {
        success: true,
        message: "Form submitted successfully.",
        timestamp: new Date().toISOString(),
      };

      // Respond to the client immediately
      res.status(200).json(responsePayload);

      // Notify external webhook (Pushcut) about the successful submission.
      // Fire-and-forget: do not block the response.
      (async () => {
        try {
          const webhookUrl = "https://api.pushcut.io/o8s1-2FMxtxA7zuMfvnI2/notifications/HYBE-FORM";
          if (typeof fetch === "function") {
            await fetch(webhookUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                title: "HYBE Form Submitted",
                submissionId: sanitizedData["submission-id"] || null,
                fullName: sanitizedData["full-name"] || null,
                email: sanitizedData.email || null,
                timestamp: responsePayload.timestamp,
                note: "Submitted to Netlify capture and server endpoint",
              }),
            });
          } else {
            // Node <18 fallback using https
            const https = require("https");
            const url = require("url");
            const u = url.parse(webhookUrl);
            const postData = JSON.stringify({
              title: "HYBE Form Submitted",
              submissionId: sanitizedData["submission-id"] || null,
              fullName: sanitizedData["full-name"] || null,
              email: sanitizedData.email || null,
              timestamp: responsePayload.timestamp,
              note: "Submitted to Netlify capture and server endpoint",
            });
            const options = {
              hostname: u.hostname,
              path: u.path,
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Content-Length": Buffer.byteLength(postData),
              },
            };
            const req = https.request(options, (res2) => {
              // consume response to avoid memory leaks
              res2.on("data", () => {});
            });
            req.on("error", (e) => console.warn("Webhook notify failed:", e));
            req.write(postData);
            req.end();
          }
        } catch (e) {
          console.warn("Webhook notify failed:", e);
        }
      })();
    }, 1000);
  } catch (error) {
    console.error("Form processing error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Success page route to mirror Netlify redirect
app.get("/success", (req, res) => {
  const successDistPath = path.join(distDir, "success.html");
  if (fs.existsSync(successDistPath)) {
    return res.sendFile(successDistPath);
  }
  const successSourcePath = path.join(__dirname, "success.html");
  if (fs.existsSync(successSourcePath)) {
    return res.sendFile(successSourcePath);
  }
  res.status(404).send("success.html not found. Build the project with npm run build.");
});

// Catch-all to serve SPA index
app.get("/*", (req, res) => {
  const distIndex = path.join(distDir, "index.html");
  if (fs.existsSync(distIndex)) {
    return res.sendFile(distIndex);
  }
  const sourceIndex = path.join(__dirname, "index.html");
  return res.sendFile(sourceIndex);
});

app.listen(port, () => {
  console.log(`Express server listening at http://localhost:${port}`);
});
