jest.mock("next/server", () => {
  const actual = {
    NextResponse: jest.fn().mockImplementation((body?: string, init?: any) => ({
      body,
      status: init?.status,
    })),
  };
  (actual.NextResponse as any).next = jest
    .fn()
    .mockReturnValue({ status: 200, next: true });
  return actual;
});

import { middleware } from "@/middleware";
import { NextResponse } from "next/server";

function createMockRequest(
  method: string,
  headers: Record<string, string> = {},
) {
  return {
    method,
    headers: {
      get: jest.fn((name: string) => headers[name.toLowerCase()] ?? null),
    },
  } as any;
}

describe("middleware", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET requests (non-mutating)", () => {
    it("passes through without checking headers", () => {
      const req = createMockRequest("GET");
      const result = middleware(req);

      expect(NextResponse.next).toHaveBeenCalled();
      expect(result).toEqual({ status: 200, next: true });
    });
  });

  describe("POST requests (mutating)", () => {
    it("returns 403 when no origin and no referer", () => {
      const req = createMockRequest("POST", { host: "example.com" });
      const result = middleware(req);

      expect(result).toEqual({ body: "Forbidden", status: 403 });
      expect(NextResponse.next).not.toHaveBeenCalled();
    });

    it("returns 403 when origin host doesn't match host header", () => {
      const req = createMockRequest("POST", {
        origin: "https://evil.com",
        host: "example.com",
      });
      const result = middleware(req);

      expect(result).toEqual({ body: "Forbidden", status: 403 });
      expect(NextResponse.next).not.toHaveBeenCalled();
    });

    it("returns 403 when origin is an invalid URL", () => {
      const req = createMockRequest("POST", {
        origin: "not-a-valid-url",
        host: "example.com",
      });
      const result = middleware(req);

      expect(result).toEqual({ body: "Forbidden", status: 403 });
      expect(NextResponse.next).not.toHaveBeenCalled();
    });

    it("passes through when origin matches host", () => {
      const req = createMockRequest("POST", {
        origin: "https://example.com",
        host: "example.com",
      });
      const result = middleware(req);

      expect(NextResponse.next).toHaveBeenCalled();
      expect(result).toEqual({ status: 200, next: true });
    });

    it("passes through when referer matches host (no origin)", () => {
      const req = createMockRequest("POST", {
        referer: "https://example.com/path",
        host: "example.com",
      });
      const result = middleware(req);

      expect(NextResponse.next).toHaveBeenCalled();
      expect(result).toEqual({ status: 200, next: true });
    });
  });

  describe("other mutating methods", () => {
    it("blocks PATCH without valid origin", () => {
      const req = createMockRequest("PATCH", { host: "example.com" });
      const result = middleware(req);

      expect(result).toEqual({ body: "Forbidden", status: 403 });
      expect(NextResponse.next).not.toHaveBeenCalled();
    });

    it("blocks PUT without valid origin", () => {
      const req = createMockRequest("PUT", { host: "example.com" });
      const result = middleware(req);

      expect(result).toEqual({ body: "Forbidden", status: 403 });
      expect(NextResponse.next).not.toHaveBeenCalled();
    });

    it("blocks DELETE without valid origin", () => {
      const req = createMockRequest("DELETE", { host: "example.com" });
      const result = middleware(req);

      expect(result).toEqual({ body: "Forbidden", status: 403 });
      expect(NextResponse.next).not.toHaveBeenCalled();
    });

    it("allows PATCH with valid origin", () => {
      const req = createMockRequest("PATCH", {
        origin: "https://example.com",
        host: "example.com",
      });
      const result = middleware(req);

      expect(NextResponse.next).toHaveBeenCalled();
      expect(result).toEqual({ status: 200, next: true });
    });
  });
});
