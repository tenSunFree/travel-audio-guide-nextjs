import { render, screen } from "@testing-library/react";

jest.mock("next/link", () => {
  const MockLink = ({
    children,
    href,
    className,
  }: {
    children: React.ReactNode;
    href: string;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  );
  MockLink.displayName = "MockLink";
  return MockLink;
});

const usePathnameMock = jest.fn();
jest.mock("next/navigation", () => ({
  usePathname: () => usePathnameMock(),
}));

import { AdminShell } from "./admin-shell";

describe("AdminShell", () => {
  it("renders all nav links and the children content", () => {
    usePathnameMock.mockReturnValue("/admin/articles");
    render(
      <AdminShell>
        <p>page-content</p>
      </AdminShell>,
    );
    expect(screen.getByText("文章管理")).toBeInTheDocument();
    expect(screen.getByText("商品管理")).toBeInTheDocument();
    expect(screen.getByText("page-content")).toBeInTheDocument();
  });

  it("marks the exact-match nav item active only on that exact path", () => {
    usePathnameMock.mockReturnValue("/admin/articles");
    render(<AdminShell>{null}</AdminShell>);
    expect(screen.getByText("文章管理").closest("a")).toHaveClass("active");
    expect(screen.getByText("商品管理").closest("a")).not.toHaveClass("active");
  });

  it("marks non-exact nav items active on prefix match", () => {
    usePathnameMock.mockReturnValue("/travel-items/anything");
    render(<AdminShell>{null}</AdminShell>);
    expect(screen.getByText("旅遊小物前台").closest("a")).toHaveClass("active");
  });

  it("handles a null pathname without throwing", () => {
    usePathnameMock.mockReturnValue(null);
    render(<AdminShell>{null}</AdminShell>);
    expect(screen.getByText("公開文章")).toBeInTheDocument();
  });
});
