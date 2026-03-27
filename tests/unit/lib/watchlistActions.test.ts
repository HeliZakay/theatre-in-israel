jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));

jest.mock("@/lib/auth", () => ({
  authOptions: {},
}));

jest.mock("@/utils/actionAuth", () => ({
  requireActionAuth: jest.fn(),
}));

jest.mock("@/lib/watchlist", () => ({
  addToWatchlist: jest.fn(),
  removeFromWatchlist: jest.fn(),
  getWatchlistShowIds: jest.fn(),
}));

jest.mock("@/utils/rateLimitCheckers", () => ({
  checkWatchlistRateLimit: jest.fn(),
}));

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { requireActionAuth } from "@/utils/actionAuth";
import {
  addToWatchlist,
  removeFromWatchlist,
  getWatchlistShowIds,
} from "@/lib/watchlist";
import {
  addToWatchlistAction,
  removeFromWatchlistAction,
  getWatchlistIdsAction,
} from "@/lib/watchlistActions";

const mockAuth = requireActionAuth as jest.Mock;
const mockAdd = addToWatchlist as jest.Mock;
const mockRemove = removeFromWatchlist as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

function authSuccess(userId = "user1") {
  mockAuth.mockResolvedValue({
    session: { user: { id: userId } },
    error: null,
  });
}

function authError(message = "יש להתחבר") {
  mockAuth.mockResolvedValue({
    error: { success: false, error: message },
  });
}

/* ------------------------------------------------------------------ */
/*  addToWatchlistAction                                               */
/* ------------------------------------------------------------------ */

describe("addToWatchlistAction", () => {
  it("returns error when auth fails", async () => {
    authError();
    const result = await addToWatchlistAction(1);
    expect(result.success).toBe(false);
  });

  it("returns error for invalid showId (0)", async () => {
    authSuccess();
    const result = await addToWatchlistAction(0);
    expect(result.success).toBe(false);
    expect(result).toHaveProperty("error");
  });

  it("returns error for negative showId", async () => {
    authSuccess();
    const result = await addToWatchlistAction(-5);
    expect(result.success).toBe(false);
  });

  it("returns success on valid add", async () => {
    authSuccess();
    mockAdd.mockResolvedValue(undefined);
    const result = await addToWatchlistAction(42);
    expect(result.success).toBe(true);
    expect(mockAdd).toHaveBeenCalledWith("user1", 42);
  });

  it("returns duplicate error for P2002", async () => {
    authSuccess();
    const error = new Error("Unique constraint");
    (error as any).code = "P2002";
    mockAdd.mockRejectedValue(error);

    const result = await addToWatchlistAction(42);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toMatch(/כבר ברשימת הצפייה/);
    }
  });

  it("returns not-found error for P2003", async () => {
    authSuccess();
    const error = new Error("Foreign key");
    (error as any).code = "P2003";
    mockAdd.mockRejectedValue(error);

    const result = await addToWatchlistAction(999);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toMatch(/לא נמצאה/);
    }
  });

  it("returns generic error for unknown exceptions", async () => {
    authSuccess();
    mockAdd.mockRejectedValue(new Error("Boom"));

    const result = await addToWatchlistAction(42);
    expect(result.success).toBe(false);
  });
});

/* ------------------------------------------------------------------ */
/*  removeFromWatchlistAction                                          */
/* ------------------------------------------------------------------ */

describe("removeFromWatchlistAction", () => {
  it("returns error when auth fails", async () => {
    authError();
    const result = await removeFromWatchlistAction(1);
    expect(result.success).toBe(false);
  });

  it("returns error for invalid showId", async () => {
    authSuccess();
    const result = await removeFromWatchlistAction(0);
    expect(result.success).toBe(false);
  });

  it("returns success and revalidates on valid remove", async () => {
    authSuccess();
    mockRemove.mockResolvedValue(true);

    const result = await removeFromWatchlistAction(42);
    expect(result.success).toBe(true);
    expect(mockRemove).toHaveBeenCalledWith("user1", 42);
    expect(revalidatePath).toHaveBeenCalledWith("/me/watchlist");
  });

  it("returns error when show not in watchlist", async () => {
    authSuccess();
    mockRemove.mockResolvedValue(false);

    const result = await removeFromWatchlistAction(42);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toMatch(/לא נמצאה ברשימת הצפייה/);
    }
  });

  it("returns generic error for unknown exceptions", async () => {
    authSuccess();
    mockRemove.mockRejectedValue(new Error("Boom"));

    const result = await removeFromWatchlistAction(42);
    expect(result.success).toBe(false);
  });
});

/* ------------------------------------------------------------------ */
/*  getWatchlistIdsAction                                              */
/* ------------------------------------------------------------------ */

describe("getWatchlistIdsAction", () => {
  const mockGetIds = getWatchlistShowIds as jest.Mock;
  const mockGetSession = getServerSession as jest.Mock;

  it("returns empty array when not authenticated", async () => {
    mockGetSession.mockResolvedValue(null);
    const result = await getWatchlistIdsAction();
    expect(result).toEqual([]);
  });

  it("returns show IDs for authenticated user", async () => {
    mockGetSession.mockResolvedValue({ user: { id: "user1" } });
    mockGetIds.mockResolvedValue([1, 2, 3]);

    const result = await getWatchlistIdsAction();
    expect(result).toEqual([1, 2, 3]);
    expect(mockGetIds).toHaveBeenCalledWith("user1");
  });
});
