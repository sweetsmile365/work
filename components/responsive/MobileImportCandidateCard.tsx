"use client";

import { useState } from "react";
import type { ImportCandidate } from "@/types/imports";
import type { EventType } from "@/types/events";
import { zhText } from "@/lib/displayText";

const eventTypeOptions: { value: EventType; label: string }[] = [
  { value: "school_event", label: "学校予定" },
  { value: "school_holiday", label: "学校休み" },
  { value: "school_interview", label: "面談 / 保護者会" },
  { value: "exam", label: "テスト" },
  { value: "badminton_practice", label: "バドミントン練習" },
  { value: "badminton_tournament", label: "バドミントン大会" },
  { value: "piano_lesson", label: "ピアノ" },
  { value: "english_lesson", label: "英語" },
  { value: "chinese_lesson", label: "中国語" },
  { value: "deadline", label: "提出 / 締切" },
  { value: "other", label: "その他" }
];

export function MobileImportCandidateCard({
  candidate,
  onConfirm,
  onIgnore,
  onUpdate
}: {
  candidate: ImportCandidate;
  onConfirm: () => void;
  onIgnore: () => void;
  onUpdate: (patch: Partial<ImportCandidate>) => void;
}) {
  const [editing, setEditing] = useState(false);
  const risky = candidate.confidence < 0.8 || candidate.date_parse_status !== "ok";
  const weekday = candidate.date ? new Intl.DateTimeFormat("ja-JP", { weekday: "short" }).format(new Date(`${candidate.date}T00:00:00+09:00`)) : "未解析";
  if (candidate.ignored) return null;

  return (
    <article className={`rounded-xl border p-4 shadow-sm ${risky ? "border-amber-300 bg-amber-50" : "border-slate-200 bg-white"} ${candidate.confirmed ? "opacity-60" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xl font-bold text-slate-950">{candidate.date ?? "日付未解析"} <span className="text-base text-slate-500">{weekday}</span></div>
          {editing ? (
            <input className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-3 text-base" value={candidate.title} onChange={(event) => onUpdate({ title: event.target.value })} />
          ) : (
            <h3 className="mt-1 text-lg font-semibold">{zhText(candidate.title)}</h3>
          )}
        </div>
        <span className="shrink-0 rounded-full bg-white px-2 py-1 text-sm font-semibold text-slate-700">{Math.round(candidate.confidence * 100)}%</span>
      </div>

      {editing ? (
        <div className="mt-3 grid gap-3">
          <label className="grid gap-1 text-sm font-medium">
            日付
            <input className="h-11 rounded-lg border border-slate-200 px-3 text-base" type="date" value={candidate.date ?? ""} onChange={(event) => onUpdate({ date: event.target.value, date_parse_status: event.target.value ? "ok" : "failed" })} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-1 text-sm font-medium">開始<input className="h-11 rounded-lg border border-slate-200 px-3 text-base" type="time" value={candidate.start_time ?? ""} onChange={(event) => onUpdate({ start_time: event.target.value })} /></label>
            <label className="grid gap-1 text-sm font-medium">終了<input className="h-11 rounded-lg border border-slate-200 px-3 text-base" type="time" value={candidate.end_time ?? ""} onChange={(event) => onUpdate({ end_time: event.target.value })} /></label>
          </div>
          <label className="grid gap-1 text-sm font-medium">
            種類
            <select className="h-11 rounded-lg border border-slate-200 px-3 text-base" value={candidate.event_type} onChange={(event) => onUpdate({ event_type: event.target.value as EventType })}>
              {eventTypeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
        </div>
      ) : null}

      <details className="mt-3 rounded-lg bg-white/70 p-3 text-base text-slate-600">
        <summary className="cursor-pointer font-medium">OCR 原文</summary>
        <p className="mt-2 whitespace-pre-wrap">{zhText(candidate.raw_text_jp)}</p>
      </details>

      <div className="mt-3 flex flex-wrap gap-2 text-sm">
        <span className="rounded-full bg-slate-100 px-3 py-1">{eventTypeOptions.find((item) => item.value === candidate.event_type)?.label ?? candidate.event_type}</span>
        {candidate.date_parse_note ? <span className="rounded-full bg-amber-200 px-3 py-1 font-medium text-amber-900">{candidate.date_parse_note}</span> : null}
        {risky ? <span className="rounded-full bg-amber-200 px-3 py-1 font-medium text-amber-900">確認注意</span> : null}
        {candidate.confirmed ? <span className="rounded-full bg-emerald-100 px-3 py-1 font-medium text-emerald-800">確認済み</span> : null}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <button className="min-h-11 rounded-lg bg-blue-600 px-3 font-semibold text-white disabled:opacity-40" disabled={candidate.confirmed || candidate.date_parse_status === "failed"} onClick={onConfirm}>確認</button>
        <button className="min-h-11 rounded-lg border border-slate-200 bg-white px-3 font-semibold" onClick={() => setEditing((value) => !value)}>{editing ? "閉じる" : "修正"}</button>
        <button className="min-h-11 rounded-lg border border-slate-200 bg-white px-3 font-semibold" disabled={candidate.confirmed} onClick={onIgnore}>無視</button>
      </div>
    </article>
  );
}
