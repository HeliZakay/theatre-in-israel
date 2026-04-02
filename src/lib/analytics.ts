/**
 * Lightweight client-side analytics utility.
 *
 * In development: logs events to the console.
 * In production: POST to /api/analytics (implement endpoint when ready).
 * Designed to be non-blocking and fire-and-forget.
 */

type EventData = Record<string, unknown>;

export function logEvent(name: string, data: EventData): void {
  if (process.env.NODE_ENV === "development") {
    // eslint-disable-next-line no-console
    console.log(`[analytics] ${name}`, data);
    return;
  }

  // Production: POST to analytics endpoint (non-blocking, fire-and-forget)
  try {
    const body = JSON.stringify({ event: name, data, ts: Date.now() });
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      navigator.sendBeacon("/api/analytics", body);
    } else {
      fetch("/api/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
      }).catch(() => {
        // Silently ignore analytics failures
      });
    }
  } catch {
    // Silently ignore
  }
}
