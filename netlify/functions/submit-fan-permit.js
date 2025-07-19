exports.handler = async function(event) {
  try {
    const formData = new URLSearchParams(event.body);
    const data = Object.fromEntries(formData);
    // Process form data (e.g., save to database, send email, etc.)
    console.log('Form data:', data);

    return {
      statusCode: 200,
      headers: {
        'Set-Cookie': 'session=abc123; Secure; HttpOnly; Expires=Wed, 19 Jul 2026 17:26:00 GMT; Path=/',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message: 'Form processed successfully' })
    };
  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Server error' })
    };
  }
};
