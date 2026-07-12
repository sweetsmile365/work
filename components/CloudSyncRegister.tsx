"use client";

import { useEffect } from "react";
import { loadState } from "@/lib/db";

const syncIntervalMs = 30000;

export function CloudSyncRegister() {
  useEffect(() => {
    let stopped = false;

    const sync = () => {
      if (stopped) return;
      loadState();
    };

    const handleFocus = () => sync();
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") sync();
    };

    sync();
    const timer = window.setInterval(sync, syncIntervalMs);
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      stopped = true;
      window.clearInterval(timer);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return null;
}
