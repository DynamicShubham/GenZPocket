import { createAuthClient } from "better-auth/react";
import { jwtClient } from "better-auth/client/plugins";

const getBaseUrl = () => {
  if (typeof window !== "undefined") return window.location.origin;
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
};

export const authClient = createAuthClient({
  baseURL: getBaseUrl(),
  plugins: [jwtClient()],
});

export const { signIn, signUp, signOut, useSession } = authClient;
