import { render, screen } from "@testing-library/react";
import MobileMenu from "@/components/Header/MobileMenu";

jest.mock("@/components/Header/AccountDropdown", () => {
  const Mock = (props: { firstName: string }) => (
    <div data-testid="account-dropdown">{props.firstName}</div>
  );
  Mock.displayName = "MockAccountDropdown";
  return { __esModule: true, default: Mock };
});

jest.mock("@/components/Button/Button", () => {
  const Mock = ({
    children,
    href,
    ...rest
  }: {
    children: React.ReactNode;
    href?: string;
    [k: string]: unknown;
  }) => (
    <a href={href} {...(rest as React.AnchorHTMLAttributes<HTMLAnchorElement>)}>
      {children}
    </a>
  );
  Mock.displayName = "MockButton";
  return { __esModule: true, default: Mock };
});

const baseProps = {
  pathname: "/",
  isAuthenticated: false,
  isLoading: false,
  fullName: "",
  firstName: "",
  isWriteReviewPage: false,
  isMyReviewsPage: false,
  isMyWatchlistPage: false,
  onClose: jest.fn(),
};

function renderMenu(
  overrides: Partial<React.ComponentProps<typeof MobileMenu>> = {},
) {
  return render(<MobileMenu {...baseProps} {...overrides} />);
}

describe("MobileMenu", () => {
  it("shows login link when unauthenticated", () => {
    renderMenu({ isAuthenticated: false });
    const loginLinks = screen.getAllByText("התחברות");
    expect(loginLinks.length).toBeGreaterThan(0);
  });

  it("encodes callbackUrl from pathname", () => {
    renderMenu({ pathname: "/shows/hamlet", isAuthenticated: false });
    const loginLink = screen.getAllByText("התחברות")[0];
    expect(loginLink).toHaveAttribute(
      "href",
      expect.stringContaining(encodeURIComponent("/shows/hamlet")),
    );
  });

  it("falls back to home when pathname starts with //", () => {
    renderMenu({ pathname: "//evil", isAuthenticated: false });
    const loginLink = screen.getAllByText("התחברות")[0];
    expect(loginLink).toHaveAttribute(
      "href",
      expect.stringContaining(encodeURIComponent("/")),
    );
    expect(loginLink).not.toHaveAttribute(
      "href",
      expect.stringContaining("evil"),
    );
  });

  it("shows account dropdown when authenticated", () => {
    renderMenu({
      isAuthenticated: true,
      fullName: "ישראל ישראלי",
      firstName: "ישראל",
    });
    expect(screen.getByTestId("account-dropdown")).toHaveTextContent("ישראל");
  });

  it("shows loading button when isLoading", () => {
    renderMenu({ isLoading: true });
    expect(screen.getByText("טוען...")).toBeDisabled();
  });

  it("marks write review link as current page when active", () => {
    renderMenu({ isWriteReviewPage: true });
    const links = screen.getAllByText("כתב.י ביקורת");
    const mobileLink = links.find((el) =>
      el.getAttribute("aria-current") === "page",
    );
    expect(mobileLink).toBeDefined();
  });

  it("always shows write review button", () => {
    renderMenu();
    expect(screen.getAllByText("כתב.י ביקורת").length).toBeGreaterThan(0);
  });
});
