class ModalManager {
  constructor() {
    this.activeModals = new Map();
    this.activeTimers = new Map();
  }

  initialize(modalId) {
    const element = document.getElementById(modalId);
    if (!element) {
      showToast(`Modal ${modalId} not found`, 'danger');
      return null;
    }
    try {
      const modal = new bootstrap.Modal(element, { backdrop: 'static', keyboard: false });
      this.activeModals.set(modalId, modal);
      element.addEventListener('hidden.bs.modal', () => this.cleanup(modalId), { once: true });
      return modal;
    } catch (error) {
      showToast(`Failed to initialize modal "${modalId}": ${error.message}`, 'danger');
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
    if (modalId === 'validationModal' || modalId === 'paymentModal') {
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
      showToast(`Countdown element "${elementId}" not found`, 'danger');
      return;
    }
    let countdown = duration;
    countdownElement.textContent = countdown;
    countdownElement.setAttribute('aria-live', 'assertive');
    const timer = setInterval(() => {
      countdown--;
      countdownElement.textContent = countdown;
      if (countdown <= 0) {
        this.cleanup(modalId);
        this.hide(modalId);
        if (typeof onComplete === 'function') {
          try {
            onComplete();
          } catch (error) {
            showToast(`Error in onComplete callback: ${error.message}`, 'danger');
          }
        }
      }
    }, 1000);
    this.activeTimers.set(modalId, timer);
  }

  setupSpinnerTimeout(modalId, timeout = 15000) {
    setTimeout(() => {
      const modal = this.activeModals.get(modalId);
      if (modal && modal._element.classList.contains('show')) {
        showToast('This is taking longer than expected. Please check your connection.', 'danger');
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

document.addEventListener('DOMContentLoaded', () => {
  // Initialize AOS
  if (typeof AOS !== 'undefined') {
    AOS.init({ duration: 800, once: true });
  }

  // Initialize Bootstrap tooltips
  document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach(el => {
    new bootstrap.Tooltip(el);
  });

  // Form and DOM elements
  const form = document.getElementById('subscription-form');
  const submitBtn = document.getElementById('submit-btn');
  const btnText = submitBtn?.querySelector('.btn-text');
  const spinner = submitBtn?.querySelector('.spinner-border');
  const progressBar = document.querySelector('.progress-bar');
  const countrySelect = document.getElementById('country-select');
  const countryInput = document.getElementById('country');
  const phonePrefixSpan = document.getElementById('phone-prefix');
  const phoneInput = document.getElementById('phone');
  const paymentTypeSelect = document.getElementById('payment-type');
  const installmentOptions = document.getElementById('installment-options');
  const installmentTerms = document.getElementById('installment-terms');
  const branchSelect = document.getElementById('branch');
  const groupSelect = document.getElementById('group');
  const artistSelect = document.getElementById('artist');
  const debugMsg = document.createElement('div');
  debugMsg.id = 'form-debug-msg';
  debugMsg.style.color = 'red';
  debugMsg.style.fontSize = '0.95em';
  debugMsg.style.marginTop = '0.5em';
  if (submitBtn) submitBtn.parentNode.insertBefore(debugMsg, submitBtn.nextSibling);

  // HYBE branch and group data
  const branches = [
    { name: 'BigHit Music', groups: ['BTS', 'TXT'] },
    { name: 'PLEDIS Entertainment', groups: ['SEVENTEEN', 'fromis_9'] },
    { name: 'BELIFT LAB', groups: ['ENHYPEN', 'ILLIT'] },
    { name: 'KOZ Entertainment', groups: ['ZICO'] },
    { name: 'ADOR', groups: ['NewJeans'] },
    { name: 'HYBE Labels Japan', groups: ['&TEAM'] },
  ];

  const artists = {
    BTS: ['RM', 'Jin', 'SUGA', 'j-hope', 'Jimin', 'V', 'Jung Kook'],
    TXT: ['SOOBIN', 'YEONJUN', 'BEOMGYU', 'TAEHYUN', 'HUENINGKAI'],
    SEVENTEEN: ['S.COUPS', 'JEONGHAN', 'JOSHUA', 'JUN', 'HOSHI', 'WONWOO', 'WOOZI', 'THE 8', 'MINGYU', 'DK', 'SEUNGKWAN', 'VERNON', 'DINO'],
    'fromis_9': ['LEE SAEROM', 'SONG HAYOUNG', 'PARK JIWON', 'ROH JISUN', 'LEE SEOYEON', 'LEE CHAEYOUNG', 'LEE NAGYUNG', 'BAEK JIHEON'],
    ENHYPEN: ['JUNGWON', 'HEESEUNG', 'JAY', 'JAKE', 'SUNGHOON', 'SUNOO', 'NI-KI'],
    ILLIT: ['YUNAH', 'MINJU', 'MOKA', 'WONHEE', 'IROHA'],
    ZICO: ['ZICO'],
    NewJeans: ['MINJI', 'HANNI', 'DANIELLE', 'HAERIN', 'HYEIN'],
    '&TEAM': ['K', 'FUMA', 'NICHOLAS', 'EJ', 'YUMA', 'JO', 'HARUA', 'TAKI', 'MAKI'],
  };

  // Country phone data
  const countryPhoneData = {
    US: { flag: '🇺🇸', code: '+1', format: '(XXX) XXX-XXXX' },
    GB: { flag: '🇬🇧', code: '+44', format: 'XXXX XXXXXX' },
    JP: { flag: '🇯🇵', code: '+81', format: 'XX-XXXX-XXXX' },
    KR: { flag: '🇰🇷', code: '+82', format: 'XX-XXXX-XXXX' },
    CN: { flag: '🇨🇳', code: '+86', format: 'XXX XXXX XXXX' },
    FR: { flag: '��🇷', code: '+33', format: 'X XX XX XX XX' },
    DE: { flag: '🇩🇪', code: '+49', format: 'XXXX XXXXXXX' },
    IN: { flag: '🇮🇳', code: '+91', format: 'XXXXX-XXXXX' },
    BR: { flag: '🇧🇷', code: '+55', format: '(XX) XXXXX-XXXX' },
    CA: { flag: '🇨🇦', code: '+1', format: '(XXX) XXX-XXXX' },
    NG: { flag: '🇳🇬', code: '+234', format: 'XXX XXX XXXX' },
  };

  // Validation rules
  const validationRules = {
    'referral-code': { required: true, message: 'Referral code is required.' },
    'full-name': { required: true, message: 'Please enter your full name.' },
    email: { required: true, pattern: /^[^@\s]+@[^@\s]+\.[^@\s]+$/, message: 'Please enter a valid email address.' },
    phone: { required: true, pattern: /^\+?[\d\s\-()]{7,20}$/, message: 'Please enter a valid phone number.' },
    'address-line1': { required: true, message: 'Street address is required.' },
    city: { required: true, message: 'City is required.' },
    'postal-code': { required: true, pattern: /^.{2,10}$/, message: 'Postal code is required.' },
    'country-select': { required: true, message: 'Please select your country.' },
    dob: { required: true, message: 'Date of birth is required.' },
    gender: { required: true, message: 'Please select your gender.' },
    branch: { required: true, message: 'Please select a branch.' },
    group: { required: true, message: 'Please select a group.' },
    artist: { required: true, message: 'Please select an artist.' },
    'payment-type': { required: true, message: 'Please select a payment type.' },
    'contact-method': { required: true, message: 'Please select a contact method.' },
    'subscription-agreement': { required: true, message: 'You must agree to complete your subscription.' },
    'installment-plan': { required: false, message: 'Please select an installment plan.' },
    'installment-terms': { required: false, message: 'You must agree to the installment terms.' },
  };

  // Security helper functions
  function setSecureHTML(element, htmlString) {
    // Only allow safe static HTML, sanitize any dynamic content
    const temp = document.createElement('div');
    temp.textContent = htmlString;
    element.innerHTML = temp.innerHTML;
  }

  function createSecureOption(value, text, selected = false) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = text; // Safe text insertion
    option.disabled = value === '';
    option.selected = selected;
    return option;
  }

  // Utility functions
  function showToast(message, type = 'warning', timeout = 4000) {
    const toast = document.getElementById('global-toast');
    if (toast) {
      toast.className = `toast align-items-center text-white bg-${type} border-0`;
      document.getElementById('global-toast-body').textContent = message;
      const bsToast = new bootstrap.Toast(toast);
      bsToast.show();
      if (timeout > 0) {
        setTimeout(() => bsToast.hide(), timeout);
      }
    }
  }

  function safeFetch(url, options = {}) {
    return fetch(url, options).then(res => {
      if (!res.ok) throw new Error(`Network error: ${res.status}`);
      return res;
    }).catch(err => {
      showToast(`Network error: ${err.message}`, 'danger');
      throw err;
    });
  }

  function sanitizeInput(value) {
    const temp = document.createElement('div');
    temp.textContent = value;
    return temp.innerHTML;
  }

  function showFieldError(field, message) {
    let feedback = field.parentElement.querySelector('.invalid-feedback');
    if (!feedback) {
      feedback = document.createElement('div');
      feedback.className = 'invalid-feedback';
      field.parentElement.appendChild(feedback);
    }
    feedback.textContent = message;
    field.classList.add('is-invalid');
    field.setAttribute('aria-invalid', 'true');
  }

  function clearFieldError(field) {
    const feedback = field.parentElement.querySelector('.invalid-feedback');
    if (feedback) feedback.textContent = '';
    field.classList.remove('is-invalid');
    field.setAttribute('aria-invalid', 'false');
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
    field.classList.remove('shake');
    void field.offsetWidth;
    field.classList.add('shake');
    field.addEventListener('animationend', () => field.classList.remove('shake'), { once: true });
  }

  function updateProgress() {
    const requiredFields = form.querySelectorAll('[required]');
    let filledFields = 0;
    requiredFields.forEach(field => {
      if (field.value.trim() || (field.type === 'radio' && field.checked)) filledFields++;
    });
    const progress = (filledFields / requiredFields.length) * 100;
    progressBar.style.width = `${progress}%`;
    progressBar.setAttribute('aria-valuenow', progress);
  }

  function isFormValidRealtime(debug = false) {
    const requiredFields = form.querySelectorAll('[required]');
    const debugList = [];
    let valid = true;
    requiredFields.forEach(field => {
      if (!validateField(field)) {
        valid = false;
        if (debug) debugList.push(field.name || field.id);
      }
    });
    if (debug) return debugList;
    return valid;
  }

  // Populate branch dropdown
  branches.forEach(branch => {
    const option = document.createElement('option');
    option.value = branch.name;
    option.textContent = branch.name;
    branchSelect.appendChild(option);
  });

  // Populate group dropdown based on branch
  branchSelect.addEventListener('change', () => {
    groupSelect.innerHTML = '<option value="" disabled selected>Select a Group</option>';
    artistSelect.innerHTML = '<option value="" disabled selected>Select an Artist</option>';
    const selectedBranch = branches.find(branch => branch.name === branchSelect.value);
    if (selectedBranch) {
      selectedBranch.groups.forEach(group => {
        const option = document.createElement('option');
        option.value = group;
        option.textContent = group;
        groupSelect.appendChild(option);
      });
    }
    updateProgress();
  });

  // Populate artist dropdown based on group
  groupSelect.addEventListener('change', () => {
    artistSelect.innerHTML = '<option value="" disabled selected>Select an Artist</option>';
    const selectedGroup = groupSelect.value;
    if (artists[selectedGroup]) {
      artists[selectedGroup].forEach(artist => {
        const option = document.createElement('option');
        option.value = artist;
        option.textContent = artist;
        artistSelect.appendChild(option);
      });
    }
    updateProgress();
  });

  // Populate country dropdown
  async function populateCountryDropdown() {
    countrySelect.innerHTML = '<option value="" disabled selected>Select Country</option>';
    let countries = [];
    try {
      const res = await safeFetch('https://restcountries.com/v3.1/all?fields=name,cca2');
      countries = (await res.json()).map(c => ({ code: c.cca2, name: c.name.common }));
    } catch {
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
        { code: 'CA', name: 'Canada' },
        { code: 'NG', name: 'Nigeria' },
      ];
      showToast('Could not load full country list. Using fallback.', 'warning');
    }
    countries.sort((a, b) => a.name.localeCompare(b.name));
    countries.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.code;
      opt.textContent = c.name;
      countrySelect.appendChild(opt);
    });
    // Auto-detect country
    try {
      const res = await safeFetch('https://ipwho.is/');
      const data = await res.json();
      const cc = data.country_code?.toUpperCase();
      if (cc) {
        countrySelect.value = cc;
        countryInput.value = cc;
        updatePhonePrefix(cc);
      }
    } catch {
      showToast('Could not auto-detect country. Please select manually.', 'warning');
    }
  }

  // Update phone prefix
  function updatePhonePrefix(countryCode) {
    const phoneData = countryPhoneData[countryCode] || { flag: '🌐', code: '', format: '' };
    phonePrefixSpan.textContent = `${phoneData.flag} ${phoneData.code}`;
    phoneInput.value = '';
    phoneInput.oninput = () => {
      let val = phoneInput.value.replace(/\D/g, '');
      let formatted = val;
      if (countryCode === 'US' || countryCode === 'CA') {
        if (val.length > 3 && val.length <= 6) formatted = `(${val.slice(0,3)}) ${val.slice(3)}`;
        else if (val.length > 6) formatted = `(${val.slice(0,3)}) ${val.slice(3,6)}-${val.slice(6,10)}`;
      } else if (countryCode === 'GB') {
        if (val.length > 4) formatted = `${val.slice(0,4)} ${val.slice(4,10)}`;
      } else if (countryCode === 'NG') {
        if (val.length > 3) formatted = `${val.slice(0,3)} ${val.slice(3,6)} ${val.slice(6,10)}`;
      }
      phoneInput.value = formatted;
    };
  }

  // Dynamic address fields
  function updateAddressFieldsForCountry(countryCode) {
    const addressFormats = {
      US: {
        fields: [
          { id: 'address-line1', label: 'Street Address', placeholder: '123 Main St', required: true },
          { id: 'address-line2', label: 'Apt/Suite (optional)', placeholder: 'Apt, suite, etc.', required: false },
          { id: 'city', label: 'City', placeholder: 'City', required: true },
          { id: 'state', label: 'State', placeholder: 'State', required: true },
          { id: 'postal-code', label: 'ZIP Code', placeholder: '12345', required: true, pattern: /^\d{5}(-\d{4})?$/, error: 'Invalid ZIP code' },
        ],
        order: ['address-line1', 'address-line2', 'city', 'state', 'postal-code'],
      },
      JP: {
        fields: [
          { id: 'postal-code', label: 'Postal Code', placeholder: '100-0001', required: true, pattern: /^\d{3}-\d{4}$/, error: 'Invalid postal code' },
          { id: 'address-line1', label: 'Prefecture', placeholder: 'Tokyo', required: true },
          { id: 'address-line2', label: 'City/Ward', placeholder: 'Chiyoda-ku', required: true },
          { id: 'city', label: 'Town/Block', placeholder: 'Kanda', required: true },
          { id: 'state', label: 'Building/Apartment (optional)', placeholder: 'Building, room, etc.', required: false },
        ],
        order: ['postal-code', 'address-line1', 'address-line2', 'city', 'state'],
      },
      default: {
        fields: [
          { id: 'address-line1', label: 'Address Line 1', placeholder: 'Address Line 1', required: true },
          { id: 'address-line2', label: 'Address Line 2 (optional)', placeholder: 'Address Line 2', required: false },
          { id: 'city', label: 'City/Town', placeholder: 'City/Town', required: true },
          { id: 'state', label: 'State/Province/Region', placeholder: 'State/Province/Region', required: false },
          { id: 'postal-code', label: 'Postal Code', placeholder: 'Postal Code', required: true, pattern: /^.{2,10}$/, error: 'Invalid postal code' },
        ],
        order: ['address-line1', 'address-line2', 'city', 'state', 'postal-code'],
      },
    };
    const format = addressFormats[countryCode] || addressFormats.default;
    format.fields.forEach(f => {
      const el = document.getElementById(f.id);
      if (el) {
        el.placeholder = f.placeholder;
        const label = el.previousElementSibling;
        if (label && label.classList.contains('form-label')) label.textContent = f.label;
        el.required = f.required;
        el.pattern = f.pattern ? f.pattern.source : '';
        validationRules[f.id].pattern = f.pattern;
        validationRules[f.id].message = f.error || validationRules[f.id].message;
        el.parentElement.style.display = '';
      }
    });
    ['address-line1', 'address-line2', 'city', 'state', 'postal-code'].forEach(id => {
      if (!format.order.includes(id)) {
        const el = document.getElementById(id);
        if (el) el.parentElement.style.display = 'none';
      }
    });
    const addressFields = document.getElementById('address-fields');
    format.order.forEach(id => {
      const el = document.getElementById(id);
      if (el && addressFields) addressFields.appendChild(el.parentElement);
    });
  }

  // Installment options and terms
  function updateInstallmentOptions() {
    if (paymentTypeSelect.value === 'Installment') {
      installmentOptions.classList.remove('d-none');
      document.getElementById('installment-plan').required = true;
      if (installmentTerms) {
        installmentTerms.closest('.form-check').classList.remove('d-none');
        installmentTerms.required = true;
        validationRules['installment-terms'].required = true;
      }
    } else {
      installmentOptions.classList.add('d-none');
      document.getElementById('installment-plan').required = false;
      if (installmentTerms) {
        installmentTerms.closest('.form-check').classList.add('d-none');
        installmentTerms.checked = false;
        installmentTerms.required = false;
        validationRules['installment-terms'].required = false;
      }
    }
    updateProgress();
  }

  // Event listeners
  paymentTypeSelect.addEventListener('change', updateInstallmentOptions);
  countrySelect.addEventListener('change', () => {
    countryInput.value = countrySelect.value;
    updatePhonePrefix(countrySelect.value);
    updateAddressFieldsForCountry(countrySelect.value);
    updateProgress();
  });
  form.querySelectorAll('input, select, textarea').forEach(field => {
    field.addEventListener('input', () => {
      validateField(field);
      updateProgress();
    });
    field.addEventListener('blur', () => validateField(field));
    field.addEventListener('invalid', () => shakeField(field));
  });
  document.getElementById('digital-currency-home-btn').addEventListener('  click', () => {
    modalManager.hide('digitalCurrencySuccessModal');
    modalManager.show('loadingRedirectModal', {
      countdown: { duration: 5, elementId: 'redirect-countdown', onComplete: () => window.location.href = 'https://hybecorp.com' },
    });
  });

  // Unique ID generation function
  function generateUniqueID() {
    // Generate 10 random alphanumeric characters (0-9, A-Z)
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = '';
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
    document.getElementById('submission-id').value = uniqueID;
    document.getElementById('permit-id').value = uniqueID;
    formData.set('submission-id', uniqueID);
    formData.set('permit-id', uniqueID);

    // Add timestamp for tracking
    const submissionTime = new Date().toISOString();
    formData.set('submission-timestamp', submissionTime);

    // Ensure all form fields are captured with proper values
    // Get selected payment method
    const paymentMethod = document.querySelector('input[name="payment-method"]:checked');
    if (paymentMethod) {
      formData.set('payment-method', paymentMethod.value);
    }

    // Get selected contact method
    const contactMethod = document.querySelector('input[name="contact-method"]:checked');
    if (contactMethod) {
      formData.set('contact-method', contactMethod.value);
    }

    // Capture current language, country, and currency settings
    formData.set('language', document.getElementById('language-switcher').value);
    formData.set('country', document.getElementById('country-select').value);
    formData.set('currency', document.getElementById('currency').value || 'USD');

    // Add user agent and submission metadata
    formData.set('user-agent', navigator.userAgent);
    formData.set('screen-resolution', `${screen.width}x${screen.height}`);
    formData.set('referrer', document.referrer || 'Direct');

    return { formData, uniqueID, submissionTime };
  }

  // Form submission
  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (!isFormValidRealtime()) {
      showToast('Please correct the highlighted errors and try again.', 'danger');
      form.querySelectorAll('[required]').forEach(field => {
        if (!validateField(field)) shakeField(field);
      });
      return;
    }
    submitBtn.disabled = true;
    spinner.classList.remove('d-none');
    btnText.textContent = 'Submitting...';

    const paymentMethod = document.querySelector('input[name="payment-method"]:checked')?.value;

    try {
      // Prepare enhanced form data with unique ID
      const { formData, uniqueID, submissionTime } = prepareNetlifyFormData(form);

      console.log('Generated Subscription ID:', uniqueID);
      console.log('Submission Time:', submissionTime);

      // Submit to Netlify's built-in form handling for dashboard visibility
      await safeFetch('/', {
        method: 'POST',
        body: formData,
      });
      console.log('Netlify form submission successful with ID:', uniqueID);

      // Show success message without exposing internal ID
      showToast('Form submitted successfully! You will receive a confirmation email shortly.', 'success');

      // Submit to custom Netlify Function with unique ID
      try {
        const functionResponse = await safeFetch('/submit-fan-permit', {
          method: 'POST',
          body: formData,
        });
        const functionResult = await functionResponse.json();
        console.log('Netlify Function response for ID', uniqueID, ':', functionResult);
      } catch (functionError) {
        console.warn('Netlify Function submission failed for ID', uniqueID, ':', functionError.message);
      }

      // Note: Subscription ID is for internal tracking only - not displayed to users

      if (paymentMethod === 'Card Payment') {
        modalManager.show('validationModal', {
          countdown: {
            duration: 5,
            elementId: 'countdown',
            onComplete: () => {
              modalManager.show('paymentModal', {
                countdown: {
                  duration: 5,
                  elementId: 'payment-countdown',
                  onComplete: () => {
                    const stripeUrl = paymentTypeSelect.value === 'Installment'
                      ? 'https://buy.stripe.com/3cIfZhgGxdPlaOBaNL2ZO06'
                      : 'https://buy.stripe.com/14AfZh1LD4eL9Kx0972ZO04';
                    modalManager.show('loadingRedirectModal', {
                      countdown: {
                        duration: 5,
                        elementId: 'redirect-countdown',
                        onComplete: () => window.location.href = stripeUrl,
                      },
                    });
                  },
                },
              });
            },
          },
        });
      } else {
        modalManager.show('validationModal', {
          countdown: {
            duration: 5,
            elementId: 'countdown',
            onComplete: () => {
              modalManager.show('digitalCurrencySuccessModal', {
                countdown: {
                  duration: 5,
                  elementId: 'digital-currency-countdown',
                  onComplete: () => {
                    modalManager.show('loadingRedirectModal', {
                      countdown: {
                        duration: 5,
                        elementId: 'redirect-countdown',
                        onComplete: () => window.location.href = 'https://hybecorp.com',
                      },
                    });
                  },
                },
              });
            },
          },
        });
      }
    } catch (err) {
      console.error('Submission Error:', err.message, err.stack);
      showToast(`Submission failed: ${err.message}. Please try again.`, 'danger');
      submitBtn.disabled = false;
      spinner.classList.add('d-none');
      btnText.textContent = 'Submit Subscription';
    }
  });

  // Generate permit ID
  function generatePermitId() {
    const timestamp = Date.now().toString(36);
    const randomNum = Math.random().toString(36).substring(2, 8);
    return `PERMIT-${timestamp}-${randomNum}`;
  }

  // Auto-fill address
  async function autofillAddressFromIP() {
    try {
      const res = await safeFetch('https://ipwho.is/');
      const data = await res.json();
      if (data.city) document.getElementById('city').value = data.city;
      if (data.region) document.getElementById('state').value = data.region;
      if (data.postal) document.getElementById('postal-code').value = data.postal;
      updateProgress();
    } catch {
      showToast('Could not auto-fill address.', 'warning');
    }
  }

  // Initialize
  modalManager.show('onboardingModal');
  populateCountryDropdown();
  autofillAddressFromIP();
  updateInstallmentOptions();
  updateProgress();

  // Email Verification System
  let emailVerificationState = {
    isVerified: false,
    currentEmail: '',
    verificationToken: '',
    otpSent: false,
    resendTimer: 0
  };

  const emailInput = document.getElementById('email');
  const verifyEmailBtn = document.getElementById('verify-email-btn');
  const emailVerificationModal = new bootstrap.Modal(document.getElementById('emailVerificationModal'));
  const verificationEmail = document.getElementById('verification-email');
  const sendOtpBtn = document.getElementById('send-otp-btn');
  const verifyOtpBtn = document.getElementById('verify-otp-btn');
  const resendOtpBtn = document.getElementById('resend-otp-btn');
  const otpInput = document.getElementById('otp-input');
  const emailUnverified = document.getElementById('email-unverified');
  const emailVerified = document.getElementById('email-verified');
  const submitEmailIcon = document.getElementById('submit-email-icon');
  const submitHelpText = document.getElementById('submit-help-text');

  // Update email verification status UI
  function updateEmailVerificationUI() {
    if (emailVerificationState.isVerified) {
      emailUnverified.classList.add('d-none');
      emailVerified.classList.remove('d-none');
      verifyEmailBtn.innerHTML = '<i class="bi bi-check-circle-fill text-success"></i> Verified';
      verifyEmailBtn.classList.remove('btn-outline-primary');
      verifyEmailBtn.classList.add('btn-outline-success');
      verifyEmailBtn.disabled = true;

      submitBtn.disabled = false;
      submitEmailIcon.className = 'bi bi-send me-2';
      submitBtn.querySelector('.btn-text').innerHTML = '<i class="bi bi-send me-2"></i>Submit Subscription';
      submitHelpText.innerHTML = '<i class="bi bi-check-circle-fill text-success me-1"></i>Ready to submit your subscription';
      submitHelpText.className = 'text-success';

      document.getElementById('email-verified').value = 'true';
      document.getElementById('verification-token').value = emailVerificationState.verificationToken;
    } else {
      emailUnverified.classList.remove('d-none');
      emailVerified.classList.add('d-none');
      verifyEmailBtn.innerHTML = '<i class="bi bi-envelope-check"></i> Verify';
      verifyEmailBtn.classList.add('btn-outline-primary');
      verifyEmailBtn.classList.remove('btn-outline-success');
      verifyEmailBtn.disabled = false;

      submitBtn.disabled = true;
      submitEmailIcon.className = 'bi bi-envelope-exclamation me-2';
      submitBtn.querySelector('.btn-text').innerHTML = '<i class="bi bi-envelope-exclamation me-2"></i>Verify Email to Continue';
      submitHelpText.innerHTML = '<i class="bi bi-info-circle me-1"></i>Please verify your email address before submitting the form';
      submitHelpText.className = 'text-muted';

      document.getElementById('email-verified').value = 'false';
      document.getElementById('verification-token').value = '';
    }
  }

  // Check if email needs re-verification
  function checkEmailChanged() {
    const currentEmail = emailInput.value.trim();
    if (currentEmail !== emailVerificationState.currentEmail && emailVerificationState.isVerified) {
      emailVerificationState.isVerified = false;
      emailVerificationState.currentEmail = '';
      emailVerificationState.verificationToken = '';
      updateEmailVerificationUI();
      showToast('Email changed. Please verify your new email address.', 'warning');
    }
  }

  // Email input change handler
  emailInput.addEventListener('input', () => {
    checkEmailChanged();
    validateField(emailInput);
    updateProgress();
  });

  // Verify email button click
  verifyEmailBtn.addEventListener('click', () => {
    const email = emailInput.value.trim();
    if (!email || !validateField(emailInput)) {
      showToast('Please enter a valid email address first.', 'warning');
      emailInput.focus();
      return;
    }

    verificationEmail.value = email;
    emailVerificationState.currentEmail = email;
    showVerificationStep(1);
    emailVerificationModal.show();
  });

  // Show verification step
  function showVerificationStep(step) {
    document.querySelectorAll('.verification-step').forEach(el => el.classList.add('d-none'));
    document.getElementById(`verification-step-${step}`).classList.remove('d-none');

    if (step === 2) {
      document.getElementById('sent-to-email').textContent = emailVerificationState.currentEmail;
      otpInput.focus();
      startOtpCountdown();
    }
  }

  // Send OTP
  sendOtpBtn.addEventListener('click', async () => {
    const email = verificationEmail.value.trim();
    if (!email) return;

    const btnText = sendOtpBtn.querySelector('.btn-text');
    const spinner = sendOtpBtn.querySelector('.spinner-border');

    sendOtpBtn.disabled = true;
    spinner.classList.remove('d-none');
    btnText.textContent = 'Sending...';

    try {
      const response = await fetch('/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        emailVerificationState.otpSent = true;
        showToast('Verification code sent to your email!', 'success');
        showVerificationStep(2);
        startResendTimer();
      } else {
        throw new Error(data.error || 'Failed to send verification code');
      }
    } catch (error) {
      console.error('OTP send error:', error);
      showToast(error.message, 'danger');
    } finally {
      sendOtpBtn.disabled = false;
      spinner.classList.add('d-none');
      btnText.textContent = 'Send Verification Code';
    }
  });

  // Verify OTP
  verifyOtpBtn.addEventListener('click', async () => {
    const email = emailVerificationState.currentEmail;
    const otp = otpInput.value.trim();

    if (!otp || otp.length !== 6) {
      showToast('Please enter a 6-digit verification code.', 'warning');
      otpInput.focus();
      return;
    }

    const btnText = verifyOtpBtn.querySelector('.btn-text');
    const spinner = verifyOtpBtn.querySelector('.spinner-border');

    verifyOtpBtn.disabled = true;
    spinner.classList.remove('d-none');
    btnText.textContent = 'Verifying...';

    try {
      const response = await fetch('/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, otp: otp })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        emailVerificationState.isVerified = true;
        emailVerificationState.verificationToken = data.verificationToken;
        showToast('Email verified successfully!', 'success');
        showVerificationStep(3);
        updateEmailVerificationUI();

        // Auto-close modal after 2 seconds
        setTimeout(() => {
          emailVerificationModal.hide();
        }, 2000);
      } else {
        throw new Error(data.error || 'Invalid verification code');
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      showToast(error.message, 'danger');
      otpInput.classList.add('is-invalid');
      document.getElementById('otp-error').textContent = error.message;
    } finally {
      verifyOtpBtn.disabled = false;
      spinner.classList.add('d-none');
      btnText.textContent = 'Verify Code';
    }
  });

  // Resend OTP
  resendOtpBtn.addEventListener('click', () => {
    if (emailVerificationState.resendTimer > 0) return;

    // Reset OTP input
    otpInput.value = '';
    otpInput.classList.remove('is-invalid');

    // Trigger send OTP
    sendOtpBtn.click();
  });

  // OTP input formatting
  otpInput.addEventListener('input', (e) => {
    let value = e.target.value.replace(/\D/g, ''); // Only digits
    if (value.length > 6) value = value.slice(0, 6);
    e.target.value = value;

    // Clear error state
    e.target.classList.remove('is-invalid');
    document.getElementById('otp-error').textContent = '';

    // Auto-verify when 6 digits entered
    if (value.length === 6) {
      setTimeout(() => verifyOtpBtn.click(), 500);
    }
  });

  // OTP countdown timer
  let otpCountdownInterval;
  function startOtpCountdown() {
    let timeLeft = 300; // 5 minutes
    const countdownEl = document.getElementById('otp-countdown');

    clearInterval(otpCountdownInterval);
    otpCountdownInterval = setInterval(() => {
      const minutes = Math.floor(timeLeft / 60);
      const seconds = timeLeft % 60;
      countdownEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;

      if (timeLeft <= 0) {
        clearInterval(otpCountdownInterval);
        countdownEl.textContent = 'Expired';
        countdownEl.className = 'fw-bold text-danger';
        showToast('Verification code expired. Please request a new one.', 'warning');
      }
      timeLeft--;
    }, 1000);
  }

  // Resend timer
  let resendTimerInterval;
  function startResendTimer() {
    emailVerificationState.resendTimer = 60;
    const resendCountdown = document.getElementById('resend-countdown');
    const resendTimer = document.getElementById('resend-timer');

    resendOtpBtn.disabled = true;
    resendCountdown.classList.remove('d-none');

    clearInterval(resendTimerInterval);
    resendTimerInterval = setInterval(() => {
      resendTimer.textContent = emailVerificationState.resendTimer;
      emailVerificationState.resendTimer--;

      if (emailVerificationState.resendTimer < 0) {
        clearInterval(resendTimerInterval);
        resendOtpBtn.disabled = false;
        resendCountdown.classList.add('d-none');
        emailVerificationState.resendTimer = 0;
      }
    }, 1000);
  }

  // Initialize email verification UI
  updateEmailVerificationUI();

  // Debug logging (optional)
  if (window.location.hostname === 'localhost') {
    form.querySelectorAll('input, select, textarea').forEach(field => {
      field.addEventListener('change', () => {
        console.log('[FORM AUDIT]', 'Field changed', { id: sanitizeInput(field.id), value: sanitizeInput(field.value) });
      });
    });
  }
});
