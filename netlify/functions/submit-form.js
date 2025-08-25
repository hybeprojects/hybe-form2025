const formidable = require('formidable-serverless');

exports.handler = async function (event) {
  try {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: JSON.stringify({ message: 'Method Not Allowed' }) };
    }

    // Parse FormData
    const contentType = event.headers['content-type'];
    let formData = {};
    if (contentType.includes('multipart/form-data')) {
      const { fields } = await new Promise((resolve, reject) => {
        const form = new formidable.IncomingForm();
        form.parse({ body: event.body, headers: event.headers }, (err, fields, files) => {
          if (err) reject(err);
          resolve({ fields, files });
        });
      });
      formData = fields;
    } else {
      formData = JSON.parse(event.body);
    }

    console.log('Form Submission:', formData);

    // Forward to Netlify Forms
    const netlifyFormData = new URLSearchParams();
    Object.entries(formData).forEach(([key, value]) => {
      netlifyFormData.append(key, value);
    });
    netlifyFormData.append('form-name', 'subscription-form');

    await fetch('https://official-hybefanpermit.netlify.app/success', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: netlifyFormData.toString(),
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Form submitted successfully', data: formData }),
    };
  } catch (error) {
    console.error('Error processing form:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error processing form', error: error.message }),
    };
  }
};
