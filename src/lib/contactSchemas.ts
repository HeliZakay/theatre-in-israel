import { z } from "zod";
import {
  CONTACT_NAME_MIN,
  CONTACT_NAME_MAX,
  CONTACT_MESSAGE_MIN,
  CONTACT_MESSAGE_MAX,
} from "@/constants/contactValidation";

const nameField = z
  .string()
  .trim()
  .min(CONTACT_NAME_MIN, `שם חייב להכיל לפחות ${CONTACT_NAME_MIN} תווים`)
  .max(CONTACT_NAME_MAX, `שם יכול להכיל עד ${CONTACT_NAME_MAX} תווים`);

const emailField = z.string().trim().email("כתובת אימייל לא תקינה");

const messageField = z
  .string()
  .trim()
  .min(
    CONTACT_MESSAGE_MIN,
    `הודעה חייבת להכיל לפחות ${CONTACT_MESSAGE_MIN} תווים`,
  )
  .max(
    CONTACT_MESSAGE_MAX,
    `הודעה יכולה להכיל עד ${CONTACT_MESSAGE_MAX} תווים`,
  );

/**
 * Server-side schema for POST /api/contact.
 * Includes honeypot field that must be empty.
 */
export const contactSchema = z.object({
  name: nameField,
  email: emailField,
  message: messageField,
  honeypot: z.string().max(0).optional(),
});

/**
 * Client-side schema for the contact form (no honeypot check needed client-side).
 */
export const clientContactSchema = z.object({
  name: nameField,
  email: emailField,
  message: messageField,
});

export type ContactInput = z.infer<typeof contactSchema>;
