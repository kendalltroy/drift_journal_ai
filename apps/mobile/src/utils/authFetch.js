import { useAuthStore } from "./auth/store";

/**
 * Fetch with automatic authentication headers
 * Adds JWT token from auth store if available
 */
export async function authFetch(url, options = {}) {
  const { auth } = useAuthStore.getState();

  const isFormData = options.body instanceof FormData;
  const headers = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(options.headers || {}),
  };

  // Add JWT token if authenticated
  if (auth?.jwt) {
    headers["Authorization"] = `Bearer ${auth.jwt}`;
  }

  return fetch(url, {
    ...options,
    headers,
  });
}
