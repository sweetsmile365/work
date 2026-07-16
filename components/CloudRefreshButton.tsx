"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { refreshCloudStateNow } from "@/lib/db";
import { useResponsiveLayout } from "@/lib/useResponsiveLayout";
import type { CloudSyncResult } from "@/lib/cloudState";

type RefreshStatus = "idle" | "loading" | "done" | "uploaded" | "downloaded" | "error";

export function CloudRefreshButton() {
  const { isMobile } = useResponsiveLayout();
  const [status, setStatus] = useState<RefreshStatus>("idle");

  async function handleRefresh() {
    if (status === "loading") return;
    setStatus("loading");
    try {
      const result = (await refreshCloudStateNow()) as CloudSyncResult | undefined;
      setStatus(result === "uploaded" ? "uploaded" : result === "downloaded" ? "downloaded" : result === "failed" ? "error" : "done");
      window.setTimeout(() => setStatus("idle"), 1800);
    } catch {
      setStatus("error");
      window.setTimeout(() => setStatus("idle"), 2400);
    }
  }

  const label =
    status === "loading" ? "同期中" :
    status === "uploaded" ? "アップロード済み" :
    status === "downloaded" ? "取得しました" :
    status === "done" ? "最新です" :
    status === "error" ? "同期不可" :
    "同期";

  return (
    <button
      type="button"
      aria-label="クラウドと同期"
      onClick={handleRefresh}
      disabled={status === "loading"}
      className={`fixed z-50 flex min-h-11 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white/95 px-4 text-sm font-semibold text-slate-800 shadow-lg shadow-slate-900/10 backdrop-blur transition hover:bg-slate-50 disabled:opacity-70 ${
        isMobile ? "bottom-[calc(88px+env(safe-area-inset-bottom))] right-4" : "bottom-5 right-5"
      }`}
    >
      <RefreshCw size={18} className={status === "loading" ? "animate-spin" : ""} />
      <span>{label}</span>
    </button>
  );
}
