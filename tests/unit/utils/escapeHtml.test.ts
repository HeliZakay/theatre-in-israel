import { escapeHtml } from "@/utils/escapeHtml";

describe("escapeHtml", () => {
  it("escapes ampersand", () => {
    expect(escapeHtml("foo & bar")).toBe("foo &amp; bar");
  });

  it("escapes less-than", () => {
    expect(escapeHtml("<script>")).toBe("&lt;script&gt;");
  });

  it("escapes greater-than", () => {
    expect(escapeHtml("a > b")).toBe("a &gt; b");
  });

  it("escapes double quotes", () => {
    expect(escapeHtml('say "hello"')).toBe("say &quot;hello&quot;");
  });

  it("escapes single quotes", () => {
    expect(escapeHtml("it's")).toBe("it&#39;s");
  });

  it("escapes all special characters together", () => {
    expect(escapeHtml(`<div class="x">&'`)).toBe(
      "&lt;div class=&quot;x&quot;&gt;&amp;&#39;",
    );
  });

  it("returns empty string unchanged", () => {
    expect(escapeHtml("")).toBe("");
  });

  it("returns normal text unchanged", () => {
    expect(escapeHtml("hello world")).toBe("hello world");
  });

  it("handles multiple occurrences of the same character", () => {
    expect(escapeHtml("a & b & c")).toBe("a &amp; b &amp; c");
  });
});
