import { render, screen } from "@testing-library/react";
import ShareButtons from "@/components/ShareButtons/ShareButtons";

describe("ShareButtons", () => {
  it("renders WhatsApp and Facebook links", () => {
    render(<ShareButtons text="הצגה מעולה" url="/shows/test" />);
    expect(screen.getByLabelText("שתפ.י בוואטסאפ")).toBeInTheDocument();
    expect(screen.getByLabelText("שתפ.י בפייסבוק")).toBeInTheDocument();
  });

  it("builds correct WhatsApp URL with encoded text and URL", () => {
    render(<ShareButtons text="הצגה" url="https://example.com/show" />);
    const link = screen.getByLabelText("שתפ.י בוואטסאפ");
    expect(link).toHaveAttribute(
      "href",
      expect.stringContaining("api.whatsapp.com/send?text="),
    );
    expect(link).toHaveAttribute(
      "href",
      expect.stringContaining(encodeURIComponent("הצגה")),
    );
  });

  it("builds correct Facebook sharer URL", () => {
    render(<ShareButtons text="הצגה" url="https://example.com/show" />);
    const link = screen.getByLabelText("שתפ.י בפייסבוק");
    expect(link).toHaveAttribute(
      "href",
      expect.stringContaining("facebook.com/sharer/sharer.php?u="),
    );
  });

  it("opens links in new tab", () => {
    render(<ShareButtons text="הצגה" url="/shows/test" />);
    const links = screen.getAllByRole("link");
    links.forEach((link) => {
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
    });
  });
});
