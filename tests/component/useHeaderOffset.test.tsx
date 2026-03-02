import { renderHook } from "@testing-library/react";
import { useHeaderOffset } from "@/hooks/useHeaderOffset";
import type { RefObject } from "react";

// ── ResizeObserver mock ──
let resizeObserverCallback: (() => void) | null = null;
const mockObserve = jest.fn();
const mockDisconnect = jest.fn();

class MockResizeObserver {
  constructor(cb: () => void) {
    resizeObserverCallback = cb;
  }
  observe = mockObserve;
  unobserve = jest.fn();
  disconnect = mockDisconnect;
}

// ── rAF mock ──
let rafCallback: FrameRequestCallback | null = null;
let rafId = 1;

beforeEach(() => {
  jest.clearAllMocks();
  resizeObserverCallback = null;
  rafCallback = null;
  rafId = 1;

  global.ResizeObserver =
    MockResizeObserver as unknown as typeof ResizeObserver;

  jest.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
    rafCallback = cb;
    return rafId++;
  });

  jest.spyOn(window, "cancelAnimationFrame").mockImplementation(jest.fn());
});

function flushRaf() {
  if (rafCallback) {
    rafCallback(performance.now());
    rafCallback = null;
  }
}

function makeRef(el: HTMLElement | null): RefObject<HTMLElement | null> {
  return { current: el };
}

describe("useHeaderOffset", () => {
  it("sets --header-offset CSS property based on element height", () => {
    const el = document.createElement("div");
    jest.spyOn(el, "getBoundingClientRect").mockReturnValue({
      height: 64,
      width: 100,
      top: 0,
      left: 0,
      bottom: 64,
      right: 100,
      x: 0,
      y: 0,
      toJSON: jest.fn(),
    });

    renderHook(() => useHeaderOffset(makeRef(el)));
    flushRaf();

    expect(
      document.documentElement.style.getPropertyValue("--header-offset"),
    ).toBe("64px");
  });

  it("does nothing when ref is null", () => {
    const spy = jest.spyOn(document.documentElement.style, "setProperty");
    renderHook(() => useHeaderOffset(makeRef(null)));
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it("uses Math.ceil on fractional heights", () => {
    const el = document.createElement("div");
    jest.spyOn(el, "getBoundingClientRect").mockReturnValue({
      height: 64.3,
      width: 100,
      top: 0,
      left: 0,
      bottom: 64.3,
      right: 100,
      x: 0,
      y: 0,
      toJSON: jest.fn(),
    });

    renderHook(() => useHeaderOffset(makeRef(el)));
    flushRaf();

    expect(
      document.documentElement.style.getPropertyValue("--header-offset"),
    ).toBe("65px");
  });

  it("does not set property when height is 0", () => {
    const el = document.createElement("div");
    jest.spyOn(el, "getBoundingClientRect").mockReturnValue({
      height: 0,
      width: 0,
      top: 0,
      left: 0,
      bottom: 0,
      right: 0,
      x: 0,
      y: 0,
      toJSON: jest.fn(),
    });

    // Clear any previous value
    document.documentElement.style.removeProperty("--header-offset");

    renderHook(() => useHeaderOffset(makeRef(el)));
    flushRaf();

    expect(
      document.documentElement.style.getPropertyValue("--header-offset"),
    ).toBe("");
  });

  it("creates a ResizeObserver and observes the element", () => {
    const el = document.createElement("div");
    jest.spyOn(el, "getBoundingClientRect").mockReturnValue({
      height: 50,
      width: 100,
      top: 0,
      left: 0,
      bottom: 50,
      right: 100,
      x: 0,
      y: 0,
      toJSON: jest.fn(),
    });

    renderHook(() => useHeaderOffset(makeRef(el)));
    expect(mockObserve).toHaveBeenCalledWith(el);
  });

  it("adds resize and orientationchange listeners", () => {
    const addSpy = jest.spyOn(window, "addEventListener");
    const el = document.createElement("div");
    jest.spyOn(el, "getBoundingClientRect").mockReturnValue({
      height: 50,
      width: 100,
      top: 0,
      left: 0,
      bottom: 50,
      right: 100,
      x: 0,
      y: 0,
      toJSON: jest.fn(),
    });

    renderHook(() => useHeaderOffset(makeRef(el)));

    const eventNames = addSpy.mock.calls.map((call) => call[0]);
    expect(eventNames).toContain("resize");
    expect(eventNames).toContain("orientationchange");

    addSpy.mockRestore();
  });

  it("cleans up on unmount", () => {
    const removeSpy = jest.spyOn(window, "removeEventListener");
    const el = document.createElement("div");
    jest.spyOn(el, "getBoundingClientRect").mockReturnValue({
      height: 50,
      width: 100,
      top: 0,
      left: 0,
      bottom: 50,
      right: 100,
      x: 0,
      y: 0,
      toJSON: jest.fn(),
    });

    const { unmount } = renderHook(() => useHeaderOffset(makeRef(el)));
    unmount();

    expect(mockDisconnect).toHaveBeenCalled();
    expect(window.cancelAnimationFrame).toHaveBeenCalled();

    const removedEvents = removeSpy.mock.calls.map((call) => call[0]);
    expect(removedEvents).toContain("resize");
    expect(removedEvents).toContain("orientationchange");

    removeSpy.mockRestore();
  });

  it("handles missing ResizeObserver gracefully", () => {
    // @ts-expect-error: deliberately removing ResizeObserver
    delete global.ResizeObserver;

    const el = document.createElement("div");
    jest.spyOn(el, "getBoundingClientRect").mockReturnValue({
      height: 50,
      width: 100,
      top: 0,
      left: 0,
      bottom: 50,
      right: 100,
      x: 0,
      y: 0,
      toJSON: jest.fn(),
    });

    // Should not throw
    expect(() => {
      renderHook(() => useHeaderOffset(makeRef(el)));
    }).not.toThrow();
  });
});
