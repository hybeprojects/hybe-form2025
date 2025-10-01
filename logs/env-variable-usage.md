# Environment Variable Usage Report

This report details the environment variables used throughout the project, their purpose, and where they are located.

## Frontend (Vite - `import.meta.env`)

These variables are prefixed with `VITE_` to be exposed to the client-side code by the Vite build tool.

1.  **`VITE_SUPABASE_URL`**
    - **File:** `lib/supabaseClient.js`
    - **Purpose:** The URL for the Supabase project.

2.  **`VITE_SUPABASE_ANON_KEY`**
    - **File:** `lib/supabaseClient.js`
    - **Purpose:** The public "anonymous" key for interacting with the Supabase API.

3.  **`VITE_FORMSPREE_URL`**
    - **File:** `script.js`
    - **Purpose:** The URL endpoint for submitting the main subscription form to Formspree.

## Backend (Node.js - `process.env`)

These variables are used by the Express server (`server.js`).

1.  **`ALLOWED_ORIGINS`**
    - **File:** `server.js`
    - **Purpose:** A comma-separated list of URLs allowed to make requests to the server, used for CORS configuration.

2.  **`NODE_ENV`**
    - **File:** `server.js`
    - **Purpose:** The application environment (e.g., `production`, `development`). Used to enable or disable certain features, such as the `Strict-Transport-Security` header.

3.  **`PORT`**
    - **File:** `server.js`
    - **Purpose:** The port on which the Express server will listen. Defaults to `3000`.

4.  **`FORCE_HTTPS`**
    - **File:** `server.js`
    - **Purpose:** A flag to force the `Strict-Transport-Security` header even in non-production environments.

## Security Assessment

- **Secrets Management:** **PASS**. No hardcoded secrets (API keys, secret keys, etc.) were found in the repository. All sensitive information is correctly sourced from environment variables.
- **Recommendations:** None. The project follows best practices for managing secrets.
