export const LOTTERY_CONFIG = {
  enabled: true,
  startDate: new Date("2026-03-02"),
  prize: "זוג כרטיסים לתיאטרון",
} as const;

export function isLotteryActive(): boolean {
  return LOTTERY_CONFIG.enabled && new Date() >= LOTTERY_CONFIG.startDate;
}
