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

  // --- Phone number: emoji flag + country code prefix, no dropdown ---
  const phonePrefix = document.getElementById("phone-prefix");
  if (phonePrefix && phoneInput) {
    // Country data: code, dial, format, validation regex
    const countryData = {
      US: { dial: "+1", format: v => v.replace(/(\d{3})(\d{3})(\d{0,4})/, (m,a,b,c)=>c?`(${a}) ${b}-${c}`:b?`(${a}) ${b}`:a), regex: /^\d{10}$/ },
      GB: { dial: "+44", format: v => v.replace(/(\d{5})(\d{0,6})/, (m,a,b)=>b?`${a} ${b}`:a), regex: /^\d{10,11}$/ },
      JP: { dial: "+81", format: v => v.replace(/(\d{2,4})(\d{2,4})(\d{0,4})/, (m,a,b,c)=>c?`${a}-${b}-${c}`:b?`${a}-${b}`:a), regex: /^\d{10,11}$/ },
      KR: { dial: "+82", format: v => v.replace(/(\d{2,3})(\d{3,4})(\d{0,4})/, (m,a,b,c)=>c?`${a}-${b}-${c}`:b?`${a}-${b}`:a), regex: /^\d{9,10}$/ },
      // Add more as needed
    };
    // Helper to get emoji flag from country code
    function countryCodeToFlagEmoji(cc) {
      if (!cc) return "🌐";
      return cc
        .toUpperCase()
        .replace(/./g, char => String.fromCodePoint(127397 + char.charCodeAt()));
    }
    // Default to US
    let userCC = "US";
    let userDial = countryData[userCC].dial;
    let userFormat = countryData[userCC].format;
    let userRegex = countryData[userCC].regex;
    // GeoIP lookup (using ipwho.is for reliability)
    fetch("https://ipwho.is/")
      .then(res => res.json())
      .then(data => {
        console.log('GeoIP response:', data); // Debug: see what country_code is returned
        const cc = data.country_code ? data.country_code.toUpperCase() : '';
        if (cc && countryData[cc]) {
          userCC = cc;
          userDial = countryData[userCC].dial;
          userFormat = countryData[userCC].format;
          userRegex = countryData[userCC].regex;
        }
        phonePrefix.textContent = `${countryCodeToFlagEmoji(userCC)} ${userDial}`;
      })
      .catch(() => {
        phonePrefix.textContent = `${countryCodeToFlagEmoji(userCC)} ${userDial}`;
      });
    // Expanded countryData for more coverage
    Object.assign(countryData, {
      CA: { dial: "+1", format: v => v.replace(/(\d{3})(\d{3})(\d{0,4})/, (m,a,b,c)=>c?`(${a}) ${b}-${c}`:b?`(${a}) ${b}`:a), regex: /^\d{10}$/ },
      AU: { dial: "+61", format: v => v.replace(/(\d{1,4})(\d{3})(\d{0,3})/, (m,a,b,c)=>c?`${a} ${b} ${c}`:b?`${a} ${b}`:a), regex: /^\d{9,10}$/ },
      IN: { dial: "+91", format: v => v.replace(/(\d{5})(\d{0,5})/, (m,a,b)=>b?`${a} ${b}`:a), regex: /^\d{10}$/ },
      DE: { dial: "+49", format: v => v.replace(/(\d{3,5})(\d{3,8})/, (m,a,b)=>b?`${a} ${b}`:a), regex: /^\d{10,11}$/ },
      FR: { dial: "+33", format: v => v.replace(/(\d{1})(\d{2})(\d{2})(\d{2})(\d{0,2})/, (m,a,b,c,d,e)=>e?`${a} ${b} ${c} ${d} ${e}`:d?`${a} ${b} ${c} ${d}`:c?`${a} ${b} ${c}`:b?`${a} ${b}`:a), regex: /^\d{9,10}$/ },
      CN: { dial: "+86", format: v => v.replace(/(\d{3})(\d{4})(\d{0,4})/, (m,a,b,c)=>c?`${a} ${b} ${c}`:b?`${a} ${b}`:a), regex: /^\d{11}$/ },
      BR: { dial: "+55", format: v => v.replace(/(\d{2})(\d{5})(\d{0,4})/, (m,a,b,c)=>c?`(${a}) ${b}-${c}`:b?`(${a}) ${b}`:a), regex: /^\d{10,11}$/ },
      RU: { dial: "+7", format: v => v.replace(/(\d{3})(\d{3})(\d{0,4})/, (m,a,b,c)=>c?`${a} ${b} ${c}`:b?`${a} ${b}`:a), regex: /^\d{10}$/ },
      ZA: { dial: "+27", format: v => v.replace(/(\d{2})(\d{3})(\d{0,4})/, (m,a,b,c)=>c?`${a} ${b} ${c}`:b?`${a} ${b}`:a), regex: /^\d{9}$/ },
      NG: { dial: "+234", format: v => v.replace(/(\d{3})(\d{3})(\d{0,4})/, (m,a,b,c)=>c?`${a} ${b} ${c}`:b?`${a} ${b}`:a), regex: /^\d{10}$/ },
      // Add more as needed
    });
    // Format and validate as user types
    const phoneError = document.getElementById("phone-error");
    function cleanNumber(val) { return val.replace(/\D/g,""); }
    function formatAndValidate() {
      let raw = cleanNumber(phoneInput.value);
      phoneInput.value = userFormat(raw);
      if (!userRegex.test(raw)) {
        phoneError.textContent = "Please enter a valid phone number.";
        phoneError.classList.add("d-block");
        phoneInput.setAttribute("aria-invalid", "true");
        phoneInput.classList.add("is-invalid");
        phoneInput.classList.remove("is-valid");
        return false;
      } else {
        phoneError.textContent = "";
        phoneError.classList.remove("d-block");
        phoneInput.setAttribute("aria-invalid", "false");
        phoneInput.classList.remove("is-invalid");
        phoneInput.classList.add("is-valid");
        return true;
      }
    }
    phoneInput.addEventListener("input", formatAndValidate);
    phoneInput.addEventListener("blur", formatAndValidate);
    if (form) {
      form.addEventListener("submit", function(e) {
        if (!formatAndValidate()) {
          e.preventDefault();
          phoneInput.focus();
          showMessage("Please enter a valid phone number before submitting.", "danger");
        }
      });
    }
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
    // After populating, set geoIP country using ipwho.is
    try {
      const res = await fetch("https://ipwho.is/");
      if (res.ok) {
        const data = await res.json();
        const cc = data.country_code ? data.country_code.toUpperCase() : '';
        if (countrySelect && cc) {
          // Find matching option (case-insensitive)
          const opt = Array.from(countrySelect.options).find(o => o.value.toUpperCase() === cc);
          if (opt) {
            countrySelect.value = opt.value;
            countryInput.value = opt.value;
            updateAddressFieldsForCountry(opt.value);
          }
        }
      }
    } catch (e) {}
  }

  // Initial population of country dropdown
  populateCountryDropdown();
});

// --- Dynamic address fields based on country ---
// Address field visibility and requirements based on selected country
function updateAddressFieldsForCountry(countryCode) {
  const addressFields = [
    "address-line1",
    "address-line2",
    "city",
    "state",
    "postal-code",
    "country-select",
  ];
  const isUS = countryCode === "US";
  const isCA = countryCode === "CA";
  const isGB = countryCode === "GB";
  const isAU = countryCode === "AU";
  const isIN = countryCode === "IN";
  const isBR = countryCode === "BR";
  const isFR = countryCode === "FR";
  const isDE = countryCode === "DE";
  const isJP = countryCode === "JP";
  const isKR = countryCode === "KR";
  const isCN = countryCode === "CN";
  const isRU = countryCode === "RU";
  const isZA = countryCode === "ZA";
  const isNG = countryCode === "NG";

  // Show/hide fields based on country
  document.getElementById("address-line2").closest(".form-group").classList.toggle("d-none", isUS || isCA);
  document.getElementById("state").closest(".form-group").classList.toggle("d-none", isUS || isCA);
  document.getElementById("postal-code").closest(".form-group").classList.toggle("d-none", isUS || isCA);
  document.getElementById("country-select").closest(".form-group").classList.toggle("d-none", isUS || isCA);

  // Set required fields based on country
  addressFields.forEach((field) => {
    const element = document.getElementById(field);
    if (element) {
      element.required = !element.closest(".form-group").classList.contains("d-none");
    }
  });

  // Special cases for certain countries
  if (isUS) {
    document.getElementById("state").setAttribute("placeholder", "State (e.g., CA)");
  } else if (isCA) {
    document.getElementById("state").setAttribute("placeholder", "Province (e.g., ON)");
  } else if (isGB) {
    document.getElementById("state").setAttribute("placeholder", "County (e.g., Greater London)");
  } else if (isAU) {
    document.getElementById("state").setAttribute("placeholder", "State/Territory (e.g., NSW)");
  } else if (isIN) {
    document.getElementById("state").setAttribute("placeholder", "State (e.g., Maharashtra)");
  } else if (isBR) {
    document.getElementById("state").setAttribute("placeholder", "Estado (e.g., São Paulo)");
  } else if (isFR) {
    document.getElementById("state").setAttribute("placeholder", "Région (e.g., Île-de-France)");
  } else if (isDE) {
    document.getElementById("state").setAttribute("placeholder", "Bundesland (e.g., Bayern)");
  } else if (isJP) {
    document.getElementById("state").setAttribute("placeholder", "都道府県 (e.g., 東京都)");
  } else if (isKR) {
    document.getElementById("state").setAttribute("placeholder", "시/도 (e.g., 서울특별시)");
  } else if (isCN) {
    document.getElementById("state").setAttribute("placeholder", "省/直辖市 (e.g., 北京市)");
  } else if (isRU) {
    document.getElementById("state").setAttribute("placeholder", "Регион (e.g., Москва)");
  } else if (isZA) {
    document.getElementById("state").setAttribute("placeholder", "Province (e.g., Gauteng)");
  } else if (isNG) {
    document.getElementById("state").setAttribute("placeholder", "State (e.g., Lagos)");
  } else {
    document.getElementById("state").removeAttribute("placeholder");
  }
}

// --- Generate random permit ID ---
function generatePermitId() {
  const timestamp = Date.now().toString(36); // Convert timestamp to base-36 string
  const randomNum = Math.random().toString(36).substring(2, 8); // Random alphanumeric string
  return `PERMIT-${timestamp}-${randomNum}`;
}
