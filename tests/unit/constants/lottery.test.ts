import { LOTTERY_CONFIG, isLotteryActive } from "@/constants/lottery";

describe("isLotteryActive", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it("returns false when LOTTERY_CONFIG.enabled is false", () => {
    // The module currently has enabled: false, so calling directly should return false
    expect(isLotteryActive()).toBe(false);
  });

  it("returns true when enabled and date is after startDate", () => {
    jest.useFakeTimers();
    // Set time to one day after startDate
    const afterStart = new Date(LOTTERY_CONFIG.startDate.getTime() + 86_400_000);
    jest.setSystemTime(afterStart);

    // We need to override enabled — re-import won't help since it's const,
    // so we test via mocking the module
    jest.replaceProperty(LOTTERY_CONFIG, "enabled", true as never);

    expect(isLotteryActive()).toBe(true);
  });

  it("returns false when enabled but date is before startDate", () => {
    jest.useFakeTimers();
    // Set time to one day before startDate
    const beforeStart = new Date(LOTTERY_CONFIG.startDate.getTime() - 86_400_000);
    jest.setSystemTime(beforeStart);

    jest.replaceProperty(LOTTERY_CONFIG, "enabled", true as never);

    expect(isLotteryActive()).toBe(false);
  });
});
