import { betterAuth } from "better-auth";
import { DatabaseSync } from "node:sqlite";
import path from "path";

const dbPath = path.resolve(process.cwd(), "backend/genzpocket.db");

export const auth = betterAuth({
  database: new DatabaseSync(dbPath),
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  secret: process.env.BETTER_AUTH_SECRET,
  emailAndPassword: { enabled: true },
  socialProviders: {
    ...(process.env.APPLE_CLIENT_ID && process.env.APPLE_CLIENT_SECRET ? {
      apple: {
        clientId: process.env.APPLE_CLIENT_ID,
        clientSecret: process.env.APPLE_CLIENT_SECRET,
      },
    } : {}),
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      },
    } : {}),
    ...(process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET ? {
      microsoft: {
        clientId: process.env.MICROSOFT_CLIENT_ID,
        clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
      },
    } : {}),
  },
});

