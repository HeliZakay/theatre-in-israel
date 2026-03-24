import { render, screen } from "@testing-library/react";
import SecurityBanner from "@/components/SecurityBanner/SecurityBanner";

describe("SecurityBanner", () => {
  it("renders with role='alert'", () => {
    render(<SecurityBanner />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("contains security warning text", () => {
    render(<SecurityBanner />);
    expect(screen.getByText("שימו לב:")).toBeInTheDocument();
  });
});
