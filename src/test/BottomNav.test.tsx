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
  it("renders all six tabs", () => {
    mockPathname.mockReturnValue("/menu");
    render(<BottomNav />);
    expect(screen.getByText("Menu")).toBeInTheDocument();
    expect(screen.getByText("Discover")).toBeInTheDocument();
    expect(screen.getByText("My Kitchen")).toBeInTheDocument();
    expect(screen.getByText("Groceries")).toBeInTheDocument();
    expect(screen.getByText("Events")).toBeInTheDocument();
    expect(screen.getByText("Settings")).toBeInTheDocument();
  });

  it("returns null on /view routes", () => {
    mockPathname.mockReturnValue("/view/abc123");
    const { container } = render(<BottomNav />);
    expect(container.firstChild).toBeNull();
  });

  it("returns null on /login", () => {
    mockPathname.mockReturnValue("/login");
    const { container } = render(<BottomNav />);
    expect(container.firstChild).toBeNull();
  });

  it("marks Menu tab as active on /menu", () => {
    mockPathname.mockReturnValue("/menu");
    render(<BottomNav />);
    expect(screen.getByText("Menu").closest("a")?.className).toContain("text-white");
  });

  it("marks My Kitchen tab as active on /recipes", () => {
    mockPathname.mockReturnValue("/recipes");
    render(<BottomNav />);
    expect(screen.getByText("My Kitchen").closest("a")?.className).toContain("text-white");
  });

  it("marks Groceries tab as active on /groceries", () => {
    mockPathname.mockReturnValue("/groceries");
    render(<BottomNav />);
    expect(screen.getByText("Groceries").closest("a")?.className).toContain("text-white");
  });

  it("marks Events tab as active on /event-planning", () => {
    mockPathname.mockReturnValue("/event-planning");
    render(<BottomNav />);
    expect(screen.getByText("Events").closest("a")?.className).toContain("text-white");
  });

  it("marks Settings tab as active on /settings", () => {
    mockPathname.mockReturnValue("/settings");
    render(<BottomNav />);
    expect(screen.getByText("Settings").closest("a")?.className).toContain("text-white");
  });

  it("marks no tab as active on an unrelated route", () => {
    mockPathname.mockReturnValue("/unknown");
    render(<BottomNav />);
    ["Menu", "Discover", "My Kitchen", "Groceries", "Events", "Settings"].forEach((label) => {
      expect(screen.getByText(label).closest("a")?.className).toContain("text-blue-300");
    });
  });

  it("links point to correct hrefs", () => {
    mockPathname.mockReturnValue("/menu");
    render(<BottomNav />);
    expect(screen.getByText("Menu").closest("a")).toHaveAttribute("href", "/menu");
    expect(screen.getByText("Discover").closest("a")).toHaveAttribute("href", "/discover");
    expect(screen.getByText("My Kitchen").closest("a")).toHaveAttribute("href", "/recipes");
    expect(screen.getByText("Groceries").closest("a")).toHaveAttribute("href", "/groceries");
    expect(screen.getByText("Events").closest("a")).toHaveAttribute("href", "/event-planning");
    expect(screen.getByText("Settings").closest("a")).toHaveAttribute("href", "/settings");
  });
});
