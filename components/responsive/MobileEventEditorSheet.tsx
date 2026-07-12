"use client";

import { Save, Trash2, X } from "lucide-react";
import type { EventType, FamilyEvent } from "@/types/events";
import { isParentTransport, normalizeTransportOwner, transportOwnerOptions } from "@/lib/transport";

const eventTypeOptions: { value: EventType; label: string }[] = [
  { value: "family_event", label: "家族予定" },
  { value: "personal_event", label: "個人予定" },
  { value: "company_meeting", label: "会社予定" },
  { value: "school_event", label: "学校予定" },
  { value: "school_holiday", label: "学校休み" },
  { value: "badminton_practice", label: "バドミントン" },
  { value: "piano_lesson", label: "ピアノ" },
  { value: "english_lesson", label: "英語" },
  { value: "chinese_lesson", label: "中国語" },
  { value: "travel", label: "旅行" },
  { value: "other", label: "その他" }
];

function updateTime(date: string, time: string) {
  return time ? `${date}T${time}:00+09:00` : undefined;
}

export function MobileEventEditorSheet({
  event,
  saveStatus,
  onChange,
  onSave,
  onDelete,
  onClose
}: {
  event: FamilyEvent | null;
  saveStatus?: "idle" | "saved";
  onChange: (event: FamilyEvent) => void;
  onSave: () => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  if (!event) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/35 md:hidden">
      <div className="absolute inset-x-0 bottom-0 max-h-[92vh] overflow-y-auto rounded-t-3xl bg-white p-4 pb-[calc(24px+env(safe-area-inset-bottom))] shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">予定編集</h2>
          <button className="grid size-11 place-items-center rounded-full bg-slate-100" onClick={onClose} aria-label="閉じる"><X size={20} /></button>
        </div>

        <div className="grid gap-4">
          <label className="grid gap-1 text-base font-medium">
            タイトル
            <input className="h-12 rounded-lg border border-slate-200 px-3 text-base" value={event.title} onChange={(input) => onChange({ ...event, title: input.target.value })} />
          </label>
          <label className="grid gap-1 text-base font-medium">
            日付
            <input className="h-12 rounded-lg border border-slate-200 px-3 text-base" type="date" value={event.date} onChange={(input) => {
              const date = input.target.value;
              onChange({ ...event, date, start_datetime: updateTime(date, event.start_datetime?.slice(11, 16) ?? ""), end_datetime: updateTime(date, event.end_datetime?.slice(11, 16) ?? "") });
            }} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-1 text-base font-medium">
              開始
              <input className="h-12 rounded-lg border border-slate-200 px-3 text-base" type="time" value={event.start_datetime?.slice(11, 16) ?? ""} onChange={(input) => onChange({ ...event, start_datetime: updateTime(event.date, input.target.value), all_day: false })} />
            </label>
            <label className="grid gap-1 text-base font-medium">
              終了
              <input className="h-12 rounded-lg border border-slate-200 px-3 text-base" type="time" value={event.end_datetime?.slice(11, 16) ?? ""} onChange={(input) => onChange({ ...event, end_datetime: updateTime(event.date, input.target.value), all_day: false })} />
            </label>
          </div>
          <label className="flex min-h-12 items-center gap-2 text-base font-medium">
            <input className="size-5" type="checkbox" checked={Boolean(event.all_day)} onChange={(input) => onChange({ ...event, all_day: input.target.checked, start_datetime: input.target.checked ? undefined : event.start_datetime, end_datetime: input.target.checked ? undefined : event.end_datetime })} />
            終日
          </label>
          <label className="grid gap-1 text-base font-medium">
            場所
            <input className="h-12 rounded-lg border border-slate-200 px-3 text-base" value={event.location ?? ""} onChange={(input) => onChange({ ...event, location: input.target.value })} />
          </label>
          <label className="grid gap-1 text-base font-medium">
            種類
            <select className="h-12 rounded-lg border border-slate-200 px-3 text-base" value={event.event_type} onChange={(input) => onChange({ ...event, event_type: input.target.value as EventType })}>
              {eventTypeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          <label className="grid gap-1 text-base font-medium">
            送迎担当
            <select className="h-12 rounded-lg border border-slate-200 px-3 text-base" value={normalizeTransportOwner(event.transport_owner)} onChange={(input) => {
              const owner = normalizeTransportOwner(input.target.value);
              onChange({ ...event, transport_owner: owner || undefined, need_transport: Boolean(owner), pickup_required: isParentTransport(owner), dropoff_required: isParentTransport(owner), route_id: owner === "bus" ? "r2" : event.route_id });
            }}>
              {transportOwnerOptions.map((option) => <option key={option.value} value={option.value}>{option.label} - {option.description}</option>)}
            </select>
          </label>
        </div>

        {saveStatus === "saved" ? <div className="mt-4 rounded-lg bg-emerald-50 p-3 text-base font-semibold text-emerald-700">保存しました</div> : null}

        <div className="mt-5 grid grid-cols-[1fr_1fr] gap-3">
          <button className="flex min-h-12 items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 text-base font-semibold text-red-700" onClick={onDelete}><Trash2 size={18} />削除</button>
          <button className="flex min-h-12 items-center justify-center gap-2 rounded-lg bg-blue-600 text-base font-semibold text-white disabled:opacity-40" disabled={!event.title.trim() || saveStatus === "saved"} onClick={onSave}><Save size={18} />{saveStatus === "saved" ? "保存済み" : "保存"}</button>
        </div>
      </div>
    </div>
  );
}
