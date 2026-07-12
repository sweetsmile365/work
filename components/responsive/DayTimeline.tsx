"use client";

import { Clock, MapPin } from "lucide-react";
import { zhText } from "@/lib/displayText";
import type { FamilyEvent } from "@/types/events";

const hourHeight = 64;
const minEventHeight = 44;

function minutesFromDateTime(value?: string) {
  if (!value) return null;
  const time = value.slice(11, 16);
  const [hour, minute] = time.split(":").map(Number);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
  return hour * 60 + minute;
}

function timeText(event: FamilyEvent) {
  if (event.all_day) return "終日";
  const start = event.start_datetime?.slice(11, 16);
  const end = event.end_datetime?.slice(11, 16);
  if (start && end) return `${start} - ${end}`;
  return start ?? "時間未設定";
}

function eventTone(event: FamilyEvent) {
  if (event.calendar_type === "japan_holiday") return "border-blue-200 bg-blue-50 text-blue-950";
  if (event.calendar_type === "school" || event.calendar_type === "child_activity") return "border-emerald-200 bg-emerald-50 text-emerald-950";
  if (event.calendar_type === "company") return "border-sky-200 bg-sky-50 text-sky-950";
  if (event.calendar_type === "personal") return "border-rose-200 bg-rose-50 text-rose-950";
  return "border-amber-200 bg-amber-50 text-amber-950";
}

export function DayTimeline({
  events,
  date,
  onEventClick
}: {
  events: FamilyEvent[];
  date: string;
  onEventClick?: (event: FamilyEvent) => void;
}) {
  const dayEvents = events
    .filter((event) => !event.deleted_at && event.date === date)
    .sort((a, b) => `${a.start_datetime ?? ""}`.localeCompare(`${b.start_datetime ?? ""}`));

  const floatingEvents = dayEvents.filter((event) => event.all_day || minutesFromDateTime(event.start_datetime) === null);
  const timedEvents = dayEvents.filter((event) => !event.all_day && minutesFromDateTime(event.start_datetime) !== null);

  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-base font-semibold text-slate-500">{date}</p>
          <h2 className="text-xl font-bold text-slate-950">24時間スケジュール</h2>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600">{dayEvents.length}件</span>
      </div>

      {floatingEvents.length ? (
        <div className="mb-4 space-y-2">
          {floatingEvents.map((event) => (
            <button
              key={event.id}
              className={`w-full rounded-xl border px-4 py-3 text-left ${eventTone(event)}`}
              onClick={() => onEventClick?.(event)}
            >
              <div className="text-base font-bold">{timeText(event)} {zhText(event.title)}</div>
              {event.location ? <div className="mt-1 text-sm opacity-75">{zhText(event.location)}</div> : null}
            </button>
          ))}
        </div>
      ) : null}

      <div className="relative overflow-hidden rounded-xl border border-slate-200">
        <div className="relative" style={{ height: hourHeight * 24 }}>
          {Array.from({ length: 24 }, (_, hour) => (
            <div key={hour} className="absolute left-0 right-0 border-t border-slate-100" style={{ top: hour * hourHeight }}>
              <div className="w-14 pt-1 text-center text-sm font-semibold text-slate-400">{String(hour).padStart(2, "0")}:00</div>
            </div>
          ))}

          {timedEvents.map((event, index) => {
            const start = minutesFromDateTime(event.start_datetime) ?? 0;
            const end = minutesFromDateTime(event.end_datetime) ?? start + 45;
            const top = (start / 60) * hourHeight;
            const height = Math.max(((Math.max(end, start + 20) - start) / 60) * hourHeight, minEventHeight);
            const laneOffset = (index % 2) * 10;

            return (
              <button
                key={event.id}
                className={`absolute left-16 right-2 rounded-xl border px-3 py-2 text-left shadow-sm ${eventTone(event)}`}
                style={{ top, minHeight: height, transform: `translateX(${laneOffset}px)`, width: `calc(100% - ${72 + laneOffset}px)` }}
                onClick={() => onEventClick?.(event)}
              >
                <div className="flex items-center gap-1 text-sm font-bold">
                  <Clock size={15} />
                  {timeText(event)}
                </div>
                <div className="mt-1 text-base font-bold leading-snug">{zhText(event.title)}</div>
                {event.location ? (
                  <div className="mt-1 flex items-center gap-1 text-sm opacity-75">
                    <MapPin size={14} />
                    {zhText(event.location)}
                  </div>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
