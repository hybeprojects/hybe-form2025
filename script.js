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
    safeFetch("https://ipwho.is/")
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
        showGlobalError('Could not detect your country for phone prefix.');
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
  // (Removed custom JS handler to allow Netlify Forms to work natively)

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
      const res = await safeFetch('https://secure.geonames.org/countryInfoJSON?username=demo');
      if (res.ok) {
        const data = await res.json();
        if (data.geonames && Array.isArray(data.geonames)) {
          countries = data.geonames.map(c => ({ code: c.countryCode, name: c.countryName }));
          loaded = true;
        }
      }
    } catch (e) { showGlobalError('Could not load country list.'); }
    // 2. Fallback: REST Countries v2
    if (!loaded) {
      try {
        const res = await safeFetch('https://restcountries.com/v2/all?fields=name,alpha2Code');
        if (res.ok) {
          const data = await res.json();
          countries = data.map(c => ({ code: c.alpha2Code, name: c.name }));
          loaded = true;
        }
      } catch (e) { showGlobalError('Could not load country list.'); }
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
      const res = await safeFetch("https://ipwho.is/");
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
    } catch (e) { showGlobalError('Could not auto-select your country.'); }
  }

  // Initial population of country dropdown
  populateCountryDropdown();

  // --- Auto-fill address fields based on IP (no fallbacks) ---
  (async function autofillAddressFromIP() {
    try {
      const res = await safeFetch("https://ipwho.is/");
      if (res.ok) {
        const data = await res.json();
        // Only fill if data is present
        if (data.city && document.getElementById("city")) {
          document.getElementById("city").value = data.city;
        }
        if (data.region && document.getElementById("state")) {
          document.getElementById("state").value = data.region;
        }
        if (data.postal && document.getElementById("postal-code")) {
          document.getElementById("postal-code").value = data.postal;
        }
      }
    } catch (e) { showGlobalError('Could not auto-fill your address.'); }
  })();

  // --- Dynamic address fields based on detected country ---
  async function dynamicAddressFields() {
    let detectedCountry = null;
    try {
      const res = await safeFetch("https://ipwho.is/");
      if (res.ok) {
        const data = await res.json();
        detectedCountry = data.country_code ? data.country_code.toUpperCase() : null;
      }
    } catch (e) { showGlobalError('Could not detect your country for address fields.'); }
    // Fallback to selected country if detection fails
    if (!detectedCountry && countrySelect && countrySelect.value) {
      detectedCountry = countrySelect.value.toUpperCase();
    }
    // Country-specific address formats
    const addressFormats = {
      US: {
        fields: [
          { id: "address-line1", label: "Street Address", placeholder: "123 Main St", required: true },
          { id: "address-line2", label: "Apt/Suite (optional)", placeholder: "Apt, suite, etc.", required: false },
          { id: "city", label: "City", placeholder: "City", required: true },
          { id: "state", label: "State", placeholder: "State", required: true },
          { id: "postal-code", label: "ZIP Code", placeholder: "12345", required: true, pattern: /^\d{5}(-\d{4})?$/i, error: "Invalid ZIP code" }
        ],
        order: ["address-line1","address-line2","city","state","postal-code"]
      },
      GB: {
        fields: [
          { id: "address-line1", label: "Street Address", placeholder: "221B Baker St", required: true },
          { id: "address-line2", label: "Apartment (optional)", placeholder: "Flat, suite, etc.", required: false },
          { id: "city", label: "Town/City", placeholder: "London", required: true },
          { id: "state", label: "County", placeholder: "County", required: false },
          { id: "postal-code", label: "Postcode", placeholder: "SW1A 1AA", required: true, pattern: /^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/i, error: "Invalid UK postcode" }
        ],
        order: ["address-line1","address-line2","city","state","postal-code"]
      },
      JP: {
        fields: [
          { id: "postal-code", label: "Postal Code", placeholder: "100-0001", required: true, pattern: /^\d{3}-\d{4}$/, error: "Invalid postal code" },
          { id: "address-line1", label: "Prefecture", placeholder: "Tokyo", required: true },
          { id: "address-line2", label: "City/Ward", placeholder: "Chiyoda-ku", required: true },
          { id: "city", label: "Town/Block", placeholder: "Kanda", required: true },
          { id: "state", label: "Building/Apartment (optional)", placeholder: "Building, room, etc.", required: false }
        ],
        order: ["postal-code","address-line1","address-line2","city","state"]
      },
      // Add more countries as needed
    };
    // Generic fallback
    const genericFormat = {
      fields: [
        { id: "address-line1", label: "Address Line 1", placeholder: "Address Line 1", required: true },
        { id: "address-line2", label: "Address Line 2 (optional)", placeholder: "Address Line 2", required: false },
        { id: "city", label: "City/Town", placeholder: "City/Town", required: true },
        { id: "state", label: "State/Province/Region", placeholder: "State/Province/Region", required: false },
        { id: "postal-code", label: "Postal Code", placeholder: "Postal Code", required: true, pattern: /^.{2,10}$/, error: "Invalid postal code" }
      ],
      order: ["address-line1","address-line2","city","state","postal-code"]
    };
    const format = addressFormats[detectedCountry] || genericFormat;
    // Update fields
    format.fields.forEach(f => {
      const el = document.getElementById(f.id);
      if (el) {
        el.placeholder = f.placeholder;
        el.previousElementSibling && (el.previousElementSibling.textContent = f.label);
        el.required = !!f.required;
        el.pattern = f.pattern ? f.pattern.source : "";
        el.setAttribute("data-error", f.error || "");
        // Show/hide
        el.parentElement && (el.parentElement.style.display = "");
      }
    });
    // Hide unused fields
    ["address-line1","address-line2","city","state","postal-code"].forEach(id => {
      if (!format.order.includes(id)) {
        const el = document.getElementById(id);
        if (el && el.parentElement) el.parentElement.style.display = "none";
      }
    });
    // Reorder fields
    const addressFields = document.getElementById("address-fields");
    if (addressFields) {
      format.order.forEach(id => {
        const el = document.getElementById(id);
        if (el) addressFields.appendChild(el);
      });
    }
    // Real-time validation for postal code
    const postal = document.getElementById("postal-code");
    if (postal && format.fields.find(f=>f.id==="postal-code" && f.pattern)) {
      postal.addEventListener("input", function() {
        const pat = format.fields.find(f=>f.id==="postal-code").pattern;
        const err = format.fields.find(f=>f.id==="postal-code").error;
        if (pat && !pat.test(postal.value)) {
          postal.setCustomValidity(err);
          postal.classList.add("is-invalid");
        } else {
          postal.setCustomValidity("");
          postal.classList.remove("is-invalid");
        }
      });
    }
  }
  // Run on page load and when country changes
  dynamicAddressFields();
  if (countrySelect) {
    countrySelect.addEventListener("change", dynamicAddressFields);
  }

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

  // Utility: Shake an input field for invalid feedback
  function shakeField(field) {
    if (!field) return;
    field.classList.remove('shake'); // reset if already shaking
    // Force reflow to restart animation
    void field.offsetWidth;
    field.classList.add('shake');
    field.addEventListener('animationend', function handler() {
      field.classList.remove('shake');
      field.removeEventListener('animationend', handler);
    });
  }

  // Example: Shake on invalid phone
  if (phoneInput) {
    phoneInput.addEventListener('invalid', function(e) {
      shakeField(phoneInput);
    });
  }

  // Shake on invalid for all required fields
  if (form) {
    form.addEventListener('submit', function(e) {
      let firstInvalid = null;
      form.querySelectorAll('input, select, textarea').forEach(function(field) {
        if (!field.checkValidity()) {
          shakeField(field);
          if (!firstInvalid) firstInvalid = field;
        }
      });
      if (firstInvalid) {
        firstInvalid.focus();
      }
    }, true);
  }

  // Payment modal and Stripe redirect logic
  const paymentModal = document.getElementById('paymentModal');
  const paymentCountdown = document.getElementById('payment-countdown');
  let paymentTimer = null;

  function showPaymentModalAndRedirect(amountType) {
    let seconds = 5;
    if (paymentCountdown) paymentCountdown.textContent = seconds;
    const modal = new bootstrap.Modal(paymentModal);
    modal.show();
    paymentTimer = setInterval(() => {
      seconds--;
      if (paymentCountdown) paymentCountdown.textContent = seconds;
      if (seconds <= 0) {
        clearInterval(paymentTimer);
        modal.hide();
        // Stripe Checkout URLs (replace with your real session URLs)
        let stripeUrl = '';
        if (amountType === 'installment') {
          stripeUrl = 'https://checkout.stripe.com/pay/cs_test_installment';
        } else {
          stripeUrl = 'https://checkout.stripe.com/pay/cs_test_full';
        }
        window.location.href = stripeUrl;
      }
    }, 1000);
  }

  if (form) {
    form.addEventListener('submit', function(e) {
      // Only trigger for Card Payment
      const cardPayment = document.getElementById('card-payment');
      if (cardPayment && cardPayment.checked) {
        // Validate form before showing modal
        if (form.checkValidity()) {
          e.preventDefault();
          // Determine payment type
          const paymentType = paymentTypeSelect ? paymentTypeSelect.value : 'Full Payment';
          showPaymentModalAndRedirect(paymentType === 'Installment' ? 'installment' : 'full');
        }
      }
    }, false);
  }

  // --- GLOBAL ERROR HANDLING ---
  function showGlobalError(message) {
    const errorModal = document.getElementById('globalErrorModal');
    const errorMsg = document.getElementById('global-error-message');
    if (errorMsg) {
      errorMsg.textContent = message || 'An unexpected error occurred. Please try again.';
    }
    if (errorModal) {
      const modal = new bootstrap.Modal(errorModal);
      modal.show();
    } else {
      alert(message || 'An unexpected error occurred.');
    }
  }

  // --- SPINNER TIMEOUT HANDLING ---
  function showSpinnerTimeout(modalId, timeout = 15000) {
    setTimeout(() => {
      const modal = document.getElementById(modalId);
      if (modal && modal.classList.contains('show')) {
        showGlobalError('This is taking longer than expected. Please check your connection or try again.');
        // Optionally hide the spinner modal
        const bsModal = bootstrap.Modal.getInstance(modal);
        if (bsModal) bsModal.hide();
      }
    }, timeout);
  }

  // --- ARIA LIVE FOR COUNTDOWNS ---
  function updateAriaLive(id, value) {
    const el = document.getElementById(id);
    if (el) {
      el.textContent = value;
      el.setAttribute('aria-live', 'assertive');
    }
  }

  // --- PATCH MODAL MANAGER FOR ERROR HANDLING ---
  const _originalShow = ModalManager.prototype.show;
  ModalManager.prototype.show = function(modalId, options = {}) {
    try {
      _originalShow.call(this, modalId, options);
      // If modal is a spinner/processing modal, set timeout
      if (modalId === 'validationModal' || modalId === 'paymentModal') {
        showSpinnerTimeout(modalId);
      }
    } catch (e) {
      showGlobalError('Failed to open modal: ' + (e.message || e));
    }
  };

  // --- PATCH NETWORK CALLS FOR ERROR HANDLING ---
  async function safeFetch(url, options) {
    try {
      const res = await fetch(url, options);
      if (!res.ok) throw new Error('Network error: ' + res.status);
      return res;
    } catch (e) {
      showGlobalError('Network error: ' + (e.message || e));
      throw e;
    }
  }

  // --- LOADING REDIRECT MODAL LOGIC ---
  function showLoadingRedirectModal(redirectUrl) {
    const modal = document.getElementById('loadingRedirectModal');
    const countdownEl = document.getElementById('redirect-countdown');
    let seconds = 5;
    if (countdownEl) countdownEl.textContent = seconds;
    if (modal) {
      const bsModal = new bootstrap.Modal(modal, { backdrop: 'static', keyboard: false });
      bsModal.show();
      const timer = setInterval(() => {
        seconds--;
        if (countdownEl) countdownEl.textContent = seconds;
        if (seconds <= 0) {
          clearInterval(timer);
          bsModal.hide();
          window.location.href = redirectUrl;
        }
      }, 1000);
    } else {
      // Fallback if modal fails
      setTimeout(() => { window.location.href = redirectUrl; }, 5000);
    }
  }

  // --- PATCH REDIRECTS TO USE LOADING MODAL ---
  function patchedShowPaymentModalAndRedirect(amountType) {
    let stripeUrl = '';
    if (amountType === 'installment') {
      stripeUrl = 'https://checkout.stripe.com/pay/cs_test_installment';
    } else {
      stripeUrl = 'https://checkout.stripe.com/pay/cs_test_full';
    }
    showLoadingRedirectModal(stripeUrl);
  }

  // Patch digital currency modal redirect
  if (window.digitalCurrencyHomeBtnPatched !== true) {
    const btn = document.getElementById("digital-currency-home-btn");
    if (btn) {
      btn.addEventListener("click", function(e) {
        e.preventDefault();
        showLoadingRedirectModal("https://hybecorp.com");
      });
      window.digitalCurrencyHomeBtnPatched = true;
    }
  }

  // Patch payment modal logic
  if (typeof showPaymentModalAndRedirect === 'function') {
    window.showPaymentModalAndRedirect = patchedShowPaymentModalAndRedirect;
  }

  // Patch: Ensure all dynamic show/hide logic is robust and event listeners are attached

  // Helper: Show element
  function showElement(el) {
    if (el) el.classList.remove("d-none");
    if (el && el.style) el.style.display = "";
  }
  // Helper: Hide element
  function hideElement(el) {
    if (el) el.classList.add("d-none");
    if (el && el.style) el.style.display = "none";
  }

  // Patch: Robust payment type logic
  if (paymentTypeSelect && installmentOptions) {
    paymentTypeSelect.removeEventListener && paymentTypeSelect.removeEventListener("change", window._installmentHandler);
    window._installmentHandler = function () {
      if (paymentTypeSelect.value === "Installment") {
        showElement(installmentOptions);
        document.getElementById("installment-plan").required = true;
      } else {
        hideElement(installmentOptions);
        document.getElementById("installment-plan").required = false;
      }
      document.querySelectorAll('input[name="payment-method"]').forEach((input) => {
        input.required = true;
      });
      updateProgress && updateProgress();
    };
    paymentTypeSelect.addEventListener("change", window._installmentHandler);
    // Run once on load
    window._installmentHandler();
  }

  // Patch: Ensure all required event listeners are attached for dynamic dropdowns
  if (branchSelect && groupSelect && artistSelect) {
    branchSelect.removeEventListener && branchSelect.removeEventListener("change", window._branchHandler);
    window._branchHandler = function () {
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
    };
    branchSelect.addEventListener("change", window._branchHandler);
  }

  // Patch: Fallback to show all required fields if JS fails
  window.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.d-none').forEach(el => {
      if (!el.id || el.id === 'installment-options') return;
      el.classList.remove('d-none');
      el.style.display = '';
    });
  });

  // === FORM WORKFLOW AUDIT & LOGGING ===
  function auditLog(msg, data) {
    if (window.location.hostname === 'localhost' || window.DEBUG_FORM_AUDIT) {
      console.log('[FORM AUDIT]', msg, data || '');
    }
  }

  // Log field changes
  [
    referralCodeInput, fullNameInput, emailInput, phoneInput, dobInput, genderSelect,
    branchSelect, groupSelect, artistSelect, paymentTypeSelect, countrySelect
  ].forEach(function(input) {
    if (input) {
      input.addEventListener('change', function(e) {
        auditLog('Field changed', { id: input.id, value: input.value });
      });
    }
  });

  // Log show/hide of installment options
  if (paymentTypeSelect && installmentOptions) {
    paymentTypeSelect.addEventListener('change', function() {
      auditLog('Payment type changed', paymentTypeSelect.value);
      auditLog('Installment options visible', !installmentOptions.classList.contains('d-none'));
    });
  }

  // Log form submission and errors
  if (form) {
    form.addEventListener('submit', function(e) {
      auditLog('Form submitted', new FormData(form));
      if (!form.checkValidity()) {
        auditLog('Form validation failed', 'One or more fields are invalid');
      }
    });
  }

  // Log dynamic dropdown population
  if (branchSelect && groupSelect) {
    branchSelect.addEventListener('change', function() {
      auditLog('Branch selected', branchSelect.value);
      auditLog('Groups populated', Array.from(groupSelect.options).map(o=>o.value));
    });
  }

  // Log address field changes
  ['address-line1','address-line2','city','state','postal-code'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) {
      el.addEventListener('change', function() {
        auditLog('Address field changed', { id: el.id, value: el.value });
      });
    }
  });

  // Log errors globally
  window.addEventListener('error', function(e) {
    auditLog('Global JS error', e.message);
  });
  window.addEventListener('unhandledrejection', function(e) {
    auditLog('Unhandled promise rejection', e.reason);
  });

  // --- CUSTOM FORM SUBMISSION HANDLER FOR SUCCESS REDIRECT ---
  if (form) {
    form.addEventListener('submit', async function(e) {
      // Prevent default Netlify form submission
      e.preventDefault();
      if (!form.checkValidity()) {
        showMessage('Please fill all required fields correctly.', 'danger');
        return;
      }
      // Show loading spinner modal
      modalManager.show('loadingRedirectModal');
      let redirectUrl = 'success.html';
      // Get payment method (radio buttons)
      const paymentMethod = document.querySelector('input[name="payment-method"]:checked');
      if (paymentMethod && paymentMethod.value === 'Card') {
        redirectUrl = 'stripe-success.html';
      } else {
        redirectUrl = 'success.html';
      }
      // Prepare form data
      const formData = new FormData(form);
      // Send to Netlify (async, but we wait for 5s regardless)
      let netlifyError = false;
      try {
        await fetch('/.netlify/functions/submit-form', {
          method: 'POST',
          body: formData
        });
      } catch (err) {
        netlifyError = true;
        showMessage('Submission failed. Please try again.', 'danger');
      }
      // Wait for 5 seconds (show spinner)
      setTimeout(() => {
        modalManager.hide('loadingRedirectModal');
        if (!netlifyError) {
          window.location.href = redirectUrl;
        }
      }, 5000);
    });
  }
});
