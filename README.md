# HYBE Fan-Permit Email OTP System

This repository contains the code for the HYBE Fan-Permit Email OTP System, a web application designed to securely verify a user's email address via a 6-digit One-Time Password (OTP) before allowing them to submit a form.

The system is built with a focus on security, reliability, and user experience, incorporating HYBE's corporate branding.

## Key Features

- **Secure Email OTP Verification**: Cryptographically secure 6-digit OTPs are sent to the user's email to confirm their identity.
- **Persistent OTP Storage**: Uses SQLite for secure, persistent storage of OTPs, with PBKDF2 hashing to protect sensitive data.
- **Robust Security**:
    - **Rate Limiting**: Multi-tiered rate limiting (by IP and email) to prevent abuse and spam.
    - **Brute Force Protection**: Progressive lockouts and cooldown periods for suspicious activity.
    - **Secure Headers**: Implements HSTS, CSP, and XSS protection.
    - **Input Validation**: Sanitizes all user inputs and blocks temporary email domains.
- **Multi-Provider Email Service**: Supports various email providers (e.g., SendGrid, Gmail) with fallback mechanisms.
- **Branded UI**: Features HYBE's official logos and color schemes for a consistent user experience.
- **Production Ready**: Includes configuration for production environments, comprehensive logging, and monitoring hooks.

## Tech Stack

- **Backend**: Node.js, Express.js
- **Frontend**: HTML, CSS, JavaScript (with Vite for development)
- **Serverless Functions**: Netlify Functions for handling OTP logic
- **Database**: SQLite3

## Getting Started

Follow these instructions to set up and run the project locally.

### 1. Prerequisites

- [Node.js](https://nodejs.org/) (version 18.x or higher recommended)
- [npm](https://www.npmjs.com/) (usually comes with Node.js)

### 2. Clone the Repository

```bash
git clone <repository-url>
cd hybe-form-client
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Configure Environment Variables

Create a `.env` file in the root of the project by copying the example file:

```bash
cp .env.example .env
```

Now, open the `.env` file and fill in the required values. **At a minimum, you must set `NODE_ENV` to `development` for local testing.**

```env
# Set to 'development' for local testing or 'production' for deployment
NODE_ENV=development

# Email Service Configuration (example for development)
# In development, OTPs are logged to the console by default.
EMAIL_PROVIDER=console # Options: console, sendgrid, gmail, smtp
EMAIL_FROM=noreply@hybecorp.com

# For production, configure your chosen provider:
# SENDGRID_API_KEY=your-sendgrid-api-key
# GMAIL_USER=your-gmail-address
# GMAIL_PASS=your-gmail-app-password

# Security Configuration
# A secret key for encrypting database values. Must be 32 characters.
DB_ENCRYPTION_KEY=a_secure_32_character_secret_key_123
# The URL of your frontend application
ALLOWED_ORIGINS=http://localhost:3000 # Adjust port if needed
```

### 5. Initialize the Database

The SQLite database will be created automatically when the application first runs.

## Running the Application

To start the local development server, run:

```bash
npm start
```

This will start an Express server, typically on port 3000. You can now access the application by navigating to `http://localhost:3000` in your web browser.

For frontend development with hot-reloading, you can use Vite:
```bash
npm run dev
```

## Testing

This project includes a browser-based test suite for the OTP functionality.

1.  Start the application using `npm start`.
2.  Open the application in your web browser (e.g., `http://localhost:3000`).
3.  Open the browser's developer console.
4.  Run the test function by typing `testEmailOTP()` in the console and pressing Enter.

The test suite will automatically run through various scenarios, including valid OTP verification, rate limiting, and error handling, logging the results to the console.

## Linting

To check the code for linting errors, run:

```bash
npm run lint
```
