jest.mock("@/app/contact/actions", () => ({
  sendContactMessage: jest.fn(),
}));

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ContactForm from "@/components/forms/ContactForm/ContactForm";
import { sendContactMessage } from "@/app/contact/actions";

describe("ContactForm", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it("renders all form fields", () => {
    render(<ContactForm />);
    expect(screen.getByPlaceholderText("השם שלך")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("example@email.com"),
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText("מה תרצ.י לשתף?")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "שלח.י הודעה" }),
    ).toBeInTheDocument();
  });

  it("shows validation errors when submitting empty form", async () => {
    const user = userEvent.setup();
    render(<ContactForm />);

    await user.click(screen.getByRole("button", { name: "שלח.י הודעה" }));

    await waitFor(() => {
      const alerts = screen.getAllByRole("alert");
      expect(alerts.length).toBeGreaterThanOrEqual(2);
    });
  });

  it("shows validation error for invalid email", async () => {
    const user = userEvent.setup();
    render(<ContactForm />);

    await user.type(screen.getByPlaceholderText("השם שלך"), "יוסי כהן");
    await user.type(
      screen.getByPlaceholderText("example@email.com"),
      "bademail",
    );
    await user.type(
      screen.getByPlaceholderText("מה תרצ.י לשתף?"),
      "הודעה טובה מאוד מספיק ארוכה",
    );

    await user.click(screen.getByRole("button", { name: "שלח.י הודעה" }));

    await waitFor(() => {
      expect(screen.getByText("כתובת אימייל לא תקינה")).toBeInTheDocument();
    });
  });

  it("shows validation error for too-short message", async () => {
    const user = userEvent.setup();
    render(<ContactForm />);

    await user.type(screen.getByPlaceholderText("השם שלך"), "יוסי");
    await user.type(
      screen.getByPlaceholderText("example@email.com"),
      "test@test.com",
    );
    await user.type(screen.getByPlaceholderText("מה תרצ.י לשתף?"), "קצר");

    await user.click(screen.getByRole("button", { name: "שלח.י הודעה" }));

    await waitFor(() => {
      expect(screen.getByText(/הודעה חייבת להכיל לפחות/)).toBeInTheDocument();
    });
  });

  it("shows success banner after successful submission", async () => {
    const user = userEvent.setup();
    (sendContactMessage as jest.Mock).mockResolvedValueOnce({ success: true });

    render(<ContactForm />);

    await user.type(screen.getByPlaceholderText("השם שלך"), "יוסי כהן");
    await user.type(
      screen.getByPlaceholderText("example@email.com"),
      "test@example.com",
    );
    await user.type(
      screen.getByPlaceholderText("מה תרצ.י לשתף?"),
      "הודעה טובה מאוד שמכילה מספיק תווים",
    );

    await user.click(screen.getByRole("button", { name: "שלח.י הודעה" }));

    await waitFor(() => {
      expect(screen.getByRole("status")).toBeInTheDocument();
      expect(screen.getByText("ההודעה נשלחה בהצלחה!")).toBeInTheDocument();
    });
  });

  it("hides the form after success", async () => {
    const user = userEvent.setup();
    (sendContactMessage as jest.Mock).mockResolvedValueOnce({ success: true });

    render(<ContactForm />);

    await user.type(screen.getByPlaceholderText("השם שלך"), "יוסי כהן");
    await user.type(
      screen.getByPlaceholderText("example@email.com"),
      "test@example.com",
    );
    await user.type(
      screen.getByPlaceholderText("מה תרצ.י לשתף?"),
      "הודעה טובה מאוד שמכילה מספיק תווים",
    );

    await user.click(screen.getByRole("button", { name: "שלח.י הודעה" }));

    await waitFor(() => {
      expect(screen.queryByPlaceholderText("השם שלך")).not.toBeInTheDocument();
    });
  });

  it("shows server error from failed action result", async () => {
    const user = userEvent.setup();
    (sendContactMessage as jest.Mock).mockResolvedValueOnce({
      success: false,
      error: "שגיאה בשרת",
    });

    render(<ContactForm />);

    await user.type(screen.getByPlaceholderText("השם שלך"), "יוסי כהן");
    await user.type(
      screen.getByPlaceholderText("example@email.com"),
      "test@example.com",
    );
    await user.type(
      screen.getByPlaceholderText("מה תרצ.י לשתף?"),
      "הודעה טובה מאוד שמכילה מספיק תווים",
    );

    await user.click(screen.getByRole("button", { name: "שלח.י הודעה" }));

    await waitFor(() => {
      expect(screen.getByText("שגיאה בשרת")).toBeInTheDocument();
    });
  });

  it("shows network error message when action throws", async () => {
    const user = userEvent.setup();
    (sendContactMessage as jest.Mock).mockRejectedValueOnce(
      new Error("Network error"),
    );

    render(<ContactForm />);

    await user.type(screen.getByPlaceholderText("השם שלך"), "יוסי כהן");
    await user.type(
      screen.getByPlaceholderText("example@email.com"),
      "test@example.com",
    );
    await user.type(
      screen.getByPlaceholderText("מה תרצ.י לשתף?"),
      "הודעה טובה מאוד שמכילה מספיק תווים",
    );

    await user.click(screen.getByRole("button", { name: "שלח.י הודעה" }));

    await waitFor(() => {
      expect(
        screen.getByText("שגיאה בחיבור לשרת. נס.י שוב."),
      ).toBeInTheDocument();
    });
  });

  it("updates character counter as user types", async () => {
    const user = userEvent.setup();
    render(<ContactForm />);

    const textarea = screen.getByPlaceholderText("מה תרצ.י לשתף?");
    await user.type(textarea, "שלום עולם");

    expect(screen.getByText(/9\/1000/)).toBeInTheDocument();
  });

  it("contains a honeypot field hidden from users", () => {
    const { container } = render(<ContactForm />);
    const honeypot = container.querySelector('input[name="website"]');
    expect(honeypot).toBeInTheDocument();
    expect(honeypot).toHaveAttribute("tabIndex", "-1");
  });
});
