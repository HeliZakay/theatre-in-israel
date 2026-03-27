import { render } from "@testing-library/react";

const mockScrollTo = jest.fn();
Object.defineProperty(window, "scrollTo", { value: mockScrollTo, writable: true });

import ScrollToTop from "@/components/layout/ScrollToTop/ScrollToTop";

describe("ScrollToTop", () => {
  beforeEach(() => mockScrollTo.mockClear());

  it("calls window.scrollTo(0, 0) on mount", () => {
    render(<ScrollToTop />);
    expect(mockScrollTo).toHaveBeenCalledWith(0, 0);
  });

  it("returns null (renders nothing)", () => {
    const { container } = render(<ScrollToTop />);
    expect(container.innerHTML).toBe("");
  });
});
