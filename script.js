document.addEventListener("DOMContentLoaded", () => {
  // Initialize Bootstrap tooltips
  const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
  tooltipTriggerList.forEach(tooltipTriggerEl => {
    new bootstrap.Tooltip(tooltipTriggerEl);
  });

  // Show onboarding modal once per session
  const onboardingModal = new bootstrap.Modal(document.getElementById("onboardingModal"));
  if (!sessionStorage.getItem("onboardingShown")) {
    onboardingModal.show();
    sessionStorage.setItem("onboardingShown", "true");
  }

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
  const resetBtn = document.getElementById("reset-btn");
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

  // Regular expressions and data
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const validReferralCodes = ["HYBE2025", "FAN2025"];
  const branches = [
    { name: "BigHit Music", groups: [
      { name: "BTS", artists: ["RM", "Jin", "SUGA", "j-hope", "Jimin", "V", "Jungkook"] },
      { name: "TXT", artists: ["Yeonjun", "Soobin", "Beomgyu", "Taehyun", "HueningKai"] }
    ]},
    { name: "Pledis Entertainment", groups: [
      { name: "SEVENTEEN", artists: ["S.Coups", "Jeonghan", "Joshua", "Jun", "Hoshi", "Wonwoo", "Woozi", "DK", "Mingyu", "The8", "Seungkwan", "Vernon", "Dino"] },
      { name: "fromis_9", artists: ["Saerom", "Hayoung", "Jiwon", "Jisun", "Seoyeon", "Chaeyoung", "Nagyung", "Jiheon"] }
    ]},
    { name: "Source Music", groups: [
      { name: "LE SSERAFIM", artists: ["Sakura", "Chaewon", "Yunjin", "Kazuha", "Eunchae"] }
    ]},
    { name: "ADOR", groups: [
      { name: "NewJeans", artists: ["Minji", "Hanni", "Danielle", "Haerin", "Hyein"] }
    ]},
    { name: "KOZ Entertainment", groups: [
      { name: "Zico", artists: ["Zico"] },
      { name: "BoyNextDoor", artists: ["Sungho", "Riwoo", "Jaehyun", "Taesan", "Leehan", "Woonhak"] }
    ]}
  ];

  // Initialize intl-tel-input
  const iti = window.intlTelInput(phoneInput, {
    initialCountry: "auto",
    geoIpLookup: (callback) => {
      fetchWithRetry("https://ipapi.co/json/", {}, 1)
        .then(data => callback(data.country_code))
        .catch(() => callback("us"));
    },
    utilsScript: "https://cdn.jsdelivr.net/npm/intl-tel-input@18.1.1/build/js/utils.js"
  });

  // Fetch with retry logic
  async function fetchWithRetry(url, options, retries = 3) {
    for (let i = 0; i < retries; i++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000); // 4s timeout
        const response = await fetch(url, { ...options, signal: controller.signal });
        clearTimeout(timeoutId);
        if (!response.ok) throw new Error(`HTTP error ${response.status}`);
        return await response.json();
      } catch (error) {
        if (i === retries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  // Lazy-load country dropdown
  let countriesLoaded = false;
  function loadCountries() {
    if (countriesLoaded) return;
    countriesLoaded = true;
    fetchWithRetry("https://restcountries.com/v3.1/all?fields=name,cca2", {})
      .then(countries => {
        countries.sort((a, b) => a.name.common.localeCompare(b.name.common));
        countries.forEach(country => {
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
  }

  // Update hidden fields
  function updateHiddenFields(countryCode) {
    fetchWithRetry(`https://restcountries.com/v3.1/alpha/${countryCode}?fields=currencies,languages`, {})
      .then(data => {
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

  // Populate branch dropdown
  branches.forEach(branch => {
    const option = document.createElement("option");
    option.value = branch.name;
    option.textContent = branch.name;
    branchSelect.appendChild(option);
  });

  // Update group and artist dropdowns
  branchSelect.addEventListener("change", () => {
    const selectedBranch = branches.find(branch => branch.name === branchSelect.value);
    groupSelect.innerHTML = '<option value="" disabled selected>Select a Group</option>';
    artistSelect.innerHTML = '<option value="" disabled selected>Select an Artist</option>';
    if (selectedBranch) {
      selectedBranch.groups.forEach(group => {
        const option = document.createElement("option");
        option.value = group.name;
        option.textContent = group.name;
        groupSelect.appendChild(option);
      });
    }
    debouncedUpdateProgress();
  });

  groupSelect.addEventListener("change", () => {
    artistSelect.innerHTML = '<option value="" disabled selected>Select an Artist</option>';
    const selectedBranch = branches.find(branch => branch.name === branchSelect.value);
    const selectedGroup = selectedBranch?.groups.find(group => group.name === groupSelect.value);
    if (selectedGroup?.artists) {
      selectedGroup.artists.forEach(artist => {
        const option = document.createElement("option");
        option.value = artist;
        option.textContent = artist;
        artistSelect.appendChild(option);
      });
    } else {
      const option = document.createElement("option");
      option.value = groupSelect.value;
      option.textContent = groupSelect.value;
      artistSelect.appendChild(option);
    }
    debouncedUpdateProgress();
  });

  // Real-time validation
  const inputs = [
    document.getElementById("full-name"),
    document.getElementById("address-line1"),
    document.getElementById("city"),
    document.getElementById("state"),
    document.getElementById("postal-code"),
    emailInput,
    dobInput,
    genderSelect,
    branchSelect,
    groupSelect,
    artistSelect,
    paymentTypeSelect,
    countrySelect
  ];
  inputs.forEach(input => {
    input.addEventListener("input", () => {
      const errorDiv = document.getElementById(`${input.id}-error`);
      if (!input.value) {
        input.classList.add("is-invalid");
        errorDiv.textContent = `Please enter a valid ${input.name.replace("-", " ")}.`;
      } else {
        input.classList.remove("is-invalid");
        errorDiv.textContent = "";
      }
      debouncedUpdateProgress();
    });
  });

  // Postal code validation
  const postalCodeInput = document.getElementById("postal-code");
  postalCodeInput.addEventListener("input", () => {
    const country = countrySelect.value;
    const usZipRegex = /^\d{5}(-\d{4})?$/;
    const errorDiv = document.getElementById("postal-code-error");
    if (country === "US" && !usZipRegex.test(postalCodeInput.value)) {
      postalCodeInput.classList.add("is-invalid");
      errorDiv.textContent = "Invalid US ZIP code.";
    } else {
      postalCodeInput.classList.remove("is-invalid");
      errorDiv.textContent = "";
    }
    debouncedUpdateProgress();
  });

  countrySelect.addEventListener("change", () => {
    updateHiddenFields(countrySelect.value);
    debouncedUpdateProgress();
  });

  // Debounce utility
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Update progress bar
  function updateProgress() {
    const requiredFields = [
      referralCodeInput, document.getElementById("full-name"), emailInput, phoneInput,
      dobInput, genderSelect, branchSelect, groupSelect, artistSelect, paymentTypeSelect,
      document.getElementById("address-line1"), document.getElementById("city"),
      document.getElementById("state"), document.getElementById("postal-code"),
      countrySelect
    ];
    let filledFields = 0;
    requiredFields.forEach(field => {
      if (field.type === "select-one" && field.value && field.value !== "") filledFields++;
      else if (field.type === "checkbox" && field.checked) filledFields++;
      else if (field.value) filledFields++;
    });
    if (document.querySelector('input[name="contact-method"]:checked')) filledFields++;
    if (paymentTypeSelect.value === "Installment" && document.getElementById("installment-plan").value) filledFields++;
    const totalFields = requiredFields.length + (paymentTypeSelect.value === "Installment" ? 1 : 0) + 1;
    const progress = (filledFields / totalFields) * 100;
    progressBar.style.width = `${progress}%`;
    progressBar.setAttribute("aria-valuenow", progress);
  }

  const debouncedUpdateProgress = debounce(updateProgress, 400); // 400ms debounce

  // Show installment options or payment methods
  paymentTypeSelect.addEventListener("change", () => {
    if (paymentTypeSelect.value === "Installment") {
      installmentOptions.classList.remove("d-none");
      paymentMethods.classList.remove("d-none");
      document.getElementById("installment-plan").required = true;
      document.querySelectorAll('input[name="payment-method"]').forEach(input => input.required = true);
    } else {
      installmentOptions.classList.add("d-none");
      paymentMethods.classList.remove("d-none");
      document.getElementById("installment-plan").required = false;
      document.querySelectorAll('input[name="payment-method"]').forEach(input => input.required = true);
    }
    debouncedUpdateProgress();
  });

  // Generate IDs
  function generatePermitId() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    return `HYBE-FP-${timestamp}-${random}`;
  }

  function generateSubmissionId() {
    return `SUB-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }

  // Show message
  function showMessage(text, type) {
    formMessage.textContent = text;
    formMessage.classList.remove("d-none", "alert-success", "alert-danger");
    formMessage.classList.add(`alert-${type}`);
    formMessage.setAttribute("role", "alert");
    formMessage.setAttribute("aria-live", "assertive");
  }

  // Reset submit button
  function resetButton() {
    submitBtn.disabled = false;
    btnText.textContent = "Submit Subscription";
    spinner.classList.add("d-none");
    resetBtn.classList.add("d-none");
  }

  // Form data persistence
  form.addEventListener("input", () => {
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    localStorage.setItem("hybeFormData", JSON.stringify(data));
  });

  if (localStorage.getItem("hybeFormData")) {
    const savedData = JSON.parse(localStorage.getItem("hybeFormData"));
    Object.entries(savedData).forEach(([key, value]) => {
      const input = form.querySelector(`[name="${key}"]`);
      if (input) input.value = value;
    });
    debouncedUpdateProgress();
  }

  // Load countries on first interaction
  countrySelect.addEventListener("focus", loadCountries);

  // Form submission
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const startTime = performance.now();
    submitBtn.disabled = true;
    btnText.textContent = "Submitting...";
    spinner.classList.remove("d-none");
    formMessage.classList.add("d-none");
    resetBtn.classList.add("d-none");

    // Failsafe UI reset
    const resetTimeout = setTimeout(() => {
      console.debug("Failsafe triggered");
      validationModal.hide();
      showMessage("Submission timed out. Please try again or check Netlify Forms setup.", "danger");
      resetButton();
    }, 7000); // 7s failsafe

    try {
      // Validation
      if (!validReferralCodes.includes(referralCodeInput.value)) {
        showMessage("Invalid referral code.", "danger");
        resetBtn.classList.remove("d-none");
        resetButton();
        clearTimeout(resetTimeout);
        return;
      }
      if (!emailRegex.test(emailInput.value)) {
        showMessage("Invalid email address.", "danger");
        resetBtn.classList.remove("d-none");
        resetButton();
        clearTimeout(resetTimeout);
        return;
      }
      if (!iti.isValidNumber()) {
        showMessage("Invalid phone number.", "danger");
        resetBtn.classList.remove("d-none");
        resetButton();
        clearTimeout(resetTimeout);
        return;
      }
      const phoneNumber = iti.getNumber();
      phoneInput.value = phoneNumber;

      const dob = new Date(dobInput.value);
      const today = new Date();
      if (isNaN(dob) || dob > today || dobInput.value !== dob.toISOString().split("T")[0]) {
        showMessage("Invalid date of birth. Use YYYY-MM-DD and ensure it’s not in the future.", "danger");
        resetBtn.classList.remove("d-none");
        resetButton();
        clearTimeout(resetTimeout);
        return;
      }
      const age = today.getFullYear() - dob.getFullYear();
      if (age < 13) {
        showMessage("You must be at least 13 years old to subscribe.", "danger");
        resetBtn.classList.remove("d-none");
        resetButton();
        clearTimeout(resetTimeout);
        return;
      }
      if (!genderSelect.value || genderSelect.value === "") {
        showMessage("Please select your gender.", "danger");
        resetBtn.classList.remove("d-none");
        resetButton();
        clearTimeout(resetTimeout);
        return;
      }
      if (!branchSelect.value || branchSelect.value === "") {
        showMessage("Please select a HYBE branch.", "danger");
        resetBtn.classList.remove("d-none");
        resetButton();
        clearTimeout(resetTimeout);
        return;
      }
      if (!groupSelect.value || groupSelect.value === "") {
        showMessage("Please select a group.", "danger");
        resetBtn.classList.remove("d-none");
        resetButton();
        clearTimeout(resetTimeout);
        return;
      }
      if (!artistSelect.value || artistSelect.value === "") {
        showMessage("Please select an artist.", "danger");
        resetBtn.classList.remove("d-none");
        resetButton();
        clearTimeout(resetTimeout);
        return;
      }
      if (!paymentTypeSelect.value || paymentTypeSelect.value === "") {
        showMessage("Please select a payment type.", "danger");
        resetBtn.classList.remove("d-none");
        resetButton();
        clearTimeout(resetTimeout);
        return;
      }
      if (paymentTypeSelect.value === "Installment" && !document.getElementById("installment-terms").checked) {
        showMessage("You must agree to the installment terms.", "danger");
        resetBtn.classList.remove("d-none");
        resetButton();
        clearTimeout(resetTimeout);
        return;
      }
      const contactMethods = document.querySelectorAll('input[name="contact-method"]:checked');
      if (contactMethods.length !== 1) {
        showMessage("Please select exactly one contact method.", "danger");
        resetBtn.classList.remove("d-none");
        resetButton();
        clearTimeout(resetTimeout);
        return;
      }
      if (!privacyPolicy.checked || !subscriptionAgreement.checked) {
        showMessage("You must agree to the privacy policy and subscription agreement.", "danger");
        resetBtn.classList.remove("d-none");
        resetButton();
        clearTimeout(resetTimeout);
        return;
      }
      const addressFields = ["address-line1", "city", "state", "postal-code", "country-select"];
      for (const fieldId of addressFields) {
        const field = document.getElementById(fieldId);
        if (!field.value) {
          showMessage(`Please fill in ${fieldId.replace("-", " ")}.`, "danger");
          resetBtn.classList.remove("d-none");
          resetButton();
          clearTimeout(resetTimeout);
          return;
        }
      }

      // Set permit and submission IDs
      permitIdInput.value = generatePermitId();
      submissionIdInput.value = generateSubmissionId();

      // Show validation modal with countdown
      validationModal.show();
      let countdown = 3;
      countdownElement.textContent = countdown;
      let countdownInterval = null;
      countdownInterval = setInterval(() => {
        countdown--;
        countdownElement.textContent = countdown;
        if (countdown <= 0) {
          clearInterval(countdownInterval);
          countdownInterval = null;
          validationModal.hide();
          submitForm();
        }
      }, 1000);

      // Cancel validation
      const cancelValidationBtn = document.getElementById("cancel-validation");
      cancelValidationBtn?.addEventListener("click", () => {
        if (countdownInterval) {
          clearInterval(countdownInterval);
          countdownInterval = null;
        }
        validationModal.hide();
        resetBtn.classList.remove("d-none");
        resetButton();
        clearTimeout(resetTimeout);
      }, { once: true });
    } catch (error) {
      console.error("Submission error:", error);
      showMessage(`An unexpected error occurred: ${error.message}. Check Netlify Forms configuration in dashboard.`, "danger");
      if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
      }
      validationModal.hide();
      resetBtn.classList.remove("d-none");
      resetButton();
      clearTimeout(resetTimeout);
    } finally {
      console.debug(`Submission attempt took ${performance.now() - startTime}ms`);
    }
  });

  // Submit form
  async function submitForm() {
    const formData = new FormData(form);
    const contactMethod = document.querySelector('input[name="contact-method"]:checked').value;
    sessionStorage.setItem("contactMethod", contactMethod);
    console.debug("Submitting form to Netlify:", Object.fromEntries(formData));

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000); // 4s timeout
      const response = await fetch("/submit-fan-permit", {
        method: "POST",
        body: formData,
        headers: { Accept: "application/json" },
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      console.debug(`Netlify response: HTTP ${response.status}`);
      if (response.ok) {
        console.debug("Submission successful, redirecting to /success");
        window.location.href = "/success";
      } else {
        throw new Error(`HTTP ${response.status}: Ensure "subscription-form" is enabled in Netlify Forms.`);
      }
    } catch (error) {
      console.error("Submission error:", error);
      showMessage(`Submission failed: ${error.message}. Trying native submission...`, "danger");
      resetBtn.classList.remove("d-none");
      resetButton();
      try {
        form.submit();
        console.debug("Native form submission triggered");
      } catch (nativeError) {
        console.error("Native submission error:", nativeError);
        showMessage("Native submission failed. Verify Netlify Forms setup and redeploy.", "danger");
      }
    }
  }

  // Reset button
  resetBtn?.addEventListener("click", () => {
    form.reset();
    progressBar.style.width = "0%";
    progressBar.setAttribute("aria-valuenow", 0);
    installmentOptions.classList.add("d-none");
    paymentMethods.classList.add("d-none");
    formMessage.classList.add("d-none");
    localStorage.removeItem("hybeFormData");
    resetBtn.classList.add("d-none");
    debouncedUpdateProgress();
  });

  // Update progress on input
  [referralCodeInput, emailInput, phoneInput, dobInput, genderSelect, branchSelect, groupSelect, artistSelect, paymentTypeSelect].forEach(input => {
    input.addEventListener("input", debouncedUpdateProgress);
  });
  document.querySelectorAll('input[name="contact-method"]').forEach(input => {
    input.addEventListener("change", debouncedUpdateProgress);
  });
});