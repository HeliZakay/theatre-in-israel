import { render, screen } from "@testing-library/react";
import EventsFAQ from "@/components/Events/EventsFAQ";

jest.mock("@/lib/seo", () => ({
  toJsonLd: (v: unknown) => JSON.stringify(v),
}));

describe("EventsFAQ", () => {
  it("renders the heading", () => {
    render(<EventsFAQ />);
    expect(
      screen.getByRole("heading", { name: "שאלות נפוצות" }),
    ).toBeInTheDocument();
  });

  it("renders all 5 FAQ items as details/summary", () => {
    render(<EventsFAQ />);
    const groups = screen.getAllByRole("group");
    expect(groups).toHaveLength(5);
  });

  it("contains JSON-LD script tag with FAQPage type", () => {
    const { container } = render(<EventsFAQ />);
    const script = container.querySelector(
      'script[type="application/ld+json"]',
    );
    expect(script).not.toBeNull();
    const json = JSON.parse(script!.textContent!);
    expect(json["@type"]).toBe("FAQPage");
  });
});
