jest.mock("@/lib/seo", () => ({
  SITE_NAME: "תיאטרון בישראל",
  SITE_DESCRIPTION: "ביקורות ודירוגים להצגות",
}));

import manifest from "@/app/manifest";

describe("manifest()", () => {
  const result = manifest();

  it("returns name and short_name", () => {
    expect(result.name).toBe("תיאטרון בישראל");
    expect(result.short_name).toBe("תיאטרון IL");
  });

  it("has dir='rtl' and lang='he'", () => {
    expect(result.dir).toBe("rtl");
    expect(result.lang).toBe("he");
  });

  it("has display='standalone'", () => {
    expect(result.display).toBe("standalone");
  });

  it("has 3 icons", () => {
    expect(result.icons).toHaveLength(3);
  });

  it("start_url is '/'", () => {
    expect(result.start_url).toBe("/");
  });
});
