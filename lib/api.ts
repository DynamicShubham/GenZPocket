import { API_BASE_URL } from "./config";

/**
 * Authenticated fetch wrapper for the FastAPI backend.
 *
 * Better Auth sets a session cookie on the Next.js domain (e.g. genzpocket.vercel.app).
 * Since the FastAPI backend runs on a different domain (Railway), the browser
 * won't forward cookies cross-origin. Instead, we read the session token from
 * the cookie and pass it as an Authorization: Bearer header.
 */

function getSessionToken(): string | null {
  if (typeof document === "undefined") return null;

  const cookies = document.cookie.split(";");
  for (const cookie of cookies) {
    const [name, ...rest] = cookie.trim().split("=");
    if (
      name === "better-auth.session_token" ||
      name === "better-auth.session-token"
    ) {
      return decodeURIComponent(rest.join("="));
    }
  }
  return null;
}

/**
 * Wrapper around fetch() that automatically attaches the Better Auth
 * session token as a Bearer header when calling the FastAPI backend.
 */
export async function apiFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = `${API_BASE_URL}${path}`;
  const token = getSessionToken();

  const headers: HeadersInit = {
    ...(options.headers || {}),
  };

  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }

  return fetch(url, {
    ...options,
    headers,
    credentials: "include", // still send cookies as a fallback for same-origin dev
  });
}
