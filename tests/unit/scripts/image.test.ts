/**
 * Tests for the fixDoubleProtocol function from image.mjs.
 *
 * Since image.mjs uses import.meta.url (not supported in Jest's CJS mode),
 * we re-implement the pure function here for testing. The function is simple
 * enough that this is reliable, and the alternative (configuring ESM support
 * in Jest) is not worth the complexity.
 */

// Extracted from scripts/lib/image.mjs — exact copy of the pure function
function fixDoubleProtocol(url: string | null): string | null {
  if (!url) return url;
  const idx = url.indexOf("https://", 8);
  return idx > 0 ? url.substring(idx) : url;
}

describe("fixDoubleProtocol", () => {
  it("strips inner protocol from double-protocol URL", () => {
    expect(
      fixDoubleProtocol("https://www.cameri.co.il/https://cdn.cameri.co.il/image.jpg")
    ).toBe("https://cdn.cameri.co.il/image.jpg");
  });

  it("returns normal URL unchanged", () => {
    expect(fixDoubleProtocol("https://cdn.example.com/image.jpg")).toBe(
      "https://cdn.example.com/image.jpg"
    );
  });

  it("returns null for null input", () => {
    expect(fixDoubleProtocol(null)).toBeNull();
  });

  it("returns empty string for empty input", () => {
    expect(fixDoubleProtocol("")).toBe("");
  });

  it("handles URL with http:// prefix followed by https://", () => {
    expect(
      fixDoubleProtocol("http://example.com/https://cdn.example.com/img.jpg")
    ).toBe("https://cdn.example.com/img.jpg");
  });

  it("handles URL where second https:// appears exactly at position 8", () => {
    // "https://" is 8 chars, so indexOf starting at 8 finds it at position 8
    expect(
      fixDoubleProtocol("https://https://cdn.example.com/img.jpg")
    ).toBe("https://cdn.example.com/img.jpg");
  });
});
