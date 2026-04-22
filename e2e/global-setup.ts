import * as fs from "fs/promises";
import * as path from "path";

// Load .env.local so AUTH_SECRET is available without running Next.js
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const COOKIE_NAME = "authjs.session-token";

async function globalSetup() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set — check your .env.local");

  // Dynamically import after env is loaded
  const { encode } = await import("next-auth/jwt");

  const sessionToken = await encode({
    token: {
      name: "Test User",
      email: "test@playwright.local",
      picture: undefined,
      sub: "playwright-test-user",
      userId: "playwright-test-user",
    },
    secret,
    salt: COOKIE_NAME,
  });

  const authDir = path.join("e2e", ".auth");
  await fs.mkdir(authDir, { recursive: true });

  await fs.writeFile(
    path.join(authDir, "user.json"),
    JSON.stringify({
      cookies: [
        {
          name: COOKIE_NAME,
          value: sessionToken,
          domain: "localhost",
          path: "/",
          expires: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
          httpOnly: true,
          secure: false,
          sameSite: "Lax",
        },
      ],
      origins: [],
    }, null, 2)
  );
}

export default globalSetup;
