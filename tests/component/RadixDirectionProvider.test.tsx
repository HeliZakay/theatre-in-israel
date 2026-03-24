import { render, screen } from "@testing-library/react";

jest.mock("@radix-ui/react-direction", () => ({
  DirectionProvider: ({
    children,
    dir,
  }: {
    children: React.ReactNode;
    dir: string;
  }) => <div data-dir={dir}>{children}</div>,
}));

import RadixDirectionProvider from "@/components/RadixDirectionProvider/RadixDirectionProvider";

describe("RadixDirectionProvider", () => {
  it("renders children", () => {
    render(
      <RadixDirectionProvider>
        <p>child</p>
      </RadixDirectionProvider>
    );
    expect(screen.getByText("child")).toBeInTheDocument();
  });

  it("defaults to dir='rtl'", () => {
    render(
      <RadixDirectionProvider>
        <p>child</p>
      </RadixDirectionProvider>
    );
    expect(screen.getByText("child").parentElement).toHaveAttribute(
      "data-dir",
      "rtl"
    );
  });

  it("accepts custom dir prop", () => {
    render(
      <RadixDirectionProvider dir="ltr">
        <p>child</p>
      </RadixDirectionProvider>
    );
    expect(screen.getByText("child").parentElement).toHaveAttribute(
      "data-dir",
      "ltr"
    );
  });
});
