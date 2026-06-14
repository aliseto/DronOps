"use client";

import { useRef, useState } from "react";
import { sha256Hex } from "../lib/hash";
import { cn } from "../lib/cn";

export interface UploadResult {
  sha256: string;
  deduped: boolean;
}

/**
 * Content-addressed upload. Hashes client-side (SHA-256), hands the file +
 * hash to the host, and shows the hash after upload (DESIGN_SYSTEM §3).
 * Duplicate uploads dedupe by hash.
 */
export function FileDrop({
  onUpload,
  className,
}: {
  onUpload: (file: File, sha256: string) => Promise<UploadResult>;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<"idle" | "hashing" | "uploading" | "done" | "error">("idle");
  const [result, setResult] = useState<{ name: string; sha256: string; deduped: boolean } | null>(
    null,
  );
  const [error, setError] = useState("");

  async function handle(file: File) {
    setError("");
    setStatus("hashing");
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const sha = await sha256Hex(bytes);
      setStatus("uploading");
      const res = await onUpload(file, sha);
      setResult({ name: file.name, sha256: res.sha256, deduped: res.deduped });
      setStatus("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
      setStatus("error");
    }
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const f = e.dataTransfer.files?.[0];
          if (f) void handle(f);
        }}
        className="flex flex-col items-center gap-1 rounded-lg border border-dashed border-default bg-inset px-6 py-8 text-small text-fg-muted hover:bg-hover"
      >
        <span>{status === "idle" || status === "done" || status === "error" ? "Drop a file or click to upload" : "Working…"}</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handle(f);
        }}
      />
      {result && (
        <p className="text-micro text-fg-secondary">
          {result.name} · <span className="font-mono text-fg-muted">sha256:{result.sha256.slice(0, 12)}…</span>
          {result.deduped && <span className="ms-1 text-status-ok-fg">(deduped)</span>}
        </p>
      )}
      {error && (
        <p role="alert" className="text-micro text-status-danger-fg">
          {error}
        </p>
      )}
    </div>
  );
}
