const { getDatabase } = require('../../lib/database');

exports.handler = async function(event) {
  try {
    // Parse form data from multipart or URL-encoded format
    let data = {};

    if (event.headers['content-type'] && event.headers['content-type'].includes('multipart/form-data')) {
      // Handle multipart form data
      const formidable = require('formidable-serverless');
      const { fields } = await new Promise((resolve, reject) => {
        const form = new formidable.IncomingForm();
        form.parse(event, (err, fields, files) => {
          if (err) reject(err);
          resolve({ fields, files });
        });
      });
      data = fields;
    } else {
      // Handle URL-encoded form data
      const formData = new URLSearchParams(event.body);
      data = Object.fromEntries(formData);
    }

    const submissionId = data['submission-id'] || data['permit-id'];
    const ownerName = data['full-name'];
    const ownerEmail = data['email'];

    if (!submissionId || !ownerName || !ownerEmail) {
      return {
        statusCode: 400,
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
