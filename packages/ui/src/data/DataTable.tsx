"use client";

import { useMemo, useRef, useState, type ReactNode } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { cn } from "../lib/cn";

export interface Column<T> {
  key: string;
  header: ReactNode;
  /** Cell renderer; defaults to String(accessor(row)). */
  cell?: (row: T) => ReactNode;
  /** Sort/filter/CSV value. */
  accessor?: (row: T) => string | number;
  sortable?: boolean;
  width?: string; // CSS grid track, default "1fr"
}

type SortDir = "asc" | "desc";

export interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  getRowId: (row: T) => string;
  onRowClick?: (row: T) => void;
  selectable?: boolean;
  selected?: Set<string>;
  onSelectedChange?: (next: Set<string>) => void;
  loading?: boolean;
  empty?: ReactNode;
  /** Enables the CSV export button with this base filename. */
  csvFileName?: string;
  height?: number;
}

const ROW_PX = { compact: 36, comfortable: 48 } as const;

export function DataTable<T>({
  columns,
  rows,
  getRowId,
  onRowClick,
  selectable,
  selected,
  onSelectedChange,
  loading,
  empty,
  csvFileName,
  height = 480,
}: DataTableProps<T>) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [density, setDensity] = useState<keyof typeof ROW_PX>("compact");
  const scrollRef = useRef<HTMLDivElement>(null);

  const accessorFor = (col: Column<T>) => col.accessor ?? (() => "");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      columns.some((c) => String(accessorFor(c)(r)).toLowerCase().includes(q)),
    );
  }, [rows, columns, query]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    const col = columns.find((c) => c.key === sortKey);
    if (!col) return filtered;
    const acc = accessorFor(col);
    const dir = sortDir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const av = acc(a);
      const bv = acc(b);
      return (av < bv ? -1 : av > bv ? 1 : 0) * dir;
    });
  }, [filtered, columns, sortKey, sortDir]);

  const rowVirtualizer = useVirtualizer({
    count: sorted.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_PX[density],
    overscan: 12,
  });

  const gridCols = [selectable ? "40px" : null, ...columns.map((c) => c.width ?? "1fr")]
    .filter(Boolean)
    .join(" ");

  const toggleSort = (col: Column<T>) => {
    if (!col.sortable) return;
    if (sortKey === col.key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(col.key);
      setSortDir("asc");
    }
  };

  const allSelected =
    selectable && sorted.length > 0 && sorted.every((r) => selected?.has(getRowId(r)));
  const toggleAll = () => {
    if (!onSelectedChange) return;
    onSelectedChange(allSelected ? new Set() : new Set(sorted.map(getRowId)));
  };

  const exportCsv = () => {
    const header = columns.map((c) => csvCell(stringHeader(c.header))).join(",");
    const body = sorted
      .map((r) => columns.map((c) => csvCell(String(accessorFor(c)(r)))).join(","))
      .join("\n");
    const blob = new Blob([`${header}\n${body}`], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${csvFileName}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter…"
          aria-label="Filter rows"
          className="w-56 rounded-md border border-default bg-inset px-3 py-1.5 text-small text-fg-primary placeholder:text-fg-muted focus-visible:border-focus"
        />
        <span className="text-micro text-fg-muted">{sorted.length} rows</span>
        <div className="ms-auto flex items-center gap-2">
          {selectable && selected && selected.size > 0 && (
            <span className="text-micro text-fg-secondary">{selected.size} selected</span>
          )}
          <button
            type="button"
            onClick={() => setDensity((d) => (d === "compact" ? "comfortable" : "compact"))}
            className="rounded-md border border-default px-2 py-1 text-micro text-fg-secondary hover:bg-hover"
          >
            {density === "compact" ? "Comfortable" : "Compact"}
          </button>
          {csvFileName && (
            <button
              type="button"
              onClick={exportCsv}
              className="rounded-md border border-default px-2 py-1 text-micro text-fg-secondary hover:bg-hover"
            >
              Export CSV
            </button>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-default">
        {/* header */}
        <div
          role="row"
          className="grid items-center border-b border-default bg-inset text-micro font-medium text-fg-secondary"
          style={{ gridTemplateColumns: gridCols }}
        >
          {selectable && (
            <div className="flex items-center justify-center py-2">
              <input
                type="checkbox"
                aria-label="Select all"
                checked={!!allSelected}
                onChange={toggleAll}
                className="h-4 w-4 accent-[var(--accent)]"
              />
            </div>
          )}
          {columns.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => toggleSort(c)}
              className={cn(
                "flex items-center gap-1 px-3 py-2 text-start",
                c.sortable ? "hover:text-fg-primary" : "cursor-default",
              )}
            >
              {c.header}
              {sortKey === c.key && <span aria-hidden>{sortDir === "asc" ? "▲" : "▼"}</span>}
            </button>
          ))}
        </div>

        {/* body */}
        {loading ? (
          <div className="divide-y divide-subtle">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-9 animate-pulse bg-inset motion-reduce:animate-none" />
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div className="p-6">{empty ?? <p className="text-small text-fg-muted">No rows.</p>}</div>
        ) : (
          <div ref={scrollRef} style={{ height, overflow: "auto" }}>
            <div style={{ height: rowVirtualizer.getTotalSize(), position: "relative" }}>
              {rowVirtualizer.getVirtualItems().map((vi) => {
                const row = sorted[vi.index]!;
                const id = getRowId(row);
                return (
                  <div
                    key={id}
                    role="row"
                    onClick={() => onRowClick?.(row)}
                    className={cn(
                      "absolute left-0 grid w-full items-center border-b border-subtle text-small text-fg-primary",
                      onRowClick && "cursor-pointer hover:bg-hover",
                    )}
                    style={{
                      gridTemplateColumns: gridCols,
                      height: vi.size,
                      transform: `translateY(${vi.start}px)`,
                    }}
                  >
                    {selectable && (
                      <div
                        className="flex items-center justify-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          aria-label="Select row"
                          checked={!!selected?.has(id)}
                          onChange={() => {
                            if (!onSelectedChange) return;
                            const next = new Set(selected);
                            if (next.has(id)) next.delete(id);
                            else next.add(id);
                            onSelectedChange(next);
                          }}
                          className="h-4 w-4 accent-[var(--accent)]"
                        />
                      </div>
                    )}
                    {columns.map((c) => (
                      <div key={c.key} className="truncate px-3 py-2">
                        {c.cell ? c.cell(row) : String(accessorFor(c)(row))}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function stringHeader(h: ReactNode): string {
  return typeof h === "string" ? h : "";
}
function csvCell(v: string): string {
  return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}
