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

  // ── Branch coverage improvements ──

  it("handles StaticImport src with default key", () => {
    const staticSrc = {
      default: { src: "/static.png", width: 100, height: 100 },
    };
    render(
      <FallbackImage
        src={staticSrc as any}
        alt="Static"
        width={300}
        height={400}
      />,
    );
    expect(screen.getByRole("img", { name: "Static" })).toBeInTheDocument();
  });

  it("handles StaticImport src without default key", () => {
    const staticSrc = { src: "/imported.png", width: 100, height: 100 };
    render(
      <FallbackImage
        src={staticSrc as any}
        alt="Imported"
        width={300}
        height={400}
      />,
    );
    expect(screen.getByRole("img", { name: "Imported" })).toBeInTheDocument();
  });

  it("does not re-trigger fallback on second error", () => {
    const onError = jest.fn();
    render(
      <FallbackImage
        src="/missing.jpg"
        alt="Double error"
        fallbackSrc="/fallback.png"
        onError={onError}
        width={300}
        height={400}
      />,
    );
    const img = screen.getByRole("img", { name: "Double error" });

    // First error → swaps to fallback
    fireEvent.error(img);
    expect(img).toHaveAttribute("src", "/fallback.png");

    // Second error → should still call onError but src stays the same
    fireEvent.error(img);
    expect(img).toHaveAttribute("src", "/fallback.png");
    expect(onError).toHaveBeenCalledTimes(2);
  });

  it("uses default fallbackSrc when not provided", () => {
    render(
      <FallbackImage
        src="/missing.jpg"
        alt="Default fallback"
        width={300}
        height={400}
      />,
    );
    const img = screen.getByRole("img", { name: "Default fallback" });
    fireEvent.error(img);
    expect(img).toHaveAttribute("src", "/show-img-default.png");
  });
});
