const rawApiUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL;

if (!rawApiUrl) {
  throw new Error(
    "Configuration Error: VITE_API_URL environment variable is missing. " +
    "Please define VITE_API_URL in your .env or hosting environment variables."
  );
}

// Remove trailing slash if present
export const API_URL = rawApiUrl.replace(/\/+$/, "");
export default API_URL;
