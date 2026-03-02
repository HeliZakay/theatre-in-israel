import { render, screen } from "@testing-library/react";
import ReviewAuthGateway from "@/components/ReviewAuthGateway/ReviewAuthGateway";

describe("ReviewAuthGateway", () => {
  const callbackUrl = "/shows/hamlet/review";

  it("renders the title and subtitle", () => {
    render(<ReviewAuthGateway callbackUrl={callbackUrl} />);
    expect(screen.getByText("כתיבת ביקורת")).toBeInTheDocument();
    expect(screen.getByText("איך תרצה להמשיך?")).toBeInTheDocument();
  });

  it("signup link includes encoded callbackUrl", () => {
    render(<ReviewAuthGateway callbackUrl={callbackUrl} />);
    const signupLink = screen.getByRole("link", { name: "הרשמה" });
    expect(signupLink).toHaveAttribute(
      "href",
      `/auth/signup?callbackUrl=${encodeURIComponent(callbackUrl)}`,
    );
  });

  it("signin link includes encoded callbackUrl", () => {
    render(<ReviewAuthGateway callbackUrl={callbackUrl} />);
    const signinLink = screen.getByRole("link", { name: "התחברות" });
    expect(signinLink).toHaveAttribute(
      "href",
      `/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`,
    );
  });

  it("guest link points to callbackUrl with guest param", () => {
    render(<ReviewAuthGateway callbackUrl={callbackUrl} />);
    const guestLink = screen.getByRole("link", { name: "המשך בלי חשבון" });
    expect(guestLink).toHaveAttribute("href", `${callbackUrl}?guest=1`);
  });

  it("back link uses backUrl when provided", () => {
    render(
      <ReviewAuthGateway callbackUrl={callbackUrl} backUrl="/shows/hamlet" />,
    );
    const backLink = screen.getByRole("link", { name: /חזרה/ });
    expect(backLink).toHaveAttribute("href", "/shows/hamlet");
  });

  it("back link falls back to home when backUrl is omitted", () => {
    render(<ReviewAuthGateway callbackUrl={callbackUrl} />);
    const backLink = screen.getByRole("link", { name: /חזרה/ });
    expect(backLink).toHaveAttribute("href", "/");
  });

  it("shows the benefit note about editing reviews", () => {
    render(<ReviewAuthGateway callbackUrl={callbackUrl} />);
    expect(
      screen.getByText("עם חשבון תוכל.י לערוך ולמחוק ביקורות"),
    ).toBeInTheDocument();
  });
});
