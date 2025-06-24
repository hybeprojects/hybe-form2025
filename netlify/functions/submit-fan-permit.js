// Netlify serverless function for handling fan permit form submissions
export async function handler(event, context) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    const data = JSON.parse(event.body);
    // TODO: Add validation, storage, or email logic here
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Submission received', data }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error' }),
    };
  }
}
