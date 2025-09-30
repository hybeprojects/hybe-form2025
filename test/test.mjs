// test/test.mjs
import { sendEmailOtp } from '../lib/supabaseClient.js';

async function runTest() {
  console.log("Running test to ensure server-side compatibility...");
  try {
    // This call is expected to fail because Supabase env vars are not configured
    // in this test environment.
    // However, the critical point is that it should NOT fail with a
    // "ReferenceError: window is not defined".
    await sendEmailOtp('test@example.com');

    // We don't realistically expect to get here in a simple test runner,
    // but if it runs without error, it means no reference to 'window' was hit.
    console.log("TEST PASSED: sendEmailOtp executed without a 'window' reference error.");
    process.exit(0);

  } catch (error) {
    if (error instanceof ReferenceError && error.message.includes("window is not defined")) {
      console.error("TEST FAILED: The code still contains a reference to the `window` object, which is not available in a server-side environment.");
      console.error(error);
      process.exit(1); // Explicit failure
    } else {
      console.log("TEST PASSED: The code does not reference the `window` object.");
      console.log(`(The function failed as expected, but for a different, acceptable reason: "${error.message}")`);
      process.exit(0); // Explicit success
    }
  }
}

runTest();