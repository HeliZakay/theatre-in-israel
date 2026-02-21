import prisma from "@/lib/prisma";
import { contactSchema } from "@/lib/contactSchemas";
import { checkContactRateLimit } from "@/utils/contactRateLimit";
import { checkFieldsForProfanity } from "@/utils/profanityFilter";
import { escapeHtml } from "@/utils/escapeHtml";
import {
  apiError,
  apiSuccess,
  INTERNAL_ERROR_MESSAGE,
} from "@/utils/apiResponse";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const CONTACT_RECIPIENT = "helizakay1@gmail.com";

export async function POST(request: Request) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "unknown";

    const rateLimit = await checkContactRateLimit(ip);
    if (rateLimit.isLimited) {
      return apiError("יותר מדי הודעות. נסו שוב מאוחר יותר.", 429);
    }

    const body = await request.json();

    const result = contactSchema.safeParse(body);
    if (!result.success) {
      const firstError =
        result.error.issues[0]?.message ?? "חסרים פרטים נדרשים";
      return apiError(firstError, 400);
    }

    const { name, email, message, honeypot } = result.data;

    // Silent rejection for bots: if honeypot is filled, pretend success
    if (honeypot) {
      return apiSuccess({ sent: true });
    }

    // Profanity check
    const profaneField = checkFieldsForProfanity({ name, message });
    if (profaneField) {
      const fieldNames: Record<string, string> = {
        name: "שם",
        message: "הודעה",
      };
      return apiError(
        `השדה "${fieldNames[profaneField] ?? profaneField}" מכיל תוכן לא הולם`,
        400,
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
      to: CONTACT_RECIPIENT,
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

    return apiSuccess({ sent: true });
  } catch (error) {
    return apiError(INTERNAL_ERROR_MESSAGE, 500, error);
  }
}
