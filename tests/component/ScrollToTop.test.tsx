import { render } from "@testing-library/react";

const mockScrollTo = jest.fn();
Object.defineProperty(window, "scrollTo", { value: mockScrollTo, writable: true });

let scrollRestoration = "auto";
Object.defineProperty(window.history, "scrollRestoration", {
  get: () => scrollRestoration,
  set: (v: string) => {
    scrollRestoration = v;
  },
  configurable: true,
});

import ScrollToTop from "@/components/layout/ScrollToTop/ScrollToTop";

describe("ScrollToTop", () => {
  beforeEach(() => {
    mockScrollTo.mockClear();
    scrollRestoration = "auto";
  });

  it("calls window.scrollTo(0, 0) on mount", () => {
    render(<ScrollToTop />);
    expect(mockScrollTo).toHaveBeenCalledWith(0, 0);
  });

  it("sets scrollRestoration to manual on mount", () => {
    render(<ScrollToTop />);
    expect(scrollRestoration).toBe("manual");
  });

  it("returns null (renders nothing)", () => {
    const { container } = render(<ScrollToTop />);
    expect(container.innerHTML).toBe("");
  });
});
