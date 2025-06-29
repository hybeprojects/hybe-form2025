The address field should:
1.  Auto-detect the user’s country based on their IP address using a reliable geolocation API (e.g., ipapi.co or similar). Fetch the user’s country code dynamically on page load.
2.  Dynamically adapt the address input fields to match the address format conventions of the detected country, including:
	•  Displaying only the relevant fields for the country (e.g., City, State, ZIP for the USA; City, County, Postcode for the UK; or Street, Postal Code, City for Germany).
	•  Proper field labels, placeholders, and arrangement based on the country’s standard address format.
	•  No dropdown selector for country; the country is inferred from the IP.
3.  Validate the input in real-time to ensure the address fields meet the country’s requirements, such as:
	•  Valid postal code formats (e.g., 5 digits for US ZIP, XXNN NXX for UK postcodes).
	•  Required fields based on country conventions (e.g., State is mandatory for the USA but not for the UK).
	•  Optional fields like “Apartment/Suite” for flexibility.
4.  Provide a clean, modern UI:
	•  Use a professional, minimal design with consistent styling (e.g., subtle borders, clear labels, focus states).
	•  Auto-format inputs where applicable (e.g., capitalize postal codes, enforce numeric input for ZIP codes).
	•  Group fields logically with a responsive layout (e.g., single-column on mobile, multi-column on desktop).
	•  Display the detected country as a non-editable prefix or label (e.g., “Country: United States”).
5.  Handle edge cases:
	•  If IP-based country detection fails, default to a generic address format (e.g., Street, City, Postal Code, Country) and allow manual country input if necessary.
	•  Support international characters (e.g., accents, non-Latin scripts) for global compatibility.
	•  Provide user-friendly error feedback (e.g., “Invalid postal code for this country” or “State is required”).
	•  Ensure compatibility across mobile and desktop browsers.