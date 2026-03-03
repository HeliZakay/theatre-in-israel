import { Resend } from "resend";
import { escapeHtml } from "@/utils/escapeHtml";

export const resend = new Resend(process.env.RESEND_API_KEY);

export const NOTIFICATION_RECIPIENT = "helizakay1@gmail.com";
const FROM_ADDRESS = "תיאטרון בישראל <onboarding@resend.dev>";

const isProduction = process.env.NODE_ENV === "production";

export async function notifyUserSignup({
  email,
  name,
}: {
  email: string;
  name?: string | null;
}): Promise<void> {
  if (!isProduction) return;
  try {
    const safeEmail = escapeHtml(email);
    const safeName = name ? escapeHtml(name) : "לא צוין";

    await resend.emails.send({
      from: FROM_ADDRESS,
      to: NOTIFICATION_RECIPIENT,
      subject: `משתמש/ת חדש/ה נרשם/ה — ${email}`,
      html: `
        <div dir="rtl" style="font-family: sans-serif; line-height: 1.6;">
          <h2>הרשמה חדשה 🎭</h2>
          <p><strong>אימייל:</strong> ${safeEmail}</p>
          <p><strong>שם:</strong> ${safeName}</p>
          <p><strong>זמן:</strong> ${new Date().toLocaleString("he-IL", { timeZone: "Asia/Jerusalem" })}</p>
        </div>
      `,
    });
  } catch (error) {
    console.error("[email] Failed to send signup notification:", error);
  }
}

export async function notifyNewReview({
  authorName,
  showTitle,
  rating,
  title,
  text,
  isAnonymous,
}: {
  authorName: string;
  showTitle: string;
  rating: number;
  title?: string | null;
  text: string;
  isAnonymous: boolean;
}): Promise<void> {
  if (!isProduction) return;
  try {
    const safeAuthor = escapeHtml(authorName);
    const safeShowTitle = escapeHtml(showTitle);
    const safeTitle = title ? escapeHtml(title) : "";
    const safeText = escapeHtml(text);
    const stars = "⭐".repeat(rating);
    const type = isAnonymous ? "אנונימית" : "מחובר/ת";

    await resend.emails.send({
      from: FROM_ADDRESS,
      to: NOTIFICATION_RECIPIENT,
      subject: `ביקורת חדשה — ${showTitle} (${rating}/5)`,
      html: `
        <div dir="rtl" style="font-family: sans-serif; line-height: 1.6;">
          <h2>ביקורת חדשה ${stars}</h2>
          <p><strong>הצגה:</strong> ${safeShowTitle}</p>
          <p><strong>מאת:</strong> ${safeAuthor} (${type})</p>
          <p><strong>דירוג:</strong> ${rating}/5</p>
          ${safeTitle ? `<p><strong>כותרת:</strong> ${safeTitle}</p>` : ""}
          <hr style="border: none; border-top: 1px solid #eee; margin: 16px 0;" />
          <p style="white-space: pre-wrap;">${safeText}</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 16px 0;" />
          <p style="color: #888; font-size: 0.85em;">${new Date().toLocaleString("he-IL", { timeZone: "Asia/Jerusalem" })}</p>
        </div>
      `,
    });
  } catch (error) {
    console.error("[email] Failed to send review notification:", error);
  }
}
