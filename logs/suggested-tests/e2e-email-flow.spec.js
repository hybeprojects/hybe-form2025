// Playwright E2E test scaffold for HYBE Fan-Permit flow
// Prereqs: npm i -D @playwright/test dotenv mailosaur; npx playwright install
// Requires: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_FORMSPREE_URL, MAILOSAUR_API_KEY, MAILOSAUR_SERVER_ID

const { test, expect } = require('@playwright/test');
require('dotenv').config();

const MAILOSAUR_API_KEY = process.env.MAILOSAUR_API_KEY;
const MAILOSAUR_SERVER_ID = process.env.MAILOSAUR_SERVER_ID;
const mailosaur = new (require('mailosaur'))(MAILOSAUR_API_KEY);

const baseURL = 'http://localhost:5173';

test('user can verify email and submit successfully', async ({ page }) => {
  await page.goto(baseURL);
  await expect(page).toHaveTitle(/Official HYBE Fan-Permit Subscription Form/);

  const unique = Math.random().toString(36).slice(2);
  const testEmail = `${unique}@${MAILOSAUR_SERVER_ID}.mailosaur.net`;

  await page.fill('#referral-code', 'TESTCODE123');
  await page.fill('#full-name', 'Test User');
  await page.fill('#email', testEmail);
  await page.fill('#phone', '1234567890');
  await page.fill('#address-line1', '123 Test St');
  await page.fill('#city', 'Testville');
  await page.fill('#postal-code', '12345');
  await page.selectOption('#country-select', { label: 'United States' });
  await page.fill('#dob', '2000-01-01');
  await page.selectOption('#gender', 'Prefer Not to Say');
  await page.selectOption('#branch', 'BigHit Music');
  await page.selectOption('#group', 'BTS');
  await page.selectOption('#artist', 'Jung Kook');
  await page.selectOption('#payment-type', 'Full Payment');
  await page.check('input[name="payment-method"][value="Card Payment"]');
  await page.check('input[name="contact-method"][value="Via Email"]');
  await page.check('#privacy-policy');
  await page.check('#subscription-agreement');

  await page.click('#submit-btn');
  await expect(page.locator('#emailVerificationModal')).toBeVisible();
  await page.click('#send-otp-btn');
  await expect(page.locator('text=Verification Code Sent!')).toBeVisible();

  const email = await mailosaur.messages.get(MAILOSAUR_SERVER_ID, { sentTo: testEmail });
  const otp = (email.html.body.match(/(\d{6})/) || [])[1];
  expect(otp).toBeTruthy();

  await page.fill('#otp-input', otp);
  await expect(page.locator('#emailVerificationModal')).toBeHidden({ timeout: 10000 });

  await expect(page.locator('#digitalCurrencySuccessModal')).toBeVisible();
  await expect(page.locator('text=Form Submitted Successfully!')).toBeVisible();

  await page.waitForURL('**/success.html', { timeout: 15000 });
  await expect(page.locator('h1')).toHaveText('Submission Successful!');
});
