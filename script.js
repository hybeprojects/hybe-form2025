// ModalManager: Robust modal management class for Bootstrap modals
class ModalManager {
  constructor() {
    this.activeModals = new Map();
    this.activeTimers = new Map();
  }

  initialize(modalId) {
    const element = document.getElementById(modalId);
    if (!element) {
      console.error(`Modal ${modalId} not found`);
      return null;
    }
    try {
      const modal = new bootstrap.Modal(element);
      this.activeModals.set(modalId, modal);

      element.addEventListener(
        "hidden.bs.modal",
        () => {
          this.cleanup(modalId);
        },
        { once: true }
      );

      return modal;
    } catch (error) {
      console.error(`Failed to initialize modal "${modalId}": ${error.message}`);
      return null;
    }
  }

  show(modalId, options = {}) {
    const modal = this.activeModals.get(modalId) || this.initialize(modalId);
    if (!modal) return;

    if (options.countdown) {
      this.setupCountdown(modalId, options.countdown);
    }

    modal.show();
  }

  hide(modalId) {
    const modal = this.activeModals.get(modalId);
    if (modal) {
      modal.hide();
    }
  }

  setupCountdown(modalId, { duration, elementId, onComplete }) {
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
        this.cleanup(modalId);
        this.hide(modalId);
        if (typeof onComplete === "function") {
          try {
            onComplete();
          } catch (error) {
            console.error(`Error in onComplete callback: ${error.message}`);
          }
        }
      }
    }, 1000);

    this.activeTimers.set(modalId, timer);
  }

  cleanup(modalId) {
    const timer = this.activeTimers.get(modalId);
    if (timer) {
      clearInterval(timer);
      this.activeTimers.delete(modalId);
    }
  }
}

const modalManager = new ModalManager();

document.addEventListener("DOMContentLoaded", () => {
  // Initialize AOS animations (run once for performance)
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
  const digitalCurrencyHomeBtn = document.getElementById("digital-currency-home-btn");
  const privacyPolicy = document.getElementById("privacy-policy");
  const subscriptionAgreement = document.getElementById("subscription-agreement");
  const permitIdInput = document.getElementById("permit-id");
  const submissionIdInput = document.getElementById("submission-id");
  const submitBtn = document.getElementById("submit-btn");
  const btnText = submitBtn ? submitBtn.querySelector(".btn-text") : null;
  const spinner = submitBtn ? submitBtn.querySelector(".spinner-border") : null;
  const progressBar = document.querySelector(".progress-bar");
  const countrySelect = document.getElementById("country-select");
  const countryInput = document.getElementById("country");
  const currencyInput = document.getElementById("currency");
  const languageInput = document.getElementById("language");
  let iti;
  let failure;
  // Regular expression for email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Show onboarding modal immediately
  modalManager.show("onboardingModal");

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
      "fromis_9": [
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
        artistSelect.appendChild(option);
      });
    }
    updateProgress();
  });

  /**
   * Updates the progress bar based on filled form fields
   */
  function updateProgress() {
    const totalFields = 14; // referral-code, full-name, email, phone, address-line1, city, state, postal-code, country-select, dob, gender, branch, group, artist, payment-type, contact-method
    let filledFields = 0;
    if (referralCodeInput.value) filledFields++;
    if (fullNameInput.value) filledFields++;
    if (emailInput.value) filledFields++;
    if (phoneInput.value) filledFields++;
    if (document.getElementById("address-line1").value) filledFields++;
    if (document.getElementById("city").value) filledFields++;
    if (document.getElementById("state").value) filledFields++;
    if (document.getElementById("postal-code").value) filledFields++;
    if (countrySelect.value) filledFields++;
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
  if (paymentTypeSelect && installmentOptions) {
    paymentTypeSelect.addEventListener("change", () => {
      if (paymentTypeSelect.value === "Installment") {
        installmentOptions.classList.remove("d-none");
        document.getElementById("installment-plan").required = true;
      } else {
        installmentOptions.classList.add("d-none");
        document.getElementById("installment-plan").required = false;
      }
      document.querySelectorAll('input[name="payment-method"]').forEach((input) => {
        input.required = true;
      });
      updateProgress();
    });
  }

  // Digital currency home button
  if (digitalCurrencyHomeBtn) {
    digitalCurrencyHomeBtn.addEventListener("click", () => {
      modalManager.hide("digitalCurrencySuccessModal");
      window.location.href = "https://hybecorp.com";
    });
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
    if (input) {
      input.addEventListener("input", updateProgress);
    }
  });

  document.querySelectorAll('input[name="contact-method"]').forEach((input) => {
    input.addEventListener("change", updateProgress);
  });

  // Initialize tooltips for accessibility
  document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach((tooltipTriggerEl) => {
    new bootstrap.Tooltip(tooltipTriggerEl);
  });

  // Phone number input: International Telephone Input
  if (window.intlTelInput && phoneInput) {
    iti = window.intlTelInput(phoneInput, {
      separateDialCode: true,
      initialCountry: "auto",
      geoIpLookup: function (success, failure) {
        fetch("https://ipapi.co/json")
          .then((res) => res.json())
          .then((data) => success(data.country_code))
          .catch(() => success("US"));
      },
      utilsScript: "https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/18.1.1/js/utils.js",
    });

    // Real-time phone validation and error display
    const phoneError = document.getElementById("phone-error");
    function validatePhoneInput() {
      if (!window.intlTelInputUtils) {
        phoneError.textContent = "Phone validation unavailable: utility script failed to load.";
        phoneError.classList.add("d-block");
        phoneInput.setAttribute("aria-invalid", "true");
        return false;
      }
      if (!iti.isValidNumber()) {
        phoneError.textContent = "Please enter a valid phone number including country code.";
        phoneError.classList.add("d-block");
        phoneInput.setAttribute("aria-invalid", "true");
        return false;
      } else {
        phoneError.textContent = "";
        phoneError.classList.remove("d-block");
        phoneInput.setAttribute("aria-invalid", "false");
        return true;
      }
    }
    phoneInput.addEventListener("input", validatePhoneInput);
    phoneInput.addEventListener("blur", validatePhoneInput);
  }

  // Form submission handler
  if (form) {
    // Remove custom fetch handler for Netlify Forms
    // form.addEventListener("submit", async (e) => {
    //   e.preventDefault();
    //   if (submitBtn && spinner && btnText) {
    //     submitBtn.disabled = true;
    //     spinner.classList.remove("d-none");
    //     btnText.classList.add("d-none");
    //   }
    //   if (formMessage) {
    //     formMessage.classList.add("d-none");
    //   }

    //   // Validation
    //   try {
    //     if (!form.checkValidity()) {
    //       form.classList.add("was-validated");
    //       showMessage("Please fill out all required fields correctly.", "danger");
    //       resetButton();
    //       return;
    //     }

    //     if (referralCodeInput.value !== "HYBE2025") {
    //       showMessage("Invalid referral code. Use HYBE2025.", "danger");
    //       resetButton();
    //       return;
    //     }
    //     if (!emailRegex.test(emailInput.value)) {
    //       showMessage("Invalid email address.", "danger");
    //       resetButton();
    //       return;
    //     }
    //     if (!iti || !iti.isValidNumber()) {
    //       showMessage("Invalid phone number.", "danger");
    //       resetButton();
    //       return;
    //     }
    //     phoneInput.value = iti.getNumber(); // Store E.164 format

    //     const dob = new Date(dobInput.value);
    //     if (isNaN(dob) || dobInput.value !== dob.toISOString().split("T")[0]) {
    //       showMessage("Invalid date of birth. Use YYYY-MM-DD format.", "danger");
    //       resetButton();
    //       return;
    //     }
    //     const today = new Date();
    //     const age = today.getFullYear() - dob.getFullYear();
    //     if (age < 13) {
    //       showMessage("You must be at least 13 years old to subscribe.", "danger");
    //       resetButton();
    //       return;
    //     }
    //     if (!privacyPolicy.checked) {
    //       showMessage("You must agree to the Privacy Policy.", "danger");
    //       resetButton();
    //       return;
    //     }
    //     if (!subscriptionAgreement.checked) {
    //       showMessage("You must agree to complete the subscription.", "danger");
    //       resetButton();
    //       return;
    //     }

    //     // Generate IDs
    //     permitIdInput.value = generatePermitId();
    //     submissionIdInput.value = `SUB-${Date.now()}`;

    //     // Gather form data
    //     const formData = new FormData(form);
    //     const data = {};
    //     formData.forEach((value, key) => {
    //       data[key] = value;
    //     });

    //     // Submit to Netlify function
    //     const response = await fetch("/submit-fan-permit", {
    //       method: "POST",
    //       headers: {
    //         "Content-Type": "application/json",
    //       },
    //       body: JSON.stringify(data),
    //     });
    //     const result = await response.json();
    //     if (response.ok) {
    //       showMessage("Submission successful!", "success");
    //       // Optionally redirect or show a modal
    //     } else {
    //       showMessage(result.error || "Submission failed.", "danger");
    //     }
    //     resetButton();
    //   } catch (error) {
    //     showMessage(`Submission failed: ${error.message}", "danger`);
    //     resetButton();
    //   }
    // });
  }

  // FormData polyfill for environments where it's not available
  if (typeof FormData === 'undefined') {
    window.FormData = function(form) {
      const data = {};
      Array.from(form.elements).forEach(el => {
        if (el.name && !el.disabled) {
          data[el.name] = el.value;
        }
      });
      return {
        forEach: (cb) => {
          Object.entries(data).forEach(([k, v]) => cb(v, k));
        }
      };
    };
  }

  // --- Auto-select country and dynamic address format ---
  // Populate country dropdown with all countries (global)
  async function populateCountryDropdown() {
    // Clear dropdown before populating (prevents duplicates)
    countrySelect.innerHTML = '<option value="" disabled selected>Select Country</option>';
    let countries = [];
    let loaded = false;
    // 1. Try GeoNames API (requires username, demo is public)
    try {
      const res = await fetch('https://secure.geonames.org/countryInfoJSON?username=demo');
      if (res.ok) {
        const data = await res.json();
        if (data.geonames && Array.isArray(data.geonames)) {
          countries = data.geonames.map(c => ({ code: c.countryCode, name: c.countryName }));
          loaded = true;
        }
      }
    } catch (e) {}
    // 2. Fallback: REST Countries v2
    if (!loaded) {
      try {
        const res = await fetch('https://restcountries.com/v2/all?fields=name,alpha2Code');
        if (res.ok) {
          const data = await res.json();
          countries = data.map(c => ({ code: c.alpha2Code, name: c.name }));
          loaded = true;
        }
      } catch (e) {}
    }
    // 3. Fallback: Static list (top 10 for brevity, expand as needed)
    if (!loaded) {
      countries = [
        { code: 'US', name: 'United States' },
        { code: 'GB', name: 'United Kingdom' },
        { code: 'JP', name: 'Japan' },
        { code: 'KR', name: 'South Korea' },
        { code: 'CN', name: 'China' },
        { code: 'FR', name: 'France' },
        { code: 'DE', name: 'Germany' },
        { code: 'IN', name: 'India' },
        { code: 'BR', name: 'Brazil' },
        { code: 'CA', name: 'Canada' }
      ];
      showMessage('Could not load full country list. Using fallback.', 'warning');
    }
    // Sort and populate
    countries.sort((a, b) => a.name.localeCompare(b.name));
    countries.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.code;
      opt.textContent = c.name;
      countrySelect.appendChild(opt);
    });
    // Remove 'selected' from the default option so auto-select works
    const defaultOpt = countrySelect.querySelector('option[value=""]');
    if (defaultOpt) defaultOpt.removeAttribute('selected');
    // After populating, set geoIP country
    try {
      const res = await fetch("https://ipapi.co/json");
      if (res.ok) {
        const data = await res.json();
        if (countrySelect && data.country_code) {
          countrySelect.value = data.country_code;
          countryInput.value = data.country_code;
          updateAddressFieldsForCountry(data.country_code);
        }
      }
    } catch (e) {}
  }
  if (countrySelect) populateCountryDropdown();

  // Update hidden input and address fields on country change
  if (countrySelect) {
    countrySelect.addEventListener("change", e => {
      countryInput.value = countrySelect.value;
      updateAddressFieldsForCountry(countrySelect.value);
    });
  }
  // Dynamic address field formatting (basic global fallback)
  function updateAddressFieldsForCountry(code) {
    const line1 = document.getElementById("address-line1");
    const line2 = document.getElementById("address-line2");
    const city = document.getElementById("city");
    const state = document.getElementById("state");
    const postal = document.getElementById("postal-code");
    // Default (global)
    let labels = {
      line1: "Address Line 1",
      line2: "Address Line 2",
      city: "City/Town",
      state: "State/Province/Region",
      postal: "Postal Code/ZIP"
    };
    let order = [line1, line2, city, state, postal];
    // Country-specific overrides (examples)
    if (code === "US") {
      labels = {
        line1: "Address Line 1",
        line2: "Address Line 2",
        city: "City",
        state: "State",
        postal: "ZIP Code"
      };
    } else if (code === "GB") {
      labels = {
        line1: "Street Address",
        line2: "Address Line 2",
        city: "Town/City",
        state: "County",
        postal: "Postcode"
      };
    } else if (code === "JP") {
      labels = {
        line1: "Prefecture",
        line2: "City/Ward",
        city: "Town/Block",
        state: "Building/Apartment",
        postal: "Postal Code"
      };
      order = [postal, line1, line2, city, state];
    }
    // Update placeholders/labels
    if (line1) line1.placeholder = labels.line1;
    if (line2) line2.placeholder = labels.line2;
    if (city) city.placeholder = labels.city;
    if (state) state.placeholder = labels.state;
    if (postal) postal.placeholder = labels.postal;
    // Optionally reorder fields for JP
    const addressFields = document.getElementById("address-fields");
    if (addressFields && code === "JP") {
      order.forEach(f => f && addressFields.appendChild(f));
    } else if (addressFields) {
      [line1, line2, city, state, postal].forEach(f => f && addressFields.appendChild(f));
    }
  }
});
