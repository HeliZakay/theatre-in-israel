import { isValidCallbackUrl } from "@/utils/auth";

describe("isValidCallbackUrl", () => {
  it.each(["/", "/shows", "/shows/קברט"])(
    "returns true for valid relative path %s",
    (url) => {
      expect(isValidCallbackUrl(url)).toBe(true);
    },
  );

  it("returns false for protocol-relative URLs", () => {
    expect(isValidCallbackUrl("//evil.com")).toBe(false);
  });

  it.each(["https://evil.com", "http://evil.com"])(
    "returns false for absolute URL %s",
    (url) => {
      expect(isValidCallbackUrl(url)).toBe(false);
    },
  );

  it("returns false for empty string", () => {
    expect(isValidCallbackUrl("")).toBe(false);
  });

  it("returns false for non-slash-starting paths", () => {
    expect(isValidCallbackUrl("shows/קברט")).toBe(false);
  });
});
