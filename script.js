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

      // For security and UX reasons do not allow automatic external redirects
      // from the client. If the countdown belongs to the digitalCurrencySuccessModal
      // we will redirect to the internal /success page only.
      const isDigitalSuccess = modalId === "digitalCurrencySuccessModal";
      const safeOnComplete = isDigitalSuccess
        ? () => {
            try {
              window.location.href = "/success";
            } catch (err) {
              console.error("Safe redirect failed", err);
            }
          }
        : onComplete;

      let countdown = duration;
      countdownElement.textContent = countdown;
      countdownElement.setAttribute("aria-live", "assertive");
      const timer = setInterval(() => {
        countdown--;
        countdownElement.textContent = countdown;
        if (countdown <= 0) {
          this.cleanup(modalId);
          if (typeof safeOnComplete === "function") {
            try {
              safeOnComplete();
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
    if (typeof AOS !== "undefined") {
      AOS.init({ duration: 800, once: true });
    }

    document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach((el) => {
      new bootstrap.Tooltip(el);
    });

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
    const emailInput = document.getElementById("email");

    const debugMsg = document.createElement("div");
    debugMsg.id = "form-debug-msg";
    debugMsg.style.color = "red";
    debugMsg.style.fontSize = "0.95em";
    debugMsg.style.marginTop = "0.5em";
    if (submitBtn) submitBtn.parentNode.insertBefore(debugMsg, submitBtn.nextSibling);

    // Track which fields the user has interacted with. Validation messages
    // are only shown for fields that are "touched" to avoid showing errors
    // on initial page load.
    const touchedFields = new Set();

    function markTouched(field) {
      const key = field.name || field.id;
      if (key) touchedFields.add(key);
    }

    const confirmModal = modalManager.initialize("confirmModal");
    const confirmBtn = document.getElementById("confirm-submit-btn");

    // Submission guards to ensure form is only submitted after explicit confirmation
    let confirmModalShown = false;
    let submissionConfirmed = false;

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

    const countryPhoneData = {};
    const countryCodeToFlagEmoji = (code) => {
      if (!code || code.length !== 2) return "🌐";
      const A = 0x1f1e6;
      return String.fromCodePoint(
        A + (code.toUpperCase().charCodeAt(0) - 65),
        A + (code.toUpperCase().charCodeAt(1) - 65)
      );
    };
    async function populateCountries() {
      if (!countrySelect) return;
      try {
        const res = await fetch("https://restcountries.com/v3.1/all?fields=name,cca2,idd");
        const json = await res.json();
        const countries = Array.isArray(json) ? json : [];
        countries
          .map((c) => {
            const root = c?.idd?.root || "";
            const suffix = Array.isArray(c?.idd?.suffixes) && c.idd.suffixes.length ? c.idd.suffixes[0] : "";
            const dial = root || suffix ? `${root}${suffix}` : "";
            const flag = countryCodeToFlagEmoji(c.cca2 || "");
            return {
              name: c?.name?.common || c?.name?.official || c?.cca2 || "",
              code2: c?.cca2 || "",
              dialCode: dial,
              flag,
            };
          })
          .filter((c) => c.name && c.code2)
          .sort((a, b) => a.name.localeCompare(b.name))
          .forEach((c) => {
            const opt = document.createElement("option");
            opt.value = c.code2;
            opt.textContent = c.name;
            countrySelect.appendChild(opt);
            countryPhoneData[c.code2] = { flag: c.flag, code: c.dialCode, format: "" };
          });

        try {
          const ipRes = await fetch("https://ipwho.is/");
          const ip = await ipRes.json();
          const cc = ip?.country_code || ip?.country_code_iso2 || "";
          if (cc && countryPhoneData[cc]) {
            countrySelect.value = cc;
            countrySelect.dispatchEvent(new Event("change"));
          }
          const setIfEmpty = (id, val) => {
            const el = document.getElementById(id);
            if (el && !el.value && val) el.value = val;
          };
          setIfEmpty("city", ip?.city || "");
          setIfEmpty("state", ip?.region || ip?.region_name || "");
          setIfEmpty("postal-code", ip?.postal || ip?.postal_code || "");
        } catch {}
      } catch (e) {
        console.error("Failed to load countries", e);
      }
    }
    populateCountries();

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
        required: false,
        message: "Street address is required.",
      },
      city: { required: false, message: "" },
      "postal-code": {
        required: false,
        pattern: null,
        message: "",
      },
      "country": {
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
      let feedback = null;
      const describedBy = field.getAttribute("aria-describedby");
      if (describedBy) {
        feedback = document.getElementById(describedBy);
      }

      if (!feedback) {
        if (field.type === "radio") {
          const container = field.closest(".mb-3") || field.parentElement;
          const groupId = `${field.name}-error`;
          feedback = container.querySelector(`#${CSS.escape(groupId)}`) || container.querySelector(".invalid-feedback");
          if (!feedback) {
            feedback = document.createElement("div");
            feedback.className = "invalid-feedback d-block";
            feedback.id = groupId;
            container.appendChild(feedback);
          } else {
            feedback.classList.add("d-block");
          }
          const radios = form.querySelectorAll(`input[type="radio"][name="${CSS.escape(field.name)}"]`);
          radios.forEach((r) => {
            const existing = r.getAttribute("aria-describedby");
            if (!existing || !existing.includes(groupId)) {
              r.setAttribute("aria-describedby", groupId);
            }
          });
        } else {
          const parent = field.parentElement || field.closest(".mb-3");
          feedback = parent.querySelector(".invalid-feedback");
          if (!feedback) {
            feedback = document.createElement("div");
            feedback.className = "invalid-feedback";
            parent.appendChild(feedback);
          }
        }
      }

      feedback.setAttribute("aria-live", "polite");
      feedback.textContent = message;
      if (field.type === "radio") {
        const radios = form.querySelectorAll(`input[type="radio"][name="${CSS.escape(field.name)}"]`);
        radios.forEach((r) => {
          r.classList.add("is-invalid");
          r.setAttribute("aria-invalid", "true");
        });
      } else {
        field.classList.add("is-invalid");
        field.setAttribute("aria-invalid", "true");
      }
    }

    function clearFieldError(field) {
      const describedBy = field.getAttribute("aria-describedby");
      let feedback = describedBy ? document.getElementById(describedBy) : null;
      if (!feedback) {
        if (field.type === "radio") {
          const container = field.closest(".mb-3") || field.parentElement;
          feedback = container.querySelector(".invalid-feedback");
        } else {
          feedback = field.parentElement.querySelector(".invalid-feedback");
        }
      }
      if (feedback) feedback.textContent = "";
      if (field.type === "radio") {
        const radios = form.querySelectorAll(`input[type="radio"][name="${CSS.escape(field.name)}"]`);
        radios.forEach((r) => {
          r.classList.remove("is-invalid");
          r.setAttribute("aria-invalid", "false");
        });
      } else {
        field.classList.remove("is-invalid");
        field.setAttribute("aria-invalid", "false");
      }
    }

    function validateField(field, showErrors = true) {
      const key = field.name || field.id;
      const rule = validationRules[key];
      const isRequired = rule?.required ?? field.required;

      function returnFalse(msg) {
        if (showErrors) showFieldError(field, msg);
        return false;
      }
      function returnTrue() {
        if (showErrors) clearFieldError(field);
        return true;
      }

      // Radio group handling
      if (field.type === "radio") {
        const name = field.name;
        const radios = form.querySelectorAll(`input[type="radio"][name="${CSS.escape(name)}"]`);
        const anyChecked = Array.from(radios).some((r) => r.checked);
        if (isRequired && !anyChecked) {
          return returnFalse(rule?.message || "This selection is required.");
        }
        return returnTrue();
      }

      // Checkbox handling
      if (field.type === "checkbox") {
        if (isRequired && !field.checked) {
          return returnFalse(rule?.message || "This checkbox is required.");
        }
        return returnTrue();
      }

      // Default inputs/selects
      const value = (field.value || "").trim();
      if (isRequired && !value) {
        return returnFalse(rule?.message || "This field is required.");
      }

      const pattern = rule?.pattern;
      if (pattern && value && !pattern.test(value)) {
        return returnFalse(rule?.message || "Invalid value.");
      }

      if (field.type === "date" && value) {
        const min = field.getAttribute("min");
        const max = field.getAttribute("max");
        const d = new Date(value);
        if ((min && d < new Date(min)) || (max && d > new Date(max))) {
          const msg = rule?.message || `Please enter a date between ${min} and ${max}.`;
          return returnFalse(msg);
        }
      }

      return returnTrue();
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
      const requiredElements = Array.from(form.querySelectorAll("[required]"));
      const items = [];
      const radioNames = new Set();

      requiredElements.forEach((el) => {
        if (el.type === "radio") {
          if (!radioNames.has(el.name)) {
            radioNames.add(el.name);
            items.push({ type: "radio", name: el.name });
          }
        } else if (el.type === "checkbox") {
          items.push({ type: "checkbox", el });
        } else {
          items.push({ type: "field", el });
        }
      });

      let filled = 0;
      items.forEach((item) => {
        if (item.type === "radio") {
          const anyChecked = !!form.querySelector(`input[type="radio"][name="${CSS.escape(item.name)}"]:checked`);
          if (anyChecked) filled++;
        } else if (item.type === "checkbox") {
          if (item.el.checked) filled++;
        } else {
          if ((item.el.value || "").trim()) filled++;
        }
      });

      const progress = items.length ? (filled / items.length) * 100 : 0;
      progressBar.style.width = `${progress}%`;
      progressBar.setAttribute("aria-valuenow", progress);
    }

    function isFormValidRealtime(debug = false, showErrors = true) {
      const requiredElements = Array.from(form.querySelectorAll("[required]"));
      const radioNames = new Set();
      const debugList = [];
      let valid = true;

      for (const field of requiredElements) {
        if (field.type === "radio") {
          if (radioNames.has(field.name)) continue;
          radioNames.add(field.name);
          const ok = validateField(field, showErrors);
          if (!ok) {
            valid = false;
            if (debug) debugList.push(field.name);
          }
        } else {
          const ok = validateField(field, showErrors);
          if (!ok) {
            valid = false;
            if (debug) debugList.push(field.name || field.id);
          }
        }
      }

      return debug ? debugList : valid;
    }

    function updateSubmitButton() {
      if (!submitBtn) return;
      // Do not show errors when toggling the disabled state — check silently
      const isValid = isFormValidRealtime(false, false);
      submitBtn.disabled = !isValid;
    }

    branches.forEach((branch) => {
      const option = document.createElement("option");
      option.value = branch.name;
      option.textContent = branch.name;
      branchSelect.appendChild(option);
    });

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
      updateSubmitButton();
    });

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
      updateSubmitButton();
    });

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
      try {
        format.fields.forEach((field) => {
          field.pattern = null;
          field.error = "";
        });
      } catch {}
      format.fields.forEach((f) => {
        const el = document.getElementById(f.id);
        if (el) {
          el.placeholder = f.placeholder;
          const label = el.previousElementSibling;
          if (label && label.classList.contains("form-label"))
            label.textContent = f.label;
          el.required = f.required;
          el.pattern = f.pattern ? f.pattern.source : "";

          if (!validationRules[f.id]) {
            validationRules[f.id] = {
              required: !!f.required,
              message: f.error || "",
            };
          }
          validationRules[f.id].required = !!f.required;

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

    function updateInstallmentOptions() {
      const amountEl = document.getElementById("subscription-amount");
      const amountInputEl = document.getElementById("amount-input");
      const base = amountEl ? parseFloat(amountEl.dataset.baseAmount || "0") : 0;
      const currency = amountEl ? amountEl.dataset.currency || "USD" : "USD";
      const currencySymbol = currency === "USD" ? "$" : "";
      const planSelect = document.getElementById("installment-plan");

      if (paymentTypeSelect.value === "Installment") {
        installmentOptions.classList.remove("d-none");
        if (planSelect) planSelect.required = true;
        if (installmentTerms) {
          const wrapper = document.getElementById("installment-terms-wrapper") || installmentTerms.closest(".form-check");
          if (wrapper) wrapper.classList.remove("d-none");
          installmentTerms.required = true;
          validationRules["installment-terms"].required = true;
        }

        // Determine number of installments from plan or default to 2
        let installments = 2;
        if (planSelect && planSelect.value) {
          const m = String(planSelect.value).match(/^(\d+)/);
          installments = m ? Number(m[1]) : installments;
        }
        if (!installments || installments < 1) installments = 2;
        let per = base / installments;
        if (planSelect) {
          const selected = planSelect.options[planSelect.selectedIndex];
          if (selected && selected.dataset && selected.dataset.perAmount) {
            const override = parseFloat(selected.dataset.perAmount);
            if (!Number.isNaN(override) && override > 0) per = override;
          }
        }
        const perStr = per.toFixed(2);
        if (amountEl) amountEl.textContent = `${currencySymbol}${perStr} / installment (x${installments})`;
        if (amountInputEl) amountInputEl.value = `${perStr}${currency}/installment x${installments}`;
      } else {
        installmentOptions.classList.add("d-none");
        if (planSelect) planSelect.required = false;
        if (installmentTerms) {
          const wrapper = document.getElementById("installment-terms-wrapper") || installmentTerms.closest(".form-check");
          if (wrapper) wrapper.classList.add("d-none");
          installmentTerms.checked = false;
          installmentTerms.required = false;
          validationRules["installment-terms"].required = false;
        }
        if (amountEl) amountEl.textContent = `${currencySymbol}${base.toFixed(2)} / year`;
        if (amountInputEl) amountInputEl.value = `${base.toFixed(2)}${currency}/year`;
      }

      updateProgress();
      updateSubmitButton();
    }

    // Update amount when installment plan changes
    const _installmentPlanSelect = document.getElementById("installment-plan");
    if (_installmentPlanSelect) {
      _installmentPlanSelect.addEventListener("change", updateInstallmentOptions);
    }

    paymentTypeSelect.addEventListener("change", updateInstallmentOptions);
    countrySelect.addEventListener("change", () => {
      countryInput.value = countrySelect.value;
      updatePhonePrefix(countrySelect.value);
      updateAddressFieldsForCountry(countrySelect.value);
      updateProgress();
      updateSubmitButton();
    });
    form.querySelectorAll("input, select, textarea").forEach((field) => {
      const key = field.name || field.id;
      // On input: update progress and show validation only if the field was touched
      field.addEventListener("input", () => {
        const shouldShow = key ? touchedFields.has(key) : false;
        validateField(field, shouldShow);
        updateProgress();
        updateSubmitButton();
      });

      // On change and blur: mark as touched and validate with errors visible
      field.addEventListener("change", () => {
        markTouched(field);
        validateField(field, true);
        updateProgress();
        updateSubmitButton();
      });
      field.addEventListener("blur", () => {
        markTouched(field);
        validateField(field, true);
      });

      field.addEventListener("invalid", () => shakeField(field));
    });

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
        mailingCheckbox.addEventListener("change", () => {
          hidden.value = mailingCheckbox.checked ? "true" : "false";
        });
      }
    } catch {}

    function generateUniqueID() {
      const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      let result = "";
      for (let i = 0; i < 10; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return `HYB${result}`;
    }

    function prepareNetlifyFormData(form) {
      const formData = new FormData(form);
      const uniqueID = generateUniqueID();

      const submissionIdEl = document.getElementById("submission-id");
      if (submissionIdEl) submissionIdEl.value = uniqueID;
      formData.set("submission-id", uniqueID);

      const submissionTime = new Date().toISOString();
      formData.set("submission-timestamp", submissionTime);

      const paymentMethod = document.querySelector(
        'input[name="payment-method"]:checked',
      );
      if (paymentMethod) {
        formData.set("payment-method", paymentMethod.value);
      }

      const contactMethod = document.querySelector(
        'input[name="contact-method"]:checked',
      );
      if (contactMethod) {
        formData.set("contact-method", contactMethod.value);
      }

      formData.set(
        "language",
        document.getElementById("language-switcher").value,
      );
      formData.set("country", document.getElementById("country-select").value);
      formData.set(
        "currency",
        document.getElementById("currency").value || "USD",
      );

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
      } catch {}

      formData.set("user-agent", navigator.userAgent);
      formData.set("screen-resolution", `${screen.width}x${screen.height}`);
      formData.set("referrer", document.referrer || "Direct");

      return { formData, uniqueID, submissionTime };
    }

    function showRedirectOverlayAndGo() {
      const overlay = document.getElementById("redirect-overlay");
      if (overlay) {
        overlay.classList.remove("d-none");
        overlay.setAttribute("aria-hidden", "false");
      }
      setTimeout(() => {
        window.location.href = "/success";
      }, 3000);
    }

    async function submitFormInternal() {
      // Ensure this flow is only executed after explicit confirmation click
      if (!submissionConfirmed) {
        showToast(
          "Please confirm your details before final submission.",
          "danger",
        );
        // If confirm modal was not shown, open it so the user can review
        if (!confirmModalShown) {
          fillConfirmDetails();
          confirmModal?.show();
          confirmModalShown = true;
        }
        return;
      }

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
      if (spinner) spinner.classList.remove("d-none");
      if (btnText) btnText.textContent = "Submitting...";

      try {
        const { formData } = prepareNetlifyFormData(form);
        // Ensure Netlify picks up this form and all fields
        formData.set("form-name", "subscription-form");
        const payload = Object.fromEntries(formData.entries());

        const netlifyCapture = (async () => {
          try {
            const encoded = new URLSearchParams();
            for (const [k, v] of formData.entries()) encoded.append(k, v);
            await fetch("/", {
              method: "POST",
              headers: { "Content-Type": "application/x-www-form-urlencoded" },
              body: encoded.toString(),
            });
          } catch (e) {
            if (location.hostname !== "localhost") {
              console.warn("Netlify forms capture failed", e);
            }
          }
        })();

        const serverFunction = (async () => {
          try {
            const endpoint = "/submit-form";
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
              showToast(formLevelErrorMessage, "warning");
            }
          } catch (e) {
            console.warn("Server function submission failed", e);
          }
        })();

        const results = await Promise.allSettled([netlifyCapture, serverFunction]);
        const allFailed = results.every((r) => r.status === "rejected");
        if (allFailed) {
          throw new Error("All submission attempts failed");
        }

        sessionStorage.setItem("submissionData", JSON.stringify(payload));
        // Reset confirmation state to avoid accidental re-submits
        submissionConfirmed = false;
        confirmModalShown = false;
        showRedirectOverlayAndGo();
      } catch (err) {
        console.error("Submission Error:", err.message, err.stack);
        showToast(
          `Submission failed: ${err.message}. Please try again.`,
          "danger",
        );
        // Reset confirmation flags so user must reconfirm after fixing errors
        submissionConfirmed = false;
        confirmModalShown = false;
        submitBtn.disabled = false;
        if (spinner) spinner.classList.add("d-none");
        if (btnText) btnText.textContent = "Submit Subscription";
      }
    }

    function fillConfirmDetails() {
      const get = (id) => document.getElementById(id);
      const text = (el, val) => {
        if (el) el.textContent = val || "—";
      };
      text(get("confirm-full-name"), document.getElementById("full-name").value);
      text(get("confirm-email"), emailInput.value);
      text(get("confirm-phone"), `${phonePrefixSpan.textContent} ${phoneInput.value}`.trim());
      const countryOption = countrySelect.options[countrySelect.selectedIndex];
      text(get("confirm-country"), countryOption ? countryOption.textContent : "");
      text(get("confirm-dob"), document.getElementById("dob").value);
      text(get("confirm-gender"), document.getElementById("gender").value);
      text(get("confirm-branch"), document.getElementById("branch").value);
      text(get("confirm-group"), document.getElementById("group").value);
      text(get("confirm-artist"), document.getElementById("artist").value);
      text(get("confirm-payment"), document.getElementById("payment-type").value);
      const contactMethod = document.querySelector('input[name="contact-method"]:checked');
      text(get("confirm-contact"), contactMethod ? contactMethod.value : "");
    }

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const honeypot = form.querySelector('[name="website"]');
      if (honeypot && honeypot.value) {
        showToast("Spam detected. Submission blocked.", "danger");
        return;
      }

      // When submitting, mark all required fields as touched so users see errors
      form.querySelectorAll("[required]").forEach((f) => markTouched(f));
      if (!isFormValidRealtime(false, true)) {
        const missing = isFormValidRealtime(true, true);
        console.debug("Invalid fields:", missing);
        showToast("Please complete the required fields.", "danger");
        // Animate the first invalid field to draw attention
        const firstInvalid = form.querySelector(".is-invalid, [aria-invalid=\"true\"]");
        if (firstInvalid) shakeField(firstInvalid);
        return;
      }

      fillConfirmDetails();
      confirmModal?.show();
      // Mark that the confirm modal was shown for this submission flow
      confirmModalShown = true;
      submissionConfirmed = false;
    });

    if (confirmBtn) {
      confirmBtn.addEventListener("click", async () => {
        // Only allow submission when user explicitly clicked confirm
        submissionConfirmed = true;
        try { confirmModal?.hide(); } catch {}
        await submitFormInternal();
      });
    }

    try {
      const onboardingModalInstance = modalManager.initialize("onboardingModal");
      if (onboardingModalInstance) onboardingModalInstance.show();
    } catch {}

    updateProgress();
    updateSubmitButton();
    // Ensure subscription amount and installment UI reflect initial selection
    try { updateInstallmentOptions(); } catch (e) { console.warn('updateInstallmentOptions failed on init', e); }

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
