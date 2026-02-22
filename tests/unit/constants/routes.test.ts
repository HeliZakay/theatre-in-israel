import { showPath, showReviewPath } from "@/constants/routes";

describe("showPath", () => {
  it("returns /shows/<slug> for a latin slug", () => {
    expect(showPath("hamlet")).toBe("/shows/hamlet");
  });

  it("handles Hebrew slugs", () => {
    expect(showPath("קברט")).toBe("/shows/קברט");
  });
});

describe("showReviewPath", () => {
  it("returns /shows/<slug>/review", () => {
    expect(showReviewPath("hamlet")).toBe("/shows/hamlet/review");
  });
});
