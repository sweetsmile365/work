"use client";

import { useState } from "react";
import type { EventDraft, EventType, CalendarType } from "@/types/events";
import type { RoutePath } from "@/types/routes";
import { RouteSelector } from "./RouteSelector";
import { calculateRoutePlan } from "@/lib/routeUtils";

const eventTypes: EventType[] = ["family_event", "personal_event", "school_event", "school_holiday", "badminton_practice", "badminton_tournament", "piano_lesson", "english_lesson", "chinese_lesson", "company_meeting", "company_holiday", "travel", "other"];
const calendarTypes: CalendarType[] = ["family", "personal", "school", "child_activity", "company", "japan_holiday", "china_reference_holiday"];

export function EventForm({ routes, onSubmit }: { routes: RoutePath[]; onSubmit: (draft: EventDraft) => void }) {
  const [draft, setDraft] = useState<EventDraft>({
    title: "",
    event_type: "family_event",
    calendar_type: "family",
    date: new Date().toISOString().slice(0, 10),
    visibility: "family",
    all_day: false
  });
  const update = (patch: Partial<EventDraft>) => setDraft((prev) => ({ ...prev, ...patch }));
  return (
    <form
      className="grid gap-4 rounded-md bg-white p-4 shadow-soft lg:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(draft);
        update({ title: "" });
      }}
    >
      <label className="grid gap-1 text-sm">タイトル<input required className="focus-ring rounded-md border border-black/10 px-3 py-2" value={draft.title} onChange={(e) => update({ title: e.target.value })} /></label>
      <label className="grid gap-1 text-sm">日付<input type="date" required className="focus-ring rounded-md border border-black/10 px-3 py-2" value={draft.date} onChange={(e) => update({ date: e.target.value })} /></label>
      <label className="grid gap-1 text-sm">開始時刻<input type="time" className="focus-ring rounded-md border border-black/10 px-3 py-2" onChange={(e) => update({ start_datetime: `${draft.date}T${e.target.value}:00+09:00`, all_day: false })} /></label>
      <label className="grid gap-1 text-sm">終了時刻<input type="time" className="focus-ring rounded-md border border-black/10 px-3 py-2" onChange={(e) => update({ end_datetime: `${draft.date}T${e.target.value}:00+09:00` })} /></label>
      <label className="grid gap-1 text-sm">予定タイプ<select className="focus-ring rounded-md border border-black/10 px-3 py-2" value={draft.event_type} onChange={(e) => update({ event_type: e.target.value as EventType })}>{eventTypes.map((type) => <option key={type}>{type}</option>)}</select></label>
      <label className="grid gap-1 text-sm">カレンダー<select className="focus-ring rounded-md border border-black/10 px-3 py-2" value={draft.calendar_type} onChange={(e) => update({ calendar_type: e.target.value as CalendarType })}>{calendarTypes.map((type) => <option key={type}>{type}</option>)}</select></label>
      <label className="grid gap-1 text-sm">場所<input className="focus-ring rounded-md border border-black/10 px-3 py-2" value={draft.location ?? ""} onChange={(e) => update({ location: e.target.value })} /></label>
      <label className="grid gap-1 text-sm">送迎担当<input className="focus-ring rounded-md border border-black/10 px-3 py-2" value={draft.transport_owner ?? ""} onChange={(e) => update({ transport_owner: e.target.value })} /></label>
      <label className="grid gap-1 text-sm lg:col-span-2">ルート<RouteSelector routes={routes} value={draft.route_id} onChange={(routeId) => {
        const route = routes.find((item) => item.id === routeId);
        update({ route_id: routeId, need_transport: Boolean(routeId), ...calculateRoutePlan(draft.start_datetime ?? `${draft.date}T09:00:00+09:00`, route) });
      }} /></label>
      <div className="flex flex-wrap gap-3 text-sm lg:col-span-2">
        <label className="flex items-center gap-2"><input type="checkbox" checked={Boolean(draft.need_parent_action)} onChange={(e) => update({ need_parent_action: e.target.checked })} />保護者対応が必要</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={Boolean(draft.pickup_required)} onChange={(e) => update({ pickup_required: e.target.checked })} />迎えが必要</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={Boolean(draft.dropoff_required)} onChange={(e) => update({ dropoff_required: e.target.checked })} />送りが必要</label>
      </div>
      <button className="focus-ring rounded-md bg-ink px-4 py-2 text-white lg:col-span-2">予定を保存</button>
    </form>
  );
}
