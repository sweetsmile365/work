"use client";

export function OcrStatusBadge({ status }: { status: string }) {
  const cls = status === "success" ? "bg-mint text-green-900" : status === "failed" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800";
  return <span className={`inline-flex rounded px-2 py-1 text-xs font-medium ${cls}`}>{status}</span>;
}
