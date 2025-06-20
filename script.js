// Initialize on DOM content loaded
document.addEventListener("DOMContentLoaded", () => {
  // Initialize AOS animations (run once for performance)
  AOS.init({ once: true });

  // Show onboarding modal on page load
  const onboardingModal = new bootstrap.Modal(document.getElementById("onboardingModal"));
  onboardingModal.show();

  // DOM elements
  const form = document.getElementById("subscription-form");
  const formMessage = document.getElementById("form-message");
  const referralCodeInput = document.getElementById("referral-code");
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
  const btnText = submitBtn.querySelector(".btn-text");
  const spinner = submitBtn.querySelector(".spinner-border");
  const progressBar = document.querySelector(".progress-bar");
  const validationModal = new bootstrap.Modal(document.getElementById("validationModal"));
  const countdownElement = document.getElementById("countdown");
  const countrySelect = document.getElementById("country-select");
  const countryInput = document.getElementById("country");
  const currencyInput = document.getElementById("currency");
  const languageInput = document.getElementById("language");
  const permitIdInput = document.getElementById("permit-id");
  const submissionIdInput = document.getElementById("submission-id");
  const paymentModal = new bootstrap.Modal(document.getElementById("paymentModal")); // For Stripe redirects

  // Regular expression for email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // HYBE branch and group data
  const branches = [
    { name: "BigHit Music", groups: ["BTS", "TXT"] },
    { name: "Pledis Entertainment", groups: ["SEVENTEEN", "fromis_9"] },
    { name: "Source Music", groups: ["LE SSERAFIM"] },
    { name: "ADOR", groups: ["NewJeans"] },
    { name: "KOZ Entertainment", groups: ["Zico", "BoyNextDoor"] },
  ];

  // Initialize intl-tel-input for phone number
  const iti = window.intlTelInput(phoneInput, {
    initialCountry: "auto",
    geoIpLookup: (callback) => {
      fetch("https://ipapi.co/json/")
        .then((res) => res.json())
        .then((data) => callback(data.country_code))
        .catch(() => callback("us"));
    },
    utilsScript: "https://cdn.jsdelivr.net/npm/intl-tel-input@18.1.1/build/js/utils.js",
  });

  /**
   * Updates hidden form fields (country, currency, language) based on country code
   * @param {string} countryCode - ISO 3166-1 alpha-2 country code
   */
  function updateHiddenFields(countryCode) {
    fetch(`https://restcountries.com/v3.1/alpha/${countryCode}?fields=currencies,languages`)
      .then((res) => res.json())
      .then((data) => {
        countryInput.value = countryCode;
        currencyInput.value = Object.keys(data.currencies)[0] || "USD";
        languageInput.value = Object.keys(data.languages)[0] || "en";
      })
      .catch(() => {
        countryInput.value = "US";
        currencyInput.value = "USD";
        languageInput.value = "en";
      });
  }

  // Populate country dropdown
  fetch("https://restcountries.com/v3.1/all?fields=name,cca2")
    .then((res) => res.json())
    .then((countries) => {
      countries.sort((a, b) => a.name.common.localeCompare(b.name.common));
      countries.forEach((country) => {
        const option = document.createElement("option");
        option.value = country.cca2;
        option.textContent = country.name.common;
        countrySelect.appendChild(option);
      });
      const userCountry = iti.getSelectedCountryData().iso2.toUpperCase();
      countrySelect.value = userCountry;
      updateHiddenFields(userCountry);
    })
    .catch(() => {
      const option = document.createElement("option");
      option.value = "US";
      option.textContent = "United States";
      countrySelect.appendChild(option);
      countrySelect.value = "US";
      updateHiddenFields("US");
    });

  // Update hidden fields on country change
  countrySelect.addEventListener("change", () => {
    updateHiddenFields(countrySelect.value);
  });

  // Populate branch dropdown
  branches.forEach((branch) => {
    const option = document.createElement("option");
    option.value = branch.name;
    option.textContent = branch.name;
    branchSelect.appendChild(option);
  });

  // Update group dropdown based on branch selection
  branchSelect.addEventListener("change", () => {
    const selectedBranch = branches.find((branch) => branch.name === branchSelect.value);
    groupSelect.innerHTML = '<option value="" disabled selected>Select a Group</option>';
    artistSelect.innerHTML = '<option value="" disabled selected>Select an Artist</option>';
    if (selectedBranch) {
      selectedBranch.groups.forEach((group) => {
        const option = document.createElement("option");
        option.value = group;
        option.textContent = group;
        groupSelect.appendChild(option);
      });
    }
    updateProgress();
  });

  // Update artist dropdown based on group selection
  groupSelect.addEventListener("change", () => {
    artistSelect.innerHTML = '<option value="" disabled selected>Select an Artist</option>';
    const selectedGroup = groupSelect.value;
    const artists = {
      BTS: ["RM", "Jin", "SUGA", "j-hope", "Jimin", "V", "Jungkook"],
      TXT: ["Yeonjun", "Soobin", "Beomgyu", "Taehyun", "HueningKai"],
      SEVENTEEN: ["S.Coups", "Jeonghan", "Joshua", "Jun", "Hoshi", "Wonwoo", "Woozi", "DK", "Mingyu", "The8", "Seungkwan", "Vernon", "Dino"],
      "LE SSERAFIM": ["Sakura", "Chaewon", "Yunjin", "Kazuha", "Eunchae"],
      NewJeans: ["Minji", "Hanni", "Danielle", "Haerin", "Hyein"],
    };
    const groupArtists = artists[selectedGroup] || [selectedGroup];
    groupArtists.forEach((artist) => {
      const option = document.createElement("option");
      option.value = artist;
      option.textContent = artist;
      artistSelect.appendChild(option);
    });
    updateProgress();
  });

  /**
   * Updates the progress bar based on filled form fields
   */
  function updateProgress() {
    const totalFields = 11; // referral-code, full-name, email, phone, dob, gender, branch, group, artist, payment-type, contact-method
    let filledFields = 0;
    if (referralCodeInput.value) filledFields++;
    if (emailInput.value) filledFields++;
    if (phoneInput.value) filledFields++;
    if (dobInput.value) filledFields++;
    if (genderSelect.value) filledFields++;
    if (branchSelect.value) filledFields++;
    if (groupSelect.value) filledFields++;
    if (artistSelect.value) filledFields++;
    if (paymentTypeSelect.value) filledFields++;
    if (document.querySelector('input[name="contact-method"]:checked')) filledFields++;
    const progress = (filledFields / totalFields) * 100;
    progressBar.style.width = `${progress}%`;
    progressBar.setAttribute("aria-valuenow", progress);
  }

  // Toggle installment options and payment methods
  paymentTypeSelect.addEventListener("change", () => {
    if (paymentTypeSelect.value === "Installment") {
      installmentOptions.classList.remove("d-none");
      paymentMethods.classList.remove("d-none");
      document.getElementById("installment-plan").required = true;
      document.querySelectorAll('input[name="payment-method"]').forEach((input) => (input.required = true));
    } else {
      installmentOptions.classList.add("d-none");
      paymentMethods.classList.remove("d-none");
      document.getElementById("installment-plan").required = false;
      document.querySelectorAll('input[name="payment-method"]').forEach((input) => (input.required = true));
    }
    updateProgress();
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
   * Generates a unique submission ID
   * @returns {string} Submission ID in format SUB-timestamp-random
   */
  function generateSubmissionId() {
    return `SUB-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }

  /**
   * Displays a form message with the specified text and type
   * @param {string} text - Message to display
   * @param {string} type - Alert type (success, danger, info)
   */
  function showMessage(text, type) {
    formMessage.textContent = text;
    formMessage.className = `alert alert-${type} mt-3`;
    formMessage.classList.remove("d-none");
    formMessage.focus(); // Improve accessibility
  }

  /**
   * Resets the submit button to its initial state
   */
  function resetButton() {
    submitBtn.disabled = false;
    btnText.textContent = "Submit Subscription";
    spinner.classList.add("d-none");
  }

  // Form submission handler (Merged with Stripe Checkout snippet)
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    submitBtn.disabled = true;
    btnText.textContent = "Submitting...";
    spinner.classList.remove("d-none");
    formMessage.classList.add("d-none");

    // HTML5 form validation
    if (!form.checkValidity()) {
      form.reportValidity();
      resetButton();
      return;
    }

    // Custom validation from original script
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
    if (!iti.isValidNumber()) {
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
    if (!genderSelect.value || genderSelect.value === "Select Gender") {
      showMessage("Please select your gender.", "danger");
      resetButton();
      return;
    }
    if (!branchSelect.value || branchSelect.value === "Select a HYBE Branch") {
      showMessage("Please select a HYBE branch.", "danger");
      resetButton();
      return;
    }
    if (!groupSelect.value || groupSelect.value === "Select a Group") {
      showMessage("Please select a group.", "danger");
      resetButton();
      return;
    }
    if (!artistSelect.value || artistSelect.value === "Select an Artist") {
      showMessage("Please select an artist.", "danger");
      resetButton();
      return;
    }
    if (!paymentTypeSelect.value || paymentTypeSelect.value === "Select Payment Type") {
      showMessage("Please select a payment type.", "danger");
      resetButton();
      return;
    }
    const paymentMethod = form.querySelector('input[name="payment-method"]:checked');
    if (!paymentMethod) {
      showMessage("Please select a payment method.", "danger");
      resetButton();
      return;
    }
    const contactMethods = document.querySelectorAll('input[name="contact-method"]:checked');
    if (contactMethods.length !== 1) {
      showMessage("Please select exactly one contact method.", "danger");
      resetButton();
      return;
    }
    if (!privacyPolicy.checked || !subscriptionAgreement.checked) {
      showMessage("You must agree to the privacy policy and subscription agreement.", "danger");
      resetButton();
      return;
    }
    if (paymentTypeSelect.value === "Installment" && !document.getElementById("installment-plan").value) {
      showMessage("Please select an installment plan.", "danger");
      resetButton();
      return;
    }

    // Set permit and submission IDs
    permitIdInput.value = generatePermitId();
    submissionIdInput.value = generateSubmissionId();

    // Submit form to Netlify
    const formData = new FormData(form);
    try {
      const response = await fetch("/", {
        method: "POST",
        body: formData,
        headers: { Accept: "application/json" },
      });
      if (!response.ok) {
        throw new Error("Form submission failed.");
      }
      // Show validation modal with countdown
      validationModal.show();
      let countdown = 5;
      countdownElement.textContent = countdown;
      const validationInterval = setInterval(() => {
        countdown--;
        countdownElement.textContent = countdown;
        if (countdown <= 0) {
          clearInterval(validationInterval);
          validationModal.hide();
          // Handle payment redirect (Merged from Stripe snippet)
          if (paymentMethod.value === "Card Payment") {
            paymentModal.show();
            let paymentCountdown = 5;
            const paymentCountdownElement = document.getElementById("payment-countdown");
            paymentCountdownElement.textContent = paymentCountdown;
            const paymentTimer = setInterval(() => {
              paymentCountdown--;
              paymentCountdownElement.textContent = paymentCountdown;
              if (paymentCountdown <= 0) {
                clearInterval(paymentTimer);
                paymentModal.hide();
                // Redirect to Stripe payment link
                const paymentType = paymentTypeSelect.value;
                if (paymentType === "Full Payment") {
                  window.location.href = "https://buy.stripe.com/14AfZh1LD4eL9Kx0972ZO04";
                } else if (paymentType === "Installment") {
                  window.location.href = "https://buy.stripe.com/3cIfZhgGxdPlaOBaNL2ZO06";
                }
                // Log submission for analytics (Inspired by Document 5 - YouTube engagement)
                console.log(`Subscription submitted: ${submissionIdInput.value}, Artist: ${artistSelect.value}, Payment: ${paymentType}`);
              }
            }, 1000);
          } else if (paymentMethod.value === "Digital Currency") {
            showMessage("Digital Currency payment coming soon!", "info");
            resetButton();
          } else {
            showMessage("Selected payment method is not supported.", "danger");
            resetButton();
          }
        }
      }, 1000);
    } catch (error) {
      showMessage(`Submission failed: ${error.message}`, "danger");
      resetButton();
    }
  });

  // Add input event listeners for progress updates
  [referralCodeInput, emailInput, phoneInput, dobInput, genderSelect, branchSelect, groupSelect, artistSelect, paymentTypeSelect].forEach((input) => {
    input.addEventListener("input", updateProgress);
  });
  document.querySelectorAll('input[name="contact-method"]').forEach((input) => {
    input.addEventListener("change", updateProgress);
  });

  // Initialize tooltips for accessibility
  document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach((tooltipTriggerEl) => {
    new bootstrap.Tooltip(tooltipTriggerEl);
  });
});