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
      // Check if Bootstrap is available
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
    // Also remove the modal instance from activeModals
    this.activeModals.delete(modalId);
  }
}

const modalManager = new ModalManager();

document.addEventListener('DOMContentLoaded', () => {
  // Initialize AOS animations (run once for performance)
  if (typeof AOS !== 'undefined') {
    AOS.init({ duration: 800, once: true });
  }

  // Form and modal DOM elements - with null checks
  const form = document.getElementById('subscription-form');
  const formMessage = document.getElementById('form-message');
  const referralCodeInput = document.getElementById('referral-code');
  const fullNameInput = document.getElementById('full-name');
  const emailInput = document.getElementById('email');
  const phoneInput = document.getElementById('phone');
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
  const countrySelect = document.getElementById('country-select');
  const countryInput = document.getElementById('country');
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

  // Show onboarding modal immediately
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

  /**
   * Updates the progress bar based on filled form fields
   * Also disables submit button if not all required fields are valid
   * Adds/removes aria-invalid on invalid fields for accessibility
   */
  function updateProgress() {
    if (!progressBar) return;
    const totalFields = 16;
    let filledFields = 0;

    // Helper function to safely check field values and set aria-invalid
    function checkField(fieldId, required = true) {
      const field = document.getElementById(fieldId);
      if (!field) return 0;
      const valid = field.value && (!required || field.value.trim() !== '');
      if (required) field.setAttribute('aria-invalid', valid ? 'false' : 'true');
      return valid ? 1 : 0;
    }

    // Count filled fields and set aria-invalid
    filledFields += referralCodeInput?.value ? 1 : 0;
    if (referralCodeInput) referralCodeInput.setAttribute('aria-invalid', referralCodeInput.value ? 'false' : 'true');
    filledFields += fullNameInput?.value ? 1 : 0;
    if (fullNameInput) fullNameInput.setAttribute('aria-invalid', fullNameInput.value ? 'false' : 'true');
    filledFields += emailInput?.value ? 1 : 0;
    if (emailInput) emailInput.setAttribute('aria-invalid', emailInput.value ? 'false' : 'true');
    filledFields += phoneInput?.value ? 1 : 0;
    if (phoneInput) phoneInput.setAttribute('aria-invalid', phoneInput.value ? 'false' : 'true');
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
    // Set aria-invalid for contact method group
    document.querySelectorAll('input[name="contact-method"]').forEach((input) => {
      input.setAttribute('aria-invalid', contactMethodChecked ? 'false' : 'true');
    });

    const progress = (filledFields / totalFields) * 100;
    progressBar.style.width = `${progress}%`;
    progressBar.setAttribute('aria-valuenow', progress);

    // Disable submit button if not all required fields are filled
    if (submitBtn) {
      submitBtn.disabled = filledFields < totalFields;
      submitBtn.setAttribute('aria-disabled', submitBtn.disabled ? 'true' : 'false');
    }
  }

  // Add aria-invalid to fields
  function setAriaInvalid(field, invalid) {
    if (field) field.setAttribute('aria-invalid', invalid ? 'true' : 'false');
  }

  // Update setPhoneValidity to set aria-invalid
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

  // Add similar aria-invalid logic for other fields in validation
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Disable submit button and show loading
    if (submitBtn) {
      submitBtn.disabled = true;
      if (spinner) {
        spinner.classList.remove('d-none');
      }
      if (btnText) {
        btnText.classList.add('d-none');
      }
    }
    
    if (formMessage) {
      formMessage.classList.add('d-none');
    }

    try {
      // Basic form validation
      if (!form.checkValidity()) {
        form.classList.add('was-validated');
        showMessage('Please fill out all required fields correctly.', 'danger');
        resetButton();
        return;
      }

      // Contact method validation
      const contactMethods = document.querySelectorAll('input[name="contact-method"]');
      const oneChecked = Array.from(contactMethods).some((el) => el.checked);
      if (!oneChecked) {
        showMessage('Please select at least one preferred contact method.', 'danger');
        resetButton();
        return;
      }

      // Referral code validation
      if (!referralCodeInput || referralCodeInput.value !== 'HYBE2025') {
        showMessage('Invalid referral code. Use HYBE2025.', 'danger');
        setAriaInvalid(referralCodeInput, true);
        resetButton();
        return;
      } else {
        setAriaInvalid(referralCodeInput, false);
      }

      // Email validation
      if (!emailInput || !emailRegex.test(emailInput.value)) {
        showMessage('Invalid email address.', 'danger');
        setAriaInvalid(emailInput, true);
        resetButton();
        return;
      } else {
        setAriaInvalid(emailInput, false);
      }

      // Phone validation
      let phoneValid = false;
      if (iti && typeof iti.isValidNumber === 'function') {
        phoneValid = iti.isValidNumber();
      } else if (phoneInput) {
        // Fallback: basic regex for international numbers
        phoneValid = /^\+?[0-9\s\-()]{7,20}$/.test(phoneInput.value.trim());
      }
      if (!phoneValid) {
        showMessage('Invalid phone number.', 'danger');
        setPhoneValidity(false);
        setAriaInvalid(phoneInput, true);
        resetButton();
        return;
      }
      setPhoneValidity(true);
      setAriaInvalid(phoneInput, false);
      
      // Store E.164 format if available
      if (iti && typeof iti.getNumber === 'function') {
        phoneInput.value = iti.getNumber();
      }

      // Date of birth validation
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
      } else {
        setAriaInvalid(dobInput, false);
      }

      // Age validation
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

      // Checkbox validations
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
      } else {
        setAriaInvalid(subscriptionAgreement, false);
      }

      // Generate IDs
      if (permitIdInput) {
        permitIdInput.value = generatePermitId();
      }
      if (submissionIdInput) {
        submissionIdInput.value = `SUB-${Date.now()}`;
      }

      // Show validation modal with countdown
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
                    // Redirect to Stripe payment link
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

            // Log submission for analytics
            console.log(
              `Subscription submitted: ${submissionIdInput?.value || 'N/A'}, Artist: ${artistSelect?.value || 'N/A'}, Payment: ${paymentTypeSelect?.value || 'N/A'}`,
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

  // Initial progress update
  updateProgress();
});

// Define showMessage and resetButton if not already defined
function showMessage(message, type = 'info') {
  const alert = document.getElementById('form-alert');
  if (alert) {
    alert.textContent = message;
    alert.className = `alert alert-${type}`;
    alert.style.display = 'block';
    setTimeout(() => {
      alert.style.display = 'none';
    }, 4000);
  } else {
    // fallback: alert()
    window.alert(message);
  }
}

function resetButton() {
  const submitBtn = document.getElementById('submit-btn');
  if (submitBtn) {
    submitBtn.disabled = false;
    submitBtn.setAttribute('aria-disabled', 'false');
  }
}

// Define emailRegex if not already defined
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Ensure iti is defined (for intl-tel-input)
// If not already defined, fallback to null
window.iti = window.iti || null;
const iti = window.iti;

// Define or import generatePermitId if not already defined
function generatePermitId() {
  // Simple random ID generator (customize as needed)
  return 'HYBE-' + Math.random().toString(36).substr(2, 9).toUpperCase();
}