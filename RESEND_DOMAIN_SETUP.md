# Resend Domain Verification — Setup Instructions

## Why?

Right now the contact form sends emails from `onboarding@resend.dev` (Resend's test sender).
This works but emails may land in spam. Verifying your domain lets you send from your own address
(e.g., `contact@yourdomain.com`), which improves deliverability.

## Steps

### 1. Add DNS records in your domain provider

Log in to your domain provider (GoDaddy, Namecheap, Cloudflare, etc.) and add these 4 records.
Copy the **full values** from the Resend dashboard (they're truncated in the UI — click to copy).

| #   | Type | Name               | Content (copy from Resend)                         | Priority |
| --- | ---- | ------------------ | -------------------------------------------------- | -------- |
| 1   | TXT  | resend.\_domainkey | p=MIGfMA...QIDAQAB (DKIM key)                      | —        |
| 2   | MX   | send               | feedback-smtp.us-east-1.amazonses.com (or similar) | 10       |
| 3   | TXT  | send               | v=spf1 include:amazonses.com ~all                  | —        |
| 4   | TXT  | \_dmarc            | v=DMARC1; p=none;                                  | —        |

### 2. Verify in Resend

1. Go to Resend dashboard → **Domains**
2. Click **"I've added the records"**
3. Wait for verification (5 min – 48 hours depending on DNS propagation)

### 3. Update the `from` address in code

Once verified, update `src/app/api/contact/route.ts` line 68:

**Before:**

```ts
from: "תיאטרון בישראל <onboarding@resend.dev>",
```

**After:**

```ts
from: "תיאטרון בישראל <contact@yourdomain.com>",
```

Replace `yourdomain.com` with your actual verified domain.

### 4. Commit & deploy

```bash
git add -A && git commit -m "chore: use verified domain for contact emails" && git push
```
