jest.mock("@/lib/prisma", () => ({
  __esModule: true,
  default: {},
}));
jest.mock("@/lib/auth", () => ({ authOptions: {} }));
jest.mock("@/utils/actionAuth");
jest.mock("@/lib/watchlist");
jest.mock("@/utils/rateLimitCheckers");
jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

import {
  addToWatchlistAction,
  removeFromWatchlistAction,
} from "@/lib/watchlistActions";
import { requireActionAuth } from "@/utils/actionAuth";
import { addToWatchlist, removeFromWatchlist } from "@/lib/watchlist";

const mockSession = {
  user: { id: "user-123", name: "Test User", email: "test@test.com" },
  expires: "2099-01-01",
};

describe("addToWatchlistAction", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (requireActionAuth as jest.Mock).mockResolvedValue({
      session: mockSession,
    });
    (addToWatchlist as jest.Mock).mockResolvedValue(undefined);
  });

  it("returns error when not authenticated", async () => {
    (requireActionAuth as jest.Mock).mockResolvedValue({
      error: { success: false, error: "יש להתחבר כדי לנהל רשימת צפייה" },
    });

    const result = await addToWatchlistAction(1);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("יש להתחבר כדי לנהל רשימת צפייה");
    }
  });

  it("returns error for invalid showId", async () => {
    const result = await addToWatchlistAction(-1);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("מזהה הצגה לא תקין");
    }
  });

  it("adds to watchlist successfully", async () => {
    const result = await addToWatchlistAction(1);

    expect(result.success).toBe(true);
    expect(addToWatchlist).toHaveBeenCalledWith("user-123", 1);
  });

  it("returns error for duplicate", async () => {
    (addToWatchlist as jest.Mock).mockRejectedValue({ code: "P2002" });

    const result = await addToWatchlistAction(1);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("ההצגה כבר ברשימת הצפייה");
    }
  });

  it("returns error for non-existent show", async () => {
    (addToWatchlist as jest.Mock).mockRejectedValue({ code: "P2003" });

    const result = await addToWatchlistAction(999);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("ההצגה לא נמצאה");
    }
  });

  it("returns internal error for unexpected error", async () => {
    (addToWatchlist as jest.Mock).mockRejectedValue(new Error("unexpected"));

    const result = await addToWatchlistAction(1);

    expect(result.success).toBe(false);
  });
});

describe("removeFromWatchlistAction", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (requireActionAuth as jest.Mock).mockResolvedValue({
      session: mockSession,
    });
    (removeFromWatchlist as jest.Mock).mockResolvedValue(true);
  });

  it("returns error when not authenticated", async () => {
    (requireActionAuth as jest.Mock).mockResolvedValue({
      error: { success: false, error: "יש להתחבר כדי לנהל רשימת צפייה" },
    });

    const result = await removeFromWatchlistAction(1);

    expect(result.success).toBe(false);
  });

  it("returns error for invalid showId", async () => {
    const result = await removeFromWatchlistAction(-1);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("מזהה הצגה לא תקין");
    }
  });

  it("returns error when not in watchlist", async () => {
    (removeFromWatchlist as jest.Mock).mockResolvedValue(false);

    const result = await removeFromWatchlistAction(1);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("ההצגה לא נמצאה ברשימת הצפייה");
    }
  });

  it("removes from watchlist successfully", async () => {
    const result = await removeFromWatchlistAction(1);

    expect(result.success).toBe(true);
    expect(removeFromWatchlist).toHaveBeenCalledWith("user-123", 1);
  });

  it("returns internal error for unexpected error", async () => {
    (removeFromWatchlist as jest.Mock).mockRejectedValue(
      new Error("unexpected"),
    );

    const result = await removeFromWatchlistAction(1);

    expect(result.success).toBe(false);
  });
});
