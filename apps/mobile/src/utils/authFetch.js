import { supabase } from "./supabase";
import { useAuthStore } from "./auth/store";
import { isTokenExpired } from "./auth/tokenUtils";

const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL || "";

async function getToken() {
  return useAuthStore.getState().auth?.jwt ?? null;
}

async function forceSignOut() {
  await supabase.auth.signOut().catch(() => {});
  useAuthStore.getState().setAuth(null);
}

function buildHeaders(token, options) {
  const isFormData = options.body instanceof FormData;
  const headers = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    "x-createxyz-project-group-id": process.env.EXPO_PUBLIC_PROJECT_GROUP_ID,
    "x-forwarded-host": process.env.EXPO_PUBLIC_HOST,
    ...(options.headers || {}),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

/**
 * Fetch with automatic authentication headers.
 * On a 401, refreshes the session once and retries.
 * If the retry also 401s, or if refresh fails, signs the user out.
 */
export async function authFetch(url, options = {}) {
  const fullUrl = url.startsWith("/") ? `${BASE_URL}${url}` : url;

  // First attempt with the current session token
  const token = await getToken();
  const requestHeaders = buildHeaders(token, options);
  const response = await fetch(fullUrl, {
    ...options,
    headers: requestHeaders,
  });

  if (response.status !== 401) {
    return response;
  }

  // 401 — attempt a token refresh then retry once
  // Use setSession (not refreshSession) so it works even when in-memory session is null
  const { data: { session: currentSession } } = await supabase.auth.getSession();

  if (!currentSession?.refresh_token) {
    console.warn("[authFetch] no refresh_token available, signing out");
    await forceSignOut();
    throw new Error("Session expired. Please sign in again.");
  }

  const { data: refreshed, error: refreshErr } = await supabase.auth.setSession({
    access_token: currentSession.access_token,
    refresh_token: currentSession.refresh_token,
  });

  if (refreshErr || !refreshed?.session) {
    console.warn("[authFetch] setSession failed, signing out:", refreshErr?.message ?? "no session returned");
    await forceSignOut();
    throw new Error("Session expired. Please sign in again.");
  }

  const freshToken = refreshed.session.access_token;
  if (freshToken === token && isTokenExpired(freshToken)) {
    console.warn("[authFetch] setSession returned same expired token — signing out");
    await forceSignOut();
    throw new Error("Session expired. Please sign in again.");
  }

  useAuthStore.getState().setAuth({ jwt: freshToken, user: refreshed.session.user });

  const retry = await fetch(fullUrl, {
    ...options,
    headers: buildHeaders(freshToken, options),
  });

  if (retry.status === 401) {
    console.warn("[authFetch] retry also 401, signing out");
    await forceSignOut();
    throw new Error("Session expired. Please sign in again.");
  }

  return retry;
}
