jest.mock("@/lib/prisma", () => ({
  __esModule: true,
  default: {},
}));
jest.mock("@/lib/auth", () => ({ authOptions: {} }));

import { getServerSession } from "next-auth";
import { requireActionAuth } from "@/utils/actionAuth";

jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));

const mockedGetServerSession = getServerSession as jest.MockedFunction<
  typeof getServerSession
>;

const mockSession = {
  user: { id: "user-123", name: "Test User", email: "test@test.com" },
  expires: "2099-01-01",
};

describe("requireActionAuth", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns error when session is null", async () => {
    mockedGetServerSession.mockResolvedValue(null);

    const result = await requireActionAuth("יש להתחבר");

    expect(result.error).toEqual({ success: false, error: "יש להתחבר" });
    expect(result.session).toBeUndefined();
  });

  it("returns session when authenticated and no rate limit config", async () => {
    mockedGetServerSession.mockResolvedValue(mockSession);

    const result = await requireActionAuth("יש להתחבר");

    expect(result.session).toEqual(mockSession);
    expect(result.error).toBeUndefined();
  });

  it("returns session when authenticated and rate limit allows", async () => {
    mockedGetServerSession.mockResolvedValue(mockSession);

    const mockCheck = jest.fn().mockResolvedValue({ isLimited: false });
    const mockMessage = jest.fn();

    const result = await requireActionAuth("יש להתחבר", {
      check: mockCheck,
      message: mockMessage,
    });

    expect(mockCheck).toHaveBeenCalledWith("user-123");
    expect(mockMessage).not.toHaveBeenCalled();
    expect(result.session).toEqual(mockSession);
    expect(result.error).toBeUndefined();
  });

  it("returns error when rate limited", async () => {
    mockedGetServerSession.mockResolvedValue(mockSession);

    const mockCheck = jest
      .fn()
      .mockResolvedValue({ isLimited: true, remainingTime: 30 });
    const mockMessage = jest.fn().mockReturnValue("נא להמתין 30 שניות");

    const result = await requireActionAuth("יש להתחבר", {
      check: mockCheck,
      message: mockMessage,
    });

    expect(mockCheck).toHaveBeenCalledWith("user-123");
    expect(mockMessage).toHaveBeenCalledWith(30);
    expect(result.error).toEqual({
      success: false,
      error: "נא להמתין 30 שניות",
    });
    expect(result.session).toBeUndefined();
  });
});
