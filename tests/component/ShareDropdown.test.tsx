import { render, screen } from "@testing-library/react";

jest.mock("@radix-ui/react-dropdown-menu", () => {
  const Passthrough = ({ children }: { children?: React.ReactNode }) => (
    <div>{children}</div>
  );
  return {
    Root: Passthrough,
    Trigger: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
    Portal: Passthrough,
    Content: Passthrough,
    Item: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
  };
});

import ShareDropdown from "@/components/ShareDropdown/ShareDropdown";

describe("ShareDropdown", () => {
  const props = {
    url: "/shows/test-show",
    title: "הצגת טסט",
    theatre: "תיאטרון הקאמרי",
  };

  it("renders share trigger button", () => {
    render(<ShareDropdown {...props} />);
    expect(screen.getByLabelText("שיתוף")).toBeInTheDocument();
  });

  it("contains WhatsApp link", () => {
    render(<ShareDropdown {...props} />);
    const links = screen.getAllByRole("link");
    const whatsapp = links.find((l) => l.textContent?.includes("WhatsApp"));
    expect(whatsapp).toBeInTheDocument();
    expect(whatsapp).toHaveAttribute(
      "href",
      expect.stringContaining("api.whatsapp.com")
    );
  });

  it("contains Facebook link", () => {
    render(<ShareDropdown {...props} />);
    const links = screen.getAllByRole("link");
    const facebook = links.find((l) => l.textContent?.includes("Facebook"));
    expect(facebook).toBeInTheDocument();
    expect(facebook).toHaveAttribute(
      "href",
      expect.stringContaining("facebook.com/sharer")
    );
  });
});
