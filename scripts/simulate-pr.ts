import crypto from "crypto";
import dotenv from "dotenv";

// Load environment variables from .env.local
dotenv.config({ path: ".env.local" });

const GITHUB_WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

if (!GITHUB_WEBHOOK_SECRET) {
  console.error("❌ GITHUB_WEBHOOK_SECRET is missing from .env.local");
  process.exit(1);
}

// Dummy PR URL to test with (can be changed to any public PR)
const prUrl = process.argv[2] || "https://github.com/facebook/react/pull/31604";

// Construct the minimal payload expected by the webhook
const payload = JSON.stringify({
  action: "opened",
  pull_request: {
    html_url: prUrl,
  },
});

// Generate the HMAC signature
const signature = crypto
  .createHmac("sha256", GITHUB_WEBHOOK_SECRET)
  .update(payload)
  .digest("hex");

console.log(`🚀 Simulating PR Webhook...`);
console.log(`URL: ${prUrl}`);
console.log(`Target: ${APP_URL}/api/webhook`);

fetch(`${APP_URL}/api/webhook`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-github-event": "pull_request",
    "x-hub-signature-256": `sha256=${signature}`,
  },
  body: payload,
})
  .then(async (res) => {
    const data = await res.json().catch(() => null);
    if (res.ok) {
      console.log(`✅ Success! Response:`, data);
      console.log(`To view progress, check the dashboard or the Next.js server logs.`);
    } else {
      console.error(`❌ Failed (${res.status}):`, data);
    }
  })
  .catch((err) => {
    console.error(`❌ Network error:`, err);
  });
