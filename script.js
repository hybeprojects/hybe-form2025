AOS.init();
const phoneInput = document.querySelector("#phone");
const phoneError = document.querySelector("#phone-error");
const iti = window.intlTelInput(phoneInput, {
  initialCountry: "auto",
  geoIpLookup: (callback) => {
    fetch("https://ipapi.co/json/")
      .then((res) => res.json())
      .then((data) => {
        callback(data.country_code);
        document.getElementById("country").value = data.country_name || "Unknown";
        const currencyMap = { US: "USD", JP: "JPY", KR: "KRW", GB: "GBP" };
        document.getElementById("currency").value = currencyMap[data.country_code] || "USD";
      })
      .catch(() => {
        callback("us");
        document.getElementById("country").value = "Unknown";
        document.getElementById("currency").value = "USD";
      });
  },
  utilsScript: "https://cdn.jsdelivr.net/npm/intl-tel-input@18.1.1/build/js/utils.js",
});
const form = document.querySelector("#subscription-form");
const formMessage = document.querySelector("#form-message");
const emailInput = document.querySelector("#email");
const branchSelect = document.querySelector("#branch");
const groupSelect = document.querySelector("#group");
const artistSelect = document.querySelector("#artist");
const addressSection = document.querySelector("#address-fields");
const referralCodeInput = document.querySelector("#referral-code");
const permitIdInput = document.querySelector("#permit-id");
const submissionIdInput = document.querySelector("#submission-id");
const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/;
const phoneRegex = /^\+\d{1,3}\s?\d{4,14}$/;
const validReferralCodes = ["HYBE2025", "ARMYVIP", "KPOPEXCLUSIVE"];
referralCodeInput.addEventListener("input", () => {
  if (!validReferralCodes.includes(referralCodeInput.value)) {
    referralCodeInput.classList.add("error");
    referralCodeInput.setCustomValidity("Invalid referral code.");
  } else {
    referralCodeInput.classList.remove("error");
    referralCodeInput.setCustomValidity("");
  }
});
document.getElementById("language").value = navigator.language.split("-")[0] || "en";
const hybeData = {
  "BigHit Music": {
    groups: {
      BTS: ["RM", "Jin", "Suga", "J-Hope", "Jimin", "V", "Jungkook"],
      TXT: ["Yeonjun", "Soobin", "Beomgyu", "Taehyun", "HueningKai"],
    },
  },
  "Pledis Entertainment": {
    groups: {
      SEVENTEEN: ["S.Coups", "Jeonghan", "Joshua", "Jun", "Hoshi", "Wonwoo", "Woozi", "DK", "Mingyu", "The8", "Seungkwan", "Vernon", "Dino"],
      fromis_9: ["Saerom", "Hayoung", "Jiwon", "Jisun", "Seoyeon", "Chaeyoung", "Nagyung", "Jiheon"],
    },
  },
  "Source Music": {
    groups: {
      "LE SSERAFIM": ["Sakura", "Chaewon", "Yunjin", "Kazuha", "Eunchae"],
    },
  },
  "HYBE Japan": {
    groups: {
      "&TEAM": ["K", "Fuma", "Nicholas", "EJ", "Yuma", "Jo", "Harua", "Taki", "Maki"],
    },
  },
  "ADOR": {
    groups: {
      "NewJeans": ["Minji", "Hanni", "Danielle", "Haerin", "Hyein"],
    },
  },
};
Object.keys(hybeData).forEach((branch) => {
  const option = document.createElement("option");
  option.value = branch;
  option.textContent = branch;
  branchSelect.appendChild(option);
});
branchSelect.addEventListener("change", () => {
  groupSelect.innerHTML = '<option value="" disabled selected>Select a Group</option>';
  artistSelect.innerHTML = '<option value="" disabled selected>Select an Artist</option>';
  const groups = hybeData[branchSelect.value]?.groups || {};
  if (!Object.keys(groups).length) {
    groupSelect.disabled = true;
    artistSelect.disabled = true;
    showMessage("No groups available for this branch.", false);
    return;
  }
  Object.keys(groups).forEach((group) => {
    const option = document.createElement("option");
    option.value = group;
    option.textContent = group;
    groupSelect.appendChild(option);
  });
  groupSelect.disabled = false;
});
groupSelect.addEventListener("change", () => {
  artistSelect.innerHTML = '<option value="" disabled selected>Select an Artist</option>';
  const artists = hybeData[branchSelect.value]?.groups[groupSelect.value] || [];
  if (!artists.length) {
    artistSelect.disabled = true;
    showMessage("No artists available for this group.", false);
    return;
  }
  artists.forEach((artist) => {
    const option = document.createElement("option");
    option.value = artist;
    option.textContent = artist;
    artistSelect.appendChild(option);
  });
  artistSelect.disabled = false;
});
function renderAddressFields(countryCode) {
  addressSection.innerHTML = "";
  const fields = {
    US: [
      { id: "street", label: "Street Address", type: "text", required: true },
      { id: "city", label: "City", type: "text", required: true },
      { id: "state", label: "State", type: "text", required: true },
      { id: "zip", label: "ZIP Code", type: "text", required: true, pattern: "\\d{5}(-\\d{4})?" },
    ],
    default: [
      { id: "address-line1", label: "Address Line 1", type: "text", required: true },
      { id: "address-line2", label: "Address Line 2", type: "text", required: false },
      { id: "city", label: "City", type: "text", required: true },
      { id: "postal-code", label: "Postal Code", type: "text", required: true },
    ],
  };
  const selectedFields = fields[countryCode] || fields.default;
  selectedFields.forEach((field) => {
    const div = document.createElement("div");
    div.className = "mb-3";
    div.innerHTML = `
      <label for="${field.id}" class="form-label">${field.label}${field.required ? ' <span class="text-danger">*</span>' : ''}</label>
      <input type="${field.type}" class="form-control" id="${field.id}" name="${field.id}" ${field.required ? "required" : ""} ${field.pattern ? `pattern="${field.pattern}"` : ""} />
    `;
    addressSection.appendChild(div);
  });
}
phoneInput.addEventListener("countrychange", () => {
  renderAddressFields(iti.getSelectedCountryData().iso2.toUpperCase());
});
renderAddressFields(iti.getSelectedCountryData().iso2.toUpperCase());
emailInput.addEventListener("input", () => {
  if (!emailRegex.test(emailInput.value)) {
    emailInput.classList.add("error");
    emailInput.setCustomValidity("Please enter a valid email address.");
  } else {
    emailInput.classList.remove("error");
    emailInput.setCustomValidity("");
  }
});
phoneInput.addEventListener("input", () => {
  const phoneNumber = iti.getNumber();
  if (!phoneRegex.test(phoneNumber)) {
    phoneInput.classList.add("error");
    phoneError.textContent = "Please enter a valid phone number.";
  } else {
    phoneInput.classList.remove("error");
    phoneError.textContent = "";
  }
});
async function validatePostalCode(postalCode, countryCode) {
  const postalRegex = {
    US: /^\d{5}(-\d{4})?$/,
    KR: /^\d{5}$/,
    JP: /^\d{3}-\d{4}$/,
    GB: /^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/,
  };
  const regex = postalRegex[countryCode] || /.*/;
  return regex.test(postalCode);
}
addressSection.addEventListener("input", async (e) => {
  if (e.target.id.includes("zip") || e.target.id.includes("postal-code")) {
    const postalCode = e.target.value;
    const countryCode = iti.getSelectedCountryData().iso2.toUpperCase();
    const isValid = await validatePostalCode(postalCode, countryCode);
    if (!isValid) {
      e.target.classList.add("error");
      e.target.setCustomValidity("Invalid postal code.");
    } else {
      e.target.classList.remove("error");
      e.target.setCustomValidity("");
    }
  }
});
document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach((el) => {
  new bootstrap.Tooltip(el);
});
document.addEventListener("DOMContentLoaded", () => {
  const paymentType = document.querySelector("#payment-type");
  const installmentOptions = document.querySelector("#installment-options");
  const paymentMethods = document.querySelector("#payment-methods");
  paymentType.addEventListener("change", () => {
    const selectedType = paymentType.value;
    paymentMethods.classList.toggle("d-none", !selectedType);
    paymentMethods.classList.toggle("d-block", !!selectedType);
    installmentOptions.classList.toggle("d-none", selectedType !== "Installment");
    installmentOptions.classList.toggle("d-block", selectedType === "Installment");
  });
});
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const submitBtn = document.querySelector("#submit-btn");
  const btnText = submitBtn.querySelector(".btn-text");
  const spinner = submitBtn.querySelector(".spinner-border");
  const emailContact = document.getElementById("email-contact");
  const smsContact = document.getElementById("sms-contact");
  const paymentType = document.querySelector("#payment-type");
  const paymentMethodInputs = document.querySelectorAll('input[name="payment-method"]:checked');
  const submittedEmails = JSON.parse(localStorage.getItem("submittedEmails")) || [];
  if (!emailContact.checked && !smsContact.checked) {
    showMessage("Please select at least one contact method.", false);
    return;
  }
  if (!paymentType.value) {
    showMessage("Please select a payment type.", false);
    return;
  }
  if (!paymentMethodInputs.length) {
    showMessage("Please select a payment method.", false);
    return;
  }
  if (!validReferralCodes.includes(referralCodeInput.value)) {
    showMessage("Invalid referral code.", false);
    return;
  }
  if (!emailRegex.test(emailInput.value)) {
    showMessage("Invalid email address.", false);
    return;
  }
  const phoneNumber = iti.getNumber();
  if (!phoneRegex.test(phoneNumber)) {
    showMessage("Invalid phone number.", false);
    return;
  }
  const postalInput = addressSection.querySelector("#zip, #postal-code");
  if (postalInput) {
    const postalCode = postalInput.value;
    const countryCode = iti.getSelectedCountryData().iso2.toUpperCase();
    if (!(await validatePostalCode(postalCode, countryCode))) {
      showMessage("Invalid postal code.", false);
      return;
    }
  }
  if (submittedEmails.includes(emailInput.value)) {
    showMessage("This email has already submitted a form.", false);
    return;
  }
  const modal = new bootstrap.Modal(document.getElementById("validationModal"));
  modal.show();
  let time = 3;
  const countdown = document.getElementById("countdown");
  const interval = setInterval(() => {
    countdown.textContent = --time;
    if (time === 0) {
      modal.hide();
      clearInterval(interval);
      proceedWithSubmission();
    }
  }, 1000);
  async function proceedWithSubmission() {
    submitBtn.disabled = true;
    btnText.textContent = "Submitting...";
    spinner.classList.remove("d-none");
    const permitId = `HYBE-2025-ARMY-${Math.floor(1000 + Math.random() * 9000)}`;
    const timestamp = new Date().toISOString().replace(/[-:T.]/g, "").slice(0, 14);
    const submissionId = `HYBE-2025-ARMY-${timestamp}`;
    permitIdInput.value = permitId;
    submissionIdInput.value = submissionId;
    const formData = new FormData(form);
    try {
        const response = await fetch("http://localhost:3000/submit-form", {
            method: "POST",
            body: formData,
          });
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      const result = await response.json();
      if (result.success) {
        submittedEmails.push(emailInput.value);
        localStorage.setItem("submittedEmails", JSON.stringify(submittedEmails));
        showMessage(`Submission successful! Permit ID: ${permitId}, Submission ID: ${submissionId}. Check email/SMS for status.`, true);
        form.reset();
        renderAddressFields(iti.getSelectedCountryData().iso2.toUpperCase());
      } else {
        throw new Error(result.message || "Submission failed");
      }
    } catch (error) {
      showMessage(`Submission failed: ${error.message || "Please try again."}`, false);
    } finally {
      submitBtn.disabled = false;
      btnText.textContent = "Submit Subscription";
      spinner.classList.add("d-none");
    }
  }
});
function showMessage(text, isSuccess) {
  formMessage.textContent = text;
  formMessage.classList.remove("success-message", "error-message", "d-none");
  formMessage.classList.add(isSuccess ? "success-message" : "error-message");
}