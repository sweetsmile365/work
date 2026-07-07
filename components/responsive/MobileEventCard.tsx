"use client";

import { Clock, MapPin, Route, UserRound } from "lucide-react";
import type { FamilyEvent } from "@/types/events";
import { zhText } from "@/lib/displayText";

function timeLabel(event: FamilyEvent) {
  if (event.all_day) return "終日";
  const start = event.start_datetime?.slice(11, 16);
  const end = event.end_datetime?.slice(11, 16);
  if (start && end) return `${start} - ${end}`;
  return start ?? "時間未設定";
}

function typeLabel(event: FamilyEvent) {
  if (event.calendar_type === "school") return "学校";
  if (event.calendar_type === "child_activity") return "活動";
  if (event.calendar_type === "company") return "会社";
  if (event.calendar_type === "japan_holiday") return "祝日";
  if (event.calendar_type === "family") return "家族";
  return "予定";
}

export function MobileEventCard({ event, onClick }: { event: FamilyEvent; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="w-full rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xl font-bold text-slate-950">{timeLabel(event)}</div>
          <h3 className="mt-1 text-lg font-semibold leading-snug text-slate-900">{zhText(event.title)}</h3>
        </div>
        <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">{typeLabel(event)}</span>
      </div>
      <div className="mt-3 grid gap-2 text-base text-slate-600">
        {event.location ? <span className="flex items-center gap-2"><MapPin size={18} />{zhText(event.location)}</span> : null}
        {event.transport_owner ? <span className="flex items-center gap-2"><UserRound size={18} />送迎：{event.transport_owner}</span> : null}
        {event.route_id || event.bus_timetable_id ? <span className="flex items-center gap-2"><Route size={18} />ルート確認あり</span> : null}
        {!event.all_day && event.start_datetime ? <span className="flex items-center gap-2"><Clock size={18} />出発時間を確認</span> : null}
      </div>
    </button>
  );
}
