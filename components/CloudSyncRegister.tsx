"use client";

import { useEffect } from "react";
import { refreshCloudStateNow } from "@/lib/db";

const syncIntervalMs = 30000;

export function CloudSyncRegister() {
  useEffect(() => {
    let stopped = false;

    const sync = async () => {
      if (stopped) return;
      const result = await refreshCloudStateNow();
      if (!stopped && result === "downloaded") window.location.reload();
    };

    const handleFocus = () => { void sync(); };
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") void sync();
    };

    void sync();
    const timer = window.setInterval(() => { void sync(); }, syncIntervalMs);
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
