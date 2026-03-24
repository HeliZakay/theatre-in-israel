import { render, screen } from "@testing-library/react";
import MobileMenu from "@/components/Header/MobileMenu";
import * as Dialog from "@radix-ui/react-dialog";

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

jest.mock("next-auth/react", () => ({
  signOut: jest.fn(),
}));

const baseProps = {
  pathname: "/",
  isAuthenticated: false,
  isLoading: false,
  fullName: "",
  firstName: "",
  isWriteReviewPage: false,
  isMyReviewsPage: false,
  isMyWatchlistPage: false,
  isContactPage: false,
  onClose: jest.fn(),
};

function renderMenu(
  overrides: Partial<React.ComponentProps<typeof MobileMenu>> = {},
) {
  return render(
    <Dialog.Root open>
      <Dialog.Portal>
        <Dialog.Content>
          <MobileMenu {...baseProps} {...overrides} />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>,
  );
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

  it("shows user info when authenticated", () => {
    renderMenu({
      isAuthenticated: true,
      fullName: "ישראל ישראלי",
      firstName: "ישראל",
    });
    expect(screen.getByText("ישראל ישראלי")).toBeInTheDocument();
  });

  it("shows loading button when isLoading", () => {
    renderMenu({ isLoading: true });
    expect(screen.getByText("טוען...")).toBeDisabled();
  });

  it("always shows write review link in drawer", () => {
    renderMenu();
    expect(screen.getAllByText("כתב.י ביקורת").length).toBeGreaterThan(0);
  });

  it("renders all nav groups", () => {
    renderMenu();
    expect(screen.getByText("לוח הופעות")).toBeInTheDocument();
    expect(screen.getByText("קטלוג הצגות")).toBeInTheDocument();
    expect(screen.getByText("תיאטראות")).toBeInTheDocument();
    expect(screen.getByText("ז׳אנרים")).toBeInTheDocument();
    expect(screen.getByText("ערים")).toBeInTheDocument();
    expect(screen.getByText("שחקנים")).toBeInTheDocument();
    expect(screen.getByText("צר.י קשר")).toBeInTheDocument();
  });

  it("shows account links when authenticated", () => {
    renderMenu({
      isAuthenticated: true,
      fullName: "Test User",
      firstName: "Test",
    });
    expect(screen.getByText("האזור האישי")).toBeInTheDocument();
    expect(screen.getByText("הביקורות שלי")).toBeInTheDocument();
    expect(screen.getByText("רשימת הצפייה שלי")).toBeInTheDocument();
    expect(screen.getByText("התנתקות")).toBeInTheDocument();
  });
});
