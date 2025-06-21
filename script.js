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
      if (typeof bootstrap === 'undefined') {
        console.error('Bootstrap is not loaded');
        return null;
      }
      
      const modal = new bootstrap.Modal(element);
      this.activeModals.set(modalId, modal);

      element.addEventListener(
        'hidden.bs.modal',
        () => {
          this.cleanup(modalId);
        },
        { once: true },
      );

      return modal;
    } catch (error) {
      console.error(
        `Failed to initialize modal "${modalId}": ${error.message}`,
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
        clearInterval(timer);
        this.activeTimers.delete(modalId);
        this.hide(modalId);
        if (typeof onComplete === 'function') {
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
    this.activeModals.delete(modalId);
  }
}

const modalManager = new ModalManager();

document.addEventListener('DOMContentLoaded', () => {
  // Initialize AOS animations
  if (typeof AOS !== 'undefined') {
    AOS.init({ duration: 800, once: true });
  }

  // Initialize Bootstrap tooltips
  const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
  tooltipTriggerList.forEach((tooltipTriggerEl) => {
    new bootstrap.Tooltip(tooltipTriggerEl);
  });

  // Initialize intl-tel-input
  const phoneInput = document.getElementById('phone');
  const countrySelect = document.getElementById('country-select');
  const countryInput = document.getElementById('country');
  let iti = null;
  if (phoneInput && typeof window.intlTelInput !== 'undefined') {
    iti = window.intlTelInput(phoneInput, {
      initialCountry: 'auto',
      geoIpLookup: (callback) => {
        fetch('https://ipgeolocation.abstractapi.com/v1/?api_key=YOUR_API_KEY')
          .then((response) => response.json())
          .then((data) => {
            const countryCode = data.country_code || 'US';
            callback(countryCode);
            if (countryInput) countryInput.value = countryCode;
            if (countrySelect) countrySelect.value = countryCode;
          })
          .catch((error) => {
            console.error('Geolocation error:', error);
            callback('US');
            if (countryInput) countryInput.value = 'US';
            if (countrySelect) countrySelect.value = 'US';
          });
      },
      utilsScript: 'https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/18.1.1/js/utils.js',
      separateDialCode: true,
      nationalMode: false,
      autoPlaceholder: 'polite',
      preferredCountries: ['KR', 'US', 'CA', 'JP'],
    });

    // Sync country-select and country input on phone country change
    phoneInput.addEventListener('countrychange', () => {
      const countryCode = iti.getSelectedCountryData().iso2.toUpperCase();
      if (countryInput) countryInput.value = countryCode;
      if (countrySelect) countrySelect.value = countryCode;
      updateProgress();
    });

    // Sync phone input country when country-select changes
    if (countrySelect) {
      countrySelect.addEventListener('change', () => {
        const countryCode = countrySelect.value;
        if (iti && countryCode) {
          iti.setCountry(countryCode.toLowerCase());
          if (countryInput) countryInput.value = countryCode;
        }
        updateProgress();
      });
    }
  }

  // Form and modal DOM elements
  const form = document.getElementById('subscription-form');
  const formMessage = document.getElementById('form-message');
  const referralCodeInput = document.getElementById('referral-code');
  const fullNameInput = document.getElementById('full-name');
  const emailInput = document.getElementById('email');
  const dobInput = document.getElementById('dob');
  const genderSelect = document.getElementById('gender');
  const branchSelect = document.getElementById('branch');
  const groupSelect = document.getElementById('group');
  const artistSelect = document.getElementById('artist');
  const paymentTypeSelect = document.getElementById('payment-type');
  const installmentOptions = document.getElementById('installment-options');
  const paymentMethods = document.getElementById('payment-methods');
  const privacyPolicy = document.getElementById('privacy-policy');
  const subscriptionAgreement = document.getElementById('subscription-agreement');
  const submitBtn = document.getElementById('submit-btn');
  const progressBar = document.querySelector('.progress-bar');
  const currencyInput = document.getElementById('currency');
  const languageInput = document.getElementById('language');
  const permitIdInput = document.getElementById('permit-id');
  const submissionIdInput = document.getElementById('submission-id');
  const digitalCurrencyHomeBtn = document.getElementById('digital-currency-home-btn');

  // Null checks for critical elements
  if (!form) {
    console.error('Subscription form not found');
    return;
  }
  if (!submitBtn) {
    console.error('Submit button not found');
    return;
  }

  const btnText = submitBtn.querySelector('.btn-text');
  const spinner = submitBtn.querySelector('.spinner-border');

  // Show onboarding modal
  modalManager.show('onboardingModal');

  // HYBE branch and group data
  const branches = [
    { name: 'BigHit Music', groups: ['BTS', 'TXT'] },
    { name: 'PLEDIS Entertainment', groups: ['SEVENTEEN', 'fromis_9'] },
    { name: 'BELIFT LAB', groups: ['ENHYPEN', 'ILLIT'] },
    { name: 'KOZ Entertainment', groups: ['ZICO'] },
    { name: 'ADOR', groups: ['NewJeans'] },
    { name: 'HYBE Labels Japan', groups: ['&TEAM'] },
  ];

  // Populate branch dropdown
  if (branchSelect) {
    branches.forEach((branch) => {
      const option = document.createElement('option');
      option.value = branch.name;
      option.textContent = branch.name;
      branchSelect.appendChild(option);
    });
  }

  // Update group dropdown based on branch selection
  if (branchSelect && groupSelect && artistSelect) {
    branchSelect.addEventListener('change', () => {
      const selectedBranch = branches.find(
        (branch) => branch.name === branchSelect.value,
      );
      groupSelect.innerHTML = '<option value="" disabled selected>Select a Group</option>';
      artistSelect.innerHTML = '<option value="" disabled selected>Select an Artist</option>';
      
      if (selectedBranch) {
        selectedBranch.groups.forEach((group) => {
          const option = document.createElement('option');
          option.value = group;
          option.textContent = group;
          groupSelect.appendChild(option);
        });
      }
      updateProgress();
    });
  }

  // Update artist dropdown based on group selection
  if (groupSelect && artistSelect) {
    groupSelect.addEventListener('change', () => {
      artistSelect.innerHTML = '<option value="" disabled selected>Select an Artist</option>';
      const selectedGroup = groupSelect.value;
      const artists = {
        BTS: ['RM', 'Jin', 'SUGA', 'j-hope', 'Jimin', 'V', 'Jung Kook'],
        TXT: ['SOOBIN', 'YEONJUN', 'BEOMGYU', 'TAEHYUN', 'HUENINGKAI'],
        SEVENTEEN: [
          'S.COUPS', 'JEONGHAN', 'JOSHUA', 'JUN', 'HOSHI', 'WONWOO',
          'WOOZI', 'THE 8', 'MINGYU', 'DK', 'SEUNGKWAN', 'VERNON', 'DINO',
        ],
        fromis_9: [
          'LEE SAEROM', 'SONG HAYOUNG', 'PARK JIWON', 'ROH JISUN',
          'LEE SEOYEON', 'LEE CHAEYOUNG', 'LEE NAGYUNG', 'BAEK JIHEON',
        ],
        ENHYPEN: ['JUNGWON', 'HEESEUNG', 'JAY', 'JAKE', 'SUNGHOON', 'SUNOO', 'NI-KI'],
        ILLIT: ['YUNAH', 'MINJU', 'MOKA', 'WONHEE', 'IROHA'],
        ZICO: ['ZICO'],
        NewJeans: ['MINJI', 'HANNI', 'DANIELLE', 'HAERIN', 'HYEIN'],
        '&TEAM': ['K', 'FUMA', 'NICHOLAS', 'EJ', 'YUMA', 'JO', 'HARUA', 'TAKI', 'MAKI'],
      };
      
      if (artists[selectedGroup]) {
        artists[selectedGroup].forEach((artist) => {
          const option = document.createElement('option');
          option.value = artist;
          option.textContent = artist;
          artistSelect.appendChild(option);
        });
      }
      updateProgress();
    });
  }

  // Toggle installment options based on payment type
  if (paymentTypeSelect && installmentOptions) {
    paymentTypeSelect.addEventListener('change', () => {
      if (paymentTypeSelect.value === 'Installment') {
        installmentOptions.classList.remove('d-none');
        installmentOptions.querySelector('select').required = true;
      } else {
        installmentOptions.classList.add('d-none');
        installmentOptions.querySelector('select').required = false;
      }
      updateProgress();
    });
  }

  // Update progress bar and validate form
  function updateProgress() {
    if (!progressBar) return;
    const totalFields = 16;
    let filledFields = 0;

    function checkField(fieldId, required = true) {
      const field = document.getElementById(fieldId);
      if (!field) return 0;
      const valid = field.value && (!required || field.value.trim() !== '');
      if (required) field.setAttribute('aria-invalid', valid ? 'false' : 'true');
      return valid ? 1 : 0;
    }

    filledFields += referralCodeInput?.value ? 1 : 0;
    if (referralCodeInput) referralCodeInput.setAttribute('aria-invalid', referralCodeInput.value ? 'false' : 'true');
    filledFields += fullNameInput?.value ? 1 : 0;
    if (fullNameInput) fullNameInput.setAttribute('aria-invalid', fullNameInput.value ? 'false' : 'true');
    filledFields += emailInput?.value ? 1 : 0;
    if (emailInput) emailInput.setAttribute('aria-invalid', emailInput.value ? 'false' : 'true');
    filledFields += phoneInput?.value && (iti ? iti.isValidNumber() : phoneInput.value.trim() !== '') ? 1 : 0;
    if (phoneInput) phoneInput.setAttribute('aria-invalid', phoneInput.value && (iti ? iti.isValidNumber() : true) ? 'false' : 'true');
    filledFields += checkField('address-line1');
    filledFields += checkField('city');
    filledFields += checkField('state');
    filledFields += checkField('postal-code');
    filledFields += countrySelect?.value ? 1 : 0;
    if (countrySelect) countrySelect.setAttribute('aria-invalid', countrySelect.value ? 'false' : 'true');
    filledFields += dobInput?.value ? 1 : 0;
    if (dobInput) dobInput.setAttribute('aria-invalid', dobInput.value ? 'false' : 'true');
    filledFields += genderSelect?.value ? 1 : 0;
    if (genderSelect) genderSelect.setAttribute('aria-invalid', genderSelect.value ? 'false' : 'true');
    filledFields += branchSelect?.value ? 1 : 0;
    if (branchSelect) branchSelect.setAttribute('aria-invalid', branchSelect.value ? 'false' : 'true');
    filledFields += groupSelect?.value ? 1 : 0;
    if (groupSelect) groupSelect.setAttribute('aria-invalid', groupSelect.value ? 'false' : 'true');
    filledFields += artistSelect?.value ? 1 : 0;
    if (artistSelect) artistSelect.setAttribute('aria-invalid', artistSelect.value ? 'false' : 'true');
    filledFields += paymentTypeSelect?.value ? 1 : 0;
    if (paymentTypeSelect) paymentTypeSelect.setAttribute('aria-invalid', paymentTypeSelect.value ? 'false' : 'true');

    const contactMethodChecked = document.querySelector('input[name="contact-method"]:checked');
    filledFields += contactMethodChecked ? 1 : 0;
    document.querySelectorAll('input[name="contact-method"]').forEach((input) => {
      input.setAttribute('aria-invalid', contactMethodChecked ? 'false' : 'true');
    });

    const progress = (filledFields / totalFields) * 100;
    progressBar.style.width = `${progress}%`;
    progressBar.setAttribute('aria-valuenow', progress);

    if (submitBtn) {
      submitBtn.disabled = filledFields < totalFields;
      submitBtn.setAttribute('aria-disabled', submitBtn.disabled ? 'true' : 'false');
    }
  }

  function setAriaInvalid(field, invalid) {
    if (field) field.setAttribute('aria-invalid', invalid ? 'true' : 'false');
  }

  function setPhoneValidity(valid) {
    if (phoneInput) {
      setAriaInvalid(phoneInput, !valid);
      if (valid) {
        phoneInput.classList.remove('is-invalid');
        phoneInput.classList.add('is-valid');
      } else {
        phoneInput.classList.remove('is-valid');
        phoneInput.classList.add('is-invalid');
      }
    }
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (submitBtn) {
      submitBtn.disabled = true;
      if (spinner) spinner.classList.remove('d-none');
      if (btnText) btnText.classList.add('d-none');
    }
    
    if (formMessage) formMessage.classList.add('d-none');

    try {
      if (!form.checkValidity()) {
        form.classList.add('was-validated');
        showMessage('Please fill out all required fields correctly.', 'danger');
        resetButton();
        return;
      }

      const contactMethods = document.querySelectorAll('input[name="contact-method"]');
      const oneChecked = Array.from(contactMethods).some((el) => el.checked);
      if (!oneChecked) {
        showMessage('Please select at least one preferred contact method.', 'danger');
        resetButton();
        return;
      }

      if (!referralCodeInput || referralCodeInput.value !== 'HYBE2025') {
        showMessage('Invalid referral code. Use HYBE2025.', 'danger');
        setAriaInvalid(referralCodeInput, true);
        resetButton();
        return;
      } else {
        setAriaInvalid(referralCodeInput, false);
      }

      if (!emailInput || !emailRegex.test(emailInput.value)) {
        showMessage('Invalid email address.', 'danger');
        setAriaInvalid(emailInput, true);
        resetButton();
        return;
      } else {
        setAriaInvalid(emailInput, false);
      }

      let phoneValid = false;
      if (iti && typeof iti.isValidNumber === 'function') {
        phoneValid = iti.isValidNumber();
      } else if (phoneInput) {
        phoneValid = /^\+?[0-9\s\-()]{7,20}$/.test(phoneInput.value.trim());
      }
      if (!phoneValid) {
        showMessage('Invalid phone number.', 'danger');
        setPhoneValidity(false);
        resetButton();
        return;
      }
      setPhoneValidity(true);
      if (iti && typeof iti.getNumber === 'function') {
        phoneInput.value = iti.getNumber();
      }

      if (!dobInput || !dobInput.value) {
        showMessage('Date of birth is required.', 'danger');
        setAriaInvalid(dobInput, true);
        resetButton();
        return;
      } else {
        setAriaInvalid(dobInput, false);
      }
      const dob = new Date(dobInput.value);
      const dobString = dobInput.value;
      if (isNaN(dob.getTime()) || dobString !== dob.toISOString().split('T')[0]) {
        showMessage('Invalid date of birth. Use YYYY-MM-DD format.', 'danger');
        setAriaInvalid(dobInput, true);
        resetButton();
        return;
      }

      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const monthDiff = today.getMonth() - dob.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
        age--;
      }
      
      if (age < 13) {
        setAriaInvalid(dobInput, true);
        showMessage('You must be at least 13 years old to subscribe.', 'danger');
        resetButton();
        return;
      } else {
        setAriaInvalid(dobInput, false);
      }

      if (!privacyPolicy || !privacyPolicy.checked) {
        showMessage('You must agree to the Privacy Policy.', 'danger');
        setAriaInvalid(privacyPolicy, true);
        resetButton();
        return;
      } else {
        setAriaInvalid(privacyPolicy, false);
      }
      if (!subscriptionAgreement || !subscriptionAgreement.checked) {
        showMessage('You must agree to complete the subscription.', 'danger');
        setAriaInvalid(subscriptionAgreement, true);
        resetButton();
        return;
      }

      if (permitIdInput) permitIdInput.value = generatePermitId();
      if (submissionIdInput) submissionIdInput.value = `SUB-${Date.now()}`;

      modalManager.show('validationModal', {
        countdown: {
          duration: 5,
          elementId: 'countdown',
          onComplete: () => {
            const paymentMethod = form.querySelector('input[name="payment-method"]:checked');
            if (!paymentMethod) {
              showMessage('Please select a payment method.', 'danger');
              resetButton();
              return;
            }

            if (paymentMethod.value === 'Card Payment') {
              modalManager.show('paymentModal', {
                countdown: {
                  duration: 5,
                  elementId: 'payment-countdown',
                  onComplete: () => {
                    const paymentType = paymentTypeSelect?.value;
                    if (paymentType === 'Full Payment') {
                      window.location.href = 'https://buy.stripe.com/14AfZh1LD4eL9Kx0972ZO04';
                    } else if (paymentType === 'Installment') {
                      window.location.href = 'https://buy.stripe.com/3cIfZhgGxdPlaOBaNL2ZO06';
                    } else {
                      showMessage('Invalid payment type selected.', 'danger');
                      resetButton();
                    }
                  }
                }
              });
            } else if (paymentMethod.value === 'Digital Currency') {
              modalManager.show('digitalCurrencySuccessModal');
              resetButton();
            } else {
              showMessage('Selected payment method is not supported.', 'danger');
              resetButton();
            }

            console.log(
              `Subscription submitted: ${submissionIdInput?.value || 'N/A'}, Artist: ${artistSelect?.value || 'N/A'}, Payment: ${paymentTypeSelect?.value || 'N/A'}, Country: ${countryInput?.value || 'N/A'}`,
            );
          },
        },
      });
    } catch (error) {
      console.error('Form submission error:', error);
      showMessage(`Submission failed: ${error.message}`, 'danger');
      resetButton();
    }
  });

  // Update progress on input changes
  [referralCodeInput, fullNameInput, emailInput, phoneInput, dobInput, genderSelect, branchSelect, groupSelect, artistSelect, paymentTypeSelect, countrySelect].forEach((input) => {
    if (input) input.addEventListener('input', updateProgress);
  });
  document.querySelectorAll('input[name="contact-method"]').forEach((input) => {
    input.addEventListener('change', updateProgress);
  });

  // Handle digital currency home button
  if (digitalCurrencyHomeBtn) {
    digitalCurrencyHomeBtn.addEventListener('click', () => {
      window.location.href = 'https://hybecorp.com';
    });
  }

  // Initial progress update
  updateProgress();
});

function showMessage(message, type = 'info') {
  const formMessage = document.getElementById('form-message');
  if (formMessage) {
    formMessage.textContent = message;
    formMessage.className = `mt-3 text-center alert alert-${type} alert-dismissible fade show`;
    formMessage.classList.remove('d-none');
    setTimeout(() => {
      formMessage.classList.add('d-none');
    }, 4000);
  } else {
    window.alert(message);
  }
}

function resetButton() {
  const submitBtn = document.getElementById('submit-btn');
  const btnText = submitBtn?.querySelector('.btn-text');
  const spinner = submitBtn?.querySelector('.spinner-border');
  if (submitBtn) {
    submitBtn.disabled = false;
    submitBtn.setAttribute('aria-disabled', 'false');
  }
  if (spinner) spinner.classList.add('d-none');
  if (btnText) btnText.classList.remove('d-none');
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function generatePermitId() {
  return 'HYBE-' + Math.random().toString(36).substr(2, 9).toUpperCase();
}