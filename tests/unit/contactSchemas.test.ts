import { contactSchema, clientContactSchema } from "@/lib/contactSchemas";

describe("contactSchema (server-side)", () => {
  const validInput = {
    name: "יוסי כהן",
    email: "test@example.com",
    message: "הודעה טובה מאוד שמכילה מספיק תווים",
  };

  // ── Valid cases ──

  it("accepts valid input", () => {
    const result = contactSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it("accepts valid input with empty honeypot", () => {
    const result = contactSchema.safeParse({ ...validInput, honeypot: "" });
    expect(result.success).toBe(true);
  });

  it("accepts valid input without honeypot field", () => {
    const result = contactSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it("trims whitespace from all fields", () => {
    const result = contactSchema.safeParse({
      name: "  יוסי כהן  ",
      email: "  test@example.com  ",
      message: "  הודעה טובה מאוד מספיק  ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("יוסי כהן");
      expect(result.data.email).toBe("test@example.com");
      expect(result.data.message).toBe("הודעה טובה מאוד מספיק");
    }
  });

  it("accepts name at min boundary (2 chars)", () => {
    const result = contactSchema.safeParse({
      ...validInput,
      name: "אב",
    });
    expect(result.success).toBe(true);
  });

  it("accepts name at max boundary (50 chars)", () => {
    const result = contactSchema.safeParse({
      ...validInput,
      name: "א".repeat(50),
    });
    expect(result.success).toBe(true);
  });

  it("accepts message at min boundary (10 chars)", () => {
    const result = contactSchema.safeParse({
      ...validInput,
      message: "א".repeat(10),
    });
    expect(result.success).toBe(true);
  });

  it("accepts message at max boundary (1000 chars)", () => {
    const result = contactSchema.safeParse({
      ...validInput,
      message: "א".repeat(1000),
    });
    expect(result.success).toBe(true);
  });

  // ── Invalid cases ──

  it("rejects name below min (1 char)", () => {
    const result = contactSchema.safeParse({ ...validInput, name: "א" });
    expect(result.success).toBe(false);
  });

  it("rejects name above max (51 chars)", () => {
    const result = contactSchema.safeParse({
      ...validInput,
      name: "א".repeat(51),
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty name", () => {
    const result = contactSchema.safeParse({ ...validInput, name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects whitespace-only name", () => {
    const result = contactSchema.safeParse({ ...validInput, name: "     " });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email", () => {
    const result = contactSchema.safeParse({
      ...validInput,
      email: "notanemail",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty email", () => {
    const result = contactSchema.safeParse({ ...validInput, email: "" });
    expect(result.success).toBe(false);
  });

  it("rejects message below min (9 chars)", () => {
    const result = contactSchema.safeParse({
      ...validInput,
      message: "א".repeat(9),
    });
    expect(result.success).toBe(false);
  });

  it("rejects message above max (1001 chars)", () => {
    const result = contactSchema.safeParse({
      ...validInput,
      message: "א".repeat(1001),
    });
    expect(result.success).toBe(false);
  });

  it("rejects whitespace-only message", () => {
    const result = contactSchema.safeParse({
      ...validInput,
      message: "          ",
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-empty honeypot (bot detection)", () => {
    const result = contactSchema.safeParse({
      ...validInput,
      honeypot: "i-am-a-bot",
    });
    expect(result.success).toBe(false);
  });
});

describe("clientContactSchema", () => {
  const validInput = {
    name: "יוסי כהן",
    email: "test@example.com",
    message: "הודעה טובה מאוד שמכילה מספיק תווים",
  };

  it("accepts valid input", () => {
    const result = clientContactSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it("strips unknown fields like honeypot", () => {
    const result = clientContactSchema.safeParse({
      ...validInput,
      honeypot: "bot-value",
    });
    // Zod strips unknown fields by default — should still pass
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).honeypot).toBeUndefined();
    }
  });

  it("rejects invalid email", () => {
    const result = clientContactSchema.safeParse({
      ...validInput,
      email: "bad",
    });
    expect(result.success).toBe(false);
  });
});
