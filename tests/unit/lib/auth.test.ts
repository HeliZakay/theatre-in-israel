jest.mock("@/lib/prisma", () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));

const redirectError = new Error("NEXT_REDIRECT");
jest.mock("next/navigation", () => ({
  redirect: jest.fn(() => {
    throw redirectError;
  }),
}));

jest.mock("next/headers", () => ({
  headers: jest.fn(() =>
    Promise.resolve(new Map([["x-forwarded-for", "127.0.0.1"]]))
  ),
}));

jest.mock(
  "@auth/prisma-adapter",
  () => ({
    PrismaAdapter: jest.fn(() => ({})),
  }),
  { virtual: true }
);

jest.mock("next-auth/providers/google", () => ({
  __esModule: true,
  default: jest.fn(() => ({ id: "google", name: "Google", type: "oauth" })),
}));

jest.mock("next-auth/providers/credentials", () => ({
  __esModule: true,
  default: jest.fn(() => ({
    id: "credentials",
    name: "credentials",
    type: "credentials",
  })),
}));

jest.mock("bcryptjs", () => ({
  compare: jest.fn(),
}));

jest.mock("@/utils/authRateLimit", () => ({
  checkLoginRateLimit: jest.fn(() =>
    Promise.resolve({ isLimited: false })
  ),
}));

jest.mock("@/constants/routes", () => ({
  __esModule: true,
  default: {
    AUTH_SIGNIN: "/auth/signin",
    AUTH_ERROR: "/auth/error",
  },
}));

import { authOptions, requireAuth } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";

describe("authOptions", () => {
  it("uses jwt session strategy", () => {
    expect(authOptions.session?.strategy).toBe("jwt");
  });

  it("has signIn page set to /auth/signin", () => {
    expect(authOptions.pages?.signIn).toBe("/auth/signin");
  });

  it("has providers defined", () => {
    expect(authOptions.providers.length).toBeGreaterThanOrEqual(2);
  });
});

describe("authOptions.callbacks.session", () => {
  it("adds user.id from token.sub", async () => {
    const session = { user: {} } as any;
    const token = { sub: "user-123" } as any;
    const result = await authOptions.callbacks!.session!({
      session,
      token,
      trigger: "update",
      newSession: undefined,
    } as any);
    expect((result as any).user.id).toBe("user-123");
  });
});

describe("authOptions.callbacks.jwt", () => {
  it("sets token.sub from user.id on login", async () => {
    const token = {} as any;
    const user = { id: "user-456" } as any;
    const result = await authOptions.callbacks!.jwt!({
      token,
      user,
      trigger: undefined,
      session: undefined,
      account: null,
    } as any);
    expect(result.sub).toBe("user-456");
  });

  it("updates token.name on trigger='update'", async () => {
    const token = { name: "old" } as any;
    const result = await authOptions.callbacks!.jwt!({
      token,
      user: undefined as any,
      trigger: "update",
      session: { name: "new-name" },
      account: null,
    } as any);
    expect(result.name).toBe("new-name");
  });
});

describe("requireAuth", () => {
  beforeEach(() => jest.clearAllMocks());

  it("redirects when no session", async () => {
    jest.mocked(getServerSession).mockResolvedValue(null);
    await expect(requireAuth("/test")).rejects.toThrow("NEXT_REDIRECT");
    expect(redirect).toHaveBeenCalledWith(
      expect.stringContaining("/auth/signin")
    );
  });

  it("redirects when user not found in DB", async () => {
    jest
      .mocked(getServerSession)
      .mockResolvedValue({ user: { id: "u1" } } as any);
    jest.mocked(prisma.user.findUnique).mockResolvedValue(null);
    await expect(requireAuth("/test")).rejects.toThrow("NEXT_REDIRECT");
    expect(redirect).toHaveBeenCalled();
  });

  it("returns session when authenticated and user exists", async () => {
    jest
      .mocked(getServerSession)
      .mockResolvedValue({ user: { id: "u1" } } as any);
    jest
      .mocked(prisma.user.findUnique)
      .mockResolvedValue({ id: "u1" } as any);
    const result = await requireAuth("/test");
    expect(result.user.id).toBe("u1");
  });
});
