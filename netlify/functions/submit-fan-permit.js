exports.handler = async function(event) {
  try {
    // Parse form data from multipart or URL-encoded format
    let data = {};

    if (event.headers['content-type'] && event.headers['content-type'].includes('multipart/form-data')) {
      // Handle multipart form data
      const formidable = require('formidable-serverless');
      const { fields } = await new Promise((resolve, reject) => {
        const form = new formidable.IncomingForm();
        form.parse({ body: event.body, headers: event.headers }, (err, fields, files) => {
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

    // Extract unique ID and timestamp
    const submissionId = data['submission-id'] || data['permit-id'];
    const timestamp = data['submission-timestamp'] || new Date().toISOString();

    // Log detailed submission info
    console.log('HYBE Fan-Permit Submission Received:');
    console.log('Submission ID:', submissionId);
    console.log('Timestamp:', timestamp);
    console.log('User Info:', {
      name: data['full-name'],
      email: data['email'],
      country: data['country'],
      paymentMethod: data['payment-method']
    });
    console.log('Full form data:', data);

    return {
      statusCode: 200,
      headers: {
        'Set-Cookie': `hybe-submission=${submissionId}; Secure; HttpOnly; Expires=Wed, 19 Jul 2026 17:26:00 GMT; Path=/`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: 'Form processed successfully',
        submissionId: submissionId,
        timestamp: timestamp,
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
