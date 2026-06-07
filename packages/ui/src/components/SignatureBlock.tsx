import { cn } from "../lib/cn";

/** Renders a completed signature: signer + UTC + hash tail (records and PDFs). */
export function SignatureBlock({
  signerName,
  meaning,
  signedAtUtc,
  payloadHash,
  method,
  className,
}: {
  signerName: string;
  meaning: string;
  signedAtUtc: string;
  payloadHash: string;
  method: "password" | "passkey";
  className?: string;
}) {
  return (
    <div className={cn("rounded-md border border-default bg-inset p-3", className)}>
      <p className="text-small text-fg-primary">{meaning}</p>
      <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-micro text-fg-muted">
        <dt>Signed by</dt>
        <dd className="text-fg-secondary">{signerName}</dd>
        <dt>When (UTC)</dt>
        <dd className="font-mono tabular-nums">{signedAtUtc}</dd>
        <dt>Method</dt>
        <dd>{method}</dd>
        <dt>Hash</dt>
        <dd className="font-mono">…{payloadHash.slice(-16)}</dd>
      </dl>
    </div>
  );
}
