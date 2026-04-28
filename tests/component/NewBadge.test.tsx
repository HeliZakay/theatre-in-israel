import { render, screen } from "@testing-library/react";
import NewBadge from "@/components/shows/NewBadge/NewBadge";

describe("NewBadge", () => {
  it("renders the Hebrew 'new' label", () => {
    render(<NewBadge />);
    expect(screen.getByText("חדש באתר")).toBeInTheDocument();
  });
});
