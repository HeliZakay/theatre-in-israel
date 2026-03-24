import { render, screen } from "@testing-library/react";
import { useSession } from "next-auth/react";
import Header from "@/components/Header/Header";

// Override usePathname per test
let mockPathname = "/";
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    prefetch: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => mockPathname,
}));

jest.mock("@/hooks/useHeaderOffset", () => ({
  useHeaderOffset: jest.fn(),
}));

// Mock child components to isolate Header logic
jest.mock("@/components/Header/AccountDropdown", () => {
  const Mock = (props: { firstName: string }) => (
    <div data-testid="account-dropdown">{props.firstName}</div>
  );
  Mock.displayName = "MockAccountDropdown";
  return { __esModule: true, default: Mock };
});

jest.mock("@/components/Header/DesktopNav", () => {
  const Mock = () => <nav data-testid="desktop-nav" />;
  Mock.displayName = "MockDesktopNav";
  return { __esModule: true, default: Mock };
});

jest.mock("@/components/Header/MobileMenu", () => {
  const Mock = () => <div data-testid="mobile-menu" />;
  Mock.displayName = "MockMobileMenu";
  return { __esModule: true, default: Mock };
});

jest.mock("@/components/Logo/Logo", () => {
  const Mock = () => <div data-testid="logo" />;
  Mock.displayName = "MockLogo";
  return { __esModule: true, default: Mock };
});

describe("Header", () => {
  beforeEach(() => {
    mockPathname = "/";
    jest.restoreAllMocks();
  });

  it("shows account dropdown when authenticated", () => {
    (useSession as jest.Mock).mockReturnValue({
      data: { user: { name: "John Doe" } },
      status: "authenticated",
    });
    render(<Header />);
    expect(screen.getAllByTestId("account-dropdown").length).toBeGreaterThan(0);
  });

  it("shows login link when unauthenticated", () => {
    (useSession as jest.Mock).mockReturnValue({
      data: null,
      status: "unauthenticated",
    });
    render(<Header />);
    const loginLinks = screen.getAllByText("התחברות");
    expect(loginLinks.length).toBeGreaterThan(0);
  });

  it("encodes callbackUrl from current pathname", () => {
    mockPathname = "/shows/hamlet";
    (useSession as jest.Mock).mockReturnValue({
      data: null,
      status: "unauthenticated",
    });
    render(<Header />);
    const loginLink = screen.getAllByText("התחברות")[0];
    expect(loginLink).toHaveAttribute(
      "href",
      expect.stringContaining(encodeURIComponent("/shows/hamlet")),
    );
  });

  it("falls back to home when pathname starts with //", () => {
    mockPathname = "//evil.com";
    (useSession as jest.Mock).mockReturnValue({
      data: null,
      status: "unauthenticated",
    });
    render(<Header />);
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

  it("hides both login link and account dropdown while loading", () => {
    (useSession as jest.Mock).mockReturnValue({
      data: null,
      status: "loading",
    });
    render(<Header />);
    expect(screen.queryByText("התחברות")).not.toBeInTheDocument();
    expect(screen.queryByTestId("account-dropdown")).not.toBeInTheDocument();
  });

  it("renders menu toggle button", () => {
    (useSession as jest.Mock).mockReturnValue({
      data: null,
      status: "unauthenticated",
    });
    render(<Header />);
    expect(
      screen.getByRole("button", { name: "פתיחת תפריט ניווט" }),
    ).toBeInTheDocument();
  });

  it("extracts firstName from full name", () => {
    (useSession as jest.Mock).mockReturnValue({
      data: { user: { name: "  ישראל   ישראלי  " } },
      status: "authenticated",
    });
    render(<Header />);
    // AccountDropdown receives firstName prop
    const dropdowns = screen.getAllByTestId("account-dropdown");
    expect(dropdowns[0]).toHaveTextContent("ישראל");
  });
});
