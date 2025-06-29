
// Ensure Stripe.js is loaded
const stripeScript = document.createElement('script');
stripeScript.src = 'https://js.stripe.com/v3/';
stripeScript.async = true;
stripeScript.onload = () => {
  console.log('Stripe.js loaded successfully');
  window.stripe = Stripe('pk_live_YOUR_PUBLISHABLE_KEY'); // Replace with your Stripe publishable key
};
stripeScript.onerror = () => {
  showToast('Failed to load payment processor. Please try again later.', 'error');
};
document.head.appendChild(stripeScript);

document.addEventListener("DOMContentLoaded", () => {
  // Initialize AOS animations
  if (typeof AOS !== "undefined") {
    AOS.init({ duration: 800, once: true });
  }

  // Show onboarding modal and focus first input
  const onboardingModal = document.getElementById("onboardingModal");
  if (onboardingModal) {
    const onboardingInstance = new bootstrap.Modal(onboardingModal);
    onboardingInstance.show();
    onboardingModal.addEventListener('shown.bs.modal', () => {
      const firstInput = onboardingModal.querySelector('input, button, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (firstInput) firstInput.focus();
    });
  }

  // ARIA live region for feedback
  if (formMessage) {
    formMessage.setAttribute('aria-live', 'polite');
  }

  // Instant feedback for each field
  [fullNameInput, emailInput, phoneInput, dobInput].forEach(input => {
    if (input) {
      input.addEventListener('input', function() {
        if (input.checkValidity()) {
          input.classList.add('is-valid');
          input.classList.remove('is-invalid');
        } else {
          input.classList.remove('is-valid');
          input.classList.add('is-invalid');
        }
      });
    }
  });

  // Debounce for performance on validation
  function debounce(fn, delay) {
    let timer = null;
    return function(...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  }
  if (emailInput) {
    emailInput.addEventListener('input', debounce(function() {
      emailInput.dispatchEvent(new Event('input'));
    }, 300));
  }

  // Global error handling for fetch
  window.safeFetch = async function(url, options) {
    try {
      const res = await fetch(url, options);
      if (!res.ok) throw new Error('Network error');
      return await res.json();
    } catch (e) {
      showToast('Network error. Please try again.', 'danger');
      throw e;
    }
  };

  // Sanitize user input (basic)
  function sanitize(str) {
    const temp = document.createElement('div');
    temp.textContent = str;
    return temp.innerHTML;
  }
  [fullNameInput, emailInput, phoneInput].forEach(input => {
    if (input) {
      input.addEventListener('blur', function() {
        input.value = sanitize(input.value);
      });
    }
  });

  // Analytics: Track form completion and modal opens
  function trackEvent(event, details) {
    if (window.gtag) {
      window.gtag('event', event, details);
    } else if (window.dataLayer) {
      window.dataLayer.push({ event, ...details });
    }
    // Add more analytics providers as needed
  }
  if (form) {
    form.addEventListener('submit', () => {
      trackEvent('form_submit', { form: 'subscription-form' });
    });
  }
  if (onboardingModal) {
    onboardingModal.addEventListener('shown.bs.modal', () => {
      trackEvent('modal_open', { modal: 'onboardingModal' });
    });
  }

  // Responsive: Ensure touch targets are large enough
  document.querySelectorAll('button, .btn, input[type="radio"], input[type="checkbox"]').forEach(el => {
    el.style.minHeight = '44px';
    el.style.minWidth = '44px';
  });

  // Comments for complex logic are already present throughout the file

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
  const paymentModal = document.getElementById("paymentModal");
  const paymentCountdown = document.getElementById("payment-countdown");
  let paymentTimer = null;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
        "S.COUPS", "JEONGHAN", "JOSHUA", "JUN", "HOSHI", "WONWOO", "WOOZI",
        "THE 8", "MINGYU", "DK", "SEUNGKWAN", "VERNON", "DINO",
      ],
      "fromis_9": [
        "LEE SAEROM", "SONG HAYOUNG", "PARK JIWON", "ROH JISUN",
        "LEE SEOYEON", "LEE CHAEYOUNG", "LEE NAGYUNG", "BAEK JIHEON",
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

  // Global Toast Notification System
  const globalToast = document.getElementById('global-toast');
  const globalToastBody = document.getElementById('global-toast-body');
  let toastInstance = null;
  function showToast(message, type = 'info', duration = 4000) {
    if (!globalToast || !globalToastBody) return;
    globalToastBody.textContent = message;
    globalToast.classList.remove('bg-primary', 'bg-success', 'bg-danger', 'bg-warning', 'bg-info');
    if (type === 'success') globalToast.classList.add('bg-success');
    else if (type === 'error' || type === 'danger') globalToast.classList.add('bg-danger');
    else if (type === 'warning') globalToast.classList.add('bg-warning');
    else if (type === 'info') globalToast.classList.add('bg-info');
    else globalToast.classList.add('bg-primary');
    if (!toastInstance) toastInstance = new bootstrap.Toast(globalToast, { delay: duration });
    else toastInstance._config.delay = duration;
    toastInstance.show();
  }

  // Consolidated showMessage function
  function showMessage(message, type = 'info', field = null) {
    if (formMessage) {
      formMessage.className = `mt-3 text-center alert alert-${type} alert-dismissible fade show`;
      formMessage.textContent = field ? `${field.name.toUpperCase()}: ${message}` : message;
      formMessage.classList.remove('d-none');
      setTimeout(() => {
        formMessage.classList.add('d-none');
      }, 7000);
    }
    showToast(field ? `${field.name.toUpperCase()}: ${message}` : message, type, 7000);
  }

  // Reset submit button state
  function resetButton() {
    if (submitBtn && spinner && btnText) {
      submitBtn.disabled = false;
      spinner.classList.add('d-none');
      btnText.classList.remove('d-none');
    }
  }

  // Update progress bar
  function updateProgress() {
    const totalFields = 16; // Adjusted for all fields
    let filledFields = 0;
    if (referralCodeInput.value) filledFields++;
    if (fullNameInput.value) filledFields++;
    if (emailInput.value) filledFields++;
    if (phoneInput.value) filledFields++;
    if (document.getElementById("address-line1").value) filledFields++;
    if (document.getElementById("address-line2").value) filledFields++;
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

  // Toggle installment options
  if (paymentTypeSelect && installmentOptions) {
    paymentTypeSelect.addEventListener("change", () => {
      if (paymentTypeSelect.value === "Installment") {
        installmentOptions.classList.remove("d-none");
        document.getElementById("installment-plan").required = true;
      } else {
        installmentOptions.classList.add("d-none");
        document.getElementById("installment-plan").required = false;
      }
      document.querySelectorAll('input[name="payment#method"]').forEach((input) => {
        input.required = true;
      });
      updateProgress();
    });
  }

  // Digital currency home button
  if (digitalCurrencyHomeBtn) {
    digitalCurrencyHomeBtn.addEventListener("click", () => {
      const digitalCurrencySuccessModal = document.getElementById("digitalCurrencySuccessModal");
      if (digitalCurrencySuccessModal) {
        const modalInstance = bootstrap.Modal.getInstance(digitalCurrencySuccessModal) || new bootstrap.Modal(digitalCurrencySuccessModal);
        modalInstance.hide();
      }
      window.location.href = "https://hybecorp.com";
    });
  }

  // Language Switcher
  const languageSwitcher = document.getElementById('language-switcher');
  function setLanguage(lang) {
    if (languageInput) languageInput.value = lang;
    showToast(`Language set to: ${languageSwitcher.options[languageSwitcher.selectedIndex].text}`, 'info');
  }
  if (languageSwitcher) {
    if (languageSwitcher.value === 'auto') {
      const browserLang = navigator.language ? navigator.language.slice(0, 2) : 'en';
      const found = Array.from(languageSwitcher.options).find(opt => opt.value === browserLang);
      if (found) languageSwitcher.value = browserLang;
      setLanguage(languageSwitcher.value);
    }
    languageSwitcher.addEventListener('change', function() {
      setLanguage(this.value);
    });
  }

  // Phone number formatting and validation
  const phonePrefix = document.getElementById("phone-prefix");
  if (phonePrefix && phoneInput) {
    const countryData = {
      US: { dial: "+1", format: v => v.replace(/(\d{3})(\d{3})(\d{0,4})/, (m, a, b, c) => c ? `(${a}) ${b}-${c}` : b ? `(${a}) ${b}` : a), regex: /^\d{10}$/ },
      GB: { dial: "+44", format: v => v.replace(/(\d{5})(\d{0,6})/, (m, a, b) => b ? `${a} ${b}` : a), regex: /^\d{10,11}$/ },
      JP: { dial: "+81", format: v => v.replace(/(\d{2,4})(\d{2,4})(\d{0,4})/, (m, a, b, c) => c ? `${a}-${b}-${c}` : b ? `${a}-${b}` : a), regex: /^\d{10,11}$/ },
      KR: { dial: "+82", format: v => v.replace(/(\d{2,3})(\d{3,4})(\d{0,4})/, (m, a, b, c) => c ? `${a}-${b}-${c}` : b ? `${a}-${b}` : a), regex: /^\d{9,10}$/ },
      CA: { dial: "+1", format: v => v.replace(/(\d{3})(\d{3})(\d{0,4})/, (m, a, b, c) => c ? `(${a}) ${b}-${c}` : b ? `(${a}) ${b}` : a), regex: /^\d{10}$/ },
      AU: { dial: "+61", format: v => v.replace(/(\d{1,4})(\d{3})(\d{0,3})/, (m, a, b, c) => c ? `${a} ${b} ${c}` : b ? `${a} ${b}` : a), regex: /^\d{9,10}$/ },
      IN: { dial: "+91", format: v => v.replace(/(\d{5})(\d{0,5})/, (m, a, b) => b ? `${a} ${b}` : a), regex: /^\d{10}$/ },
      DE: { dial: "+49", format: v => v.replace(/(\d{3,5})(\d{3,8})/, (m, a, b) => b ? `${a} ${b}` : a), regex: /^\d{10,11}$/ },
      FR: { dial: "+33", format: v => v.replace(/(\d{1})(\d{2})(\d{2})(\d{2})(\d{0,2})/, (m, a, b, c, d, e) => e ? `${a} ${b} ${c} ${d} ${e}` : d ? `${a} ${b} ${c} ${d}` : c ? `${a} ${b} ${c}` : b ? `${a} ${b}` : a), regex: /^\d{9,10}$/ },
      CN: { dial: "+86", format: v => v.replace(/(\d{3})(\d{4})(\d{0,4})/, (m, a, b, c) => c ? `${a} ${b} ${c}` : b ? `${a} ${b}` : a), regex: /^\d{11}$/ },
      BR: { dial: "+55", format: v => v.replace(/(\d{2})(\d{5})(\d{0,4})/, (m, a, b, c) => c ? `(${a}) ${b}-${c}` : b ? `(${a}) ${b}` : a), regex: /^\d{10,11}$/ },
      RU: { dial: "+7", format: v => v.replace(/(\d{3})(\d{3})(\d{0,4})/, (m, a, b, c) => c ? `${a} ${b} ${c}` : b ? `${a} ${b}` : a), regex: /^\d{10}$/ },
      ZA: { dial: "+27", format: v => v.replace(/(\d{2})(\d{3})(\d{0,4})/, (m, a, b, c) => c ? `${a} ${b} ${c}` : b ? `${a} ${b}` : a), regex: /^\d{9}$/ },
      NG: { dial: "+234", format: v => v.replace(/(\d{3})(\d{3})(\d{0,4})/, (m, a, b, c) => c ? `${a} ${b} ${c}` : b ? `${a} ${b}` : a), regex: /^\d{10}$/ },
    };
    function countryCodeToFlagEmoji(cc) {
      if (!cc) return "🌐";
      return cc.toUpperCase().replace(/./g, char => String.fromCodePoint(127397 + char.charCodeAt()));
    }
    let userCC = localStorage.getItem('detectedCountry') || 'US';
    let userDial = countryData[userCC]?.dial || '+1';
    let userFormat = countryData[userCC]?.format || (v => v);
    let userRegex = countryData[userCC]?.regex || /^\d{10}$/;
    phonePrefix.textContent = `${countryCodeToFlagEmoji(userCC)} ${userDial}`;

    // Fetch country code with fallback
    async function getCountryCode() {
      const services = [
        'https://ipwho.is/',
        'https://ipapi.co/json/',
        'https://geoiplookup.net/json/',
      ];
      for (const service of services) {
        try {
          const res = await fetch(service);
          if (res.ok) {
            const data = await res.json();
            return data.country_code || data.country || 'US';
          }
        } catch (e) {
          console.warn(`Failed to fetch from ${service}:`, e);
          showMessage('Unable to detect your location. Defaulting to US format.', 'warning');
        }
      }
      showMessage('All location services unavailable. Defaulting to US.', 'warning');
      return 'US';
    }
    if (!localStorage.getItem('detectedCountry')) {
      getCountryCode().then(cc => {
        localStorage.setItem('detectedCountry', cc);
        userCC = cc.toUpperCase();
        userDial = countryData[userCC]?.dial || '+1';
        userFormat = countryData[userCC]?.format || (v => v);
        userRegex = countryData[userCC]?.regex || /^\d{10}$/;
        phonePrefix.textContent = `${countryCodeToFlagEmoji(userCC)} ${userDial}`;
        updateAddressFields();
      });
    }

    const phoneError = document.getElementById("phone-error");
    function cleanNumber(val) { return val.replace(/\D/g, ""); }
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
  }

  // Dynamic address fields
  async function updateAddressFields() {
    let detectedCountry = countrySelect.value || localStorage.getItem('detectedCountry') || 'US';
    if (!detectedCountry) {
      detectedCountry = await getCountryCode();
      localStorage.setItem('detectedCountry', detectedCountry);
    }
    detectedCountry = detectedCountry.toUpperCase();
    const addressFormats = {
      US: {
        fields: [
          { id: "address-line1", label: "Street Address", placeholder: "123 Main St", required: true },
          { id: "address-line2", label: "Apt/Suite (optional)", placeholder: "Apt, suite, etc.", required: false },
          { id: "city", label: "City", placeholder: "City", required: true },
          { id: "state", label: "State", placeholder: "State (e.g., CA)", required: true },
          { id: "postal-code", label: "ZIP Code", placeholder: "12345", required: true, pattern: /^\d{5}(-\d{4})?$/i, error: "Invalid ZIP code" }
        ],
        order: ["address-line1", "address-line2", "city", "state", "postal-code"]
      },
      GB: {
        fields: [
          { id: "address-line1", label: "Street Address", placeholder: "221B Baker St", required: true },
          { id: "address-line2", label: "Apartment (optional)", placeholder: "Flat, suite, etc.", required: false },
          { id: "city", label: "Town/City", placeholder: "London", required: true },
          { id: "state", label: "County", placeholder: "County", required: false },
          { id: "postal-code", label: "Postcode", placeholder: "SW1A 1AA", required: true, pattern: /^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/i, error: "Invalid UK postcode" }
        ],
        order: ["address-line1", "address-line2", "city", "state", "postal-code"]
      },
      JP: {
        fields: [
          { id: "postal-code", label: "Postal Code", placeholder: "100-0001", required: true, pattern: /^\d{3}-\d{4}$/, error: "Invalid postal code" },
          { id: "address-line1", label: "Prefecture", placeholder: "Tokyo", required: true },
          { id: "address-line2", label: "City/Ward", placeholder: "Chiyoda-ku", required: true },
          { id: "city", label: "Town/Block", placeholder: "Kanda", required: true },
          { id: "state", label: "Building/Apartment (optional)", placeholder: "Building, room, etc.", required: false }
        ],
        order: ["postal-code", "address-line1", "address-line2", "city", "state"]
      },
    };
    const genericFormat = {
      fields: [
        { id: "address-line1", label: "Address Line 1", placeholder: "Address Line 1", required: true },
        { id: "address-line2", label: "Address Line 2 (optional)", placeholder: "Address Line 2", required: false },
        { id: "city", label: "City/Town", placeholder: "City/Town", required: true },
        { id: "state", label: "State/Province/Region", placeholder: "State/Province/Region", required: false },
        { id: "postal-code", label: "Postal Code", placeholder: "Postal Code", required: true, pattern: /^.{2,10}$/, error: "Invalid postal code" }
      ],
      order: ["address-line1", "address-line2", "city", "state", "postal-code"]
    };
    const format = addressFormats[detectedCountry] || genericFormat;
    format.fields.forEach(f => {
      const el = document.getElementById(f.id);
      if (el) {
        el.placeholder = f.placeholder;
        if (el.previousElementSibling) el.previousElementSibling.textContent = f.label;
        el.required = !!f.required;
        el.pattern = f.pattern ? f.pattern.source : "";
        el.setAttribute("data-error", f.error || "");
        el.parentElement.style.display = "";
      }
    });
    ["address-line1", "address-line2", "city", "state", "postal-code"].forEach(id => {
      if (!format.order.includes(id)) {
        const el = document.getElementById(id);
        if (el && el.parentElement) el.parentElement.style.display = "none";
      }
    });
    const addressFields = document.getElementById("address-fields");
    if (addressFields) {
      format.order.forEach(id => {
        const el = document.getElementById(id);
        if (el && el.parentElement) addressFields.appendChild(el.parentElement);
      });
    }
    const postal = document.getElementById("postal-code");
    if (postal && format.fields.find(f => f.id === "postal-code" && f.pattern)) {
      postal.addEventListener("input", function() {
        const pat = format.fields.find(f => f.id === "postal-code").pattern;
        const err = format.fields.find(f => f.id === "postal-code").error;
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
  updateAddressFields();
  if (countrySelect) {
    countrySelect.addEventListener("change", () => {
      countryInput.value = countrySelect.value;
      updateAddressFields();
      updateProgress();
    });
  }

  // Populate country dropdown
  async function populateCountryDropdown() {
    countrySelect.innerHTML = '<option value="" disabled selected>Select Country</option>';
    let countries = [];
    let loaded = false;
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
    countries.sort((a, b) => a.name.localeCompare(b.name));
    countries.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.code;
      opt.textContent = c.name;
      countrySelect.appendChild(opt);
    });
    const defaultOpt = countrySelect.querySelector('option[value=""]');
    if (defaultOpt) defaultOpt.removeAttribute('selected');
    try {
      const res = await fetch("https://ipwho.is/");
      if (res.ok) {
        const data = await res.json();
        const cc = data.country_code ? data.country_code.toUpperCase() : '';
        if (cc) {
          const opt = Array.from(countrySelect.options).find(o => o.value.toUpperCase() === cc);
          if (opt) {
            countrySelect.value = opt.value;
            countryInput.value = opt.value;
            updateAddressFields();
          }
        }
      }
    } catch (e) {}
  }
  populateCountryDropdown();

  // Auto-fill address fields
  (async function autofillAddressFromIP() {
    try {
      const res = await fetch("https://ipwho.is/");
      if (res.ok) {
        const data = await res.json();
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
    } catch (e) {}
    updateProgress();
  })();

  // Generate random permit ID
  function generatePermitId() {
    const timestamp = Date.now().toString(36);
    const randomNum = Math.random().toString(36).substring(2, 8);
    return `PERMIT-${timestamp}-${randomNum}`;
  }

  // Shake invalid fields
  function shakeField(field) {
    if (!field) return;
    field.classList.add('is-invalid', 'shake');
    field.addEventListener('animationend', () => {
      field.classList.remove('shake');
    }, { once: true });
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

  // Initialize tooltips
  document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach((tooltipTriggerEl) => {
    new bootstrap.Tooltip(tooltipTriggerEl);
  });

  // Handle modal dismissal
  if (paymentModal) {
    paymentModal.addEventListener('hidden.bs.modal', () => {
      if (paymentTimer) {
        clearInterval(paymentTimer);
        paymentTimer = null;
        resetButton();
        showMessage('Payment process cancelled. Please submit the form again to retry.', 'warning');
      }
    });
  }

  // Form submission handler
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!form.checkValidity()) {
        let firstInvalid = null;
        form.querySelectorAll('input, select, textarea').forEach((field) => {
          if (!field.checkValidity()) {
            shakeField(field);
            const errorMsg = field.getAttribute('data-error') || `Please fill in ${field.name} correctly.`;
            showMessage(errorMsg, 'danger', field);
            if (!firstInvalid) firstInvalid = field;
          }
        });
        if (firstInvalid) {
          firstInvalid.focus();
        }
        form.reportValidity();
        return;
      }
      // Custom validations
      if (!emailRegex.test(emailInput.value)) {
        shakeField(emailInput);
        showMessage(emailInput.getAttribute('data-error'), 'danger', emailInput);
        emailInput.focus();
        return;
      }
      if (referralCodeInput.value && !/^[A-Z0-9]{6,10}$/.test(referralCodeInput.value)) {
        shakeField(referralCodeInput);
        showMessage(referralCodeInput.getAttribute('data-error'), 'danger', referralCodeInput);
        referralCodeInput.focus();
        return;
      }
      const dob = new Date(dobInput.value);
      const today = new Date();
      const minAge = 13;
      if (dobInput.value && (isNaN(dob.getTime()) || dob > today || (today.getFullYear() - dob.getFullYear()) < minAge)) {
        shakeField(dobInput);
        showMessage(dobInput.getAttribute('data-error'), 'danger', dobInput);
        dobInput.focus();
        return;
      }
      if (!formatAndValidate()) {
        shakeField(phoneInput);
        showMessage('Please enter a valid phone number.', 'danger', phoneInput);
        phoneInput.focus();
        return;
      }
      submitBtn.disabled = true;
      spinner.classList.remove('d-none');
      btnText.classList.add('d-none');
      showMessage('Preparing payment, please wait...', 'info');
      try {
        const cardPayment = document.getElementById('card-payment');
        const digitalCurrency = document.getElementById('digital-currency');
        if (cardPayment.checked) {
          const response = await fetch('/create-checkout-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              paymentType: paymentTypeSelect.value,
              userId: generatePermitId(),
              referralCode: referralCodeInput.value,
              email: emailInput.value,
              fullName: fullNameInput.value,
            }),
          });
          if (!response.ok) {
            const error = await response.json();
            showMessage(
              error.message || 'Failed to initialize payment. Please check your internet connection or try a different payment method.',
              'error'
            );
            resetButton();
            return;
          }
          const { url } = await response.json();
          const modal = new bootstrap.Modal(paymentModal, { keyboard: false });
          modal.show();
          paymentCountdown.textContent = '3';
          let seconds = 3;
          paymentTimer = setInterval(() => {
            seconds--;
            paymentCountdown.textContent = seconds;
            if (seconds <= 0) {
              clearInterval(paymentTimer);
              modal.hide();
              window.location.href = url;
            }
          }, 1000);
        } else if (digitalCurrency.checked) {
          const modal = new bootstrap.Modal(paymentModal, { keyboard: false });
          modal.show();
          paymentCountdown.textContent = '3';
          let seconds = 3;
          paymentTimer = setInterval(() => {
            seconds--;
            paymentCountdown.textContent = seconds;
            if (seconds <= 0) {
              clearInterval(paymentTimer);
              modal.hide();
              window.location.href = 'success.html';
            }
          }, 1000);
        }
      } catch (error) {
        showMessage(
          'Network error occurred. Please check your internet connection and try again in a few minutes.',
          'error'
        );
        resetButton();
      }
    });
  }

  // FormData polyfill
  if (typeof FormData === 'undefined') {
    window.FormData = function(form) {
      const data = {};
      Array.from(form.elements).forEach(el => {
        if (el.name && !el.disabled) {
          if (el.type === 'checkbox' || el.type === 'radio') {
            if (el.checked) {
              if (!data[el.name]) data[el.name] = [];
              data[el.name].push(el.value);
            }
          } else if (el.type === 'file' && el.files.length > 0) {
            data[el.name] = Array.from(el.files);
          } else if (el.type !== 'submit' && el.type !== 'button') {
            if (!data[el.name]) data[el.name] = [];
            data[el.name].push(el.value);
          }
        }
      });
      return {
        forEach: (cb) => {
          Object.entries(data).forEach(([k, v]) => {
            if (Array.isArray(v)) {
              v.forEach(val => cb(val, k));
            } else {
              cb(v, k);
            }
          });
        },
        append: (name, value) => {
          if (!data[name]) data[name] = [];
          data[name].push(value);
        },
        get: (name) => data[name] && data[name].length > 0 ? data[name][0] : null,
        getAll: (name) => data[name] || [],
        has: (name) => !!data[name],
        set: (name, value) => {
          data[name] = [value];
        },
        delete: (name) => {
          delete data[name];
        }
      };
    };
  }

  // Cleanup event listeners to prevent memory leaks
  function cleanupListeners() {
    const inputs = [
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
    ].filter(input => input);
    inputs.forEach(input => {
      input.removeEventListener('input', updateProgress);
    });
    document.querySelectorAll('input[name="contact-method"]').forEach(input => {
      input.removeEventListener('change', updateProgress);
    });
    if (countrySelect) {
      countrySelect.removeEventListener('change', countrySelect.changeHandler);
    }
    if (phoneInput) {
      phoneInput.removeEventListener('input', formatAndValidate);
      phoneInput.removeEventListener('blur', formatAndValidate);
    }
    if (form) {
      form.removeEventListener('submit', form.submitHandler);
    }
    if (paymentTypeSelect) {
      paymentTypeSelect.removeEventListener('change', paymentTypeSelect.changeHandler);
    }
    if (digitalCurrencyHomeBtn) {
      digitalCurrencyHomeBtn.removeEventListener('click', digitalCurrencyHomeBtn.clickHandler);
    }
    if (languageSwitcher) {
      languageSwitcher.removeEventListener('change', languageSwitcher.changeHandler);
    }
    if (paymentModal) {
      paymentModal.removeEventListener('hidden.bs.modal', paymentModal.hiddenHandler);
    }
  }
  form.submitHandler = form.querySelector('form')?.submitHandler;
  paymentTypeSelect.changeHandler = paymentTypeSelect?.changeHandler;
  digitalCurrencyHomeBtn.clickHandler = digitalCurrencyHomeBtn?.clickHandler;
  languageSwitcher.changeHandler = languageSwitcher?.changeHandler;
  paymentModal.hiddenHandler = paymentModal?.hiddenHandler;
  window.addEventListener('beforeunload', cleanupListeners);
});