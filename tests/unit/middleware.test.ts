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
  (actual.NextResponse as any).redirect = jest
    .fn()
    .mockImplementation((url: URL, status: number) => ({
      status,
      redirectUrl: url.toString(),
    }));
  return actual;
});

import { middleware } from "@/middleware";
import { NextResponse } from "next/server";

function createMockRequest(
  method: string,
  pathname: string,
  headers: Record<string, string> = {},
) {
  return {
    method,
    url: `https://example.com${pathname}`,
    nextUrl: {
      pathname,
      startsWith: (prefix: string) => pathname.startsWith(prefix),
    },
    headers: {
      get: jest.fn((name: string) => headers[name.toLowerCase()] ?? null),
    },
  } as any;
}

describe("middleware", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("CSRF protection on API routes", () => {
    it("passes through GET requests to API", async () => {
      const req = createMockRequest("GET", "/api/test");
      const result = await middleware(req);

      expect(NextResponse.next).toHaveBeenCalled();
    });

    it("returns 403 when POST to API without origin or referer", async () => {
      const req = createMockRequest("POST", "/api/test", {
        host: "example.com",
      });
      const result = await middleware(req);

      expect(result).toEqual({ body: "Forbidden", status: 403 });
    });

    it("returns 403 when origin host doesn't match", async () => {
      const req = createMockRequest("POST", "/api/test", {
        origin: "https://evil.com",
        host: "example.com",
      });
      const result = await middleware(req);

      expect(result).toEqual({ body: "Forbidden", status: 403 });
    });

    it("passes through when origin matches host", async () => {
      const req = createMockRequest("POST", "/api/test", {
        origin: "https://example.com",
        host: "example.com",
      });
      const result = await middleware(req);

      expect(NextResponse.next).toHaveBeenCalled();
    });

    it("passes through when referer matches host", async () => {
      const req = createMockRequest("POST", "/api/test", {
        referer: "https://example.com/path",
        host: "example.com",
      });
      const result = await middleware(req);

      expect(NextResponse.next).toHaveBeenCalled();
    });

    it("returns 403 for invalid origin URL", async () => {
      const req = createMockRequest("POST", "/api/test", {
        origin: "not-a-valid-url",
        host: "example.com",
      });
      const result = await middleware(req);

      expect(result).toEqual({ body: "Forbidden", status: 403 });
    });
  });

  describe("non-API POST requests", () => {
    it("passes through POST to non-API paths", async () => {
      const req = createMockRequest("POST", "/shows/קברט", {
        host: "example.com",
      });
      const result = await middleware(req);

      expect(NextResponse.next).toHaveBeenCalled();
    });
  });
});
