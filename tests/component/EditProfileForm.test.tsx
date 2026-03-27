import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import EditProfileForm from "@/components/forms/EditProfileForm/EditProfileForm";

// Mock next-auth/react
const mockUpdate = jest.fn();
jest.mock("next-auth/react", () => ({
  useSession: jest.fn(() => ({
    data: {
      user: { id: "user-1", name: "יוסי כהן", email: "test@test.com" },
    },
    status: "authenticated",
    update: mockUpdate,
  })),
}));

// Mock the server action
const mockUpdateProfile = jest.fn();
jest.mock("@/app/me/actions", () => ({
  updateProfile: (...args: unknown[]) => mockUpdateProfile(...args),
}));

describe("EditProfileForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUpdateProfile.mockResolvedValue({
      success: true,
      data: { name: "שם חדש" },
    });
  });

  it("renders with current name", () => {
    render(<EditProfileForm currentName="יוסי כהן" />);

    const input = screen.getByPlaceholderText("השם שיופיע בביקורות");
    expect(input).toHaveValue("יוסי כהן");
  });

  it("has a disabled submit button when name has not changed", () => {
    render(<EditProfileForm currentName="יוסי כהן" />);

    const button = screen.getByRole("button", { name: "שמירה" });
    expect(button).toBeDisabled();
  });

  it("enables submit button when name is changed", async () => {
    const user = userEvent.setup();
    render(<EditProfileForm currentName="יוסי כהן" />);

    const input = screen.getByPlaceholderText("השם שיופיע בביקורות");
    await user.clear(input);
    await user.type(input, "שם חדש");

    const button = screen.getByRole("button", { name: "שמירה" });
    expect(button).toBeEnabled();
  });

  it("shows success message after successful update", async () => {
    const user = userEvent.setup();
    render(<EditProfileForm currentName="יוסי כהן" />);

    const input = screen.getByPlaceholderText("השם שיופיע בביקורות");
    await user.clear(input);
    await user.type(input, "שם חדש");

    const button = screen.getByRole("button", { name: "שמירה" });
    await user.click(button);

    expect(await screen.findByText("השם עודכן בהצלחה!")).toBeInTheDocument();
    expect(mockUpdate).toHaveBeenCalledWith({ name: "שם חדש" });
  });

  it("shows server error", async () => {
    mockUpdateProfile.mockResolvedValue({
      success: false,
      error: "השם מכיל שפה לא הולמת. אנא בחר.י שם אחר.",
    });

    const user = userEvent.setup();
    render(<EditProfileForm currentName="יוסי כהן" />);

    const input = screen.getByPlaceholderText("השם שיופיע בביקורות");
    await user.clear(input);
    await user.type(input, "bad name");

    const button = screen.getByRole("button", { name: "שמירה" });
    await user.click(button);

    expect(
      await screen.findByText("השם מכיל שפה לא הולמת. אנא בחר.י שם אחר."),
    ).toBeInTheDocument();
  });

  it("renders label for display name", () => {
    render(<EditProfileForm currentName="יוסי כהן" />);

    expect(screen.getByText("שם תצוגה")).toBeInTheDocument();
  });
});
