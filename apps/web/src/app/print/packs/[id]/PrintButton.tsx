"use client";

export function PrintButton() {
  return (
    <button onClick={() => window.print()} className="rounded-md border border-strong px-3 py-1 text-small text-fg-secondary hover:border-accent">
      Print / Save as PDF
    </button>
  );
}
