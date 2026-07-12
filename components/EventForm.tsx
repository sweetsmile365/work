"use client";

import { useState } from "react";
import type { CalendarType, EventDraft, EventType } from "@/types/events";
import type { RoutePath } from "@/types/routes";
import { RouteSelector } from "./RouteSelector";
import { calculateRoutePlan } from "@/lib/routeUtils";
import { isParentTransport, normalizeTransportOwner, transportOwnerOptions } from "@/lib/transport";

const eventTypes: { value: EventType; label: string; calendarType: CalendarType }[] = [
  { value: "family_event", label: "家族予定", calendarType: "family" },
  { value: "personal_event", label: "個人予定", calendarType: "personal" },
  { value: "school_event", label: "学校予定", calendarType: "school" },
  { value: "school_holiday", label: "学校休み", calendarType: "school" },
  { value: "badminton_practice", label: "バドミントン練習", calendarType: "child_activity" },
  { value: "badminton_tournament", label: "バドミントン大会", calendarType: "child_activity" },
  { value: "piano_lesson", label: "ピアノ", calendarType: "child_activity" },
  { value: "english_lesson", label: "英語", calendarType: "child_activity" },
  { value: "chinese_lesson", label: "中国語", calendarType: "child_activity" },
  { value: "company_meeting", label: "会社予定", calendarType: "company" },
  { value: "company_holiday", label: "会社休み", calendarType: "company" },
  { value: "travel", label: "旅行", calendarType: "family" },
  { value: "other", label: "その他", calendarType: "family" }
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
  const today = new Date().toISOString().slice(0, 10);
  const [isMultiDay, setIsMultiDay] = useState(false);
  const [endDate, setEndDate] = useState(today);
  const [draft, setDraft] = useState<EventDraft>({
    title: "",
    event_type: "family_event",
    calendar_type: "family",
    date: today,
    visibility: "family",
    all_day: false,
    start_datetime: `${today}T09:00:00+09:00`,
    end_datetime: `${today}T10:00:00+09:00`
  });
  const update = (patch: Partial<EventDraft>) => setDraft((prev) => ({ ...prev, ...patch }));

  function addDays(dateKey: string, days: number) {
    const date = new Date(`${dateKey}T00:00:00+09:00`);
    date.setDate(date.getDate() + days);
    return date.toISOString().slice(0, 10);
  }

  function dateRange(start: string, end: string) {
    const range: string[] = [];
    let cursor = start;
    const safeEnd = end < start ? start : end;
    while (cursor <= safeEnd && range.length < 366) {
      range.push(cursor);
      cursor = addDays(cursor, 1);
    }
    return range;
  }

  function draftForDate(base: EventDraft, date: string): EventDraft {
    return {
      ...base,
      date,
      start_datetime: base.start_datetime ? `${date}T${base.start_datetime.slice(11, 16)}:00+09:00` : undefined,
      end_datetime: base.end_datetime ? `${date}T${base.end_datetime.slice(11, 16)}:00+09:00` : undefined
    };
  }

  function updateEventType(value: EventType) {
    const option = eventTypes.find((item) => item.value === value);
    update({ event_type: value, calendar_type: option?.calendarType ?? draft.calendar_type });
  }

  return (
    <form
      className="grid gap-4 rounded-lg bg-white p-4 shadow-soft lg:grid-cols-2"
      onSubmit={(event) => {
        event.preventDefault();
        const baseDraft = {
          ...draft,
          title: draft.title.trim(),
          transport_owner: normalizeTransportOwner(draft.transport_owner) || undefined
        };
        const dates = isMultiDay ? dateRange(draft.date, endDate) : [draft.date];
        dates.forEach((date) => onSubmit(draftForDate(baseDraft, date)));
        setDraft({ ...draft, title: "" });
        setIsMultiDay(false);
        setEndDate(draft.date);
      }}
    >
      <label className="grid gap-1 text-base font-medium lg:col-span-2">
        タイトル
        <input required className="focus-ring h-12 rounded-lg border border-black/10 px-3 text-base" value={draft.title} onChange={(event) => update({ title: event.target.value })} placeholder="例：ピアノレッスン" />
      </label>

      <label className="grid gap-1 text-base font-medium">
        日付
        <input type="date" required className="focus-ring h-12 rounded-lg border border-black/10 px-3 text-base" value={draft.date} onChange={(event) => {
          const date = event.target.value;
          if (endDate < date) setEndDate(date);
          update({
            date,
            start_datetime: draft.start_datetime ? `${date}T${draft.start_datetime.slice(11, 16)}:00+09:00` : undefined,
            end_datetime: draft.end_datetime ? `${date}T${draft.end_datetime.slice(11, 16)}:00+09:00` : undefined
          });
        }} />
      </label>

      <div className="grid gap-3 rounded-xl border border-blue-100 bg-blue-50/60 p-3 lg:col-span-2">
        <label className="flex min-h-11 items-center gap-2 text-base font-semibold text-blue-950">
          <input className="size-5" type="checkbox" checked={isMultiDay} onChange={(event) => setIsMultiDay(event.target.checked)} />
          連続日程として追加
        </label>
        {isMultiDay ? (
          <label className="grid gap-1 text-base font-medium text-blue-950">
            終了日
            <input type="date" required className="focus-ring h-12 rounded-lg border border-blue-200 bg-white px-3 text-base" min={draft.date} value={endDate < draft.date ? draft.date : endDate} onChange={(event) => setEndDate(event.target.value)} />
            <span className="text-sm font-normal text-blue-700">{dateRange(draft.date, endDate).length}日分の予定を作成します</span>
          </label>
        ) : null}
      </div>

      <label className="flex items-end gap-2 text-base font-medium">
        <input className="mb-4 size-5" type="checkbox" checked={Boolean(draft.all_day)} onChange={(event) => update({ all_day: event.target.checked, start_datetime: event.target.checked ? undefined : `${draft.date}T09:00:00+09:00`, end_datetime: event.target.checked ? undefined : `${draft.date}T10:00:00+09:00` })} />
        <span className="pb-3">終日</span>
      </label>

      <label className="grid gap-1 text-base font-medium">
        開始
        <input disabled={draft.all_day} type="time" className="focus-ring h-12 rounded-lg border border-black/10 px-3 text-base disabled:bg-slate-100" value={draft.start_datetime?.slice(11, 16) ?? ""} onChange={(event) => update({ start_datetime: `${draft.date}T${event.target.value}:00+09:00`, all_day: false })} />
      </label>

      <label className="grid gap-1 text-base font-medium">
        終了
        <input disabled={draft.all_day} type="time" className="focus-ring h-12 rounded-lg border border-black/10 px-3 text-base disabled:bg-slate-100" value={draft.end_datetime?.slice(11, 16) ?? ""} onChange={(event) => update({ end_datetime: `${draft.date}T${event.target.value}:00+09:00`, all_day: false })} />
      </label>

      <label className="grid gap-1 text-base font-medium">
        種類
        <select className="focus-ring h-12 rounded-lg border border-black/10 px-3 text-base" value={draft.event_type} onChange={(event) => updateEventType(event.target.value as EventType)}>
          {eventTypes.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
        </select>
      </label>

      <label className="grid gap-1 text-base font-medium">
        カレンダー
        <select className="focus-ring h-12 rounded-lg border border-black/10 px-3 text-base" value={draft.calendar_type} onChange={(event) => update({ calendar_type: event.target.value as CalendarType })}>
          {calendarTypes.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
        </select>
      </label>

      <label className="grid gap-1 text-base font-medium">
        場所
        <input className="focus-ring h-12 rounded-lg border border-black/10 px-3 text-base" value={draft.location ?? ""} onChange={(event) => update({ location: event.target.value })} placeholder="例：体育館" />
      </label>

      <label className="grid gap-1 text-base font-medium">
        送迎担当
        <select className="focus-ring h-12 rounded-lg border border-black/10 px-3 text-base" value={normalizeTransportOwner(draft.transport_owner)} onChange={(event) => {
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

      <label className="grid gap-1 text-base font-medium lg:col-span-2">
        ルート
        <RouteSelector routes={routes} value={draft.route_id} onChange={(routeId) => {
          const route = routes.find((item) => item.id === routeId);
          update({ route_id: routeId, need_transport: Boolean(routeId), ...calculateRoutePlan(draft.start_datetime ?? `${draft.date}T09:00:00+09:00`, route) });
        }} />
      </label>

      <div className="flex flex-wrap gap-3 text-base lg:col-span-2">
        <label className="flex min-h-11 items-center gap-2 rounded-lg border border-black/10 px-3"><input type="checkbox" checked={Boolean(draft.need_parent_action)} onChange={(event) => update({ need_parent_action: event.target.checked })} />保護者対応が必要</label>
        <label className="flex min-h-11 items-center gap-2 rounded-lg border border-black/10 px-3"><input type="checkbox" checked={Boolean(draft.pickup_required)} onChange={(event) => update({ pickup_required: event.target.checked })} />迎えが必要</label>
        <label className="flex min-h-11 items-center gap-2 rounded-lg border border-black/10 px-3"><input type="checkbox" checked={Boolean(draft.dropoff_required)} onChange={(event) => update({ dropoff_required: event.target.checked })} />送りが必要</label>
      </div>

      <button className="focus-ring min-h-12 rounded-lg bg-blue-600 px-4 text-base font-semibold text-white lg:col-span-2">予定を保存</button>
    </form>
  );
}
