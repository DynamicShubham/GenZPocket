import { API_BASE_URL } from "./config";
import { authClient } from "./auth-client";

/**
 * Authenticated fetch wrapper for the FastAPI backend.
 *
 * Uses Better Auth's JWT plugin to obtain a short-lived JWT token, then sends
 * it as a standard Authorization: Bearer header to the cross-origin FastAPI
 * backend. No cookie reading, no document.cookie hacks.
 */

// ── In-memory JWT cache ────────────────────────────────────────────────
let cachedToken: string | null = null;
let tokenExpiresAt = 0; // epoch ms

/**
 * Retrieve a valid JWT from the Better Auth server.
 * Caches the token in memory and refreshes it 60 seconds before expiry.
 */
async function getJwt(): Promise<string | null> {
  const now = Date.now();

  // Return cached token if still valid (with 60s buffer)
  if (cachedToken && tokenExpiresAt - now > 60_000) {
    return cachedToken;
  }

  try {
    // authClient.token() calls /api/auth/token which returns a fresh JWT
    const res = await authClient.token();

    if (res.data?.token) {
      cachedToken = res.data.token;

      // Decode the JWT payload to read the exp claim (base64url → JSON)
      try {
        const payloadB64 = cachedToken.split(".")[1];
        const payload = JSON.parse(atob(payloadB64));
        tokenExpiresAt = (payload.exp ?? 0) * 1000;
      } catch {
        // If we can't parse exp, cache for 50 minutes (conservative for 1h tokens)
        tokenExpiresAt = now + 50 * 60 * 1000;
      }

      return cachedToken;
    }
  } catch {
    // Token retrieval failed — user is likely not authenticated
  }

  // Clear stale cache
  cachedToken = null;
  tokenExpiresAt = 0;
  return null;
}

/**
 * Clear the cached JWT. Call this on sign-out.
 */
export function clearTokenCache(): void {
  cachedToken = null;
  tokenExpiresAt = 0;
}

/**
 * Wrapper around fetch() that automatically attaches a JWT Bearer token
 * when calling the FastAPI backend.
 */
export async function apiFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = `${API_BASE_URL}${path}`;
  const token = await getJwt();

  const headers: HeadersInit = {
    ...(options.headers || {}),
  };

  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }

  return fetch(url, {
    ...options,
    headers,
  });
}
