"use client";

import { useState } from "react";
import { Modal } from "../overlays/Modal";
import { Button } from "./Button";
import { Input } from "./Input";
import { SignatureBlock } from "./SignatureBlock";

export interface SignatureResult {
  signerName: string;
  signedAtUtc: string;
  payloadHash: string;
  method: "password" | "passkey";
}

export interface SignProof {
  method: "password" | "passkey";
  password?: string;
}

/**
 * Tier-3 ceremony (UX_SYSTEM §6): the meaning statement is shown BEFORE re-auth;
 * the result block (signer, UTC, hash tail) appears immediately after. One
 * signature, one meaning — never batched. Role-gating is enforced server-side
 * in onSign.
 */
export function SignatureCeremony({
  open,
  onClose,
  meaning,
  onSign,
}: {
  open: boolean;
  onClose: () => void;
  meaning: string;
  onSign: (proof: SignProof) => Promise<SignatureResult>;
}) {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<SignatureResult | null>(null);

  async function sign(proof: SignProof) {
    setBusy(true);
    setError("");
    try {
      setResult(await onSign(proof));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Signing failed");
    } finally {
      setBusy(false);
    }
  }

  const close = () => {
    setPassword("");
    setError("");
    setResult(null);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title="Sign to confirm"
      footer={
        result ? (
          <Button size="sm" onClick={close}>
            Done
          </Button>
        ) : (
          <>
            <Button variant="secondary" size="sm" onClick={close}>
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={busy || password.length === 0}
              onClick={() => void sign({ method: "password", password })}
            >
              {busy ? "Signing…" : "Sign"}
            </Button>
          </>
        )
      }
    >
      {result ? (
        <SignatureBlock {...result} meaning={meaning} />
      ) : (
        <div className="flex flex-col gap-3">
          {/* meaning BEFORE re-auth */}
          <p className="rounded-md bg-inset p-3 text-small text-fg-primary">{meaning}</p>
          <label className="flex flex-col gap-1 text-small text-fg-secondary">
            Confirm your password
            <Input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <Button
            variant="secondary"
            size="sm"
            disabled={busy}
            onClick={() => void sign({ method: "passkey" })}
          >
            Use passkey instead
          </Button>
          {error && (
            <p role="alert" className="text-small text-status-danger-fg">
              {error}
            </p>
          )}
        </div>
      )}
    </Modal>
  );
}
