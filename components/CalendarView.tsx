"use client";

import type { FamilyEvent } from "@/types/events";
import { zhText } from "@/lib/displayText";

const typeColor: Record<string, string> = {
  company: "bg-sky",
  school: "bg-mint",
  child_activity: "bg-coral",
  family: "bg-white",
  personal: "bg-plum text-white",
  japan_holiday: "bg-blue-100 text-blue-800",
  china_reference_holiday: "bg-red-50 text-red-800"
};

export function CalendarView({ events, onDelete }: { events: FamilyEvent[]; onDelete?: (id: string) => void }) {
  const active = events.filter((event) => !event.deleted_at).sort((a, b) => `${a.date}${a.start_datetime ?? ""}`.localeCompare(`${b.date}${b.start_datetime ?? ""}`));
  return (
    <div className="rounded-md bg-white shadow-soft">
      <div className="grid grid-cols-[150px_1fr_120px] border-b border-black/10 px-4 py-3 text-sm font-medium text-black/60">
        <div>日付</div>
        <div>予定</div>
        <div>操作</div>
      </div>
      {active.map((event) => (
        <div key={event.id} className="grid grid-cols-[150px_1fr_120px] gap-3 border-b border-black/5 px-4 py-3">
          <div className="text-sm">
            <div className="font-medium">{event.date}</div>
            <div className="text-black/50">{event.start_datetime?.slice(11, 16) ?? "終日"}</div>
          </div>
          <div>
            <span className={`mb-1 inline-flex rounded px-2 py-1 text-xs ${typeColor[event.calendar_type] ?? "bg-gray-100"}`}>{event.calendar_type}</span>
            <div className="font-medium">{zhText(event.title)}</div>
            <div className="text-sm text-black/55">{zhText(event.location)} {event.need_parent_action ? "保護者対応が必要" : ""}</div>
          </div>
          <div className="flex items-center justify-end">
            {onDelete ? <button className="focus-ring rounded-md border border-black/10 px-3 py-2 text-sm hover:bg-black/5" onClick={() => onDelete(event.id)}>削除</button> : null}
          </div>
        </div>
      ))}
    </div>
  );
}
