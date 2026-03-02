import { renderHook, act } from "@testing-library/react";
import { useDebounce } from "@/hooks/useDebounce";

describe("useDebounce", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("returns the initial value immediately", () => {
    const { result } = renderHook(() => useDebounce("hello"));
    expect(result.current).toBe("hello");
  });

  it("does not update before the delay has elapsed", () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value), {
      initialProps: { value: "a" },
    });

    rerender({ value: "b" });
    act(() => {
      jest.advanceTimersByTime(100);
    });

    expect(result.current).toBe("a");
  });

  it("updates the debounced value after the default delay (300ms)", () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value), {
      initialProps: { value: "a" },
    });

    rerender({ value: "b" });
    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(result.current).toBe("b");
  });

  it("only emits the last value when changed rapidly", () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value), {
      initialProps: { value: "a" },
    });

    rerender({ value: "b" });
    act(() => {
      jest.advanceTimersByTime(100);
    });
    rerender({ value: "c" });
    act(() => {
      jest.advanceTimersByTime(100);
    });
    rerender({ value: "d" });
    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(result.current).toBe("d");
  });

  it("respects a custom delay", () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: "a", delay: 500 } },
    );

    rerender({ value: "b", delay: 500 });

    act(() => {
      jest.advanceTimersByTime(300);
    });
    expect(result.current).toBe("a");

    act(() => {
      jest.advanceTimersByTime(200);
    });
    expect(result.current).toBe("b");
  });

  it("cleans up timeout on unmount", () => {
    const { result, rerender, unmount } = renderHook(
      ({ value }) => useDebounce(value),
      { initialProps: { value: "a" } },
    );

    rerender({ value: "b" });
    unmount();

    act(() => {
      jest.advanceTimersByTime(300);
    });

    // After unmount the value shouldn't have changed
    expect(result.current).toBe("a");
  });

  it("works with delay of 0", () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 0),
      { initialProps: { value: "a" } },
    );

    rerender({ value: "b" });
    act(() => {
      jest.advanceTimersByTime(0);
    });

    expect(result.current).toBe("b");
  });
});
