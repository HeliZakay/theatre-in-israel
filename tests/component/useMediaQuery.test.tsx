import { renderHook, act } from "@testing-library/react";
import { useMediaQuery } from "@/hooks/useMediaQuery";

describe("useMediaQuery", () => {
  let listeners: Array<() => void>;
  let matchesValue: boolean;

  beforeEach(() => {
    listeners = [];
    matchesValue = false;

    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: jest.fn().mockImplementation((query: string) => ({
        matches: matchesValue,
        media: query,
        addEventListener: jest.fn((_: string, cb: () => void) => {
          listeners.push(cb);
        }),
        removeEventListener: jest.fn(),
      })),
    });
  });

  it("returns true when media query matches", () => {
    matchesValue = true;
    const { result } = renderHook(() => useMediaQuery(768));
    expect(result.current).toBe(true);
  });

  it("returns false when media query does not match", () => {
    matchesValue = false;
    const { result } = renderHook(() => useMediaQuery(768));
    expect(result.current).toBe(false);
  });

  it("updates when media query changes", () => {
    matchesValue = false;
    const { result } = renderHook(() => useMediaQuery(768));
    expect(result.current).toBe(false);

    // Simulate a media change
    matchesValue = true;
    act(() => {
      listeners.forEach((cb) => cb());
    });
    expect(result.current).toBe(true);
  });
});
