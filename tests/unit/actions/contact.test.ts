jest.mock("@/lib/prisma", () => ({
  __esModule: true,
  default: {
    contactMessage: { create: jest.fn() },
  },
}));
jest.mock("@/lib/email", () => ({
  resend: { emails: { send: jest.fn() } },
  NOTIFICATION_RECIPIENT: "test@example.com",
}));
jest.mock("@/utils/contactRateLimit");
jest.mock("@/utils/profanityFilter");
jest.mock("@/utils/escapeHtml", () => ({
  escapeHtml: jest.fn((s: string) => s),
}));
jest.mock("next/headers", () => ({
  headers: jest.fn(),
}));

import { sendContactMessage } from "@/app/contact/actions";
import { checkContactRateLimit } from "@/utils/contactRateLimit";
import { checkFieldsForProfanity } from "@/utils/profanityFilter";
import prisma from "@/lib/prisma";
import { resend } from "@/lib/email";
import { headers } from "next/headers";

const validInput = {
  name: "Test User",
  email: "test@example.com",
  message: "This is a valid contact message for testing purposes.",
};

describe("sendContactMessage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (headers as jest.Mock).mockResolvedValue({
      get: jest.fn().mockReturnValue("127.0.0.1"),
    });
    (checkContactRateLimit as jest.Mock).mockResolvedValue({ isLimited: false });
    (checkFieldsForProfanity as jest.Mock).mockReturnValue(null);
    (prisma.contactMessage.create as jest.Mock).mockResolvedValue({ id: 1 });
    (resend.emails.send as jest.Mock).mockResolvedValue({ id: "email-1" });
  });

  it("returns error when rate limited", async () => {
    (checkContactRateLimit as jest.Mock).mockResolvedValue({ isLimited: true });

    const result = await sendContactMessage(validInput);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("יותר מדי הודעות");
    }
    expect(prisma.contactMessage.create).not.toHaveBeenCalled();
  });

  it("returns error for invalid schema (missing name)", async () => {
    const result = await sendContactMessage({
      name: "",
      email: "test@example.com",
      message: "Valid message text here for testing.",
    });

    expect(result.success).toBe(false);
  });

  it("returns error for invalid email", async () => {
    const result = await sendContactMessage({
      ...validInput,
      email: "not-an-email",
    });

    expect(result.success).toBe(false);
  });

  it("returns silent success when honeypot is filled (bot trap)", async () => {
    const result = await sendContactMessage({
      ...validInput,
      honeypot: "bot filled this",
    });

    // Honeypot validation happens at schema level (max 0 chars)
    // so this should fail validation, not reach the honeypot check
    expect(result.success).toBe(false);
  });

  it("returns error when profanity detected in name", async () => {
    (checkFieldsForProfanity as jest.Mock).mockReturnValue("name");

    const result = await sendContactMessage(validInput);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("שם");
      expect(result.error).toContain("לא הולם");
    }
    expect(prisma.contactMessage.create).not.toHaveBeenCalled();
  });

  it("returns error when profanity detected in message", async () => {
    (checkFieldsForProfanity as jest.Mock).mockReturnValue("message");

    const result = await sendContactMessage(validInput);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("הודעה");
      expect(result.error).toContain("לא הולם");
    }
  });

  it("creates DB record and sends email on success", async () => {
    const result = await sendContactMessage(validInput);

    expect(result.success).toBe(true);
    expect(prisma.contactMessage.create).toHaveBeenCalledWith({
      data: {
        name: validInput.name,
        email: validInput.email,
        message: validInput.message,
      },
    });
    expect(resend.emails.send).toHaveBeenCalledTimes(1);
  });

  it("returns internal error when DB fails", async () => {
    (prisma.contactMessage.create as jest.Mock).mockRejectedValue(new Error("DB down"));

    const result = await sendContactMessage(validInput);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("שגיאה");
    }
  });

  it("returns internal error when email send fails", async () => {
    (resend.emails.send as jest.Mock).mockRejectedValue(new Error("Email service down"));

    const result = await sendContactMessage(validInput);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("שגיאה");
    }
  });
});
