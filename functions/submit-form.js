const formidable = require("formidable");
const fetch = require("node-fetch");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  const { WEB3FORMS_KEY } = process.env;
  if (!WEB3FORMS_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: "Web3Forms key is missing" }) };
  }

  const form = new formidable.IncomingForm();
  try {
    const { fields, files } = await new Promise((resolve, reject) => {
      form.parse(event, (err, fields, files) => {
        if (err) reject(err);
        resolve({ fields, files });
      });
    });

    const formData = new FormData();
    // Append all fields (handle arrays correctly)
    for (const key in fields) {
      const value = Array.isArray(fields[key]) ? fields[key][0] : fields[key];
      formData.append(key, value);
    }
    // Append the selfie file if present
    if (files.selfie) {
      const file = files.selfie[0] || files.selfie; // Handle formidable v3/v2
      formData.append("selfie", {
        content: require("fs").createReadStream(file.filepath),
        name: file.originalFilename,
        type: file.mimetype,
      });
    }
    // Add Web3Forms access key
    formData.append("access_key", WEB3FORMS_KEY);

    const response = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      body: formData,
    });

    const result = await response.json();
    console.log("Web3Forms response:", result); // Debug log
    if (response.ok) {
      return { statusCode: 200, body: JSON.stringify({ message: "Form submitted successfully!" }) };
    } else {
      return { statusCode: response.status, body: JSON.stringify({ error: result.message || "Failed to submit to Web3Forms" }) };
    }
  } catch (error) {
    console.error("Form submission error:", error); // Debug log
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};