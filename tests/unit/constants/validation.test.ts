import {
  CONTACT_NAME_MIN,
  CONTACT_NAME_MAX,
  CONTACT_MESSAGE_MIN,
  CONTACT_MESSAGE_MAX,
} from "@/constants/contactValidation";
import {
  PROFILE_NAME_MIN,
  PROFILE_NAME_MAX,
} from "@/constants/profileValidation";
import {
  REVIEW_NAME_MAX,
  REVIEW_TITLE_MIN,
  REVIEW_TITLE_MAX,
  REVIEW_TEXT_MIN,
  REVIEW_TEXT_MAX,
} from "@/constants/reviewValidation";

describe("Contact validation constants", () => {
  it("CONTACT_NAME_MIN <= CONTACT_NAME_MAX", () => {
    expect(CONTACT_NAME_MIN).toBeLessThanOrEqual(CONTACT_NAME_MAX);
  });

  it("CONTACT_MESSAGE_MIN <= CONTACT_MESSAGE_MAX", () => {
    expect(CONTACT_MESSAGE_MIN).toBeLessThanOrEqual(CONTACT_MESSAGE_MAX);
  });

  it("all values are positive integers", () => {
    for (const v of [
      CONTACT_NAME_MIN,
      CONTACT_NAME_MAX,
      CONTACT_MESSAGE_MIN,
      CONTACT_MESSAGE_MAX,
    ]) {
      expect(v).toBeGreaterThan(0);
      expect(Number.isInteger(v)).toBe(true);
    }
  });
});

describe("Profile validation constants", () => {
  it("PROFILE_NAME_MIN <= PROFILE_NAME_MAX", () => {
    expect(PROFILE_NAME_MIN).toBeLessThanOrEqual(PROFILE_NAME_MAX);
  });

  it("all values are positive integers", () => {
    for (const v of [PROFILE_NAME_MIN, PROFILE_NAME_MAX]) {
      expect(v).toBeGreaterThan(0);
      expect(Number.isInteger(v)).toBe(true);
    }
  });
});

describe("Review validation constants", () => {
  it("REVIEW_TITLE_MIN <= REVIEW_TITLE_MAX", () => {
    expect(REVIEW_TITLE_MIN).toBeLessThanOrEqual(REVIEW_TITLE_MAX);
  });

  it("REVIEW_TEXT_MIN <= REVIEW_TEXT_MAX", () => {
    expect(REVIEW_TEXT_MIN).toBeLessThanOrEqual(REVIEW_TEXT_MAX);
  });

  it("REVIEW_NAME_MAX is a positive integer", () => {
    expect(REVIEW_NAME_MAX).toBeGreaterThan(0);
    expect(Number.isInteger(REVIEW_NAME_MAX)).toBe(true);
  });

  it("all values are positive integers", () => {
    for (const v of [
      REVIEW_NAME_MAX,
      REVIEW_TITLE_MIN,
      REVIEW_TITLE_MAX,
      REVIEW_TEXT_MIN,
      REVIEW_TEXT_MAX,
    ]) {
      expect(v).toBeGreaterThan(0);
      expect(Number.isInteger(v)).toBe(true);
    }
  });
});
