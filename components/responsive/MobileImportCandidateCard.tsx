"use client";

import type { ImportCandidate } from "@/types/imports";
import { zhText } from "@/lib/displayText";

export function MobileImportCandidateCard({ candidate, onConfirm }: { candidate: ImportCandidate; onConfirm: () => void }) {
  const risky = candidate.confidence < 0.8 || candidate.date_parse_status !== "ok";
  const weekday = candidate.date ? new Intl.DateTimeFormat("ja-JP", { weekday: "short" }).format(new Date(`${candidate.date}T00:00:00+09:00`)) : "未解析";
  return (
    <article className={`rounded-xl border p-4 shadow-sm ${risky ? "border-amber-300 bg-amber-50" : "border-slate-200 bg-white"}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xl font-bold text-slate-950">{candidate.date ?? "日付未解析"} <span className="text-base text-slate-500">{weekday}</span></div>
          <h3 className="mt-1 text-lg font-semibold">{zhText(candidate.title)}</h3>
        </div>
        <span className="rounded-full bg-white px-2 py-1 text-sm font-semibold text-slate-700">{Math.round(candidate.confidence * 100)}%</span>
      </div>
      <details className="mt-3 rounded-lg bg-white/70 p-3 text-base text-slate-600">
        <summary className="cursor-pointer font-medium">OCR 原文</summary>
        <p className="mt-2">{zhText(candidate.raw_text_jp)}</p>
      </details>
      <div className="mt-3 flex flex-wrap gap-2 text-sm">
        <span className="rounded-full bg-slate-100 px-3 py-1">{candidate.event_type}</span>
        {risky ? <span className="rounded-full bg-amber-200 px-3 py-1 font-medium text-amber-900">確認注意</span> : null}
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        <button className="min-h-11 rounded-lg bg-blue-600 px-3 font-semibold text-white disabled:opacity-40" disabled={candidate.confirmed || candidate.date_parse_status === "failed"} onClick={onConfirm}>確認</button>
        <button className="min-h-11 rounded-lg border border-slate-200 bg-white px-3 font-semibold">修改</button>
        <button className="min-h-11 rounded-lg border border-slate-200 bg-white px-3 font-semibold">忽略</button>
      </div>
    </article>
  );
}
