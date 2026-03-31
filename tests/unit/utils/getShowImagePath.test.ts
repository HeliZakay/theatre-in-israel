import { getShowImagePath } from "@/utils/getShowImagePath";

describe("getShowImagePath", () => {
  it("replaces spaces with dashes", () => {
    expect(getShowImagePath("hello world")).toBe("/images/shows/hello-world.webp");
  });

  it("replaces ASCII apostrophe with Hebrew geresh (\\u05F3)", () => {
    expect(getShowImagePath("it's")).toBe("/images/shows/it\u05F3s.webp");
  });

  it("handles title with no spaces or apostrophes", () => {
    expect(getShowImagePath("hamlet")).toBe("/images/shows/hamlet.webp");
  });

  it("handles multiple consecutive spaces", () => {
    expect(getShowImagePath("a   b")).toBe("/images/shows/a-b.webp");
  });

  it("combines space and apostrophe replacements", () => {
    expect(getShowImagePath("king's new play")).toBe(
      "/images/shows/king\u05F3s-new-play.webp",
    );
  });
});
