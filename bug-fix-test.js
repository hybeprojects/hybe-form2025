function assert(condition, message) {
  if (!condition) {
    console.error("Assertion Failed:", message);
    throw new Error(message);
  }
  console.log("Assertion Passed:", message);
}

async function runAutoSendBugTest() {
  console.log("--- Starting OTP Auto-Send Bug Test ---");

  // Wait for the main script to initialize everything
  await new Promise((resolve) => setTimeout(resolve, 500));

  const form = document.getElementById("subscription-form");
  const submitBtn = document.getElementById("submit-btn");
  const emailInput = document.getElementById("email");
  const modalElement = document.getElementById("emailVerificationModal");
  const modal = bootstrap.Modal.getInstance(modalElement);

  // Mock the sendEmailOtp function to prevent actual API calls
  // This is a simplified mock for the test environment.
  const originalSendEmailOtp = window.sendEmailOtp;
  window.sendEmailOtp = async (email) => {
    console.log(`Mock sendEmailOtp called for ${email}`);
    // In a real test, you might not want to call the original function.
    // For this test, we just need to know it was called.
    return Promise.resolve({});
  };

  // 1. Initial state check
  assert(
    window.emailVerificationState.autoSent === false,
    "Initial state: autoSent is false",
  );

  // 2. First submission attempt
  console.log("Simulating first form submission...");
  emailInput.value = "test@example.com";
  form.dispatchEvent(new Event("submit", { cancelable: true }));

  // Wait for modal to be shown and auto-send to trigger
  await new Promise((resolve) => setTimeout(resolve, 500));

  assert(modal._isShown, "Modal is shown after first submission");
  assert(
    window.emailVerificationState.autoSent === true,
    "After 1st submit: autoSent is true",
  );

  // 3. Close the modal
  console.log("Simulating modal close...");
  modal.hide();

  // Wait for modal 'hidden' event to fire and reset the flag
  await new Promise((resolve) => {
    modalElement.addEventListener("hidden.bs.modal", () => resolve(), {
      once: true,
    });
  });

  assert(!modal._isShown, "Modal is hidden");
  assert(
    window.emailVerificationState.autoSent === false,
    "After modal close: autoSent is reset to false",
  );

  // 4. Second submission attempt
  console.log("Simulating second form submission...");
  form.dispatchEvent(new Event("submit", { cancelable: true }));

  // Wait for modal to be shown and auto-send to trigger again
  await new Promise((resolve) => setTimeout(resolve, 500));

  assert(modal._isShown, "Modal is shown after second submission");
  assert(
    window.emailVerificationState.autoSent === true,
    "After 2nd submit: autoSent is true again",
  );

  console.log("--- Test Completed Successfully ---");
  modal.hide(); // Clean up

  // Restore original function if needed
  window.sendEmailOtp = originalSendEmailOtp;
}

// Expose the test function to be run from the console
window.runAutoSendBugTest = runAutoSendBugTest;

console.log(
  "Bug fix test script loaded. Run `runAutoSendBugTest()` in the console to start.",
);
