"use client";

import { useState } from "react";
import type { CalendarType, EventDraft, EventType } from "@/types/events";
import type { RoutePath } from "@/types/routes";
import { RouteSelector } from "./RouteSelector";
import { calculateRoutePlan } from "@/lib/routeUtils";
import { isParentTransport, normalizeTransportOwner, transportOwnerOptions } from "@/lib/transport";

const eventTypes: { value: EventType; label: string }[] = [
  { value: "family_event", label: "家族予定" },
  { value: "personal_event", label: "個人予定" },
  { value: "school_event", label: "学校予定" },
  { value: "school_holiday", label: "学校休み" },
  { value: "badminton_practice", label: "バドミントン練習" },
  { value: "badminton_tournament", label: "バドミントン大会" },
  { value: "piano_lesson", label: "ピアノ" },
  { value: "english_lesson", label: "英語" },
  { value: "chinese_lesson", label: "中国語" },
  { value: "company_meeting", label: "会社予定" },
  { value: "company_holiday", label: "会社休み" },
  { value: "travel", label: "旅行" },
  { value: "other", label: "その他" }
];

const calendarTypes: { value: CalendarType; label: string }[] = [
  { value: "family", label: "家族" },
  { value: "personal", label: "個人" },
  { value: "school", label: "学校" },
  { value: "child_activity", label: "子どもの活動" },
  { value: "company", label: "会社" },
  { value: "japan_holiday", label: "日本の祝日" },
  { value: "china_reference_holiday", label: "中国の祝日（参考）" }
];

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
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit({
          ...draft,
          transport_owner: normalizeTransportOwner(draft.transport_owner) || undefined
        });
        update({ title: "" });
      }}
    >
      <label className="grid gap-1 text-sm">
        タイトル
        <input required className="focus-ring rounded-md border border-black/10 px-3 py-2" value={draft.title} onChange={(event) => update({ title: event.target.value })} />
      </label>
      <label className="grid gap-1 text-sm">
        日付
        <input type="date" required className="focus-ring rounded-md border border-black/10 px-3 py-2" value={draft.date} onChange={(event) => update({ date: event.target.value })} />
      </label>
      <label className="grid gap-1 text-sm">
        開始時刻
        <input type="time" className="focus-ring rounded-md border border-black/10 px-3 py-2" onChange={(event) => update({ start_datetime: `${draft.date}T${event.target.value}:00+09:00`, all_day: false })} />
      </label>
      <label className="grid gap-1 text-sm">
        終了時刻
        <input type="time" className="focus-ring rounded-md border border-black/10 px-3 py-2" onChange={(event) => update({ end_datetime: `${draft.date}T${event.target.value}:00+09:00` })} />
      </label>
      <label className="grid gap-1 text-sm">
        予定タイプ
        <select className="focus-ring rounded-md border border-black/10 px-3 py-2" value={draft.event_type} onChange={(event) => update({ event_type: event.target.value as EventType })}>
          {eventTypes.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
        </select>
      </label>
      <label className="grid gap-1 text-sm">
        カレンダー
        <select className="focus-ring rounded-md border border-black/10 px-3 py-2" value={draft.calendar_type} onChange={(event) => update({ calendar_type: event.target.value as CalendarType })}>
          {calendarTypes.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
        </select>
      </label>
      <label className="grid gap-1 text-sm">
        場所
        <input className="focus-ring rounded-md border border-black/10 px-3 py-2" value={draft.location ?? ""} onChange={(event) => update({ location: event.target.value })} />
      </label>
      <label className="grid gap-1 text-sm">
        送迎担当
        <select className="focus-ring rounded-md border border-black/10 px-3 py-2" value={normalizeTransportOwner(draft.transport_owner)} onChange={(event) => {
          const owner = normalizeTransportOwner(event.target.value);
          update({
            transport_owner: owner || undefined,
            need_transport: Boolean(owner),
            pickup_required: isParentTransport(owner),
            dropoff_required: isParentTransport(owner),
            route_id: owner === "bus" ? "r2" : draft.route_id
          });
        }}>
          {transportOwnerOptions.map((option) => <option key={option.value} value={option.value}>{option.label} - {option.description}</option>)}
        </select>
      </label>
      <label className="grid gap-1 text-sm lg:col-span-2">
        ルート
        <RouteSelector routes={routes} value={draft.route_id} onChange={(routeId) => {
          const route = routes.find((item) => item.id === routeId);
          update({ route_id: routeId, need_transport: Boolean(routeId), ...calculateRoutePlan(draft.start_datetime ?? `${draft.date}T09:00:00+09:00`, route) });
        }} />
      </label>
      <div className="flex flex-wrap gap-3 text-sm lg:col-span-2">
        <label className="flex items-center gap-2"><input type="checkbox" checked={Boolean(draft.need_parent_action)} onChange={(event) => update({ need_parent_action: event.target.checked })} />保護者対応が必要</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={Boolean(draft.pickup_required)} onChange={(event) => update({ pickup_required: event.target.checked })} />迎えが必要</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={Boolean(draft.dropoff_required)} onChange={(event) => update({ dropoff_required: event.target.checked })} />送りが必要</label>
      </div>
      <button className="focus-ring rounded-md bg-ink px-4 py-2 text-white lg:col-span-2">予定を保存</button>
    </form>
  );
}
