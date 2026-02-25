# Resend Domain Verification

Checklist to stop sending contact-form emails from `onboarding@resend.dev` and use your own domain instead.

- [ ] **Add DNS records** — In your domain provider, add the 4 records shown in Resend dashboard → Domains (DKIM TXT, MX, SPF TXT, DMARC TXT). Copy full values from Resend — they're truncated in the UI.
- [ ] **Verify in Resend** — Resend dashboard → Domains → "I've added the records". DNS propagation can take 5 min – 48 hours.
- [ ] **Update code** — In `src/app/contact/actions.ts` line 73, change `onboarding@resend.dev` to `contact@theatre-in-israel.co.il` (or whichever address you verified).
- [ ] **Deploy** — Commit, push, verify emails arrive from the new address.

> **Delete this file** once all steps are done.
