"use client";

import type { ImportCandidate, BusTimetableCandidate } from "@/types/imports";
import { OcrStatusBadge } from "./OcrStatusBadge";
import { zhText } from "@/lib/displayText";

export function ImportInboxTable({ candidates, busCandidates, onConfirm }: { candidates: ImportCandidate[]; busCandidates: BusTimetableCandidate[]; onConfirm: (id: string) => void }) {
  return (
    <div className="space-y-4">
      <section className="rounded-md bg-white p-4 shadow-soft">
        <h2 className="mb-3 font-semibold">予定候補</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="text-black/55">
              <tr><th className="p-2">日付</th><th className="p-2">タイトル</th><th className="p-2">タイプ</th><th className="p-2">信頼度</th><th className="p-2">状態</th><th className="p-2">操作</th></tr>
            </thead>
            <tbody>
              {candidates.map((item) => (
                <tr key={item.id} className={item.confidence < 0.8 || item.date_parse_status !== "ok" ? "bg-yellow-50" : ""}>
                  <td className="p-2">{item.date ?? "未解析"}</td>
                  <td className="p-2">{zhText(item.title)}<div className="text-xs text-black/45">{zhText(item.raw_text_jp)}</div></td>
                  <td className="p-2">{item.event_type}</td>
                  <td className="p-2">{Math.round(item.confidence * 100)}%</td>
                  <td className="p-2"><OcrStatusBadge status={item.confirmed ? "confirmed" : item.date_parse_status} /></td>
                  <td className="p-2">
                    <button disabled={item.confirmed || item.date_parse_status === "failed"} className="focus-ring rounded-md border border-black/10 px-3 py-2 disabled:opacity-40" onClick={() => onConfirm(item.id)}>確認して保存</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="rounded-md bg-white p-4 shadow-soft">
        <h2 className="mb-3 font-semibold">バス時刻表候補</h2>
        <div className="grid gap-2">
          {busCandidates.length === 0 ? <p className="text-sm text-black/55">バス候補はありません。</p> : busCandidates.map((item) => (
            <div key={item.id} className={`rounded-md border p-3 text-sm ${item.confidence < 0.8 ? "border-yellow-300 bg-yellow-50" : "border-black/10"}`}>
              {zhText(item.line_name)} {zhText(item.direction_name)} {item.departure_time} → {item.arrival_time ?? "未解析"} <span className="text-black/50">{Math.round(item.confidence * 100)}%</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
