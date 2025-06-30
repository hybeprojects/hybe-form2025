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
const validationModal = document.getElementById("validationModal");
const validationCountdown = document.getElementById("countdown");
const paymentModal = document.getElementById("paymentModal");
const paymentCountdown = document.getElementById("payment-countdown");

// Regular expression for email validation
const emailRegex = /^[^\s@]+@[^\s@]+\.[^@\s]+$/;

// HYBE branch and group data
const branches = [
  { name: "BigHit Music", groups: ["BTS", "TXT"] },
  { name: "PLEDIS Entertainment", groups: ["SEVENTEEN", "fromis_9"] },
  { name: "BELIFT LAB", groups: ["ENHYPEN", "ILLIT"] },
  { name: "KOZ Entertainment", groups: ["ZICO"] },
  { name: "ADOR", groups: ["NewJeans"] },
  { name: "HYBE Labels Japan", groups: ["&TEAM"] },
];

// Show onboarding modal immediately
document.addEventListener("DOMContentLoaded", () => {
  try {
    const onboardingModal = new bootstrap.Modal(document.getElementById("onboardingModal"));
    onboardingModal.show();
  } catch (error) {
    console.error("Failed to show onboarding modal:", error.message);
    showToast("Error displaying onboarding modal", "danger");
  }

  // Populate branch dropdown with error handling
  try {
    if (!branchSelect) throw new Error("Branch select element not found");
    branches.forEach((branch) => {
      const option = document.createElement("option");
      option.value = branch.name;
      option.textContent = branch.name;
      branchSelect.appendChild(option);
    });
  } catch (error) {
    console.error("Failed to populate branch dropdown:", error.message);
    showToast("Error loading branch options", "danger");
  }
});

// Update group dropdown based on branch selection
branchSelect.addEventListener("change", () => {
  try {
    if (!groupSelect || !artistSelect) throw new Error("Group or artist select element not found");
    groupSelect.innerHTML = '<option value="" disabled selected>Select a Group</option>';
    artistSelect.innerHTML = '<option value="" disabled selected>Select an Artist</option>';
    const selectedBranch = branches.find((branch) => branch.name === branchSelect.value);
    if (selectedBranch) {
      selectedBranch.groups.forEach((group) => {
        const option = document.createElement("option");
        option.value = group;
        option.textContent = group;
        groupSelect.appendChild(option);
      });
    }
    updateProgress();
  } catch (error) {
    console.error("Error updating group dropdown:", error.message);
    showToast("Error loading group options", "danger");
  }
});

// Update artist dropdown based on group selection
groupSelect.addEventListener("change", () => {
  try {
    if (!artistSelect) throw new Error("Artist select element not found");
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
  } catch (error) {
    console.error("Error updating artist dropdown:", error.message);
    showToast("Error loading artist options", "danger");
  }
});

// Updates the progress bar based on filled form fields
function updateProgress() {
  try {
    const totalFields = 14;
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
  } catch (error) {
    console.error("Error updating progress bar:", error.message);
  }
}

// Toggle installment options and payment methods
if (paymentTypeSelect && installmentOptions) {
  paymentTypeSelect.addEventListener("change", () => {
    try {
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
    } catch (error) {
      console.error("Error handling payment type change:", error.message);
    }
  });
}

// Digital currency home button
if (digitalCurrencyHomeBtn) {
  digitalCurrencyHomeBtn.addEventListener("click", () => {
    try {
      clearInterval(digitalCurrencyTimer); // Stop countdown if user clicks
      const modal = bootstrap.Modal.getInstance(document.getElementById("digitalCurrencySuccessModal"));
      if (modal) modal.hide();
      window.location.href = "https://hybecorp.com";
    } catch (error) {
      console.error("Error handling digital currency button:", error.message);
      showToast("Error redirecting to home", "danger");
    }
  });
}

// Global Toast Notification System
const globalToast = document.getElementById('global-toast');
const globalToastBody = document.getElementById('global-toast-body');
let toastInstance = null;
function showToast(message, type = 'info', duration = 4000) {
  try {
    if (!globalToast || !globalToastBody) throw new Error("Toast elements not found");
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
  } catch (error) {
    console.error("Error showing toast:", error.message);
  }
}

// Patch showMessage to also show toast
function showMessage(message, type = "info") {
  try {
    if (formMessage) {
      formMessage.className = `mt-3 text-center alert alert-${type} alert-dismissible fade show`;
      formMessage.textContent = message;
      formMessage.classList.remove("d-none");
      setTimeout(() => {
        formMessage.classList.add("d-none");
      }, 7000);
    }
    showToast(message, type);
  } catch (error) {
    console.error("Error showing message:", error.message);
  }
}

// Language Switcher (auto-detect)
const languageSwitcher = document.getElementById('language-switcher');
function setLanguage(lang) {
  try {
    if (languageInput) languageInput.value = lang;
    showToast(`Language set to: ${languageSwitcher.options[languageSwitcher.selectedIndex].text}`, 'info');
  } catch (error) {
    console.error("Error setting language:", error.message);
  }
}
if (languageSwitcher) {
  try {
    if (languageSwitcher.value === 'auto') {
      const browserLang = navigator.language ? navigator.language.slice(0, 2) : 'en';
      const found = Array.from(languageSwitcher.options).find(opt => opt.value === browserLang);
      if (found) languageSwitcher.value = browserLang;
      setLanguage(languageSwitcher.value);
    }
    languageSwitcher.addEventListener('change', function() {
      setLanguage(this.value);
    });
  } catch (error) {
    console.error("Error initializing language switcher:", error.message);
  }
}

// Reset the submit button state
function resetButton() {
  try {
    if (submitBtn && spinner && btnText) {
      submitBtn.disabled = false;
      spinner.classList.add("d-none");
      btnText.classList.remove("d-none");
    }
  } catch (error) {
    console.error("Error resetting button:", error.message);
  }
}

// Add input event listeners for progress updates
[
  referralCodeInput, fullNameInput, emailInput, phoneInput,
  document.getElementById("address-line1"), document.getElementById("address-line2"),
  document.getElementById("city"), document.getElementById("state"),
  document.getElementById("postal-code"), countrySelect, dobInput,
  genderSelect, branchSelect, groupSelect, artistSelect, paymentTypeSelect
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

// Phone number: intl-tel-input with GeoIP fallback
let iti;
if (phoneInput) {
  try {
    iti = window.intlTelInput(phoneInput, {
      initialCountry: "us",
      geoIpLookup: (callback) => {
        fetch("https://ipwho.is/")
          .then(res => {
            if (!res.ok) throw new Error("GeoIP API failed");
            return res.json();
          })
          .then(data => {
            const countryCode = data.country_code ? data.country_code.toLowerCase() : "us";
            callback(countryCode);
          })
          .catch(error => {
            console.error("GeoIP lookup failed:", error.message);
            callback("us");
            showToast("Unable to detect country for phone input", "warning");
          });
      },
      utilsScript: "https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/18.1.1/js/utils.js",
    });

    const phoneError = document.getElementById("phone-error");
    function validatePhone() {
      const phoneNumber = iti.getNumber();
      if (!iti.isValidNumber()) {
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
    phoneInput.addEventListener("input", validatePhone);
    phoneInput.addEventListener("blur", validatePhone);
    if (form) {
      form.addEventListener("submit", function(e) {
        if (!validatePhone()) {
          e.preventDefault();
          phoneInput.focus();
          showMessage("Please enter a valid phone number before submitting.", "danger");
        }
      });
    }
  } catch (error) {
    console.error("Error initializing intl-tel-input:", error.message);
    showToast("Error setting up phone input", "danger");
  }
}

// FormData polyfill
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

// Auto-select country and dynamic address format
async function populateCountryDropdown() {
  try {
    if (!countrySelect) throw new Error("Country select element not found");
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
        } else {
          throw new Error("Invalid GeoNames API response");
        }
      } else {
        throw new Error(`GeoNames API failed with status ${res.status}`);
      }
    } catch (e) {
      console.warn("GeoNames API failed:", e.message);
      showToast("Failed to load countries from primary source", "warning");
    }

    if (!loaded) {
      try {
        const res = await fetch('https://restcountries.com/v2/all?fields=name,alpha2Code');
        if (res.ok) {
          const data = await res.json();
          countries = data.map(c => ({ code: c.alpha2Code, name: c.name }));
          loaded = true;
        } else {
          throw new Error(`REST Countries API failed with status ${res.status}`);
        }
      } catch (e) {
        console.warn("REST Countries API failed:", e.message);
        showToast("Failed to load countries from secondary source", "warning");
      }
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
            updateAddressFieldsForCountry(opt.value);
          }
        }
      } else {
        throw new Error(`GeoIP API failed with status ${res.status}`);
      }
    } catch (e) {
      console.warn("GeoIP country detection failed:", e.message);
      showToast("Unable to auto-detect country", "warning");
    }
  } catch (error) {
    console.error("Error populating country dropdown:", error.message);
    showToast("Error loading country options", "danger");
  }
}

populateCountryDropdown();

// Auto-fill address fields based on IP
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
    } else {
      throw new Error(`GeoIP API failed with status ${res.status}`);
    }
  } catch (e) {
    console.error("Error autofilling address:", e.message);
    showToast("Unable to auto-fill address", "warning");
  }
})();

// Dynamic address fields based on detected country
async function dynamicAddressFields() {
  try {
    let detectedCountry = null;
    try {
      const res = await fetch("https://ipwho.is/");
      if (res.ok) {
        const data = await res.json();
        detectedCountry = data.country_code ? data.country_code.toUpperCase() : null;
      } else {
        throw new Error(`GeoIP API failed with status ${res.status}`);
      }
    } catch (e) {
      console.warn("GeoIP detection failed:", e.message);
    }

    if (!detectedCountry && countrySelect && countrySelect.value) {
      detectedCountry = countrySelect.value.toUpperCase();
    }

    const addressFormats = {
      US: {
        fields: [
          { id: "address-line1", label: "Street Address", placeholder: "123 Main St", required: true },
          { id: "address-line2", label: "Apt/Suite (optional)", placeholder: "Apt, suite, etc.", required: false },
          { id: "city", label: "City", placeholder: "City", required: true },
          { id: "state", label: "State", placeholder: "State", required: true },
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
        el.previousElementSibling && (el.previousElementSibling.textContent = f.label);
        el.required = !!f.required;
        el.pattern = f.pattern ? f.pattern.source : "";
        el.setAttribute("data-error", f.error || "");
        el.parentElement && (el.parentElement.style.display = "");
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
  } catch (error) {
    console.error("Error setting dynamic address fields:", error.message);
    showToast("Error configuring address fields", "danger");
  }
}

dynamicAddressFields();
if (countrySelect) {
  countrySelect.addEventListener("change", dynamicAddressFields);
}

// Dynamic address fields based on country
function updateAddressFieldsForCountry(countryCode) {
  try {
    const addressFields = [
      "address-line1", "address-line2", "city", "state", "postal-code", "country-select"
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

    document.getElementById("address-line2").closest(".form-group").classList.toggle("d-none", isUS || isCA);
    document.getElementById("state").closest(".form-group").classList.toggle("d-none", isUS || isCA);
    document.getElementById("postal-code").closest(".form-group").classList.toggle("d-none", isUS || isCA);
    document.getElementById("country-select").closest(".form-group").classList.toggle("d-none", isUS || isCA);

    addressFields.forEach((field) => {
      const element = document.getElementById(field);
      if (element) {
        element.required = !element.closest(".form-group").classList.contains("d-none");
      }
    });

    if (isUS) document.getElementById("state").setAttribute("placeholder", "State (e.g., CA)");
    else if (isCA) document.getElementById("state").setAttribute("placeholder", "Province (e.g., ON)");
    else if (isGB) document.getElementById("state").setAttribute("placeholder", "County (e.g., Greater London)");
    else if (isAU) document.getElementById("state").setAttribute("placeholder", "State/Territory (e.g., NSW)");
    else if (isIN) document.getElementById("state").setAttribute("placeholder", "State (e.g., Maharashtra)");
    else if (isBR) document.getElementById("state").setAttribute("placeholder", "Estado (e.g., São Paulo)");
    else if (isFR) document.getElementById("state").setAttribute("placeholder", "Région (e.g., Île-de-France)");
    else if (isDE) document.getElementById("state").setAttribute("placeholder", "Bundesland (e.g., Bayern)");
    else if (isJP) document.getElementById("state").setAttribute("placeholder", "都道府県 (e.g., 東京都)");
    else if (isKR) document.getElementById("state").setAttribute("placeholder", "시/도 (e.g., 서울특별시)");
    else if (isCN) document.getElementById("state").setAttribute("placeholder", "省/直辖市 (e.g., 北京市)");
    else if (isRU) document.getElementById("state").setAttribute("placeholder", "Регион (e.g., Москва)");
    else if (isZA) document.getElementById("state").setAttribute("placeholder", "Province (e.g., Gauteng)");
    else if (isNG) document.getElementById("state").setAttribute("placeholder", "State (e.g., Lagos)");
    else document.getElementById("state").removeAttribute("placeholder");
  } catch (error) {
    console.error("Error updating address fields:", error.message);
    showToast("Error updating address fields", "danger");
  }
}

// Generate random permit ID
function generatePermitId() {
  try {
    const timestamp = Date.now().toString(36);
    const randomNum = Math.random().toString(36).substring(2, 8);
    return `PERMIT-${timestamp}-${randomNum}`;
  } catch (error) {
    console.error("Error generating permit ID:", error.message);
    return "";
  }
}

// Utility: Shake an input field for invalid feedback
function shakeField(field) {
  try {
    if (!field) return;
    field.classList.remove('shake');
    void field.offsetWidth;
    field.classList.add('shake');
    field.addEventListener('animationend', function handler() {
      field.classList.remove('shake');
      field.removeEventListener('animationend', handler);
    });
  } catch (error) {
    console.error("Error shaking field:", error.message);
  }
}

if (phoneInput) {
  phoneInput.addEventListener('invalid', function(e) {
    shakeField(phoneInput);
  });
}

if (form) {
  form.addEventListener('submit', function(e) {
    try {
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
    } catch (error) {
      console.error("Error handling form validation:", error.message);
    }
  }, true);
}

// Backend submission with fetch
async function submitFormData(formData) {
  try {
    // For Netlify Forms, encode form data
    const encodedData = new URLSearchParams(formData).toString();
    const response = await fetch("/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: encodedData
    });
    if (!response.ok) {
      throw new Error(`Form submission failed with status ${response.status}`);
    }
    return true;
  } catch (error) {
    console.error("Error submitting form to backend:", error.message);
    showToast("Failed to submit form. Please try again.", "danger");
    return false;
  }
}

// Validation and Payment modal logic
let validationTimer = null;
let paymentTimer = null;
let digitalCurrencyTimer = null;

function showValidationModalAndProceed() {
  try {
    let seconds = 5;
    if (validationCountdown) validationCountdown.textContent = seconds;
    const modal = new bootstrap.Modal(validationModal);
    modal.show();
    validationTimer = setInterval(() => {
      seconds--;
      if (validationCountdown) validationCountdown.textContent = seconds;
      if (seconds <= 0) {
        clearInterval(validationTimer);
        modal.hide();
        const cardPayment = document.getElementById('card-payment');
        if (cardPayment && cardPayment.checked) {
          const paymentType = paymentTypeSelect ? paymentTypeSelect.value : 'Full Payment';
          showPaymentModalAndRedirect(paymentType === 'Installment' ? 'installment' : 'full');
        } else if (document.getElementById('digital-currency').checked) {
          // Submit form to Netlify for digital currency
          const formData = new FormData(form);
          formData.set('permit-id', generatePermitId());
          submitFormData(formData).then(success => {
            if (success) {
              showDigitalCurrencyModal();
            }
          });
        }
      }
    }, 1000);
  } catch (error) {
    console.error("Error showing validation modal:", error.message);
    showToast("Error during form validation", "danger");
    resetButton();
  }
}

function showPaymentModalAndRedirect(amountType) {
  try {
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
        // Submit form to Netlify before redirecting
        const formData = new FormData(form);
        formData.set('permit-id', generatePermitId());
        submitFormData(formData).then(success => {
          if (success) {
            let stripeUrl = '';
            if (amountType === 'installment') {
              stripeUrl = 'https://checkout.stripe.com/pay/cs_test_installment';
            } else {
              stripeUrl = 'https://checkout.stripe.com/pay/cs_test_full';
            }
            window.location.href = stripeUrl;
          }
        });
      }
    }, 1000);
  } catch (error) {
    console.error("Error showing payment modal:", error.message);
    showToast("Error redirecting to payment", "danger");
    resetButton();
  }
}

function showDigitalCurrencyModal() {
  try {
    let seconds = 5;
    const countdownElement = document.getElementById('digital-currency-countdown');
    if (countdownElement) countdownElement.textContent = seconds;
    const modal = new bootstrap.Modal(document.getElementById('digitalCurrencySuccessModal'));
    modal.show();
    digitalCurrencyTimer = setInterval(() => {
      seconds--;
      if (countdownElement) countdownElement.textContent = seconds;
      if (seconds <= 0) {
        clearInterval(digitalCurrencyTimer);
        modal.hide();
        window.location.href = 'https://hybecorp.com';
      }
    }, 1000);
  } catch (error) {
    console.error("Error showing digital currency modal:", error.message);
    showToast("Error displaying submission confirmation", "danger");
    resetButton();
  }
}

if (form) {
  form.addEventListener('submit', function(e) {
    try {
      e.preventDefault(); // Prevent default Netlify submission to handle validation
      if (form.checkValidity() && validatePhone()) {
        submitBtn.disabled = true;
        spinner.classList.remove("d-none");
        btnText.classList.add("d-none");
        showValidationModalAndProceed();
      } else {
        showMessage("Please fill out all required fields correctly.", "danger");
        form.reportValidity();
      }
    } catch (error) {
      console.error("Error handling form submission:", error.message);
      showToast("Error submitting form", "danger");
      resetButton();
    }
  }, false);
}