exports.handler = async (event) => {
    const { WEB3FORMS_KEY } = process.env;
  
    // Check if the environment variable is set
    if (!WEB3FORMS_KEY) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Web3Forms key is missing" }),
      };
    }
  
    // Parse the form data from the event
    const formData = new URLSearchParams(event.body);
  
    // Prepare data for Web3Forms (basic example)
    const web3FormData = new FormData();
    for (const [key, value] of formData) {
      web3FormData.append(key, value);
    }
  
    // Add the access_key for Web3Forms
    web3FormData.append("access_key", WEB3FORMS_KEY);
  
    try {
      // Send data to Web3Forms API (replace with actual endpoint if needed)
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        body: web3FormData,
      });
  
      if (!response.ok) {
        throw new Error("Failed to submit to Web3Forms");
      }
  
      const result = await response.json();
      return {
        statusCode: 200,
        body: JSON.stringify({ message: "Form submitted successfully", data: result }),
      };
    } catch (error) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: error.message }),
      };
    }
  };