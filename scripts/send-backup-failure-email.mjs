#!/usr/bin/env node
/**
 * Sends an email when the backup workflow fails. Called from the workflow's
 * `if: failure()` step. Mirrors the Resend pattern in send-events-report.mjs.
 */

import { Resend } from "resend";

const RECIPIENT = "helizakay1@gmail.com";
const FROM = "תיאטרון בישראל <onboarding@resend.dev>";

const apiKey = process.env.RESEND_API_KEY;
if (!apiKey) {
  console.error("RESEND_API_KEY not set; cannot send failure email.");
  process.exit(1);
}

const runUrl = process.env.RUN_URL || "(unknown)";
const resend = new Resend(apiKey);

await resend.emails.send({
  from: FROM,
  to: RECIPIENT,
  subject: "DB backup workflow FAILED",
  text:
    "The nightly database backup workflow failed.\n\n" +
    `Run: ${runUrl}\n\n` +
    "Investigate ASAP. Multiple consecutive failures put production data at risk " +
    "(Neon Free retains only 6 hours of point-in-time history).",
});

console.log("Failure email sent.");
