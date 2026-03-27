import { render } from "@testing-library/react";
import ShowCardSkeleton from "@/components/shows/ShowCardSkeleton/ShowCardSkeleton";

describe("ShowCardSkeleton", () => {
  it("renders with aria-hidden='true'", () => {
    const { container } = render(<ShowCardSkeleton />);
    expect(container.firstChild).toHaveAttribute("aria-hidden", "true");
  });

  it("renders as a div element", () => {
    const { container } = render(<ShowCardSkeleton />);
    expect((container.firstChild as HTMLElement).tagName).toBe("DIV");
  });
});
