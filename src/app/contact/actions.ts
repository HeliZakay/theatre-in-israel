"use server";

import prisma from "@/lib/prisma";
import { contactSchema } from "@/lib/contactSchemas";
import { checkContactRateLimit } from "@/utils/rateLimitCheckers";
import { getClientIp } from "@/utils/getClientIp";
import { checkFieldsForProfanity } from "@/utils/profanityFilter";
import { escapeHtml } from "@/utils/escapeHtml";
import { headers } from "next/headers";
import {
  actionSuccess,
  actionError,
  INTERNAL_ERROR_MESSAGE,
  type ActionResult,
} from "@/types/actionResult";
import { resend, NOTIFICATION_RECIPIENT } from "@/lib/email";

export async function sendContactMessage(values: {
  name: string;
  email: string;
  message: string;
  honeypot?: string;
}): Promise<ActionResult<{ sent: boolean }>> {
  try {
    const headersList = await headers();
    const ip = getClientIp(headersList);

    const rateLimit = await checkContactRateLimit(ip);
    if (rateLimit.isLimited) {
      return actionError("יותר מדי הודעות. נס.י שוב מאוחר יותר.");
    }

    const result = contactSchema.safeParse(values);
    if (!result.success) {
      const firstError =
        result.error.issues[0]?.message ?? "חסרים פרטים נדרשים";
      return actionError(firstError);
    }

    const { name, email, message, honeypot } = result.data;

    // Silent rejection for bots: if honeypot is filled, pretend success
    if (honeypot) {
      return actionSuccess({ sent: true });
    }

    // Profanity check
    const profaneField = checkFieldsForProfanity({ name, message });
    if (profaneField) {
      const fieldNames: Record<string, string> = {
        name: "שם",
        message: "הודעה",
      };
      return actionError(
        `השדה "${fieldNames[profaneField] ?? profaneField}" מכיל תוכן לא הולם`,
      );
    }

    // Save to database
    await prisma.contactMessage.create({
      data: { name, email, message },
    });

    // Send email via Resend
    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safeMessage = escapeHtml(message);

    await resend.emails.send({
      from: "תיאטרון בישראל <onboarding@resend.dev>",
      to: NOTIFICATION_RECIPIENT,
      subject: `הודעה חדשה מטופס יצירת קשר — ${name}`,
      html: `
        <div dir="rtl" style="font-family: sans-serif; line-height: 1.6;">
          <h2>הודעה חדשה מטופס יצירת קשר</h2>
          <p><strong>שם:</strong> ${safeName}</p>
          <p><strong>אימייל:</strong> <a href="mailto:${safeEmail}">${safeEmail}</a></p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 16px 0;" />
          <p style="white-space: pre-wrap;">${safeMessage}</p>
        </div>
      `,
      replyTo: email,
    });

    return actionSuccess({ sent: true });
  } catch (error) {
    return actionError(INTERNAL_ERROR_MESSAGE, error);
  }
}
