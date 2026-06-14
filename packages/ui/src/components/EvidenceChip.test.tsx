import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { EvidenceChip } from "./EvidenceChip";

afterEach(cleanup);

describe("EvidenceChip", () => {
  it("labels the grade as text (not color alone)", () => {
    render(<EvidenceChip grade="manual" />);
    expect(screen.getByText("Manual entry")).toBeDefined();
  });

  it("shows only the last 8 chars of a content hash, in an ellipsis tail", () => {
    render(<EvidenceChip grade="telemetry" hash="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855" />);
    expect(screen.getByText("…7852b855")).toBeDefined();
  });

  it("keeps short hashes intact behind the ellipsis", () => {
    render(<EvidenceChip grade="cloud" hash="abc123" />);
    expect(screen.getByText("…abc123")).toBeDefined();
  });

  it("omits the hash tail when no hash is given", () => {
    const { container } = render(<EvidenceChip grade="telemetry" />);
    expect(container.querySelector(".font-mono")).toBeNull();
  });
});
