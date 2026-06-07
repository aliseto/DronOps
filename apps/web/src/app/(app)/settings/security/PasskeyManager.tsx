"use client";

import { useState } from "react";
import { startRegistration } from "@simplewebauthn/browser";
import { Button } from "@dronops/ui";
import { completePasskeyEnrollment, startPasskeyEnrollment } from "./actions";

type State = "idle" | "working" | "done" | "error";

export function PasskeyManager() {
  const [state, setState] = useState<State>("idle");
  const [message, setMessage] = useState<string>("");

  async function enroll() {
    setState("working");
    setMessage("");
    try {
      const options = await startPasskeyEnrollment();
      const response = await startRegistration({ optionsJSON: options });
      const result = await completePasskeyEnrollment(response, "This device");
      if (result.verified) {
        setState("done");
        setMessage("Passkey registered.");
      } else {
        setState("error");
        setMessage("Could not verify the passkey.");
      }
    } catch (err) {
      setState("error");
      setMessage(err instanceof Error ? err.message : "Enrollment failed.");
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-small text-fg-muted">
        Passkeys are used to sign consequential actions (approvals, seals). Register one on this
        device.
      </p>
      <Button onClick={() => void enroll()} disabled={state === "working"} className="self-start">
        {state === "working" ? "Waiting for device…" : "Add passkey"}
      </Button>
      {message && (
        <p
          role="status"
          className={
            state === "error" ? "text-small text-status-danger-fg" : "text-small text-status-ok-fg"
          }
        >
          {message}
        </p>
      )}
    </div>
  );
}
