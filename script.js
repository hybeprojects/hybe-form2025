document.addEventListener("DOMContentLoaded", () => {
  // Initialize AOS animations
  AOS.init({ once: true });

  // Initialize Bootstrap tooltips
  const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
  tooltipTriggerList.forEach(tooltipTriggerEl => {
    new bootstrap.Tooltip(tooltipTriggerEl);
  });

  // DOM elements
  const onboardingModal = new bootstrap.Modal(document.getElementById("onboardingModal"));
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
      fetchWithRetry("https://ipapi.co/json/", {})
        .then(data => callback(data.country_code))
        .catch(() => callback("us"));
    },
    utilsScript: "/js/intl-tel-input-utils.js" // Local fallback
  });

  // Fetch with retry logic
  async function fetchWithRetry(url, options, retries = 3) {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url, options);
        if (!response.ok) throw new Error(`HTTP error ${response.status}`);
        return await response.json();
      } catch (error) {
        if (i === retries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  // Populate country dropdown
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

  // Update hidden fields (country, currency, language)
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
    updateProgress();
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
    updateProgress();
  });

  // Real-time validation for inputs
  const inputs = [
    document.getElementById("full-name"),
    document.getElementById("address-line1"),
    document.getElementById("city"),
    document.getElementById("state"),
    document.getElementById("postal-code"),
    emailInput
  ];
  inputs.forEach(input => {
    input.addEventListener("input", () => {
      if (!input.value) {
        input.classList.add("is-invalid");
        input.nextElementSibling.textContent = `Please enter a valid ${input.name.replace("-", " ")}.`;
      } else {
        input.classList.remove("is-invalid");
        input.nextElementSibling.textContent = "";
      }
    });
  });

  // Postal code validation
  const postalCodeInput = document.getElementById("postal-code");
  postalCodeInput.addEventListener("input", () => {
    const country = countrySelect.value;
    const usZipRegex = /^\d{5}(-\d{4})?$/;
    if (country === "US" && !usZipRegex.test(postalCodeInput.value)) {
      postalCodeInput.classList.add("is-invalid");
      postalCodeInput.nextElementSibling.textContent = "Invalid US ZIP code.";
    } else {
      postalCodeInput.classList.remove("is-invalid");
      postalCodeInput.nextElementSibling.textContent = "";
    }
  });

  countrySelect.addEventListener("change", () => {
    updateHiddenFields(countrySelect.value);
  });

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
    const totalFields = requiredFields.length + (paymentTypeSelect.value === "Installment" ? 1 : 0) + 1; // +1 for contact-method
    const progress = (filledFields / totalFields) * 100;
    progressBar.style.width = `${progress}%`;
    progressBar.setAttribute("aria-valuenow", progress);
  }

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
    updateProgress();
  });

  // Generate permit and submission IDs
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
    formMessage.classList.remove("d-none");
    formMessage.classList.add(`alert-${type}`);
    formMessage.setAttribute("role", "alert");
    formMessage.setAttribute("aria-live", "assertive");
  }

  // Reset submit button
  function resetButton() {
    submitBtn.disabled = false;
    btnText.textContent = "Submit Subscription";
    spinner.classList.add("d-none");
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
    updateProgress();
  }

  // Form submission
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    submitBtn.disabled = true;
    btnText.textContent = "Submitting...";
    spinner.classList.remove("d-none");
    formMessage.classList.add("d-none");

    // Validation
    if (!validReferralCodes.includes(referralCodeInput.value)) {
      showMessage("Invalid referral code.", "danger");
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
    const phoneNumber = iti.getNumber();
    phoneInput.value = phoneNumber;

    const dob = new Date(dobInput.value);
    const today = new Date();
    if (isNaN(dob) || dob > today || dobInput.value !== dob.toISOString().split("T")[0]) {
      showMessage("Invalid date of birth. Use YYYY-MM-DD and ensure it’s not in the future.", "danger");
      resetButton();
      return;
    }
    const age = today.getFullYear() - dob.getFullYear();
    if (age < 13) {
      showMessage("You must be at least 13 years old to subscribe.", "danger");
      resetButton();
      return;
    }
    if (!genderSelect.value || genderSelect.value === "") {
      showMessage("Please select your gender.", "danger");
      resetButton();
      return;
    }
    if (!branchSelect.value || branchSelect.value === "") {
      showMessage("Please select a HYBE branch.", "danger");
      resetButton();
      return;
    }
    if (!groupSelect.value || groupSelect.value === "") {
      showMessage("Please select a group.", "danger");
      resetButton();
      return;
    }
    if (!artistSelect.value || artistSelect.value === "") {
      showMessage("Please select an artist.", "danger");
      resetButton();
      return;
    }
    if (!paymentTypeSelect.value || paymentTypeSelect.value === "") {
      showMessage("Please select a payment type.", "danger");
      resetButton();
      return;
    }
    if (paymentTypeSelect.value === "Installment" && !document.getElementById("installment-terms").checked) {
      showMessage("You must agree to the installment terms.", "danger");
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
    const addressFields = ["address-line1", "city", "state", "postal-code", "country-select"];
    for (const fieldId of addressFields) {
      const field = document.getElementById(fieldId);
      if (!field.value) {
        showMessage(`Please fill in ${fieldId.replace("-", " ")}.`, "danger");
        resetButton();
        return;
      }
    }

    // Set permit and submission IDs
    permitIdInput.value = generatePermitId();
    submissionIdInput.value = generateSubmissionId();

    // Show validation modal with countdown
    validationModal.show();
    let countdown = 5;
    countdownElement.textContent = countdown;
    const countdownInterval = setInterval(() => {
      countdown--;
      countdownElement.textContent = countdown;
      if (countdown <= 0) {
        clearInterval(countdownInterval);
        validationModal.hide();
        submitForm();
      }
    }, 1000);

    // Cancel validation
    const cancelValidationBtn = document.getElementById("cancel-validation");
    cancelValidationBtn?.addEventListener("click", () => {
      clearInterval(countdownInterval);
      validationModal.hide();
      resetButton();
    });
  });

  // Submit form
  async function submitForm() {
    const formData = new FormData(form);
    const contactMethod = document.querySelector('input[name="contact-method"]:checked').value;
    sessionStorage.setItem("contactMethod", contactMethod);
    try {
      const response = await fetch("/submit-fan-permit", {
        method: "POST",
        body: formData,
        headers: { Accept: "application/json" },
      });
      if (response.ok) {
        window.location.href = "/success"; // Redirect to success page
      } else {
        throw new Error("Submission failed.");
      }
    } catch (error) {
      showMessage(`Submission failed: ${error.message}`, "danger");
      resetButton();
    }
  }

  // Update progress on input
  [referralCodeInput, emailInput, phoneInput, dobInput, genderSelect, branchSelect, groupSelect, artistSelect, paymentTypeSelect].forEach(input => {
    input.addEventListener("input", updateProgress);
  });
  document.querySelectorAll('input[name="contact-method"]').forEach(input => {
    input.addEventListener("change", updateProgress);
  });
});