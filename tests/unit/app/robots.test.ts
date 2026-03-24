jest.mock("@/lib/seo", () => ({
  getSiteUrl: () => "https://example.com",
  toAbsoluteUrl: (path: string) => `https://example.com${path}`,
}));

import robots from "@/app/robots";

describe("robots()", () => {
  const result = robots();

  it("allows / for all user agents", () => {
    const rules = Array.isArray(result.rules) ? result.rules[0] : result.rules;
    expect(rules.userAgent).toBe("*");
    expect(rules.allow).toBe("/");
  });

  it("disallows sensitive paths", () => {
    const rules = Array.isArray(result.rules) ? result.rules[0] : result.rules;
    const disallowed = rules.disallow;
    expect(disallowed).toContain("/api/");
    expect(disallowed).toContain("/auth/");
    expect(disallowed).toContain("/me/");
  });

  it("includes sitemap URL", () => {
    expect(result.sitemap).toBe("https://example.com/sitemap.xml");
  });

  it("includes host", () => {
    expect(result.host).toBe("https://example.com");
  });
});
