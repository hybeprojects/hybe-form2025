const { getDatabase } = require('../../lib/database');
const { validateVerificationToken } = require('./verify-otp.js');
const { getSecurityHeaders } = require('../../lib/security');

exports.handler = async function(event) {
  const origin = event.headers.origin || event.headers.Origin;
  const headers = { ...getSecurityHeaders(origin), 'Content-Type': 'application/json' };

  try {
    // Parse form data from the event body
    let data;
    try {
      data = JSON.parse(event.body);
    } catch (error) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid request format. Expected JSON.' })
      };
    }

    // --- Email Verification Check ---
    const token = data['verification-token'];
    const ownerEmail = data['email'] ? data['email'].toLowerCase().trim() : undefined;

    if (!token) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'Forbidden. Email verification token is missing.' })
      };
    }

    const tokenValidation = validateVerificationToken(token);

    if (!tokenValidation.valid) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: `Forbidden. ${tokenValidation.error}` })
      };
    }

    if (tokenValidation.email.toLowerCase() !== ownerEmail) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'Forbidden. Email in token does not match form email.' })
      };
    }
    // --- End Email Verification Check ---

    const submissionId = data['submission-id'] || data['permit-id'];
    const ownerName = data['full-name'];

    if (!submissionId || !ownerName || !ownerEmail) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields: submission-id, full-name, email' })
      };
    }

    // Store submission in the database
    const database = getDatabase();
    await database.storeSubscription({
      subscription_id: submissionId,
      owner_name: ownerName,
      owner_email: ownerEmail,
      form_data: data
    });

    // Log detailed submission info
    console.log('HYBE Fan-Permit Submission Received and Stored:');
    console.log('Subscription ID:', submissionId);
    console.log('User Info:', {
      name: ownerName,
      email: ownerEmail,
      country: data['country'],
      paymentMethod: data['payment-method']
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: 'Form processed successfully and stored.',
        subscriptionId: submissionId,
        status: 'received'
      })
    };
  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Server error',
        message: error.message
      })
    };
  }
};
