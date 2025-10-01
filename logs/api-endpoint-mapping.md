API Endpoint Mapping

Frontend form submission:
- Source: script.js (submitFormInternal)
- Endpoint: VITE_FORMSPREE_URL (external Formspree endpoint)
- Method: POST multipart/form-data

Email verification (OTP):
- Source: lib/supabaseClient.js (sendEmailOtp, verifyEmailOtp)
- Provider: Supabase Auth (email OTP)
- Endpoints: Supabase JS client SDK (signInWithOtp, verifyOtp)

Local server endpoint (not used by form):
- Source: server.js
- Endpoint: POST /submit-form
- Handler: in-file anonymous handler (sanitizes, validates email, returns JSON)

Notes:
- No SMTP/SendGrid/Mailgun code paths detected.
- success.html is a separate static page; Vite includes it in build inputs.
