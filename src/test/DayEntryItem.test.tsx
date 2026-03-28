import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import DayEntryItem from "@/components/menu/DayEntryItem";
import type { DayEntry } from "@/types";

vi.mock("@dnd-kit/sortable", () => ({
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: () => {},
    transform: null,
    transition: null,
    isDragging: false,
  }),
}));

vi.mock("@dnd-kit/utilities", () => ({
  CSS: { Transform: { toString: () => "" } },
}));

function makeEntry(overrides: Partial<DayEntry> = {}): DayEntry {
  return { id: "entry-1", type: "text", text: "Takeout Night", ...overrides };
}

describe("DayEntryItem — text/note entry", () => {
  it("renders the entry text", () => {
    render(<DayEntryItem entry={makeEntry()} onRemove={() => {}} />);
    expect(screen.getByText("Takeout Night")).toBeInTheDocument();
  });

  it("shows remove button when not readOnly", () => {
    render(<DayEntryItem entry={makeEntry()} onRemove={() => {}} />);
    expect(screen.getByLabelText("Remove")).toBeInTheDocument();
  });

  it("hides remove button when readOnly", () => {
    render(<DayEntryItem entry={makeEntry()} onRemove={() => {}} readOnly />);
    expect(screen.queryByLabelText("Remove")).not.toBeInTheDocument();
  });

  it("calls onRemove when remove button is clicked", () => {
    const onRemove = vi.fn();
    render(<DayEntryItem entry={makeEntry()} onRemove={onRemove} />);
    fireEvent.click(screen.getByLabelText("Remove"));
    expect(onRemove).toHaveBeenCalledOnce();
  });

  it("calls onOpen when the entry is tapped", () => {
    const onOpen = vi.fn();
    render(<DayEntryItem entry={makeEntry()} onRemove={() => {}} onOpen={onOpen} />);
    fireEvent.click(screen.getByText("Takeout Night"));
    expect(onOpen).toHaveBeenCalledOnce();
  });

  it("does not render a tappable button when onOpen is not provided", () => {
    render(<DayEntryItem entry={makeEntry()} onRemove={() => {}} />);
    // text is present but not inside a button
    const text = screen.getByText("Takeout Night");
    expect(text.closest("button")).toBeNull();
  });
});

describe("DayEntryItem — recipe entry", () => {
  it("renders the recipe title", () => {
    const entry = makeEntry({ type: "recipe", recipeTitle: "Pasta Carbonara", recipeId: "123" });
    render(<DayEntryItem entry={entry} onRemove={() => {}} />);
    expect(screen.getByText("Pasta Carbonara")).toBeInTheDocument();
  });
});

describe("DayEntryItem — custom recipe entry", () => {
  it("renders the custom recipe title", () => {
    const entry = makeEntry({ type: "custom-recipe", recipeTitle: "Mom's Chili", customRecipeId: "custom_1" });
    render(<DayEntryItem entry={entry} onRemove={() => {}} />);
    expect(screen.getByText("Mom's Chili")).toBeInTheDocument();
  });
});

describe("DayEntryItem — event entry", () => {
  it("renders the event text", () => {
    const entry = makeEntry({ type: "event", text: "🎉 Easter Brunch" });
    render(<DayEntryItem entry={entry} onRemove={() => {}} />);
    expect(screen.getByText("🎉 Easter Brunch")).toBeInTheDocument();
  });

  it("shows the amber banner styling", () => {
    const entry = makeEntry({ type: "event", text: "🎂 Birthday" });
    const { container } = render(<DayEntryItem entry={entry} onRemove={() => {}} />);
    expect(container.querySelector(".bg-amber-50")).toBeInTheDocument();
  });

  it("shows remove button on event when not readOnly", () => {
    const entry = makeEntry({ type: "event", text: "🎉 Easter" });
    render(<DayEntryItem entry={entry} onRemove={() => {}} />);
    expect(screen.getByLabelText("Remove")).toBeInTheDocument();
  });

  it("hides remove button on event when readOnly", () => {
    const entry = makeEntry({ type: "event", text: "🎉 Easter" });
    render(<DayEntryItem entry={entry} onRemove={() => {}} readOnly />);
    expect(screen.queryByLabelText("Remove")).not.toBeInTheDocument();
  });

  it("calls onOpen when event banner is tapped", () => {
    const onOpen = vi.fn();
    const entry = makeEntry({ type: "event", text: "🎉 Easter Brunch" });
    render(<DayEntryItem entry={entry} onRemove={() => {}} onOpen={onOpen} />);
    fireEvent.click(screen.getByText("🎉 Easter Brunch"));
    expect(onOpen).toHaveBeenCalledOnce();
  });
});

describe("DayEntryItem — drag handle", () => {
  it("shows drag handle when sortable and not readOnly", () => {
    render(<DayEntryItem entry={makeEntry()} onRemove={() => {}} sortable />);
    expect(screen.getByLabelText("Drag to reorder")).toBeInTheDocument();
  });

  it("hides drag handle when not sortable", () => {
    render(<DayEntryItem entry={makeEntry()} onRemove={() => {}} sortable={false} />);
    expect(screen.queryByLabelText("Drag to reorder")).not.toBeInTheDocument();
  });

  it("hides drag handle when readOnly even if sortable", () => {
    render(<DayEntryItem entry={makeEntry()} onRemove={() => {}} sortable readOnly />);
    expect(screen.queryByLabelText("Drag to reorder")).not.toBeInTheDocument();
  });
});
