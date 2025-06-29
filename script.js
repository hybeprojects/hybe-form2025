// Ensure JavaScript is enabled (as per Stripe Checkout requirement)
if (!window.bootstrap) {
  console.error("Bootstrap JavaScript is required for this application.");
}

// Initialize AOS animations on DOM load
document.addEventListener("DOMContentLoaded", () => {
  if (typeof AOS !== "undefined") {
    AOS.init({ duration: 800, once: true });
  }

  // Form and modal DOM elements
  const form = document.getElementById("subscription-form");
  const formMessage = document.getElementById("form-message");
  const referralCodeInput = document.getElementById("referral-code");
  const fullNameInput = document.getElementById("full-name");
  const emailInput = document.getElementById("email");
  const phoneInput = document.getElementById("phone");
  const dobInput = document.getElementById("dob");
  const genderSelect = document.getElementById("gender");
  const branchSelect = document.getElementById("branch");
  const groupSelect = document.getElementById("group");
  const artistSelect = document.getElementById("artist");
  const paymentTypeSelect = document.getElementById("payment-type");
  const installmentOptions = document.getElementById("installment-options");
  const paymentMethods = document.getElementById("payment-methods");
  const privacyPolicy = document.getElementById("privacy-policy");
  const subscriptionAgreement = document.getElementById("subscription-agreement");
  const submitBtn = document.getElementById("submit-btn");
  const btnText = submitBtn?.querySelector(".btn-text");
  const spinner = submitBtn?.querySelector(".spinner-border");
  const progressBar = document.querySelector(".progress-bar");
  const countrySelect = document.getElementById("country-select");
  const countryInput = document.getElementById("country");
  const currencyInput = document.getElementById("currency");
  const languageInput = document.getElementById("language");
  const permitIdInput = document.getElementById("permit-id");
  const submissionIdInput = document.getElementById("submission-id");
  const digitalCurrencyHomeBtn = document.getElementById("digital-currency-home-btn");

  // Show onboarding modal immediately
  const onboardingModalEl = document.getElementById("onboardingModal");
  if (onboardingModalEl) {
    new bootstrap.Modal(onboardingModalEl).show();
  }

  // HYBE branch and group data
  const branches = [
    { name: "BigHit Music", groups: ["BTS", "TXT"] },
    { name: "PLEDIS Entertainment", groups: ["SEVENTEEN", "fromis_9"] },
    { name: "BELIFT LAB", groups: ["ENHYPEN", "ILLIT"] },
    { name: "KOZ Entertainment", groups: ["ZICO"] },
    { name: "ADOR", groups: ["NewJeans"] },
    { name: "HYBE Labels Japan", groups: ["&TEAM"] },
  ];

  // Populate branch dropdown
  branches.forEach((branch) => {
    const option = document.createElement("option");
    option.value = branch.name;
    option.textContent = branch.name;
    branchSelect?.appendChild(option);
  });

  // Update group dropdown based on branch selection
  branchSelect?.addEventListener("change", () => {
    const selectedBranch = branches.find((branch) => branch.name === branchSelect.value);
    if (groupSelect) {
      groupSelect.innerHTML = '<option value="" disabled selected>Select a Group</option>';
    }
    if (artistSelect) {
      artistSelect.innerHTML = '<option value="" disabled selected>Select an Artist</option>';
    }
    if (selectedBranch) {
      selectedBranch.groups.forEach((group) => {
        const option = document.createElement("option");
        option.value = group;
        option.textContent = group;
        groupSelect?.appendChild(option);
      });
    }
    updateProgress();
  });

  // Update artist dropdown based on group selection
  groupSelect?.addEventListener("change", () => {
    if (artistSelect) {
      artistSelect.innerHTML = '<option value="" disabled selected>Select an Artist</option>';
    }
    const selectedGroup = groupSelect.value;
    const artists = {
      BTS: ["RM", "Jin", "SUGA", "j-hope", "Jimin", "V", "Jung Kook"],
      TXT: ["SOOBIN", "YEONJUN", "BEOMGYU", "TAEHYUN", "HUENINGKAI"],
      SEVENTEEN: [
        "S.COUPS",
        "JEONGHAN",
        "JOSHUA",
        "JUN",
        "HOSHI",
        "WONWOO",
        "WOOZI",
        "THE 8",
        "MINGYU",
        "DK",
        "SEUNGKWAN",
        "VERNON",
        "DINO",
      ],
      fromis_9: [
        "LEE SAEROM",
        "SONG HAYOUNG",
        "PARK JIWON",
        "ROH JISUN",
        "LEE SEOYEON",
        "LEE CHAEYOUNG",
        "LEE NAGYUNG",
        "BAEK JIHEON",
      ],
      ENHYPEN: ["JUNGWON", "HEESEUNG", "JAY", "JAKE", "SUNGHOON", "SUNOO", "NI-KI"],
      ILLIT: ["YUNAH", "MINJU", "MOKA", "WONHEE", "IROHA"],
      ZICO: ["ZICO"],
      NewJeans: ["MINJI", "HANNI", "DANIELLE", "HAERIN", "HYEIN"],
      "&TEAM": ["K", "FUMA", "NICHOLAS", "EJ", "YUMA", "JO", "HARUA", "TAKI", "MAKI"],
    };
    if (artists[selectedGroup]) {
      artists[selectedGroup].forEach((artist) => {
        const option = document.createElement("option");
        option.value = artist;
        option.textContent = artist;
        artistSelect?.appendChild(option);
      });
    }
    updateProgress();
  });

  /**
   * Updates the progress bar based on filled form fields
   */
  function updateProgress() {
    const totalFields = 16; // Updated to include all fields
    let filledFields = 0;
    if (referralCodeInput?.value) filledFields++;
    if (fullNameInput?.value) filledFields++;
    if (emailInput?.value) filledFields++;
    if (phoneInput?.value) filledFields++;
    if (document.getElementById("address-line1")?.value) filledFields++;
    if (document.getElementById("city")?.value) filledFields++;
    if (document.getElementById("state")?.value) filledFields++;
    if (document.getElementById("postal-code")?.value) filledFields++;
    if (countrySelect?.value) filledFields++;
    if (dobInput?.value) filledFields++;
    if (genderSelect?.value) filledFields++;
    if (branchSelect?.value) filledFields++;
    if (groupSelect?.value) filledFields++;
    if (artistSelect?.value) filledFields++;
    if (paymentTypeSelect?.value) filledFields++;
    if (document.querySelector('input[name="contact-method"]:checked')) filledFields++;
    const progress = (filledFields / totalFields) * 100;
    if (progressBar) {
      progressBar.style.width = `${progress}%`;
      progressBar.setAttribute("aria-valuenow", progress);
    }
  }

  // Toggle installment options and payment methods
  paymentTypeSelect?.addEventListener("change", () => {
    if (paymentTypeSelect.value === "Installment") {
      installmentOptions?.classList.remove("d-none");
      document.getElementById("installment-plan").required = true;
    } else {
      installmentOptions?.classList.add("d-none");
      document.getElementById("installment-plan").required = false;
    }
    document.querySelectorAll('input[name="payment-method"]').forEach((input) => {
      input.required = true;
    });
    updateProgress();
  });

  // Digital currency home button
  digitalCurrencyHomeBtn?.addEventListener("click", () => {
    const digitalCurrencyModalEl = document.getElementById("digitalCurrencySuccessModal");
    if (digitalCurrencyModalEl) {
      bootstrap.Modal.getInstance(digitalCurrencyModalEl)?.hide();
    }
    window.location.href = "https://hybecorp.com";
  });

  /**
   * Generates a unique permit ID
   * @returns {string} Permit ID in format HYBE-FP-timestamp-random
   */
  function generatePermitId() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    return `HYBE-FP-${timestamp}-${random}`;
  }

  /**
   * Show feedback messages for the user
   */
  function showMessage(message, type = "info") {
    if (formMessage) {
      formMessage.className = `mt-3 text-center alert alert-${type} alert-dismissible fade show`;
      formMessage.textContent = message;
      formMessage.classList.remove("d-none");
      setTimeout(() => {
        formMessage.classList.add("d-none");
      }, 7000);
    }
  }

  /**
   * Reset the submit button state
   */
  function resetButton() {
    if (submitBtn && spinner && btnText) {
      submitBtn.disabled = false;
      spinner.classList.add("d-none");
      btnText.classList.remove("d-none");
    }
  }

  /**
   * Handle modal countdown
   * @param {string} modalId - ID of the modal element
   * @param {Object} options - Countdown options { duration, elementId, onComplete }
   */
  function setupCountdown(modalId, { duration, elementId, onComplete }) {
    const countdownElement = document.getElementById(elementId);
    if (!countdownElement) {
      console.error(`Countdown element "${elementId}" not found`);
      return;
    }

    let countdown = duration;
    countdownElement.textContent = countdown;

    const timer = setInterval(() => {
      countdown--;
      countdownElement.textContent = countdown;

      if (countdown <= 0) {
        clearInterval(timer);
        const modalEl = document.getElementById(modalId);
        if (modalEl) {
          bootstrap.Modal.getInstance(modalEl)?.hide();
        }
        if (typeof onComplete === "function") {
          try {
            onComplete();
          } catch (error) {
            console.error(`Error in onComplete callback: ${error.message}`);
          }
        }
      }
    }, 1000);
  }

  // Add input event listeners for progress updates
  [
    referralCodeInput,
    fullNameInput,
    emailInput,
    phoneInput,
    document.getElementById("address-line1"),
    document.getElementById("address-line2"),
    document.getElementById("city"),
    document.getElementById("state"),
    document.getElementById("postal-code"),
    countrySelect,
    dobInput,
    genderSelect,
    branchSelect,
    groupSelect,
    artistSelect,
    paymentTypeSelect,
  ].forEach((input) => {
    input?.addEventListener("input", updateProgress);
  });

  document.querySelectorAll('input[name="contact-method"]').forEach((input) => {
    input.addEventListener("change", updateProgress);
  });

  // Initialize tooltips for accessibility
  document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach((tooltipTriggerEl) => {
    new bootstrap.Tooltip(tooltipTriggerEl);
  });

  // Phone number input: International Telephone Input
  let iti;
  if (window.intlTelInput && phoneInput) {
    iti = window.intlTelInput(phoneInput, {
      separateDialCode: true,
      initialCountry: "auto",
      geoIpLookup: (success, failure) => {
        fetch("https://ipapi.co/json")
          .then((res) => res.json())
          .then((data) => success(data.country_code))
          .catch(() => success("US"));
      },
      utilsScript: "https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/18.1.1/js/utils.js",
    });
  }

  // Regular expression for email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Form submission handler
  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (submitBtn && spinner && btnText) {
      submitBtn.disabled = true;
      spinner.classList.remove("d-none");
      btnText.classList.add("d-none");
    }
    if (formMessage) {
      formMessage.classList.add("d-none");
    }

    // Validation
    try {
      if (!form.checkValidity()) {
        form.classList.add("was-validated");
        showMessage("Please fill out all required fields correctly.", "danger");
        resetButton();
        return;
      }

      if (referralCodeInput.value !== "HYBE2025") {
        showMessage("Invalid referral code. Use HYBE2025.", "danger");
        resetButton();
        return;
      }
      if (!emailRegex.test(emailInput.value)) {
        showMessage("Invalid email address.", "danger");
        resetButton();
        return;
      }
      if (!iti || !iti.isValidNumber()) {
        showMessage("Invalid phone number.", "danger");
        resetButton();
        return;
      }
      phoneInput.value = iti.getNumber(); // Store E.164 format

      const dob = new Date(dobInput.value);
      if (isNaN(dob) || dobInput.value !== dob.toISOString().split("T")[0]) {
        showMessage("Invalid date of birth. Use YYYY-MM-DD format.", "danger");
        resetButton();
        return;
      }
      const today = new Date();
      const age = today.getFullYear() - dob.getFullYear();
      if (age < 13) {
        showMessage("You must be at least 13 years old to subscribe.", "danger");
        resetButton();
        return;
      }
      if (!privacyPolicy.checked) {
        showMessage("You must agree to the Privacy Policy.", "danger");
        resetButton();
        return;
      }
      if (!subscriptionAgreement.checked) {
        showMessage("You must agree to complete the subscription.", "danger");
        resetButton();
        return;
      }

      // Generate IDs
      permitIdInput.value = generatePermitId();
      submissionIdInput.value = `SUB-${Date.now()}`;

      // Show validation modal with countdown
      const validationModalEl = document.getElementById("validationModal");
      if (validationModalEl) {
        new bootstrap.Modal(validationModalEl).show();
        setupCountdown("validationModal", {
          duration: 5,
          elementId: "countdown",
          onComplete: () => {
            const paymentMethod = form.querySelector('input[name="payment-method"]:checked');
            if (!paymentMethod) {
              showMessage("Please select a payment method.", "danger");
              resetButton();
              return;
            }

            if (paymentMethod.value === "Card Payment") {
              const paymentModalEl = document.getElementById("paymentModal");
              if (paymentModalEl) {
                new bootstrap.Modal(paymentModalEl).show();
                setupCountdown("paymentModal", {
                  duration: 5,
                  elementId: "payment-countdown",
                  onComplete: () => {
                    const paymentType = paymentTypeSelect.value;
                    if (paymentType === "Full Payment") {
                      window.location.href = "https://buy.stripe.com/14AfZh1LD4eL9Kx0972ZO04";
                    } else if (paymentType === "Installment") {
                      window.location.href = "https://buy.stripe.com/3cIfZhgGxdPlaOBaNL2ZO06";
                    }
                  },
                });
              }
            } else if (paymentMethod.value === "Digital Currency") {
              const digitalCurrencyModalEl = document.getElementById("digitalCurrencySuccessModal");
              if (digitalCurrencyModalEl) {
                new bootstrap.Modal(digitalCurrencyModalEl).show();
              }
              resetButton();
            } else {
              showMessage("Selected payment method is not supported.", "danger");
              resetButton();
            }

            // Log submission for analytics
            console.log(
              `Subscription submitted: ${submissionIdInput.value}, Artist: ${artistSelect.value}, Payment: ${paymentTypeSelect.value}`
            );
          },
        });
      }
    } catch (error) {
      showMessage(`Submission failed: ${error.message}`, "danger");
      resetButton();
    }
  });
});