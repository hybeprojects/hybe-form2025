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
  // Check Bootstrap dependency
  if (typeof bootstrap === "undefined") {
    console.error("Bootstrap JavaScript is not loaded");
    showToast("Form functionality is limited due to missing dependencies. Please refresh the page.", "error");
    return;
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
  const paymentModal = document.getElementById("paymentModal");
  const paymentCountdown = document.getElementById("payment-countdown");
  let paymentTimer = null;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Verify dropdown elements exist
  if (!branchSelect || !groupSelect || !artistSelect) {
    console.error("One or more dropdown elements are missing in the DOM");
    showToast("Form initialization failed. Please refresh the page.", "error");
    return;
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

  // Artists data
  const artists = {
    BTS: ["RM", "Jin", "SUGA", "j-hope", "Jimin", "V", "Jung Kook"],
    TXT: ["SOOBIN", "YEONJUN", "BEOMGYU", "TAEHYUN", "HUENINGKAI"],
    SEVENTEEN: [
      "S.COUPS", "JEONGHAN", "JOSHUA", "JUN", "HOSHI", "WONWOO", "WOOZI",
      "THE 8", "MINGYU", "DK", "SEUNGKWAN", "VERNON", "DINO",
    ],
    fromis_9: [
      "LEE SAEROM", "SONG HAYOUNG", "PARK JIWON", "ROH JISUN",
      "LEE SEOYEON", "LEE CHAEYOUNG", "LEE NAGYUNG", "BAEK JIHEON",
    ],
    ENHYPEN: ["JUNGWON", "HEESEUNG", "JAY", "JAKE", "SUNGHOON", "SUNOO", "NI-KI"],
    ILLIT: ["YUNAH", "MINJU", "MOKA", "WONHEE", "IROHA"],
    ZICO: ["ZICO"],
    NewJeans: ["MINJI", "HANNI", "DANIELLE", "HAERIN", "HYEIN"],
    "&TEAM": ["K", "FUMA", "NICHOLAS", "EJ", "YUMA", "JO", "HARUA", "TAKI", "MAKI"],
  };

  // Populate branch dropdown
  function populateBranchDropdown() {
    branchSelect.innerHTML = '<option value="" disabled selected>Select a Branch</option>';
    branches.forEach((branch) => {
      const option = document.createElement("option");
      option.value = branch.name;
      option.textContent = branch.name;
      branchSelect.appendChild(option);
    });
    branchSelect.disabled = false;
  }

  // Populate group dropdown based on branch
  function populateGroupDropdown(branchName) {
    groupSelect.innerHTML = '<option value="" disabled selected>Select a Group</option>';
    artistSelect.innerHTML = '<option value="" disabled selected>Select an Artist</option>';
    const selectedBranch = branches.find(
      (branch) => branch.name.toLowerCase() === branchName.toLowerCase()
    );
    if (selectedBranch) {
      selectedBranch.groups.forEach((group) => {
        const option = document.createElement("option");
        option.value = group;
        option.textContent = group;
        groupSelect.appendChild(option);
      });
      groupSelect.disabled = false;
    } else {
      groupSelect.disabled = true;
      artistSelect.disabled = true;
    }
    updateProgress();
  }

  // Populate artist dropdown based on group
  function populateArtistDropdown(groupName) {
    artistSelect.innerHTML = '<option value="" disabled selected>Select an Artist</option>';
    if (artists[groupName]) {
      artists[groupName].forEach((artist) => {
        const option = document.createElement("option");
        option.value = artist;
        option.textContent = artist;
        artistSelect.appendChild(option);
      });
      artistSelect.disabled = false;
    } else {
      artistSelect.disabled = true;
    }
    updateProgress();
  }

  // Initialize branch dropdown
  populateBranchDropdown();

  // Event listeners for dropdowns
  branchSelect.addEventListener("change", () => {
    console.log("Branch selected:", branchSelect.value);
    populateGroupDropdown(branchSelect.value);
  });

  groupSelect.addEventListener("change", () => {
    console.log("Group selected:", groupSelect.value);
    populateArtistDropdown(groupSelect.value);
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

  // Update progress bar
  function updateProgress() {
    const totalFields = 16;
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

  // Form reset handler
  if (form) {
    form dozens.addEventListener("reset", () => {
      populateBranchDropdown();
      groupSelect.innerHTML = '<option value="" disabled selected>Select a Group</option>';
      artistSelect.innerHTML = '<option value="" disabled selected>Select an Artist</option>';
      groupSelect.disabled = true;
      artistSelect.disabled = true;
      updateProgress();
    });
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
      input.removeEventListener("input", updateProgress);
    });

    document.querySelectorAll('input[name="contact-method"]').forEach(input => {
      input.removeEventListener("change", updateProgress);
    });

    if (branchSelect) {
      branchSelect.removeEventListener("change", branchSelect.changeHandler);
    }
    if (groupSelect) {
      groupSelect.removeEventListener("change", groupSelect.changeHandler);
    }
    if (countrySelect) {
      countrySelect.removeEventListener("change", countrySelect.changeHandler);
    }
    if (phoneInput) {
      phoneInput.removeEventListener("input", formatAndValidate);
      phoneInput.removeEventListener("blur", formatAndValidate);
    }
    if (form) {
      form.removeEventListener("submit", form.submitHandler);
    }
    if (paymentTypeSelect) {
      paymentTypeSelect.removeEventListener("change", paymentTypeSelect.changeHandler);
    }
    if (digitalCurrencyHomeBtn) {
      digitalCurrencyHomeBtn.removeEventListener("click", digitalCurrencyHomeBtn.clickHandler);
    }
    if (languageSwitcher) {
      languageSwitcher.removeEventListener("change", languageSwitcher.changeHandler);
    }
    if (paymentModal) {
      paymentModal.removeEventListener("hidden.bs.modal", paymentModal.hiddenHandler);
    }
  }

  // Store handlers for cleanup
  branchSelect.changeHandler = () => populateGroupDropdown(branchSelect.value);
  groupSelect.changeHandler = () => populateArtistDropdown(groupSelect.value);
  form.submitHandler = form.querySelector('form')?.submitHandler;
  paymentTypeSelect.changeHandler = paymentTypeSelect?.changeHandler;
  digitalCurrencyHomeBtn.clickHandler = digitalCurrencyHomeBtn?.clickHandler;
  languageSwitcher.changeHandler = languageSwitcher?.changeHandler;
  paymentModal.hiddenHandler = paymentModal?.hiddenHandler;

  window.addEventListener("beforeunload", cleanupListeners);

  // Initialize AOS animations and other existing functionality...
  if (typeof AOS !== "undefined") {
    AOS.init({ duration: 800, once: true });
  }
  // ... (rest of your original code for other form functionality)
});