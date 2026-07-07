"use client";

import type { FamilyEvent } from "@/types/events";
import { zhText } from "@/lib/displayText";

export function TodayCard({ events }: { events: FamilyEvent[] }) {
  const today = new Date().toISOString().slice(0, 10);
  const todays = events.filter((event) => event.date === today && !event.deleted_at);
  return (
    <section className="rounded-md bg-white p-4 shadow-soft">
      <h2 className="mb-3 font-semibold">今日の予定</h2>
      <div className="space-y-2">
        {todays.length === 0 ? <p className="text-sm text-black/55">今日は登録済みの予定がありません。</p> : todays.map((event) => (
          <div key={event.id} className="rounded-md border border-black/10 p-3">
            <div className="font-medium">{zhText(event.title)}</div>
            <div className="text-sm text-black/55">{event.start_datetime?.slice(11, 16) ?? "終日"} {zhText(event.location)}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
