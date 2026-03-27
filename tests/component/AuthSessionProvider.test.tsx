import { render, screen } from "@testing-library/react";
import AuthSessionProvider from "@/components/auth/AuthSessionProvider/AuthSessionProvider";

describe("AuthSessionProvider", () => {
  it("renders children", () => {
    render(
      <AuthSessionProvider>
        <p>child content</p>
      </AuthSessionProvider>
    );
    expect(screen.getByText("child content")).toBeInTheDocument();
  });
});
