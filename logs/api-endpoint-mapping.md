# API Endpoint and Handler Mapping

This document maps the key frontend actions to their corresponding backend handlers or external API calls.

## 1. Main Form Submission

- **Frontend Trigger:** `submitFormInternal()` function in `script.js`.
- **File:** `script.js`
- **Action:** Submits the main subscription form data.
- **Endpoint:** External Formspree URL.
- **Handler:** `fetch(import.meta.env.VITE_FORMSPREE_URL, ...)`
- **Note:** The local endpoint `/submit-form` in `server.js` is not used by the primary form submission flow.

## 2. Email OTP - Send Code

- **Frontend Trigger:** Click event on `send-otp-btn` in `script.js`.
- **File:** `lib/supabaseClient.js`
- **Action:** Sends a one-time password to the user's email.
- **Endpoint:** Supabase Auth API.
- **Handler:** `sendEmailOtp(email, redirectTo)` which calls `client.auth.signInWithOtp({ email, options })`.

## 3. Email OTP - Verify Code

- **Frontend Trigger:** `verifyOtp()` function in `script.js`, called on button click or when 6 digits are entered.
- **File:** `lib/supabaseClient.js`
- **Action:** Verifies the OTP entered by the user.
- **Endpoint:** Supabase Auth API.
- **Handler:** `verifyEmailOtp(email, token)` which calls `client.auth.verifyOtp({ email, token, type: 'email' })`.
