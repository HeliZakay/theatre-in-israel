jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn((data: unknown, init?: { status?: number }) => ({
      data,
      status: init?.status ?? 200,
    })),
  },
}));

import {
  apiError,
  apiSuccess,
  INTERNAL_ERROR_MESSAGE,
} from "@/utils/apiResponse";

describe("apiError", () => {
  beforeEach(() => {
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns error response with given message and status", () => {
    const res = apiError("Not found", 404) as unknown as {
      data: { error: string };
      status: number;
    };
    expect(res.data).toEqual({ error: "Not found" });
    expect(res.status).toBe(404);
  });

  it("logs internal error to console.error when provided", () => {
    const internalErr = new Error("db failed");
    apiError("Server error", 500, internalErr);
    expect(console.error).toHaveBeenCalledWith("[API Error]", internalErr);
  });

  it("does not log when no internal error", () => {
    apiError("Bad request", 400);
    expect(console.error).not.toHaveBeenCalled();
  });
});

describe("apiSuccess", () => {
  it("returns success response with data and default status 200", () => {
    const res = apiSuccess({ id: 1 }) as unknown as {
      data: { id: number };
      status: number;
    };
    expect(res.data).toEqual({ id: 1 });
    expect(res.status).toBe(200);
  });

  it("returns success response with custom status", () => {
    const res = apiSuccess({ created: true }, 201) as unknown as {
      data: { created: boolean };
      status: number;
    };
    expect(res.data).toEqual({ created: true });
    expect(res.status).toBe(201);
  });
});

describe("INTERNAL_ERROR_MESSAGE", () => {
  it("exports the correct Hebrew error string", () => {
    expect(INTERNAL_ERROR_MESSAGE).toBe("שגיאה פנימית, נסו שוב מאוחר יותר");
  });
});
