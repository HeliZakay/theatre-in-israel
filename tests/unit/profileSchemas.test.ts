import { updateProfileSchema } from "@/lib/profileSchemas";

describe("updateProfileSchema", () => {
  // Valid names
  it("accepts a valid Hebrew name", () => {
    const result = updateProfileSchema.safeParse({ name: "יוסי כהן" });
    expect(result.success).toBe(true);
  });

  it("accepts a valid English name", () => {
    const result = updateProfileSchema.safeParse({ name: "John Doe" });
    expect(result.success).toBe(true);
  });

  it("accepts name with apostrophe", () => {
    const result = updateProfileSchema.safeParse({ name: "דני'אל" });
    expect(result.success).toBe(true);
  });

  it("accepts name with hyphen", () => {
    const result = updateProfileSchema.safeParse({ name: "אן-מרי" });
    expect(result.success).toBe(true);
  });

  it("accepts Arabic name", () => {
    const result = updateProfileSchema.safeParse({ name: "أحمد محمد" });
    expect(result.success).toBe(true);
  });

  it("trims whitespace", () => {
    const result = updateProfileSchema.safeParse({ name: "  יוסי כהן  " });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.name).toBe("יוסי כהן");
  });

  it("accepts name at max length boundary (20 chars)", () => {
    const result = updateProfileSchema.safeParse({ name: "א".repeat(20) });
    expect(result.success).toBe(true);
  });

  it("accepts name at min length boundary (2 chars)", () => {
    const result = updateProfileSchema.safeParse({ name: "אב" });
    expect(result.success).toBe(true);
  });

  // Invalid names
  it("rejects empty name", () => {
    const result = updateProfileSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects single character name", () => {
    const result = updateProfileSchema.safeParse({ name: "א" });
    expect(result.success).toBe(false);
  });

  it("rejects name exceeding max length (21 chars)", () => {
    const result = updateProfileSchema.safeParse({ name: "א".repeat(21) });
    expect(result.success).toBe(false);
  });

  it("rejects name with emojis", () => {
    const result = updateProfileSchema.safeParse({ name: "יוסי 😀" });
    expect(result.success).toBe(false);
  });

  it("rejects name with numbers", () => {
    const result = updateProfileSchema.safeParse({ name: "יוסי123" });
    expect(result.success).toBe(false);
  });

  it("rejects name with HTML tags", () => {
    const result = updateProfileSchema.safeParse({
      name: "<script>alert</script>",
    });
    expect(result.success).toBe(false);
  });

  it("rejects name with special characters", () => {
    const result = updateProfileSchema.safeParse({ name: "יוסי@כהן" });
    expect(result.success).toBe(false);
  });

  it("rejects name that is only whitespace", () => {
    const result = updateProfileSchema.safeParse({ name: "     " });
    expect(result.success).toBe(false);
  });

  it("rejects name with control characters", () => {
    const result = updateProfileSchema.safeParse({ name: "יוסי\x00כהן" });
    expect(result.success).toBe(false);
  });
});
