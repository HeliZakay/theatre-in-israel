import { render } from "@testing-library/react";
import ShowsSectionsSkeleton from "@/components/ShowsSectionsSkeleton/ShowsSectionsSkeleton";

describe("ShowsSectionsSkeleton", () => {
  it("renders with aria-busy='true'", () => {
    const { container } = render(<ShowsSectionsSkeleton />);
    expect(container.firstChild).toHaveAttribute("aria-busy", "true");
  });

  it("renders aria-label for loading state", () => {
    const { container } = render(<ShowsSectionsSkeleton />);
    expect(container.firstChild).toHaveAttribute("aria-label", "טוען הצגות…");
  });
});
