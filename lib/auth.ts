import { betterAuth } from "better-auth";
import { jwt } from "better-auth/plugins";
import { Pool } from "pg";

export const auth = betterAuth({
  database: new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  }),
  baseURL: process.env.BETTER_AUTH_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"),
  secret: process.env.BETTER_AUTH_SECRET,
  emailAndPassword: { enabled: true },
  plugins: [
    jwt({
      jwt: {
        expirationTime: "1h",
        definePayload: ({ user }) => ({
          sub: user.id,
          email: user.email,
          name: user.name,
        }),
      },
    }),
  ],
  socialProviders: {
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      },
    } : {}),
  },
});
