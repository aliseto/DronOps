"use client";

import { useEffect } from "react";

/** Registers the offline-shell service worker — production only, so dev and
 * e2e never fight stale caches. */
export function SwRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if ("serviceWorker" in navigator) void navigator.serviceWorker.register("/sw.js");
  }, []);
  return null;
}
