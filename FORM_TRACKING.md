# HYBE Fan-Permit Form Tracking Documentation

## Form Fields Captured in Netlify Dashboard

### Unique Identification
- **submission-id**: Auto-generated unique ID (format: HYBE-[timestamp]-[random])
- **permit-id**: Same as submission-id for tracking
- **submission-timestamp**: ISO timestamp of submission

### Personal Information
- **full-name**: User's full name
- **email**: Email address
- **phone**: Phone number with country prefix
- **dob**: Date of birth
- **gender**: Selected gender

### Address Information
- **address-line1**: Primary address
- **address-line2**: Secondary address (optional)
- **city**: City name
- **state**: State/Province
- **postal-code**: ZIP/Postal code
- **country**: Selected country

### Preferences & Selections
- **branch**: Selected HYBE branch
- **group**: Selected K-pop group
- **artist**: Selected artist
- **language**: Interface language
- **referral-code**: Referral code (optional)

### Payment Information
- **payment-type**: Full payment or Installment
- **payment-method**: Card, Digital Currency, Bank Transfer, Mobile Money, or Cash
- **installment-plan**: Selected installment plan
- **amount**: Fixed amount ($1278.89USD/year)

### Contact & Communication
- **contact-method**: Email or SMS preference
- **feedback**: Optional user feedback

### Agreements & Terms
- **privacy-policy**: Privacy policy acceptance
- **subscription-agreement**: Subscription terms acceptance
- **installment-terms**: Installment terms acceptance (if applicable)

### Technical Metadata
- **form-name**: "subscription-form" (Netlify identifier)
- **user-agent**: Browser information
- **screen-resolution**: User's screen resolution
- **referrer**: How user arrived at the form
- **currency**: Currency setting (default: USD)

## Unique ID Generation

Each form submission generates a unique ID in the format:
```
HYBE-[base36-timestamp]-[random-string]
```

Example: `HYBE-LX8K7M2N-5R3W9Q2X4`

This ID is used to:
1. Track submissions in Netlify dashboard
2. Identify user data uniquely
3. Reference in customer support
4. Link payment transactions

## Netlify Form Dashboard

All captured data appears in your Netlify dashboard under:
- **Site Name** → Forms → subscription-form
- Each submission shows all field data
- Searchable by submission-id or email
- Exportable to CSV/Excel

## Data Validation

### Required Fields
- full-name
- email
- country
- dob
- gender
- branch
- group
- artist
- payment-type
- payment-method
- privacy-policy (must be checked)
- subscription-agreement (must be checked)

### Format Validation
- **Email**: Standard email format validation
- **Phone**: International format with country prefix
- **Date**: ISO date format for date of birth
- **Submission ID**: Unique HYBE prefix format

## Submission Flow

1. User fills out form
2. Client-side validation runs
3. Unique ID generated
4. All fields compiled into FormData
5. Submitted to Netlify Forms (appears in dashboard)
6. Optionally submitted to custom function
7. User redirected based on payment method
8. Submission ID stored in session for success pages

## Debugging Form Submissions

Check browser console for:
- Generated Unique ID
- Netlify submission success/failure
- Function submission results
- Validation errors

All submissions are logged with their unique IDs for tracking.
