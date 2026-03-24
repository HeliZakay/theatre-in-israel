import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DesktopNav from "@/components/Header/DesktopNav";

// Radix NavigationMenu renders portals — mock to simplify
jest.mock("@radix-ui/react-navigation-menu", () => {
  const Root = ({ children }: { children: React.ReactNode }) => (
    <nav>{children}</nav>
  );
  const List = ({ children }: { children: React.ReactNode }) => (
    <ul>{children}</ul>
  );
  const Item = ({ children }: { children: React.ReactNode }) => (
    <li>{children}</li>
  );
  const Link = ({
    children,
    active,
    asChild,
  }: {
    children: React.ReactNode;
    active?: boolean;
    asChild?: boolean;
  }) => (
    <span data-active={active || undefined}>
      {children}
    </span>
  );
  return { Root, List, Item, Link };
});

describe("DesktopNav", () => {
  const onNavigate = jest.fn();

  beforeEach(() => {
    onNavigate.mockClear();
  });

  it("renders all nav links", () => {
    render(<DesktopNav pathname="/" onNavigate={onNavigate} />);
    expect(screen.getByText("עמוד הבית")).toBeInTheDocument();
    expect(screen.getByText("לוח הופעות")).toBeInTheDocument();
    expect(screen.getByText("קטלוג הצגות")).toBeInTheDocument();
    expect(screen.getByText("תיאטראות")).toBeInTheDocument();
    expect(screen.getByText("ז׳אנרים")).toBeInTheDocument();
    expect(screen.getByText("ערים")).toBeInTheDocument();
    expect(screen.getByText("שחקנים")).toBeInTheDocument();
    expect(screen.getByText("צר.י קשר")).toBeInTheDocument();
  });

  it("marks home link as active on /", () => {
    render(<DesktopNav pathname="/" onNavigate={onNavigate} />);
    const homeWrapper = screen.getByText("עמוד הבית").closest("[data-active]");
    expect(homeWrapper).toHaveAttribute("data-active", "true");
  });

  it("marks events link as active on /events sub-path", () => {
    render(
      <DesktopNav pathname="/events/today/center" onNavigate={onNavigate} />,
    );
    const eventsWrapper = screen
      .getByText("לוח הופעות")
      .closest("[data-active]");
    expect(eventsWrapper).toHaveAttribute("data-active", "true");
  });

  it("marks contact link as active on /contact", () => {
    render(<DesktopNav pathname="/contact" onNavigate={onNavigate} />);
    const contactWrapper = screen
      .getByText("צר.י קשר")
      .closest("[data-active]");
    expect(contactWrapper).toHaveAttribute("data-active", "true");
  });

  it("calls onNavigate when a link is clicked", async () => {
    const user = userEvent.setup();
    render(<DesktopNav pathname="/" onNavigate={onNavigate} />);

    await user.click(screen.getByText("קטלוג הצגות"));
    expect(onNavigate).toHaveBeenCalled();
  });
});
