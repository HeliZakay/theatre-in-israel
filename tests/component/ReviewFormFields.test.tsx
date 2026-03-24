import { render, screen } from "@testing-library/react";
import { useForm } from "react-hook-form";
import ReviewFormFields from "@/components/ReviewFormFields/ReviewFormFields";

jest.mock("@/components/AppSelect/AppSelect", () => {
  const MockSelect = (props: Record<string, unknown>) => (
    <select aria-label={props.ariaLabel as string} data-testid="rating-select">
      <option>mock</option>
    </select>
  );
  MockSelect.displayName = "MockAppSelect";
  return { __esModule: true, default: MockSelect };
});

jest.mock("@/lib/reviewSchemas", () => ({
  ratingOptions: [
    { value: "5", label: "5" },
    { value: "4", label: "4" },
  ],
}));

type FormValues = { title: string; rating: string; text: string };

function Wrapper(overrides: Partial<Parameters<typeof ReviewFormFields>[0]> = {}) {
  const { register, control, formState } = useForm<FormValues>({
    defaultValues: { title: "", rating: "", text: "" },
  });

  return (
    <ReviewFormFields
      register={register}
      control={control}
      errors={formState.errors}
      titleValue=""
      textValue=""
      {...overrides}
    />
  );
}

describe("ReviewFormFields", () => {
  it("renders title input, textarea, and rating select", () => {
    render(<Wrapper />);
    expect(screen.getByText("כותרת הביקורת (לא חובה)")).toBeInTheDocument();
    expect(screen.getByText("תגובה")).toBeInTheDocument();
    expect(screen.getByText("דירוג")).toBeInTheDocument();
  });

  it("shows character counters", () => {
    render(<Wrapper titleValue="abc" textValue="hello" />);
    expect(screen.getByText("3/120")).toBeInTheDocument();
    expect(screen.getByText("5/5000")).toBeInTheDocument();
  });

  it("hides rating field when hideRating is true", () => {
    render(<Wrapper hideRating />);
    expect(screen.queryByText("דירוג")).not.toBeInTheDocument();
  });
});
