jest.mock("@/lib/prisma", () => ({
  __esModule: true,
  default: {
    show: {
      findUnique: jest.fn(),
    },
  },
}));

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
import prisma from "@/lib/prisma";

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

  describe("Legacy show URL redirects", () => {
    it("redirects /shows/42 to /shows/:slug with 301", async () => {
      (prisma.show.findUnique as jest.Mock).mockResolvedValue({
        slug: "קברט",
      });

      const req = createMockRequest("GET", "/shows/42");
      const result = await middleware(req);

      expect(prisma.show.findUnique).toHaveBeenCalledWith({
        where: { id: 42 },
        select: { slug: true },
      });
      expect(NextResponse.redirect).toHaveBeenCalledWith(
        new URL("/shows/קברט", "https://example.com"),
        301,
      );
    });

    it("redirects /shows/42/review to /shows/:slug/review with 301", async () => {
      (prisma.show.findUnique as jest.Mock).mockResolvedValue({
        slug: "קברט",
      });

      const req = createMockRequest("GET", "/shows/42/review");
      const result = await middleware(req);

      expect(NextResponse.redirect).toHaveBeenCalledWith(
        new URL("/shows/קברט/review", "https://example.com"),
        301,
      );
    });

    it("falls through when numeric ID not found", async () => {
      (prisma.show.findUnique as jest.Mock).mockResolvedValue(null);

      const req = createMockRequest("GET", "/shows/999");
      const result = await middleware(req);

      expect(NextResponse.next).toHaveBeenCalled();
    });

    it("does not redirect slug-based URLs", async () => {
      const req = createMockRequest("GET", "/shows/קברט");
      const result = await middleware(req);

      expect(prisma.show.findUnique).not.toHaveBeenCalled();
      expect(NextResponse.next).toHaveBeenCalled();
    });
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
