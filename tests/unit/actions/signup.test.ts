jest.mock("@/lib/prisma", () => ({
  __esModule: true,
  default: {
    user: {
      create: jest.fn(),
    },
  },
}));

jest.mock("bcryptjs", () => ({
  hash: jest.fn().mockResolvedValue("hashed-password"),
}));

jest.mock("@/utils/authRateLimit", () => ({
  checkSignupRateLimit: jest.fn().mockResolvedValue({ isLimited: false }),
}));

jest.mock("next/headers", () => ({
  headers: jest.fn().mockResolvedValue(
    new Map([["x-forwarded-for", "127.0.0.1"]]),
  ),
}));

import { signup } from "@/app/auth/signup/actions";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

describe("signup", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (prisma.user.create as jest.Mock).mockResolvedValue({
      id: "new-user-id",
      email: "test@test.com",
      name: "Test User",
    });
  });

  it("returns error for invalid email", async () => {
    const result = await signup({ email: "invalid", password: "12345678" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeDefined();
    }
  });

  it("returns error for short password", async () => {
    const result = await signup({ email: "test@test.com", password: "12" });
    expect(result.success).toBe(false);
  });

  it("returns error for missing fields", async () => {
    const result = await signup({ email: "", password: "" });
    expect(result.success).toBe(false);
  });

  it("returns error if user already exists (P2002)", async () => {
    const prismaError = new Error("Unique constraint failed") as Error & {
      code: string;
    };
    prismaError.code = "P2002";
    (prisma.user.create as jest.Mock).mockRejectedValue(prismaError);

    const result = await signup({
      email: "test@test.com",
      password: "12345678",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("לא ניתן ליצור חשבון עם פרטים אלו");
    }
  });

  it("creates user successfully", async () => {
    const result = await signup({
      email: "test@test.com",
      password: "12345678",
      name: "Test User",
    });

    expect(result.success).toBe(true);
    expect(bcrypt.hash).toHaveBeenCalledWith("12345678", 12);
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        email: "test@test.com",
        password: "hashed-password",
        name: "Test User",
      },
    });
  });

  it("returns user data without password", async () => {
    const result = await signup({
      email: "test@test.com",
      password: "12345678",
      name: "Test User",
    });

    if (result.success) {
      expect(result.data.user).toEqual({
        id: "new-user-id",
        email: "test@test.com",
        name: "Test User",
      });
    }
  });

  it("handles optional name field", async () => {
    (prisma.user.create as jest.Mock).mockResolvedValue({
      id: "new-user-id",
      email: "test@test.com",
      name: null,
    });

    const result = await signup({
      email: "test@test.com",
      password: "12345678",
    });

    expect(result.success).toBe(true);
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: { email: "test@test.com", password: "hashed-password", name: null },
    });
  });

  it("returns internal error for unexpected errors", async () => {
    (prisma.user.create as jest.Mock).mockRejectedValue(new Error("DB error"));

    const result = await signup({
      email: "test@test.com",
      password: "12345678",
      name: "Test User",
    });

    expect(result.success).toBe(false);
  });
});
