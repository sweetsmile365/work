"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { refreshCloudStateNow } from "@/lib/db";
import { useResponsiveLayout } from "@/lib/useResponsiveLayout";

type RefreshStatus = "idle" | "loading" | "done" | "error";

export function CloudRefreshButton() {
  const { isMobile } = useResponsiveLayout();
  const [status, setStatus] = useState<RefreshStatus>("idle");

  async function handleRefresh() {
    if (status === "loading") return;
    setStatus("loading");
    try {
      await refreshCloudStateNow();
      setStatus("done");
      window.setTimeout(() => setStatus("idle"), 1800);
    } catch {
      setStatus("error");
      window.setTimeout(() => setStatus("idle"), 2400);
    }
  }

  const label = status === "loading" ? "更新中" : status === "done" ? "更新しました" : status === "error" ? "更新できません" : "更新";

  return (
    <button
      type="button"
      aria-label="クラウドから最新データを更新"
      onClick={handleRefresh}
      disabled={status === "loading"}
      className={`fixed z-50 flex min-h-11 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white/95 px-4 text-sm font-semibold text-slate-800 shadow-lg shadow-slate-900/10 backdrop-blur transition hover:bg-slate-50 disabled:opacity-70 ${
        isMobile
          ? "bottom-[calc(88px+env(safe-area-inset-bottom))] right-4"
          : "right-5 top-5"
      }`}
    >
      <RefreshCw size={18} className={status === "loading" ? "animate-spin" : ""} />
      <span>{label}</span>
    </button>
  );
}
