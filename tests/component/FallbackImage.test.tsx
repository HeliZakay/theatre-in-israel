import { render, screen, fireEvent } from "@testing-library/react";
import FallbackImage from "@/components/FallbackImage/FallbackImage";

describe("FallbackImage", () => {
  it("renders an image with the given src and alt", () => {
    render(
      <FallbackImage
        src="/show.jpg"
        alt="Show poster"
        width={300}
        height={400}
      />,
    );
    const img = screen.getByRole("img", { name: "Show poster" });
    expect(img).toHaveAttribute("src", "/show.jpg");
  });

  it("swaps src to fallbackSrc on image error", () => {
    render(
      <FallbackImage
        src="/missing.jpg"
        alt="Missing"
        fallbackSrc="/fallback.png"
        width={300}
        height={400}
      />,
    );
    const img = screen.getByRole("img", { name: "Missing" });
    fireEvent.error(img);
    expect(img).toHaveAttribute("src", "/fallback.png");
  });

  it("calls the onError callback prop when error occurs", () => {
    const onError = jest.fn();
    render(
      <FallbackImage
        src="/missing.jpg"
        alt="Missing"
        onError={onError}
        width={300}
        height={400}
      />,
    );
    fireEvent.error(screen.getByRole("img", { name: "Missing" }));
    expect(onError).toHaveBeenCalledTimes(1);
  });

  it("does not swap src if no error occurs", () => {
    render(
      <FallbackImage
        src="/show.jpg"
        alt="Show"
        fallbackSrc="/fallback.png"
        width={300}
        height={400}
      />,
    );
    expect(screen.getByRole("img", { name: "Show" })).toHaveAttribute(
      "src",
      "/show.jpg",
    );
  });
});
