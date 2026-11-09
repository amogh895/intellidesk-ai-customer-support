import { useState, useCallback } from "react";
import { API_URL } from "../config";

export function useApi(authToken, onAuthError) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const request = useCallback(
    async (endpoint, options = {}, retries = 2) => {
      setIsLoading(true);
      setError(null);

      const url = endpoint.startsWith("http") ? endpoint : `${API_URL}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

      const headers = {
        "Content-Type": "application/json",
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        ...(options.headers || {})
      };

      let attempt = 0;
      while (attempt <= retries) {
        try {
          const res = await fetch(url, {
            ...options,
            headers
          });

          if (res.status === 401 || res.status === 403) {
            const errData = await res.json().catch(() => ({ detail: "Unauthorized access" }));
            if (onAuthError) {
              onAuthError(errData.detail || "Authentication required. Please log in again.", res.status);
            }
            throw new Error(errData.detail || `Access Denied (${res.status})`);
          }

          if (!res.ok) {
            const errBody = await res.json().catch(() => ({ detail: `HTTP ${res.status}` }));
            throw new Error(errBody.detail || `Request failed with status ${res.status}`);
          }

          const data = await res.json();
          setIsLoading(false);
          return data;
        } catch (err) {
          attempt++;
          if (attempt > retries) {
            setError(err.message || "Backend network error");
            setIsLoading(false);
            throw err;
          }
          // Exponential backoff delay: 300ms, 600ms
          await new Promise((resolve) => setTimeout(resolve, attempt * 300));
        }
      }
    },
    [authToken, onAuthError]
  );

  return { request, isLoading, error, clearError: () => setError(null) };
}

export default useApi;
