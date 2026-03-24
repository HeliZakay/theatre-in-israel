const mockNextAuth = jest.fn(() => jest.fn().mockResolvedValue(new Response()));

jest.mock("next-auth", () => ({
  __esModule: true,
  default: mockNextAuth,
}));

jest.mock("@/lib/auth", () => ({
  authOptions: { session: { strategy: "jwt" } },
}));

import { GET, POST } from "@/app/api/auth/[...nextauth]/route";

describe("NextAuth route handlers", () => {
  it("GET is a function", () => {
    expect(typeof GET).toBe("function");
  });

  it("POST is a function", () => {
    expect(typeof POST).toBe("function");
  });

  it("GET awaits params and calls NextAuth", async () => {
    const req = new Request("http://localhost/api/auth/signin");
    const context = {
      params: Promise.resolve({ nextauth: ["signin"] }),
    };
    await GET(req, context);
    const handler = mockNextAuth.mock.results[0].value;
    expect(handler).toHaveBeenCalledWith(req, {
      params: { nextauth: ["signin"] },
    });
  });
});
