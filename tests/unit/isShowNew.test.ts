import { isShowNew } from "@/lib/shows/isNew";
import {
  NEW_SHOW_MAX_REVIEWS,
  NEW_SHOW_WINDOW_DAYS,
} from "@/constants/newShows";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * MS_PER_DAY);
}

describe("isShowNew", () => {
  it("flags a freshly added show with no reviews", () => {
    expect(isShowNew({ createdAt: daysAgo(1), reviewCount: 0 })).toBe(true);
  });

  it("flags a show inside the window with fewer than the max reviews", () => {
    expect(
      isShowNew({
        createdAt: daysAgo(NEW_SHOW_WINDOW_DAYS - 1),
        reviewCount: NEW_SHOW_MAX_REVIEWS - 1,
      }),
    ).toBe(true);
  });

  it("retires the badge once the show hits the review threshold", () => {
    expect(
      isShowNew({
        createdAt: daysAgo(1),
        reviewCount: NEW_SHOW_MAX_REVIEWS,
      }),
    ).toBe(false);
  });

  it("retires the badge after the window elapses", () => {
    expect(
      isShowNew({
        createdAt: daysAgo(NEW_SHOW_WINDOW_DAYS + 1),
        reviewCount: 0,
      }),
    ).toBe(false);
  });

  it("ignores shows backfilled to the far past", () => {
    expect(
      isShowNew({
        createdAt: new Date("2020-01-01T00:00:00Z"),
        reviewCount: 0,
      }),
    ).toBe(false);
  });

  it("treats the boundary day as still new", () => {
    expect(
      isShowNew({
        createdAt: daysAgo(NEW_SHOW_WINDOW_DAYS),
        reviewCount: 0,
      }),
    ).toBe(true);
  });
});
