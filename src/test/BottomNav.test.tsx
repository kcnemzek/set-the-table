import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import BottomNav from "@/components/layout/BottomNav";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}));

import { usePathname } from "next/navigation";
const mockPathname = vi.mocked(usePathname);

describe("BottomNav", () => {
  it("renders all four tabs", () => {
    mockPathname.mockReturnValue("/menu");
    render(<BottomNav />);
    expect(screen.getByText("Menu")).toBeInTheDocument();
    expect(screen.getByText("My Kitchen")).toBeInTheDocument();
    expect(screen.getByText("Groceries")).toBeInTheDocument();
    expect(screen.getByText("Events")).toBeInTheDocument();
  });

  it("returns null on /view routes", () => {
    mockPathname.mockReturnValue("/view/abc123");
    const { container } = render(<BottomNav />);
    expect(container.firstChild).toBeNull();
  });

  it("marks Menu tab as active on /menu", () => {
    mockPathname.mockReturnValue("/menu");
    render(<BottomNav />);
    const menuLink = screen.getByText("Menu").closest("a");
    expect(menuLink?.className).toContain("text-brand-500");
  });

  it("marks My Kitchen tab as active on /recipes", () => {
    mockPathname.mockReturnValue("/recipes");
    render(<BottomNav />);
    const recipesLink = screen.getByText("My Kitchen").closest("a");
    expect(recipesLink?.className).toContain("text-brand-500");
  });

  it("marks Groceries tab as active on /groceries", () => {
    mockPathname.mockReturnValue("/groceries");
    render(<BottomNav />);
    const groceriesLink = screen.getByText("Groceries").closest("a");
    expect(groceriesLink?.className).toContain("text-brand-500");
  });

  it("marks Events tab as active on /event-planning", () => {
    mockPathname.mockReturnValue("/event-planning");
    render(<BottomNav />);
    const eventsLink = screen.getByText("Events").closest("a");
    expect(eventsLink?.className).toContain("text-brand-500");
  });

  it("marks no tab as active on an unrelated route", () => {
    mockPathname.mockReturnValue("/login");
    render(<BottomNav />);
    ["Menu", "My Kitchen", "Groceries", "Events"].forEach((label) => {
      const link = screen.getByText(label).closest("a");
      expect(link?.className).not.toContain("text-brand-500");
    });
  });

  it("links point to correct hrefs", () => {
    mockPathname.mockReturnValue("/menu");
    render(<BottomNav />);
    expect(screen.getByText("Menu").closest("a")).toHaveAttribute("href", "/menu");
    expect(screen.getByText("My Kitchen").closest("a")).toHaveAttribute("href", "/recipes");
    expect(screen.getByText("Groceries").closest("a")).toHaveAttribute("href", "/groceries");
    expect(screen.getByText("Events").closest("a")).toHaveAttribute("href", "/event-planning");
  });
});
