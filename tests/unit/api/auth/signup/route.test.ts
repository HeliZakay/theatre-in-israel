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

jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn((data: any, init?: any) => ({
      json: async () => data,
      status: init?.status ?? 200,
    })),
  },
}));

import { POST } from "@/app/api/auth/signup/route";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

function createMockRequest(body: any) {
  return {
    json: jest.fn().mockResolvedValue(body),
    headers: new Headers({ "x-forwarded-for": "127.0.0.1" }),
  } as any;
}

describe("POST /api/auth/signup", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (prisma.user.create as jest.Mock).mockResolvedValue({
      id: "new-user-id",
      email: "test@test.com",
      name: "Test User",
    });
  });

  it("returns 400 for invalid email", async () => {
    const req = createMockRequest({ email: "invalid", password: "12345678" });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBeDefined();
  });

  it("returns 400 for short password", async () => {
    const req = createMockRequest({ email: "test@test.com", password: "12" });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBeDefined();
  });

  it("returns 400 for missing fields", async () => {
    const req = createMockRequest({});
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBeDefined();
  });

  it("returns 400 if user already exists (P2002)", async () => {
    const prismaError = new Error("Unique constraint failed") as Error & {
      code: string;
    };
    prismaError.code = "P2002";
    (prisma.user.create as jest.Mock).mockRejectedValue(prismaError);
    const req = createMockRequest({
      email: "test@test.com",
      password: "12345678",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("לא ניתן ליצור חשבון עם פרטים אלו");
  });

  it("creates user successfully", async () => {
    const req = createMockRequest({
      email: "test@test.com",
      password: "12345678",
      name: "Test User",
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
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
    const req = createMockRequest({
      email: "test@test.com",
      password: "12345678",
      name: "Test User",
    });
    const res = await POST(req);
    const data = await res.json();
    expect(data.user).toEqual({
      id: "new-user-id",
      email: "test@test.com",
      name: "Test User",
    });
    expect(data.user.password).toBeUndefined();
  });

  it("handles optional name field", async () => {
    (prisma.user.create as jest.Mock).mockResolvedValue({
      id: "new-user-id",
      email: "test@test.com",
      name: null,
    });
    const req = createMockRequest({
      email: "test@test.com",
      password: "12345678",
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: { email: "test@test.com", password: "hashed-password", name: null },
    });
  });

  it("returns 500 for unexpected errors", async () => {
    (prisma.user.create as jest.Mock).mockRejectedValue(new Error("DB error"));
    const req = createMockRequest({
      email: "test@test.com",
      password: "12345678",
      name: "Test User",
    });
    const res = await POST(req);
    expect(res.status).toBe(500);
  });
});
