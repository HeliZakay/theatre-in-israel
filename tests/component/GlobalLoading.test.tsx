import { render, screen } from "@testing-library/react";
import GlobalLoading from "@/components/layout/GlobalLoading/GlobalLoading";

describe("GlobalLoading", () => {
  it("renders main with aria-busy='true'", () => {
    render(<GlobalLoading />);
    expect(screen.getByRole("main")).toHaveAttribute("aria-busy", "true");
  });

  it("renders main with aria-live='polite'", () => {
    render(<GlobalLoading />);
    expect(screen.getByRole("main")).toHaveAttribute("aria-live", "polite");
  });

  it("has id='main-content'", () => {
    render(<GlobalLoading />);
    expect(screen.getByRole("main")).toHaveAttribute("id", "main-content");
  });

  it("renders loading text", () => {
    render(<GlobalLoading />);
    expect(screen.getByText("טוענים תוצאות")).toBeInTheDocument();
  });
});
