# Manual Verification Endpoint Test Strategy

This document provides a step-by-step guide for manually testing the email verification flow using the browser's developer console, as described in `OTP_TESTING_GUIDE.md`. This test is necessary to confirm whether the fix for the `type: 'magiclink'` issue resolves the verification problem.

**Prerequisites:**

1.  The application must be running locally (`npm run dev`).
2.  You must have valid Supabase credentials (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) in a `.env` file at the project root.
3.  You need access to the email inbox for the address you will be testing with.

## Test Steps

### Step 1: Open the Application and Developer Console

1.  Navigate to the application in your browser (e.g., `http://localhost:5173`).
2.  Open the browser's developer console (F12 or Ctrl+Shift+I).

### Step 2: Initiate the OTP Request

1.  Fill in the email field on the form with a valid email address you can access.
2.  Click the "Submit Subscription" button. This will open the email verification modal.
3.  In the modal, click the "Send Verification Code" button.
4.  **Expected Result:** You should see a success toast message, and the modal should advance to the OTP input screen.

### Step 3: Retrieve the OTP Code

1.  Check the inbox of the email address you provided.
2.  You should receive an email from Supabase containing a 6-digit verification code.
3.  Copy this 6-digit code.

### Step 4: Manually Test the `verifyEmailOtp` Function

This step directly tests the core verification logic.

1.  In the developer console, type the following command, replacing `"your-email@example.com"` and `"123456"` with your actual email and the OTP you received:

    ```javascript
    import { verifyEmailOtp } from "./lib/supabaseClient.js";
    verifyEmailOtp("your-email@example.com", "123456")
      .then((data) => console.log("✅ Verification Success:", data))
      .catch((error) => console.error("❌ Verification Error:", error));
    ```

2.  Press Enter to execute the command.

### Step 5: Analyze the Results

- **If the test is successful (with the proposed fix):**
  - The console should log a "✅ Verification Success" message, followed by a Supabase session object.
  - This confirms that the `type: 'magiclink'` change correctly fixes the verification issue.

- **If the test fails (with the original code):**
  - The console will likely log a "❌ Verification Error" message. The error details might include "Invalid token" or a similar message, confirming the bug.

### Step 6: Test the Full UI Flow (Optional but Recommended)

1.  After triggering the OTP, enter the 6-digit code directly into the UI modal.
2.  **Expected Result (with the fix):** The modal should show a success message, close automatically, and the form submission should proceed.
3.  **Expected Result (without the fix):** The UI will likely show an error message like "Invalid or expired verification code."

## Conclusion

This test strategy provides a definitive way to validate the functionality of the email verification endpoint. The key is to execute the `verifyEmailOtp` function directly from the console to isolate the backend logic from any potential UI issues. The success or failure of this test will prove whether the identified bug is the root cause of the verification problem.
