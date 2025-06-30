// Cypress E2E test for HYBE Fan-Permit form
// To run: npx cypress open

describe('HYBE Fan-Permit Form E2E', () => {
  beforeEach(() => {
    // Mock the ipwho.is API to always return a successful response
    cy.intercept('GET', 'https://ipwho.is/', {
      statusCode: 200,
      body: {
        country_code: 'KR',
        city: 'Seoul',
        region: 'Seoul',
        postal: '12345'
      }
    }).as('geoip');
    cy.visit('http://localhost:3000/');
    // If a global error modal appears, close it
    cy.get('body').then($body => {
      if ($body.find('#globalErrorModal').length) {
        cy.get('#globalErrorModal').then($modal => {
          if ($modal.is(':visible')) {
            cy.get('#globalErrorModal button[data-bs-dismiss="modal"]').click({ force: true });
            cy.get('#globalErrorModal').should('not.be.visible');
          }
        });
      }
    });
    // Always close onboarding modal and wait for it to be hidden
    cy.get('#onboardingModal button[data-bs-dismiss="modal"]').click();
    cy.get('#onboardingModal').should('not.be.visible');
  });

  it('Onboarding modal appears and closes', () => {
    cy.get('#onboardingModal').should('be.visible');
    cy.get('#onboardingModal button[data-bs-dismiss="modal"]').click();
    cy.get('#onboardingModal').should('not.be.visible');
  });

  it('Form validation and progress bar', () => {
    cy.get('#referral-code').type('REF123');
    cy.get('#full-name').type('Test User');
    cy.get('#email').type('test@example.com');
    cy.get('#phone').type('1234567890');
    cy.get('#address-line1').type('123 Main St');
    cy.get('#city').type('Seoul');
    cy.get('#postal-code').type('12345');
    cy.get('#country-select').select('South Korea');
    cy.get('#dob').type('2000-01-01');
    cy.get('#gender').select('Male');
    cy.get('#branch').select('BigHit Music');
    cy.get('#group').select('BTS');
    cy.get('#artist').select('RM');
    cy.get('#payment-type').select('Full Payment');
    cy.get('#card-payment').check();
    cy.get('#email-contact').check();
    cy.get('#privacy-policy').check();
    cy.get('#subscription-agreement').check();
    cy.get('.progress-bar').invoke('attr', 'style').should('contain', 'width:');
  });

  it('Shows error for invalid email', () => {
    cy.get('#email').type('invalid-email');
    cy.get('#submit-btn').click();
    cy.get('#email-error').should('be.visible');
  });

  it('Shows error for invalid phone', () => {
    cy.get('#phone').type('abc');
    cy.get('#submit-btn').click();
    cy.get('#phone-error').should('be.visible');
  });

  it('Shows loading modal and redirects on payment', () => {
    cy.get('#referral-code').type('REF123');
    cy.get('#full-name').type('Test User');
    cy.get('#email').type('test@example.com');
    cy.get('#phone').type('1234567890');
    cy.get('#address-line1').type('123 Main St');
    cy.get('#city').type('Seoul');
    cy.get('#postal-code').type('12345');
    cy.get('#country-select').select('South Korea');
    cy.get('#dob').type('2000-01-01');
    cy.get('#gender').select('Male');
    cy.get('#branch').select('BigHit Music');
    cy.get('#group').select('BTS');
    cy.get('#artist').select('RM');
    cy.get('#payment-type').select('Full Payment');
    cy.get('#card-payment').check();
    cy.get('#email-contact').check();
    cy.get('#privacy-policy').check();
    cy.get('#subscription-agreement').check();
    cy.get('#submit-btn').click();
    cy.get('#loadingRedirectModal').should('be.visible');
  });
});
