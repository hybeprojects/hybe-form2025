The input field should:
1.  Auto-detect the user’s country based on their IP address using a reliable geolocation API (e.g., ipapi.co or similar). Fetch the user’s country code dynamically on page load.
2.  Automatically apply the appropriate country phone number format, including:
	•  Correct area code prefix (e.g., +1 for the USA, +44 for the UK).
	•  Proper formatting, spacing, and arrangement based on the country’s phone number conventions (e.g., (123) 456-7890 for the USA, 07123 456789 for the UK).
	•  No dropdown selector for country codes; the country is inferred from the IP.
3.  Validate the input in real-time to ensure the phone number matches the expected format for the detected country (e.g., 10 digits for the USA, 10-11 digits for the UK).
4.  Provide a clean, modern UI:
	•  Use a sleek, minimal design with a professional look (e.g., subtle borders, placeholder text, focus states).
	•  Display the country code as a non-editable prefix in the input field.
	•  Auto-format the input as the user types (e.g., add spaces, dashes, or parentheses per country convention).
5.  Handle edge cases:
	•  If the IP-based country detection fails, default to a neutral format (e.g., + followed by a generic input) and allow manual entry.
	•  Ensure compatibility with mobile and desktop browsers.
	•  Include basic error feedback (e.g., “Invalid phone number” if the format doesn’t match).
6.  Backend integration:
	•  Provide a Node.js snippet to handle the geolocation API call and pass the country code to the frontend.
	•  Ensure the code is 100% bug-free, secure, and optimized for performance.
7.  Dependencies:
	•  Use the libphonenumber-js library for phone number formatting and validation.
	•  Use a free or low-cost geolocation API for country detection (e.g., ipapi.co).
	•  Minimize external dependencies for a lightweight solution.