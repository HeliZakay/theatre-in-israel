import { render, screen } from "@testing-library/react";
import ContentWithSidebar from "@/components/ContentWithSidebar/ContentWithSidebar";

describe("ContentWithSidebar", () => {
  it("renders main content children", () => {
    render(
      <ContentWithSidebar sidebar={<div>sidebar</div>}>
        <p>main content</p>
      </ContentWithSidebar>
    );
    expect(screen.getByText("main content")).toBeInTheDocument();
  });

  it("renders sidebar content", () => {
    render(
      <ContentWithSidebar sidebar={<p>sidebar content</p>}>
        <div>main</div>
      </ContentWithSidebar>
    );
    expect(screen.getByText("sidebar content")).toBeInTheDocument();
  });

  it("renders sidebar inside an aside element", () => {
    render(
      <ContentWithSidebar sidebar={<p>sidebar</p>}>
        <div>main</div>
      </ContentWithSidebar>
    );
    const aside = screen.getByText("sidebar").closest("aside");
    expect(aside).toBeInTheDocument();
  });
});
