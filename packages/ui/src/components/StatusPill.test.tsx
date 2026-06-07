import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { StatusPill } from "./StatusPill";
import { Button } from "./Button";

afterEach(cleanup);

describe("StatusPill", () => {
  it("renders the mapped label with text (not color alone)", () => {
    render(<StatusPill domain="mission" status="sealed" />);
    expect(screen.getByText("Sealed")).toBeDefined();
  });

  it("renders an optional detail suffix", () => {
    render(<StatusPill domain="currency" status="expiring" detail="12 d" />);
    expect(screen.getByText("Expiring")).toBeDefined();
    expect(screen.getByText("12 d")).toBeDefined();
  });

  it("includes an icon svg so state is never color-only", () => {
    const { container } = render(<StatusPill domain="ncr" status="open" />);
    expect(container.querySelector("svg")).not.toBeNull();
  });
});

describe("Button", () => {
  it("defaults to type=button", () => {
    render(<Button>Approve mission</Button>);
    const btn = screen.getByRole("button", { name: "Approve mission" });
    expect(btn.getAttribute("type")).toBe("button");
  });
});
