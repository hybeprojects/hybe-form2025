if (typeof document !== "undefined") {
  class ModalManager {
    constructor() {
      this.activeModals = new Map();
      this.activeTimers = new Map();
    }

    initialize(modalId) {
      const element = document.getElementById(modalId);
      if (!element) {
        showToast(`Modal ${modalId} not found`, "danger");
        return null;
      }
      try {
        const modal = new bootstrap.Modal(element, {
          backdrop: "static",
          keyboard: false,
        });
        this.activeModals.set(modalId, modal);
        element.addEventListener(
          "hidden.bs.modal",
          () => this.cleanup(modalId),
          { once: true },
        );
        return modal;
      } catch (error) {
        showToast(
          `Failed to initialize modal "${modalId}": ${error.message}`,
          "danger",
        );
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
      if (modalId === "validationModal" || modalId === "paymentModal") {
        this.setupSpinnerTimeout(modalId);
      }
    }

    hide(modalId) {
      const modal = this.activeModals.get(modalId);
      if (modal) modal.hide();
    }

    setupCountdown(modalId, { duration, elementId, onComplete }) {
      const countdownElement = document.getElementById(elementId);
      if (!countdownElement) {
        showToast(`Countdown element "${elementId}" not found`, "danger");
        return;
      }
      let countdown = duration;
      countdownElement.textContent = countdown;
      countdownElement.setAttribute("aria-live", "assertive");
      const timer = setInterval(() => {
        countdown--;
        countdownElement.textContent = countdown;
        if (countdown <= 0) {
          this.cleanup(modalId);
          if (typeof onComplete === "function") {
            try {
              onComplete();
            } catch (error) {
              showToast(
                `Error in onComplete callback: ${error.message}`,
                "danger",
              );
            }
          }
        }
      }, 1000);
      this.activeTimers.set(modalId, timer);
    }

    setupSpinnerTimeout(modalId, timeout = 15000) {
      setTimeout(() => {
        const modal = this.activeModals.get(modalId);
        if (modal && modal._element.classList.contains("show")) {
          showToast(
            "This is taking longer than expected. Please check your connection.",
            "danger",
          );
          this.hide(modalId);
        }
      }, timeout);
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

  // Utility functions
  function showToast(message, type = "warning", timeout = 4000) {
    const toast = document.getElementById("global-toast");
    if (toast) {
      toast.className = `toast align-items-center text-white bg-${type} border-0`;
      document.getElementById("global-toast-body").textContent = message;
      const bsToast = new bootstrap.Toast(toast);
      bsToast.show();
      if (timeout > 0) {
        setTimeout(() => bsToast.hide(), timeout);
      }
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    // Initialize AOS
    if (typeof AOS !== "undefined") {
      AOS.init({ duration: 800, once: true });
    }

    // Initialize Bootstrap tooltips
    document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach((el) => {
      new bootstrap.Tooltip(el);
    });

    // Form and DOM elements
    const form = document.getElementById("subscription-form");
    const submitBtn = document.getElementById("submit-btn");
    const btnText = submitBtn?.querySelector(".btn-text");
    const spinner = submitBtn?.querySelector(".spinner-border");
    const progressBar = document.querySelector(".progress-bar");
    const countrySelect = document.getElementById("country-select");
    const countryInput = document.getElementById("country");
    const phonePrefixSpan = document.getElementById("phone-prefix");
    const phoneInput = document.getElementById("phone");
    const paymentTypeSelect = document.getElementById("payment-type");
    const installmentOptions = document.getElementById("installment-options");
    const installmentTerms = document.getElementById("installment-terms");
    const branchSelect = document.getElementById("branch");
    const groupSelect = document.getElementById("group");
    const artistSelect = document.getElementById("artist");
    const debugMsg = document.createElement("div");
    debugMsg.id = "form-debug-msg";
    debugMsg.style.color = "red";
    debugMsg.style.fontSize = "0.95em";
    debugMsg.style.marginTop = "0.5em";
    if (submitBtn)
      submitBtn.parentNode.insertBefore(debugMsg, submitBtn.nextSibling);

    // Email verification elements & state
    const emailInput = document.getElementById("email");
    // verifyEmailBtn removed from UI; remain resilient if absent
    const emailVerificationModal = modalManager.initialize(
      "emailVerificationModal",
    );
    if (emailVerificationModal && emailVerificationModal._element) {
      emailVerificationModal._element.addEventListener(
        "hidden.bs.modal",
        () => {
          emailVerificationState.autoSent = false;
          console.debug("Email verification modal closed, autoSent reset.");
        },
      );
    }
    const verificationEmail = document.getElementById("verification-email");
    const sendOtpBtn = document.getElementById("send-otp-btn");
    const resendOtpBtn = document.getElementById("resend-otp-btn");
    const otpInput = document.getElementById("otp-input");
    const verifyOtpBtn = document.getElementById("verify-otp-btn");

    const emailVerificationState = {
      isVerified: false,
      currentEmail: "",
      verificationToken: "",
      otpSent: false,
      resendTimer: 0,
      autoSent: false,
    };
    // Expose for testing
    if (
      window.location.hostname === "localhost" ||
      window.location.protocol === "file:"
    ) {
      window.emailVerificationState = emailVerificationState;
    }

    function updateEmailVerificationUI() {
      const verifiedBadge = document.getElementById("email-verified-badge");
      const unverifiedBadge = document.getElementById("email-unverified");
      if (emailVerificationState.isVerified) {
        if (verifiedBadge) verifiedBadge.classList.remove("d-none");
        if (unverifiedBadge) unverifiedBadge.classList.add("d-none");
      } else {
        if (verifiedBadge) verifiedBadge.classList.add("d-none");
        if (unverifiedBadge) unverifiedBadge.classList.remove("d-none");
      }
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
      fromis_9: [
        "LEE SAEROM",
        "SONG HAYOUNG",
        "PARK JIWON",
        "ROH JISUN",
        "LEE SEOYEON",
        "LEE CHAEYOUNG",
        "LEE NAGYUNG",
        "BAEK JIHEON",
      ],
      ENHYPEN: [
        "JUNGWON",
        "HEESEUNG",
        "JAY",
        "JAKE",
        "SUNGHOON",
        "SUNOO",
        "NI-KI",
      ],
      ILLIT: ["YUNAH", "MINJU", "MOKA", "WONHEE", "IROHA"],
      ZICO: ["ZICO"],
      NewJeans: ["MINJI", "HANNI", "DANIELLE", "HAERIN", "HYEIN"],
      "&TEAM": [
        "K",
        "FUMA",
        "NICHOLAS",
        "EJ",
        "YUMA",
        "JO",
        "HARUA",
        "TAKI",
        "MAKI",
      ],
    };

    // Country phone data
    const countryPhoneData = {
      US: { flag: "🇺🇸", code: "+1", format: "(XXX) XXX-XXXX" },
      GB: { flag: "🇬🇧", code: "+44", format: "XXXX XXXXXX" },
      JP: { flag: "🇯🇵", code: "+81", format: "XX-XXXX-XXXX" },
      KR: { flag: "🇰🇷", code: "+82", format: "XX-XXXX-XXXX" },
      CN: { flag: "🇨🇳", code: "+86", format: "XXX XXXX XXXX" },
      FR: { flag: "🇫🇷", code: "+33", format: "X XX XX XX XX" },
      DE: { flag: "🇩🇪", code: "+49", format: "XXXX XXXXXXX" },
      IN: { flag: "🇮🇳", code: "+91", format: "XXXXX-XXXXX" },
      BR: { flag: "🇧🇷", code: "+55", format: "(XX) XXXXX-XXXX" },
      CA: { flag: "🇨🇦", code: "+1", format: "(XXX) XXX-XXXX" },
      NG: { flag: "🇳🇬", code: "+234", format: "XXX XXX XXXX" },
    };

    // Validation rules
    const validationRules = {
      "referral-code": {
        required: true,
        message: "Referral code is required.",
      },
      "full-name": { required: true, message: "Please enter your full name." },
      email: {
        required: true,
        pattern: /^[^@\s]+@[^@\s]+\.[^@\s]+$/,
        message: "Please enter a valid email address.",
      },
      phone: {
        required: true,
        pattern: /^\+?[\d\s\-()]{7,20}$/,
        message: "Please enter a valid phone number.",
      },
      "address-line1": {
        required: true,
        message: "Street address is required.",
      },
      city: { required: true, message: "City is required." },
      "postal-code": {
        required: true,
        pattern: /^.{2,10}$/,
        message: "Postal code is required.",
      },
      "country-select": {
        required: true,
        message: "Please select your country.",
      },
      dob: { required: true, message: "Date of birth is required." },
      gender: { required: true, message: "Please select your gender." },
      branch: { required: true, message: "Please select a branch." },
      group: { required: true, message: "Please select a group." },
      artist: { required: true, message: "Please select an artist." },
      "payment-type": {
        required: true,
        message: "Please select a payment type.",
      },
      "contact-method": {
        required: true,
        message: "Please select a contact method.",
      },
      "subscription-agreement": {
        required: true,
        message: "You must agree to complete your subscription.",
      },
      "installment-plan": {
        required: false,
        message: "Please select an installment plan.",
      },
      "installment-terms": {
        required: false,
        message: "You must agree to the installment terms.",
      },
    };

    function sanitizeInput(value) {
      const temp = document.createElement("div");
      temp.textContent = value;
      return temp.innerHTML;
    }

    function showFieldError(field, message) {
      let feedback = field.parentElement.querySelector(".invalid-feedback");
      if (!feedback) {
        feedback = document.createElement("div");
        feedback.className = "invalid-feedback";
        field.parentElement.appendChild(feedback);
      }
      feedback.textContent = message;
      field.classList.add("is-invalid");
      field.setAttribute("aria-invalid", "true");
    }

    function clearFieldError(field) {
      const feedback = field.parentElement.querySelector(".invalid-feedback");
      if (feedback) feedback.textContent = "";
      field.classList.remove("is-invalid");
      field.setAttribute("aria-invalid", "false");
    }

    function validateField(field) {
      const rule = validationRules[field.name || field.id];
      if (!rule) return true;
      if (rule.required && !field.value) {
        showFieldError(field, rule.message);
        return false;
      }
      if (rule.pattern && field.value && !rule.pattern.test(field.value)) {
        showFieldError(field, rule.message);
        return false;
      }
      clearFieldError(field);
      return true;
    }

    function shakeField(field) {
      if (!field) return;
      field.classList.remove("shake");
      void field.offsetWidth;
      field.classList.add("shake");
      field.addEventListener(
        "animationend",
        () => field.classList.remove("shake"),
        { once: true },
      );
    }

    function updateProgress() {
      const requiredFields = form.querySelectorAll("[required]");
      let filledFields = 0;
      requiredFields.forEach((field) => {
        if (field.value.trim() || (field.type === "radio" && field.checked))
          filledFields++;
      });
      const progress = (filledFields / requiredFields.length) * 100;
      progressBar.style.width = `${progress}%`;
      progressBar.setAttribute("aria-valuenow", progress);
    }

    function isFormValidRealtime(debug = false) {
      const requiredFields = form.querySelectorAll("[required]");
      const debugList = [];
      let valid = true;
      requiredFields.forEach((field) => {
        if (!validateField(field)) {
          valid = false;
          if (debug) debugList.push(field.name || field.id);
        }
      });
      if (debug) return debugList;
      return valid;
    }

    // Populate branch dropdown
    branches.forEach((branch) => {
      const option = document.createElement("option");
      option.value = branch.name;
      option.textContent = branch.name;
      branchSelect.appendChild(option);
    });

    // Populate group dropdown based on branch
    branchSelect.addEventListener("change", () => {
      groupSelect.innerHTML =
        '<option value="" disabled selected>Select a Group</option>';
      artistSelect.innerHTML =
        '<option value="" disabled selected>Select an Artist</option>';
      const selectedBranch = branches.find(
        (branch) => branch.name === branchSelect.value,
      );
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

    // Populate artist dropdown based on group
    groupSelect.addEventListener("change", () => {
      artistSelect.innerHTML =
        '<option value="" disabled selected>Select an Artist</option>';
      const selectedGroup = groupSelect.value;
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

    // Update phone prefix
    function updatePhonePrefix(countryCode) {
      const phoneData = countryPhoneData[countryCode] || {
        flag: "🌐",
        code: "",
        format: "",
      };
      phonePrefixSpan.textContent = `${phoneData.flag} ${phoneData.code}`;
      phoneInput.value = "";
      phoneInput.oninput = () => {
        let val = phoneInput.value.replace(/\D/g, "");
        let formatted = val;
        if (countryCode === "US" || countryCode === "CA") {
          if (val.length > 3 && val.length <= 6)
            formatted = `(${val.slice(0, 3)}) ${val.slice(3)}`;
          else if (val.length > 6)
            formatted = `(${val.slice(0, 3)}) ${val.slice(3, 6)}-${val.slice(6, 10)}`;
        } else if (countryCode === "GB") {
          if (val.length > 4)
            formatted = `${val.slice(0, 4)} ${val.slice(4, 10)}`;
        } else if (countryCode === "NG") {
          if (val.length > 3)
            formatted = `${val.slice(0, 3)} ${val.slice(3, 6)} ${val.slice(6, 10)}`;
        }
        phoneInput.value = formatted;
      };
    }

    // Dynamic address fields
    function updateAddressFieldsForCountry(countryCode) {
      const addressFormats = {
        US: {
          fields: [
            {
              id: "address-line1",
              label: "Street Address",
              placeholder: "123 Main St",
              required: true,
            },
            {
              id: "address-line2",
              label: "Apt/Suite (optional)",
              placeholder: "Apt, suite, etc.",
              required: false,
            },
            { id: "city", label: "City", placeholder: "City", required: true },
            {
              id: "state",
              label: "State",
              placeholder: "State",
              required: true,
            },
            {
              id: "postal-code",
              label: "ZIP Code",
              placeholder: "12345",
              required: true,
              pattern: /^\d{5}(-\d{4})?$/,
              error: "Invalid ZIP code",
            },
          ],
          order: [
            "address-line1",
            "address-line2",
            "city",
            "state",
            "postal-code",
          ],
        },
        JP: {
          fields: [
            {
              id: "postal-code",
              label: "Postal Code",
              placeholder: "100-0001",
              required: true,
              pattern: /^\d{3}-\d{4}$/,
              error: "Invalid postal code",
            },
            {
              id: "address-line1",
              label: "Prefecture",
              placeholder: "Tokyo",
              required: true,
            },
            {
              id: "address-line2",
              label: "City/Ward",
              placeholder: "Chiyoda-ku",
              required: true,
            },
            {
              id: "city",
              label: "Town/Block",
              placeholder: "Kanda",
              required: true,
            },
            {
              id: "state",
              label: "Building/Apartment (optional)",
              placeholder: "Building, room, etc.",
              required: false,
            },
          ],
          order: [
            "postal-code",
            "address-line1",
            "address-line2",
            "city",
            "state",
          ],
        },
        default: {
          fields: [
            {
              id: "address-line1",
              label: "Address Line 1",
              placeholder: "Address Line 1",
              required: true,
            },
            {
              id: "address-line2",
              label: "Address Line 2 (optional)",
              placeholder: "Address Line 2",
              required: false,
            },
            {
              id: "city",
              label: "City/Town",
              placeholder: "City/Town",
              required: true,
            },
            {
              id: "state",
              label: "State/Province/Region",
              placeholder: "State/Province/Region",
              required: false,
            },
            {
              id: "postal-code",
              label: "Postal Code",
              placeholder: "Postal Code",
              required: true,
              pattern: /^.{2,10}$/,
              error: "Invalid postal code",
            },
          ],
          order: [
            "address-line1",
            "address-line2",
            "city",
            "state",
            "postal-code",
          ],
        },
      };
      const format = addressFormats[countryCode] || addressFormats.default;
      format.fields.forEach((f) => {
        const el = document.getElementById(f.id);
        if (el) {
          el.placeholder = f.placeholder;
          const label = el.previousElementSibling;
          if (label && label.classList.contains("form-label"))
            label.textContent = f.label;
          el.required = f.required;
          el.pattern = f.pattern ? f.pattern.source : "";

          // Ensure there's a validation rule object for this field before assigning
          if (!validationRules[f.id]) {
            validationRules[f.id] = {
              required: !!f.required,
              message: f.error || "",
            };
          }

          validationRules[f.id].pattern = f.pattern || null;
          validationRules[f.id].message =
            f.error || validationRules[f.id].message;
          el.style.display = "";
        }
      });
      [
        "address-line1",
        "address-line2",
        "city",
        "state",
        "postal-code",
      ].forEach((id) => {
        if (!format.order.includes(id)) {
          const el = document.getElementById(id);
          if (el) el.style.display = "none";
        }
      });
      const addressFields = document.getElementById("address-fields");
      format.order.forEach((id) => {
        const el = document.getElementById(id);
        if (el && addressFields) addressFields.appendChild(el);
      });
    }

    // Installment options and terms
    function updateInstallmentOptions() {
      if (paymentTypeSelect.value === "Installment") {
        installmentOptions.classList.remove("d-none");
        document.getElementById("installment-plan").required = true;
        if (installmentTerms) {
          installmentTerms.closest(".form-check").classList.remove("d-none");
          installmentTerms.required = true;
          validationRules["installment-terms"].required = true;
        }
      } else {
        installmentOptions.classList.add("d-none");
        document.getElementById("installment-plan").required = false;
        if (installmentTerms) {
          installmentTerms.closest(".form-check").classList.add("d-none");
          installmentTerms.checked = false;
          installmentTerms.required = false;
          validationRules["installment-terms"].required = false;
        }
      }
      updateProgress();
    }

    // Event listeners
    paymentTypeSelect.addEventListener("change", updateInstallmentOptions);
    countrySelect.addEventListener("change", () => {
      countryInput.value = countrySelect.value;
      updatePhonePrefix(countrySelect.value);
      updateAddressFieldsForCountry(countrySelect.value);
      updateProgress();
    });
    form.querySelectorAll("input, select, textarea").forEach((field) => {
      field.addEventListener("input", () => {
        validateField(field);
        updateProgress();
      });
      field.addEventListener("blur", () => validateField(field));
      field.addEventListener("invalid", () => shakeField(field));
    });

    // Ensure mailing checkbox hidden mirror exists and stays in sync (covers non-JS submits)
    try {
      const mailingCheckbox = document.getElementById("use-as-mailing-address");
      if (mailingCheckbox) {
        let hidden = document.getElementById("use-as-mailing-address-hidden");
        if (!hidden) {
          hidden = document.createElement("input");
          hidden.type = "hidden";
          hidden.id = "use-as-mailing-address-hidden";
          hidden.name = "use-as-mailing-address";
          hidden.value = mailingCheckbox.checked ? "true" : "false";
          form.appendChild(hidden);
        }
        // Keep hidden input updated whenever checkbox changes
        mailingCheckbox.addEventListener("change", () => {
          hidden.value = mailingCheckbox.checked ? "true" : "false";
        });
      }
    } catch {
      /* ignore */
    }
    document
      .getElementById("digital-currency-home-btn")
      .addEventListener("click", () => {
        try {
          modalManager.hide("digitalCurrencySuccessModal");
        } catch {}
        // Navigate to success page
        window.location.href = "success.html";
      });

    // Unique ID generation function
    function generateUniqueID() {
      // Generate 10 random alphanumeric characters (0-9, A-Z)
      const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      let result = "";
      for (let i = 0; i < 10; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return `HYB${result}`;
    }

    // Enhanced form data preparation for Netlify
    function prepareNetlifyFormData(form) {
      const formData = new FormData(form);

      // Generate unique submission ID
      const uniqueID = generateUniqueID();

      // Add/update unique ID in both hidden fields and form data
      document.getElementById("submission-id").value = uniqueID;
      formData.set("submission-id", uniqueID);

      // Add timestamp for tracking
      const submissionTime = new Date().toISOString();
      formData.set("submission-timestamp", submissionTime);

      // Ensure hidden verification fields are included
      try {
        const hiddenVerified = document.getElementById("email-verified");
        const hiddenToken = document.getElementById("verification-token");
        if (hiddenVerified)
          formData.set("email-verified", hiddenVerified.value);
        if (hiddenToken)
          formData.set("verification-token", hiddenToken.value || "");
      } catch {
        /* ignore */
      }

      // Ensure all form fields are captured with proper values
      // Get selected payment method
      const paymentMethod = document.querySelector(
        'input[name="payment-method"]:checked',
      );
      if (paymentMethod) {
        formData.set("payment-method", paymentMethod.value);
      }

      // Get selected contact method
      const contactMethod = document.querySelector(
        'input[name="contact-method"]:checked',
      );
      if (contactMethod) {
        formData.set("contact-method", contactMethod.value);
      }

      // Capture current language, country, and currency settings
      formData.set(
        "language",
        document.getElementById("language-switcher").value,
      );
      formData.set("country", document.getElementById("country-select").value);
      formData.set(
        "currency",
        document.getElementById("currency").value || "USD",
      );

      // Include mailing address consent checkbox as a normalized boolean string
      try {
        const hiddenMailing = document.getElementById(
          "use-as-mailing-address-hidden",
        );
        const mailingCheckbox = document.getElementById(
          "use-as-mailing-address",
        );
        if (hiddenMailing) {
          formData.set(
            "use-as-mailing-address",
            hiddenMailing.value === "true" ? "true" : "false",
          );
        } else if (mailingCheckbox) {
          formData.set(
            "use-as-mailing-address",
            mailingCheckbox.checked ? "true" : "false",
          );
        }
      } catch {
        /* ignore */
      }

      // Add user agent and submission metadata
      formData.set("user-agent", navigator.userAgent);
      formData.set("screen-resolution", `${screen.width}x${screen.height}`);
      formData.set("referrer", document.referrer || "Direct");

      return { formData, uniqueID, submissionTime };
    }

    // Form submission
    let resumeSubmission = null; // will hold a function to continue submission after verification

    async function submitFormInternal() {
      // Check form validation
      if (!isFormValidRealtime()) {
        showToast(
          "Please correct the highlighted errors and try again.",
          "danger",
        );
        form.querySelectorAll("[required]").forEach((field) => {
          if (!validateField(field)) shakeField(field);
        });
        return;
      }

      submitBtn.disabled = true;
      spinner.classList.remove("d-none");
      btnText.textContent = "Submitting...";

      try {
        const { formData } = prepareNetlifyFormData(form);
        const payload = Object.fromEntries(formData.entries());
        const endpoint = import.meta.env?.DEV
          ? "http://localhost:3000/submit-form"
          : "/submit-form";
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok || data?.success === false) {
          const formLevelErrorMessage =
            data?.message ||
            (response.status === 400
              ? "Invalid data sent to the server. Please refresh and try again."
              : response.status >= 500
              ? "A server error occurred. Please try again later."
              : "An error occurred. Please check the form and try again.");
          showToast(formLevelErrorMessage, "danger");
          submitBtn.disabled = false;
          spinner.classList.add("d-none");
          btnText.textContent = "Submit Subscription";
          return;
        }

        // Success UX
        modalManager.show("digitalCurrencySuccessModal", {
          countdown: {
            duration: 5,
            elementId: "digital-currency-countdown",
            onComplete: () => {
              window.location.href = "success.html";
            },
          },
        });

        // Store form data in sessionStorage for the success page
        sessionStorage.setItem("submissionData", JSON.stringify(payload));
      } catch (err) {
        console.error("Submission Error:", err.message, err.stack);
        showToast(
          `Submission failed: ${err.message}. Please try again.`,
          "danger",
        );
        submitBtn.disabled = false;
        spinner.classList.add("d-none");
        btnText.textContent = "Submit Subscription";
      }
    }

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      // Honeypot
      const honeypot = form.querySelector('[name="website"]');
      if (honeypot && honeypot.value) {
        showToast("Spam detected. Submission blocked.", "danger");
        return;
      }

      // If email already verified, proceed immediately
      if (emailVerificationState.isVerified) {
        await submitFormInternal();
        return;
      }

      // Otherwise, initiate verification flow, then resume submission when verified
      const email =
        emailInput && emailInput.value ? emailInput.value.trim() : "";
      if (!email) {
        showToast(
          "Please enter your email address before submitting.",
          "warning",
        );
        emailInput.scrollIntoView({ behavior: "smooth", block: "center" });
        emailInput.focus();
        return;
      }

      // Prefill verification modal and show, then send OTP automatically
      verificationEmail.value = email;
      emailVerificationState.currentEmail = email;
      emailVerificationModal.show();

      // Automatically send OTP as part of submit flow
      try {
        // Small delay to ensure modal is visible and prevent double auto-sends
        setTimeout(() => {
          try {
            if (
              !emailVerificationState.autoSent &&
              sendOtpBtn &&
              !sendOtpBtn.disabled &&
              (!emailVerificationState.resendTimer ||
                emailVerificationState.resendTimer === 0)
            ) {
              emailVerificationState.autoSent = true;
              sendOtpBtn.click();
            } else {
              console.debug("Auto-send skipped: conditions not met");
            }
          } catch (err) {
            console.error("Auto-send inner error", err);
          }
        }, 250);
      } catch (e) {
        console.error("Auto-send OTP failed", e);
      }

      // Set resume handler
      resumeSubmission = async () => {
        // Small delay to allow modal close animation
        await new Promise((r) => setTimeout(r, 300));
        await submitFormInternal();
        resumeSubmission = null;
      };
    });

    // Check if email needs re-verification
    function checkEmailChanged() {
      const currentEmail = emailInput.value.trim();
      if (
        currentEmail !== emailVerificationState.currentEmail &&
        emailVerificationState.isVerified
      ) {
        emailVerificationState.isVerified = false;
        emailVerificationState.currentEmail = "";
        emailVerificationState.verificationToken = "";
        updateEmailVerificationUI();
        showToast(
          "Email changed. Please verify your new email address.",
          "warning",
        );
      }
    }

    // Email input change handler
    emailInput.addEventListener("input", () => {
      checkEmailChanged();
      validateField(emailInput);
      updateProgress();
    });

    // Show verification step
    function showVerificationStep(step) {
      document
        .querySelectorAll(".verification-step")
        .forEach((el) => el.classList.add("d-none"));
      document
        .getElementById(`verification-step-${step}`)
        .classList.remove("d-none");

      if (step === 2) {
        document.getElementById("sent-to-email").textContent =
          emailVerificationState.currentEmail;
        otpInput.focus();
      }
    }

    // Send OTP via Supabase
    sendOtpBtn.addEventListener("click", async () => {
      const email = verificationEmail.value.trim();
      if (!email) return;

      // Prevent double-sending: if already sent, currently sending, or resend timer active, ignore
      if (
        emailVerificationState.otpSent ||
        emailVerificationState.sending ||
        (emailVerificationState.resendTimer &&
          emailVerificationState.resendTimer > 0)
      ) {
        console.debug(
          "Send OTP ignored: already sent or sending or resend timer active",
        );
        return;
      }

      emailVerificationState.sending = true;
      const btnText = sendOtpBtn.querySelector(".btn-text");
      const spinner = sendOtpBtn.querySelector(".spinner-border");

      sendOtpBtn.disabled = true;
      spinner.classList.remove("d-none");
      btnText.textContent = "Sending...";

      try {
        const { sendEmailOtp } = await import("./lib/supabaseClient.js");
        await sendEmailOtp(email, window.location.origin);

        emailVerificationState.otpSent = true;
        showToast("Verification code sent to your email!", "success");
        showVerificationStep(2);
        setTimeout(() => {
          try {
            otpInput.focus();
          } catch {}
        }, 100);
        const expiresIn = 300; // Supabase default configurable; UI uses 5 minutes
        const resendAfter = 60;
        startOtpCountdown(expiresIn);
        startResendTimer(resendAfter);
      } catch (error) {
        console.error("OTP send error:", error);
        showToast(
          error.message || "Failed to send verification code",
          "danger",
        );
      } finally {
        emailVerificationState.sending = false;
        if (
          !emailVerificationState.resendTimer ||
          emailVerificationState.resendTimer <= 0
        ) {
          sendOtpBtn.disabled = false;
        }
        spinner.classList.add("d-none");
        btnText.textContent = "Send Verification Code";
      }
    });

    // Verify OTP helper function and click handler
    async function verifyOtp(auto = false) {
      const email = emailVerificationState.currentEmail;
      const otp = otpInput.value.trim();

      if (!otp || otp.length !== 6) {
        if (!auto) {
          showToast("Please enter a 6-digit verification code.", "warning");
          otpInput.focus();
        }
        return;
      }

      const btnText = verifyOtpBtn.querySelector(".btn-text");
      const spinner = verifyOtpBtn.querySelector(".spinner-border");

      verifyOtpBtn.disabled = true;
      spinner.classList.remove("d-none");
      btnText.textContent = "Verifying...";

      try {
        const { verifyEmailOtp } = await import("./lib/supabaseClient.js");
        const data = await verifyEmailOtp(email, otp);

        // Success
        emailVerificationState.isVerified = true;
        // Prefer not to expose tokens; store minimal marker
        const supaUserId = data?.session?.user?.id || "";
        emailVerificationState.verificationToken = supaUserId
          ? `supabase:${supaUserId}`
          : "supabase:email_otp";
        try {
          const hiddenVerified = document.getElementById("email-verified");
          const hiddenToken = document.getElementById("verification-token");
          if (hiddenVerified) hiddenVerified.value = "true";
          if (hiddenToken)
            hiddenToken.value = emailVerificationState.verificationToken;
        } catch (e) {
          console.warn("Could not set hidden verification fields", e);
        }

        showToast("Email verified successfully!", "success");
        showVerificationStep(3);
        updateEmailVerificationUI();
        try {
          emailVerificationModal.hide();
        } catch {}
        if (typeof resumeSubmission === "function") {
          try {
            await resumeSubmission();
          } catch (err) {
            console.error("Error resuming submission after verification:", err);
          }
        }
      } catch (error) {
        console.error("OTP verification error:", error);
        const msg = error?.message || "Invalid or expired verification code";
        showToast(msg, "danger");
        otpInput.classList.add("is-invalid");
        document.getElementById("otp-error").textContent = msg;
      } finally {
        verifyOtpBtn.disabled = false;
        spinner.classList.add("d-none");
        btnText.textContent = "Verify Code";
      }
    }

    verifyOtpBtn.addEventListener("click", () => verifyOtp(false));

    // Resend OTP
    resendOtpBtn.addEventListener("click", () => {
      if (emailVerificationState.resendTimer > 0) return;

      // Reset OTP input
      otpInput.value = "";
      otpInput.classList.remove("is-invalid");

      // Trigger send OTP
      sendOtpBtn.click();
    });

    // OTP input formatting
    otpInput.addEventListener("input", (e) => {
      let value = e.target.value.replace(/\D/g, ""); // Only digits
      if (value.length > 6) value = value.slice(0, 6);
      e.target.value = value;

      // Clear error state
      e.target.classList.remove("is-invalid");
      document.getElementById("otp-error").textContent = "";

      // Auto-verify when 6 digits entered
      if (value.length === 6) {
        // Directly call verification without extra delay
        verifyOtp(true);
      }
    });

    // OTP countdown timer
    let otpCountdownInterval;
    function startOtpCountdown(seconds = 300) {
      let timeLeft = Number(seconds);
      if (!Number.isFinite(timeLeft) || timeLeft <= 0) timeLeft = 300;
      const countdownEl = document.getElementById("otp-countdown");

      clearInterval(otpCountdownInterval);
      otpCountdownInterval = setInterval(() => {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        countdownEl.textContent = `${minutes}:${seconds.toString().padStart(2, "0")}`;

        if (timeLeft <= 0) {
          clearInterval(otpCountdownInterval);
          countdownEl.textContent = "Expired";
          countdownEl.className = "fw-bold text-danger";
          showToast(
            "Verification code expired. Please request a new one.",
            "warning",
          );
        }
        timeLeft--;
      }, 1000);
    }

    // Resend timer
    let resendTimerInterval;
    function startResendTimer(seconds = 60) {
      emailVerificationState.resendTimer = Number(seconds) || 60;
      const resendCountdown = document.getElementById("resend-countdown");
      const resendTimer = document.getElementById("resend-timer");

      resendOtpBtn.disabled = true;
      resendCountdown.classList.remove("d-none");

      clearInterval(resendTimerInterval);
      resendTimerInterval = setInterval(() => {
        resendTimer.textContent = emailVerificationState.resendTimer;
        emailVerificationState.resendTimer--;

        if (emailVerificationState.resendTimer < 0) {
          clearInterval(resendTimerInterval);
          resendOtpBtn.disabled = false;
          resendCountdown.classList.add("d-none");
          emailVerificationState.resendTimer = 0;
        }
      }, 1000);
    }

    // Change email link
    const changeEmailLink = document.getElementById("change-email-link");
    if (changeEmailLink) {
      changeEmailLink.addEventListener("click", () => {
        emailVerificationModal.hide();
        setTimeout(() => {
          emailInput.scrollIntoView({ behavior: "smooth", block: "center" });
          emailInput.focus();
        }, 300);
      });
    }

    // Allow paste of 6-digit code
    otpInput.addEventListener("paste", (e) => {
      e.preventDefault();
      const text =
        (e.clipboardData || window.clipboardData).getData("text") || "";
      const digits = (text.match(/\d/g) || []).join("").slice(0, 6);
      if (digits) {
        otpInput.value = digits;
        // Trigger input handling and immediate verification
        otpInput.dispatchEvent(new Event("input"));
        verifyOtp(true);
      }
    });

    // Initialize email verification UI
    updateEmailVerificationUI();

    // Show onboarding modal on every page load for consistency.
    try {
      const onboardingModalInstance =
        modalManager.initialize("onboardingModal");

      if (onboardingModalInstance) {
        onboardingModalInstance.show();
        console.debug("[Onboarding] Modal shown on page load.");
      } else {
        console.warn(
          "[Onboarding] Modal instance not available; attempting manual show.",
        );
        manualShowModal("onboardingModal");
      }
    } catch (err) {
      console.warn(
        "[Onboarding] Error while attempting to show onboarding modal:",
        err,
      );
      // Fallback if Bootstrap or other parts fail
      manualShowModal("onboardingModal");
    }

    // Manual fallback to show a Bootstrap-like modal using DOM manipulation
    function manualShowModal(modalId) {
      try {
        const el = document.getElementById(modalId);
        if (!el) {
          console.warn(
            "[Onboarding] manualShowModal: element not found",
            modalId,
          );
          return;
        }

        // Avoid double-backdrop
        if (!document.querySelector(".modal-backdrop")) {
          const backdrop = document.createElement("div");
          backdrop.className = "modal-backdrop fade show";
          document.body.appendChild(backdrop);
        }

        el.classList.add("show");
        el.style.display = "block";
        el.setAttribute("aria-modal", "true");
        el.setAttribute("role", "dialog");
        el.removeAttribute("aria-hidden");

        // Prevent body scroll
        document.body.classList.add("modal-open");

        // Focus the modal for accessibility
        setTimeout(() => {
          const focusEl =
            el.querySelector("[autofocus]") ||
            el.querySelector("button, [tabindex]");
          if (focusEl) focusEl.focus();
        }, 50);

        try {
          localStorage.setItem("onboardingShown", "true");
        } catch {
          /* ignore */
        }
        console.debug("[Onboarding] Shown via manual fallback");
      } catch (err) {
        console.error("[Onboarding] manualShowModal error:", err);
      }
    }

    // Debug logging (optional)
    if (window.location.hostname === "localhost") {
      form.querySelectorAll("input, select, textarea").forEach((field) => {
        field.addEventListener("change", () => {
          console.log("[FORM AUDIT]", "Field changed", {
            id: sanitizeInput(field.id),
            value: sanitizeInput(field.value),
          });
        });
      });
    }
  });
}
