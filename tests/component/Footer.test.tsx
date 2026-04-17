import { render, screen } from "@testing-library/react";
import Footer from "@/components/layout/Footer/Footer";

jest.mock("@/lib/fonts", () => ({
  titleFont: { variable: "mock-font-variable" },
}));

describe("Footer", () => {
  it("renders navigation links", () => {
    render(<Footer />);
    expect(screen.getByRole("link", { name: "דף הבית" })).toHaveAttribute(
      "href",
      "/",
    );
    expect(screen.getByRole("link", { name: "קטלוג הצגות" })).toHaveAttribute(
      "href",
      "/shows",
    );
    expect(screen.getByRole("link", { name: "תיאטראות" })).toHaveAttribute(
      "href",
      "/theatres",
    );
  });

  it("renders current year in copyright text", () => {
    render(<Footer />);
    const year = new Date().getFullYear().toString();
    expect(screen.getByText(new RegExp(`© ${year}`))).toBeInTheDocument();
  });

  it("renders contact link", () => {
    render(<Footer />);
    const link = screen.getByRole("link", { name: "צר.י קשר" });
    expect(link).toHaveAttribute("href", "/contact");
  });

  it("renders Facebook group link", () => {
    render(<Footer />);
    const link = screen.getByRole("link", {
      name: "קבוצת פייסבוק (נפתח בחלון חדש)",
    });
    expect(link).toHaveAttribute(
      "href",
      "https://www.facebook.com/groups/965299379184440",
    );
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("renders brand name and tagline", () => {
    render(<Footer />);
    expect(screen.getByText("תיאטרון בישראל")).toBeInTheDocument();
    expect(
      screen.getByText(
        "ביקורות אמיתיות, המלצות חכמות, וערבים טובים יותר.",
      ),
    ).toBeInTheDocument();
  });

  it("renders back-to-top button", () => {
    render(<Footer />);
    expect(
      screen.getByRole("button", { name: "חזרה לראש הדף" }),
    ).toBeInTheDocument();
  });

  it("renders about and accessibility links", () => {
    render(<Footer />);
    expect(screen.getByRole("link", { name: "אודות" })).toHaveAttribute(
      "href",
      "/about",
    );
    expect(
      screen.getByRole("link", { name: "הצהרת נגישות" }),
    ).toHaveAttribute("href", "/accessibility");
  });
});
