"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Save, Trash2 } from "lucide-react";
import { RoleGuard } from "@/components/RoleGuard";
import { DayTimeline } from "@/components/responsive/DayTimeline";
import { MobileEventCard } from "@/components/responsive/MobileEventCard";
import { MobileEventEditorSheet } from "@/components/responsive/MobileEventEditorSheet";
import { MobileLayout } from "@/components/responsive/MobileLayout";
import { TabletLayout } from "@/components/responsive/TabletLayout";
import { checkConflicts } from "@/lib/conflictChecker";
import { defaultChecklists, loadState, saveState, softDeleteEvent, type AppState } from "@/lib/db";
import { zhText } from "@/lib/displayText";
import { isParentTransport, normalizeTransportOwner, transportOwnerOptions } from "@/lib/transport";
import { useResponsiveLayout } from "@/lib/useResponsiveLayout";
import type { CalendarType, EventType, FamilyEvent } from "@/types/events";

type ViewMode = "month" | "week" | "day";

const weekLabels = ["日", "月", "火", "水", "木", "金", "土"];

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

const calendarTypeByEvent: Partial<Record<EventType, CalendarType>> = {
  family_event: "family",
  personal_event: "personal",
  company_meeting: "company",
  school_event: "school",
  school_holiday: "school",
  badminton_practice: "child_activity",
  piano_lesson: "child_activity",
  english_lesson: "child_activity",
  chinese_lesson: "child_activity",
  travel: "family",
  other: "family"
};

function formatLocalDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function parseDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function moveDate(dateKey: string, days: number) {
  const date = parseDateKey(dateKey);
  date.setDate(date.getDate() + days);
  return formatLocalDate(date);
}

function getMonthCells(baseDate: Date) {
  const first = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());
  return Array.from({ length: 35 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return { date, key: formatLocalDate(date), day: date.getDate(), inMonth: date.getMonth() === baseDate.getMonth() };
  });
}

function getWeekCells(baseDate: Date) {
  const start = new Date(baseDate);
  start.setDate(baseDate.getDate() - baseDate.getDay());
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return { date, key: formatLocalDate(date), day: date.getDate(), inMonth: true };
  });
}

function updateTime(date: string, time: string) {
  return time ? `${date}T${time}:00+09:00` : undefined;
}

function timeLabel(event: FamilyEvent) {
  if (event.all_day) return "終日";
  const start = event.start_datetime?.slice(11, 16);
  const end = event.end_datetime?.slice(11, 16);
  if (start && end) return `${start} - ${end}`;
  return start ?? "";
}

function monthTitle(date: Date) {
  return `${date.getFullYear()}年${date.getMonth() + 1}月`;
}

function periodTitle(viewMode: ViewMode, monthDate: Date, selectedDate: string) {
  if (viewMode === "month") return monthTitle(monthDate);
  const date = parseDateKey(selectedDate);
  if (viewMode === "day") return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
  const week = getWeekCells(date);
  return `${week[0].date.getMonth() + 1}/${week[0].date.getDate()} - ${week[6].date.getMonth() + 1}/${week[6].date.getDate()}`;
}

function createEmptyEvent(date: string): FamilyEvent {
  return {
    id: `event-${crypto.randomUUID()}`,
    title: "",
    event_type: "family_event",
    calendar_type: "family",
    date,
    start_datetime: `${date}T09:00:00+09:00`,
    end_datetime: `${date}T10:00:00+09:00`,
    all_day: false,
    visibility: "family",
    location: "",
    need_parent_action: false
  };
}

function isPlainDadCompanyDayOff(event: FamilyEvent) {
  return event.id.startsWith("dad-company-off-");
}

function eventTone(event: FamilyEvent) {
  const owner = normalizeTransportOwner(event.transport_owner);
  if (owner === "ママ" || event.created_by === "mom" || event.title.startsWith("ママ")) return "border-rose-200 bg-rose-50 text-rose-900";
  if (owner === "パパ" || event.created_by === "dad" || event.title.startsWith("パパ")) return "border-sky-200 bg-sky-50 text-sky-900";
  if (event.calendar_type === "school" || event.calendar_type === "child_activity") return "border-emerald-200 bg-emerald-50 text-emerald-900";
  if (event.calendar_type === "company") return "border-green-200 bg-green-50 text-green-900";
  if (event.calendar_type === "japan_holiday") return "border-blue-200 bg-blue-50 text-blue-900";
  return "border-amber-200 bg-amber-50 text-amber-900";
}

export default function DashboardPage() {
  const [state, setState] = useState<AppState | null>(null);
  const { isMobile, isTablet } = useResponsiveLayout();
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [monthDate, setMonthDate] = useState(() => new Date(2026, 6, 1));
  const [selectedDate, setSelectedDate] = useState(() => formatLocalDate(new Date()));
  const [editingEvent, setEditingEvent] = useState<FamilyEvent | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved">("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => setState(loadState()), []);
  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const selectedDateObject = parseDateKey(selectedDate);
  const monthCells = useMemo(() => getMonthCells(monthDate), [monthDate]);
  const weekCells = useMemo(() => getWeekCells(selectedDateObject), [selectedDate]);

  if (!state) return null;

  const todayKey = formatLocalDate(new Date());
  const viewStart = viewMode === "month" ? formatLocalDate(new Date(monthDate.getFullYear(), monthDate.getMonth(), 1)) : viewMode === "week" ? weekCells[0].key : selectedDate;
  const viewEnd = viewMode === "month" ? formatLocalDate(new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0)) : viewMode === "week" ? weekCells[6].key : selectedDate;
  const visibleEvents = state.events
    .filter((event) => !event.deleted_at && event.date >= viewStart && event.date <= viewEnd && !isPlainDadCompanyDayOff(event))
    .sort((a, b) => `${a.date}${a.start_datetime ?? ""}`.localeCompare(`${b.date}${b.start_datetime ?? ""}`));
  const eventsByDate = visibleEvents.reduce<Record<string, FamilyEvent[]>>((acc, event) => {
    acc[event.date] = [...(acc[event.date] ?? []), event];
    return acc;
  }, {});
  const selectedEvents = state.events
    .filter((event) => !event.deleted_at && event.date === selectedDate && !isPlainDadCompanyDayOff(event))
    .sort((a, b) => `${a.start_datetime ?? ""}`.localeCompare(`${b.start_datetime ?? ""}`));
  const todayEvents = state.events
    .filter((event) => !event.deleted_at && event.date === todayKey && !isPlainDadCompanyDayOff(event))
    .sort((a, b) => `${a.start_datetime ?? ""}`.localeCompare(`${b.start_datetime ?? ""}`));
  const todayChildEvents = todayEvents.filter((event) => event.calendar_type === "school" || event.calendar_type === "child_activity");
  const todayTransportEvents = todayEvents.filter((event) => event.need_transport || event.transport_owner || event.route_id || event.bus_timetable_id);
  const visibleConflicts = checkConflicts(todayEvents, state.routes).filter((conflict) => conflict.level === "high" || conflict.level === "medium");
  const pendingImportCount = state.importCandidates.filter((candidate) => !candidate.confirmed && !candidate.ignored).length;

  function persist(next: AppState) {
    saveState(next);
    setState(next);
  }

  function shiftPeriod(delta: number) {
    if (viewMode === "month") {
      const next = new Date(monthDate);
      next.setMonth(next.getMonth() + delta);
      next.setDate(1);
      setMonthDate(next);
      setSelectedDate(formatLocalDate(next));
      setEditingEvent(null);
      return;
    }
    const nextSelectedDate = moveDate(selectedDate, viewMode === "week" ? delta * 7 : delta);
    const nextDate = parseDateKey(nextSelectedDate);
    setSelectedDate(nextSelectedDate);
    setMonthDate(new Date(nextDate.getFullYear(), nextDate.getMonth(), 1));
    setEditingEvent(null);
  }

  function jumpToday() {
    const now = new Date();
    setMonthDate(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelectedDate(formatLocalDate(now));
    setEditingEvent(null);
  }

  function saveEvent() {
    if (!state || !editingEvent?.title.trim()) return;
    const owner = normalizeTransportOwner(editingEvent.transport_owner);
    const exists = state.events.some((event) => event.id === editingEvent.id);
    const nextEvent: FamilyEvent = {
      ...editingEvent,
      title: editingEvent.title.trim(),
      calendar_type: calendarTypeByEvent[editingEvent.event_type] ?? editingEvent.calendar_type,
      transport_owner: owner || undefined,
      need_transport: Boolean(owner),
      pickup_required: isParentTransport(owner) || editingEvent.pickup_required,
      dropoff_required: isParentTransport(owner) || editingEvent.dropoff_required,
      route_id: owner === "bus" ? "r2" : editingEvent.route_id
    };
    const next = { ...state, events: exists ? state.events.map((event) => (event.id === nextEvent.id ? nextEvent : event)) : [nextEvent, ...state.events] };
    persist(next);
    setSelectedDate(nextEvent.date);
    setSaveStatus("saved");
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setEditingEvent(null);
      setSaveStatus("idle");
    }, 700);
  }

  function removeEvent(id: string) {
    if (!state) return;
    setState(softDeleteEvent(id, state.currentUser?.id));
    setEditingEvent(null);
  }

  const mobileContent = (
    <div className="space-y-5">
      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <p className="text-base text-slate-500">{todayKey}</p>
        <h2 className="mt-1 text-xl font-bold text-slate-950">{todayEvents.length ? "今日の重要事項" : "今日は予定がありません"}</h2>
      </section>
      <DayTimeline events={state.events.filter((event) => !isPlainDadCompanyDayOff(event))} date={todayKey} onEventClick={setEditingEvent} />
      <section className="space-y-3">
        <h2 className="text-xl font-bold">子どもの今日</h2>
        {todayChildEvents.length ? todayChildEvents.map((event) => <MobileEventCard key={event.id} event={event} onClick={() => setEditingEvent(event)} />) : <div className="rounded-xl bg-white p-4 text-base text-slate-500">子どもの予定はありません。</div>}
      </section>
      <section className="space-y-3">
        <h2 className="text-xl font-bold">送迎とルート</h2>
        {todayTransportEvents.length ? todayTransportEvents.map((event) => <MobileEventCard key={event.id} event={event} onClick={() => setEditingEvent(event)} />) : <div className="rounded-xl bg-white p-4 text-base text-slate-500">送迎予定はありません。</div>}
      </section>
      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="text-xl font-bold">準備物</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {["弁当", "ラケット", "教材", "宿題", ...defaultChecklists.badminton.slice(0, 4)].map((item) => <span key={item} className="rounded-full bg-emerald-50 px-3 py-2 text-base font-medium text-emerald-800">{item}</span>)}
        </div>
      </section>
      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="text-xl font-bold">競合アラート</h2>
        {visibleConflicts.length ? <div className="mt-3 space-y-2">{visibleConflicts.map((conflict) => <div key={conflict.id} className="rounded-xl bg-amber-50 p-3 text-base font-medium text-amber-900">{conflict.title}</div>)}</div> : <p className="mt-2 text-base text-slate-500">high / medium の競合はありません。</p>}
      </section>
      {state.currentUser?.role !== "child_editor" ? (
        <section className="rounded-2xl bg-white p-4 shadow-sm">
          <h2 className="text-xl font-bold">OCR 待確認</h2>
          <p className="mt-2 text-base text-slate-600">{pendingImportCount} 件の候補があります。</p>
        </section>
      ) : null}
      <MobileEventEditorSheet event={editingEvent} saveStatus={saveStatus} onChange={setEditingEvent} onSave={saveEvent} onDelete={() => editingEvent ? removeEvent(editingEvent.id) : undefined} onClose={() => setEditingEvent(null)} />
    </div>
  );

  const calendarCells = viewMode === "month" ? monthCells : weekCells;

  return (
    <RoleGuard>
      {isMobile ? (
        <MobileLayout title="今日" user={state.currentUser}>{mobileContent}</MobileLayout>
      ) : isTablet ? (
        <TabletLayout title="今日">
          <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
            <div className="space-y-3">{todayEvents.map((event) => <MobileEventCard key={event.id} event={event} onClick={() => setEditingEvent(event)} />)}</div>
            <EditorPanel editingEvent={editingEvent} setEditingEvent={setEditingEvent} saveStatus={saveStatus} saveEvent={saveEvent} removeEvent={removeEvent} />
          </div>
        </TabletLayout>
      ) : (
        <div className="flex min-h-screen bg-slate-50">
          <main className="flex-1 p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold">Family Schedule Hub</h1>
                <p className="text-sm text-slate-500">家族の予定をまとめて確認</p>
              </div>
              <div className="flex items-center gap-2">
                <button className="rounded-full border border-slate-200 p-2" onClick={() => shiftPeriod(-1)}><ChevronLeft size={18} /></button>
                <div className="min-w-48 text-center text-xl font-bold">{periodTitle(viewMode, monthDate, selectedDate)}</div>
                <button className="rounded-full border border-slate-200 p-2" onClick={() => shiftPeriod(1)}><ChevronRight size={18} /></button>
                <button className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium" onClick={jumpToday}>今日</button>
                {(["month", "week", "day"] as ViewMode[]).map((mode) => <button key={mode} className={`rounded-full px-4 py-2 text-sm font-medium ${viewMode === mode ? "bg-blue-600 text-white" : "border border-slate-200 bg-white"}`} onClick={() => setViewMode(mode)}>{mode === "month" ? "月" : mode === "week" ? "週" : "日"}</button>)}
                <button className="rounded-full bg-blue-600 p-2 text-white" onClick={() => setEditingEvent(createEmptyEvent(selectedDate))}><Plus size={18} /></button>
              </div>
            </div>

            {viewMode !== "day" ? (
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                <div className="grid grid-cols-7 border-b border-slate-200 text-center text-sm font-semibold text-slate-500">
                  {weekLabels.map((label) => <div key={label} className="py-2">{label}</div>)}
                </div>
                <div className="grid grid-cols-7">
                  {calendarCells.map((cell) => {
                    const dayEvents = eventsByDate[cell.key] ?? [];
                    const active = selectedDate === cell.key;
                    return (
                      <button key={cell.key} className={`min-h-32 border-b border-r border-slate-100 p-2 text-left ${active ? "bg-blue-50" : cell.inMonth ? "bg-white" : "bg-slate-50 text-slate-400"}`} onClick={() => {
                        setSelectedDate(cell.key);
                        setEditingEvent(null);
                      }}>
                        <div className="mb-2 text-sm font-semibold">{cell.day}</div>
                        <div className="space-y-1">
                          {dayEvents.slice(0, 3).map((event) => <div key={event.id} className={`truncate rounded border px-2 py-1 text-xs ${eventTone(event)}`} onClick={(click) => {
                            click.stopPropagation();
                            setSelectedDate(event.date);
                            setEditingEvent(event);
                          }}>{timeLabel(event)} {zhText(event.title)}</div>)}
                          {dayEvents.length > 3 ? <div className="text-xs text-slate-500">+{dayEvents.length - 3} 件</div> : null}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <DayTimeline events={state.events.filter((event) => !isPlainDadCompanyDayOff(event))} date={selectedDate} onEventClick={setEditingEvent} />
                {selectedEvents.length === 0 ? <button className="w-full rounded-lg border border-dashed border-slate-300 bg-white p-6 text-left text-sm text-slate-500 shadow-sm" onClick={() => setEditingEvent(createEmptyEvent(selectedDate))}>この日の予定はありません。クリックして追加できます。</button> : null}
              </div>
            )}
          </main>

          <aside className="w-[360px] border-l border-slate-200 bg-white p-4">
            <EditorPanel editingEvent={editingEvent} setEditingEvent={setEditingEvent} saveStatus={saveStatus} saveEvent={saveEvent} removeEvent={removeEvent} />
          </aside>
        </div>
      )}
    </RoleGuard>
  );
}

function EditorPanel({
  editingEvent,
  setEditingEvent,
  saveStatus,
  saveEvent,
  removeEvent
}: {
  editingEvent: FamilyEvent | null;
  setEditingEvent: (event: FamilyEvent | null) => void;
  saveStatus: "idle" | "saved";
  saveEvent: () => void;
  removeEvent: (id: string) => void;
}) {
  if (!editingEvent) return <div className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500">日付または予定をクリックすると編集できます。</div>;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">予定編集</h3>
        <button className="rounded-md p-2 text-red-600 hover:bg-red-50" title="削除" onClick={() => removeEvent(editingEvent.id)}><Trash2 size={17} /></button>
      </div>
      <label className="grid gap-1 text-sm">タイトル<input className="rounded-md border border-slate-200 px-3 py-2" value={editingEvent.title} onChange={(event) => setEditingEvent({ ...editingEvent, title: event.target.value })} /></label>
      <label className="grid gap-1 text-sm">日付<input className="rounded-md border border-slate-200 px-3 py-2" type="date" value={editingEvent.date} onChange={(event) => {
        const date = event.target.value;
        setEditingEvent({ ...editingEvent, date, start_datetime: updateTime(date, editingEvent.start_datetime?.slice(11, 16) ?? ""), end_datetime: updateTime(date, editingEvent.end_datetime?.slice(11, 16) ?? "") });
      }} /></label>
      <div className="grid grid-cols-2 gap-3">
        <label className="grid gap-1 text-sm">開始<input className="rounded-md border border-slate-200 px-3 py-2" type="time" value={editingEvent.start_datetime?.slice(11, 16) ?? ""} onChange={(event) => setEditingEvent({ ...editingEvent, start_datetime: updateTime(editingEvent.date, event.target.value), all_day: false })} /></label>
        <label className="grid gap-1 text-sm">終了<input className="rounded-md border border-slate-200 px-3 py-2" type="time" value={editingEvent.end_datetime?.slice(11, 16) ?? ""} onChange={(event) => setEditingEvent({ ...editingEvent, end_datetime: updateTime(editingEvent.date, event.target.value), all_day: false })} /></label>
      </div>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={Boolean(editingEvent.all_day)} onChange={(event) => setEditingEvent({ ...editingEvent, all_day: event.target.checked, start_datetime: event.target.checked ? undefined : editingEvent.start_datetime, end_datetime: event.target.checked ? undefined : editingEvent.end_datetime })} />終日</label>
      <label className="grid gap-1 text-sm">場所<input className="rounded-md border border-slate-200 px-3 py-2" value={editingEvent.location ?? ""} onChange={(event) => setEditingEvent({ ...editingEvent, location: event.target.value })} /></label>
      <label className="grid gap-1 text-sm">種類<select className="rounded-md border border-slate-200 px-3 py-2" value={editingEvent.event_type} onChange={(event) => setEditingEvent({ ...editingEvent, event_type: event.target.value as EventType })}>{eventTypeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
      <label className="grid gap-1 text-sm">送迎担当<select className="rounded-md border border-slate-200 px-3 py-2" value={normalizeTransportOwner(editingEvent.transport_owner)} onChange={(event) => {
        const owner = normalizeTransportOwner(event.target.value);
        setEditingEvent({ ...editingEvent, transport_owner: owner || undefined, need_transport: Boolean(owner), pickup_required: isParentTransport(owner), dropoff_required: isParentTransport(owner), route_id: owner === "bus" ? "r2" : editingEvent.route_id });
      }}>{transportOwnerOptions.map((option) => <option key={option.value} value={option.value}>{option.label} - {option.description}</option>)}</select></label>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={Boolean(editingEvent.need_parent_action)} onChange={(event) => setEditingEvent({ ...editingEvent, need_parent_action: event.target.checked })} />保護者対応が必要</label>
      {saveStatus === "saved" ? <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">保存しました</div> : null}
      <button className={`flex w-full items-center justify-center gap-2 rounded-md px-4 py-2 font-medium text-white disabled:opacity-40 ${saveStatus === "saved" ? "bg-slate-400" : "bg-blue-600 hover:bg-blue-700"}`} disabled={!editingEvent.title.trim() || saveStatus === "saved"} onClick={saveEvent}>
        <Save size={17} />
        {saveStatus === "saved" ? "保存しました" : "保存"}
      </button>
    </div>
  );
}
