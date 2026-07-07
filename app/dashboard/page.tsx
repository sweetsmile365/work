"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useRef } from "react";
import {
  AlertTriangle,
  ArchiveRestore,
  Bell,
  CalendarCheck,
  CalendarDays,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  Home,
  Inbox,
  MapPin,
  Plus,
  Save,
  Settings,
  Trash2,
  UserPlus
} from "lucide-react";
import { RoleGuard } from "@/components/RoleGuard";
import { MobileEventCard } from "@/components/responsive/MobileEventCard";
import { MobileLayout } from "@/components/responsive/MobileLayout";
import { MobileTaskCard } from "@/components/responsive/MobileTaskCard";
import { TabletLayout } from "@/components/responsive/TabletLayout";
import { TabletSplitView } from "@/components/responsive/TabletSplitView";
import { checkConflicts } from "@/lib/conflictChecker";
import { defaultChecklists, loadState, saveState, softDeleteEvent, toggleTask, type AppState } from "@/lib/db";
import { zhText } from "@/lib/displayText";
import { useResponsiveLayout } from "@/lib/useResponsiveLayout";
import type { CalendarType, EventType, FamilyEvent } from "@/types/events";

const weekLabels = ["日", "月", "火", "水", "木", "金", "土"];
type ViewMode = "month" | "week" | "day";

const menuItems = [
  { href: "/dashboard", label: "日程", icon: CalendarCheck },
  { href: "/calendar", label: "カレンダー", icon: CalendarDays, active: true },
  { href: "/import-inbox", label: "取り込み Inbox", icon: Inbox, badge: 3 },
  { href: "/child-schedule", label: "タスク", icon: CheckSquare },
  { href: "/conflicts", label: "競合チェック", icon: Bell, badge: 2 },
  { href: "/recycle-bin", label: "復元とバックアップ", icon: ArchiveRestore },
  { href: "/settings", label: "設定", icon: Settings }
];

const memberStyleById = {
  mom: { role: "管理者", color: "from-rose-100 to-pink-200 text-rose-700" },
  dad: { role: "保護者", color: "from-sky-100 to-blue-200 text-blue-700" },
  child: { role: "学生", color: "from-emerald-100 to-lime-200 text-emerald-700" }
};

const avatarOptions = ["🌸", "💙", "⭐", "🎀", "🍀", "☀️", "🌙", "💚", "✨", "🍓", "🎵", "📘"];

const eventTypeOptions: { value: EventType; label: string }[] = [
  { value: "family_event", label: "家族予定" },
  { value: "personal_event", label: "個人予定" },
  { value: "company_meeting", label: "会社予定" },
  { value: "school_event", label: "学校予定" },
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
  badminton_practice: "child_activity",
  piano_lesson: "child_activity",
  english_lesson: "child_activity",
  chinese_lesson: "child_activity",
  travel: "family",
  other: "family"
};

const transportOwnerOptions = [
  { value: "", label: "未設定" },
  { value: "ママ", label: "ママ送迎" },
  { value: "パパ", label: "パパ送迎" },
  { value: "自分", label: "自分で移動" },
  { value: "bus", label: "バス" }
];

function formatLocalDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getMonthCells(baseDate: Date) {
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();
  const first = new Date(year, month, 1);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());
  return Array.from({ length: 35 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return {
      date,
      key: formatLocalDate(date),
      day: date.getDate(),
      inMonth: date.getMonth() === month
    };
  });
}

function parseDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function getWeekCells(baseDate: Date) {
  const start = new Date(baseDate);
  start.setDate(baseDate.getDate() - baseDate.getDay());
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return {
      date,
      key: formatLocalDate(date),
      day: date.getDate(),
      inMonth: date.getMonth() === baseDate.getMonth()
    };
  });
}

function moveDate(dateKey: string, days: number) {
  const date = parseDateKey(dateKey);
  date.setDate(date.getDate() + days);
  return formatLocalDate(date);
}

function eventTone(event: FamilyEvent) {
  if (event.created_by === "mom" || event.transport_owner === "ママ" || event.title.startsWith("ママ")) return "border-rose-200 bg-rose-50 text-rose-900";
  if (event.created_by === "dad" || event.transport_owner === "パパ" || event.title.startsWith("パパ")) return "border-sky-200 bg-sky-50 text-sky-900";
  if (event.created_by === "child" || event.calendar_type === "school" || event.calendar_type === "child_activity") return "border-emerald-200 bg-emerald-50 text-emerald-900";
  if (event.calendar_type === "family") return "border-amber-200 bg-amber-50 text-amber-900";
  if (event.calendar_type === "japan_holiday") return "border-blue-200 bg-blue-50 text-blue-900";
  if (event.calendar_type === "company") return "border-green-200 bg-green-50 text-green-900";
  if (event.calendar_type === "china_reference_holiday") return "border-red-200 bg-red-50 text-red-900";
  return "border-violet-200 bg-violet-50 text-violet-900";
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
  const start = week[0].date;
  const end = week[6].date;
  return `${start.getFullYear()}年${start.getMonth() + 1}月${start.getDate()}日 - ${end.getMonth() + 1}月${end.getDate()}日`;
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

function updateTime(date: string, time: string) {
  return time ? `${date}T${time}:00+09:00` : undefined;
}

function isPlainDadCompanyDayOff(event: FamilyEvent) {
  return event.id.startsWith("dad-company-off-");
}

function isJapaneseHolidayEvent(event: FamilyEvent) {
  return event.calendar_type === "japan_holiday" || event.event_type === "japan_public_holiday";
}

function transportOwnerLabel(owner?: string) {
  return transportOwnerOptions.find((option) => option.value === owner)?.label ?? owner;
}

function isImageAvatar(avatar?: string) {
  return avatar?.startsWith("data:image/");
}

export default function DashboardPage() {
  const [state, setState] = useState<AppState | null>(null);
  const { isMobile, isTablet } = useResponsiveLayout();
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [monthDate, setMonthDate] = useState(() => new Date(2026, 6, 1));
  const [selectedDate, setSelectedDate] = useState(() => formatLocalDate(new Date(2026, 6, 15)));
  const [editingEvent, setEditingEvent] = useState<FamilyEvent | null>(null);
  const [editingAvatarUserId, setEditingAvatarUserId] = useState<string | null>(null);
  const [avatarMessage, setAvatarMessage] = useState("");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved">("idle");
  const saveStatusTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => setState(loadState()), []);
  useEffect(() => () => {
    if (saveStatusTimer.current) clearTimeout(saveStatusTimer.current);
  }, []);

  const todayKey = formatLocalDate(new Date());
  const monthCells = useMemo(() => getMonthCells(monthDate), [monthDate]);
  const selectedDateObject = parseDateKey(selectedDate);
  const weekCells = useMemo(() => getWeekCells(selectedDateObject), [selectedDate]);

  if (!state) return null;

  const viewStart = viewMode === "month" ? formatLocalDate(new Date(monthDate.getFullYear(), monthDate.getMonth(), 1)) : viewMode === "week" ? weekCells[0].key : selectedDate;
  const viewEnd = viewMode === "month" ? formatLocalDate(new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0)) : viewMode === "week" ? weekCells[6].key : selectedDate;
  const visibleEvents = state.events
    .filter((event) => !event.deleted_at && event.date >= viewStart && event.date <= viewEnd && !isPlainDadCompanyDayOff(event))
    .sort((a, b) => `${a.date}${a.start_datetime ?? ""}`.localeCompare(`${b.date}${b.start_datetime ?? ""}`));
  const eventsByDate = visibleEvents.reduce<Record<string, FamilyEvent[]>>((acc, event) => {
    acc[event.date] = [...(acc[event.date] ?? []), event];
    return acc;
  }, {});
  const conflictCount = checkConflicts(visibleEvents, state.routes).length;
  const selectedEvents = state.events
    .filter((event) => !event.deleted_at && event.date === selectedDate && !isPlainDadCompanyDayOff(event))
    .sort((a, b) => `${a.start_datetime ?? ""}`.localeCompare(`${b.start_datetime ?? ""}`));
  const todayEvents = state.events
    .filter((event) => !event.deleted_at && event.date === todayKey && !isPlainDadCompanyDayOff(event))
    .sort((a, b) => `${a.start_datetime ?? ""}`.localeCompare(`${b.start_datetime ?? ""}`));
  const todayChildEvents = todayEvents.filter((event) => event.calendar_type === "school" || event.calendar_type === "child_activity");
  const todayTransportEvents = todayEvents.filter((event) => event.need_transport || event.transport_owner || event.route_id || event.bus_timetable_id);
  const activeTasks = state.tasks.filter((task) => task.status !== "done");
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
      setSelectedDate(formatLocalDate(new Date(next.getFullYear(), next.getMonth(), 1)));
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
    if (!state || !editingEvent || !editingEvent.title.trim()) return;
    const exists = state.events.some((event) => event.id === editingEvent.id);
    const nextEvent = {
      ...editingEvent,
      calendar_type: calendarTypeByEvent[editingEvent.event_type] ?? editingEvent.calendar_type,
      title: editingEvent.title.trim()
    };
    const next = {
      ...state,
      events: exists ? state.events.map((event) => (event.id === nextEvent.id ? nextEvent : event)) : [nextEvent, ...state.events]
    };
    persist(next);
    setEditingEvent(nextEvent);
    setSelectedDate(nextEvent.date);
    setSaveStatus("saved");
    if (saveStatusTimer.current) clearTimeout(saveStatusTimer.current);
    saveStatusTimer.current = setTimeout(() => setSaveStatus("idle"), 1500);
  }

  function removeEvent(id: string) {
    if (!state) return;
    const next = softDeleteEvent(id, state.currentUser?.id);
    setState(next);
    setEditingEvent(null);
  }

  function updateUserAvatar(userId: string, avatar: string) {
    if (!state) return;
    try {
      const next = {
        ...state,
        users: state.users.map((user) => (user.id === userId ? { ...user, avatar } : user))
      };
      persist(next);
      setAvatarMessage("アイコンを保存しました");
      setEditingAvatarUserId(null);
    } catch {
      setAvatarMessage("保存できませんでした。別の小さい写真を選んでください。");
    }
  }

  function updateUserAvatarFromFile(userId: string, file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setAvatarMessage("画像ファイルを選んでください。");
      return;
    }
    setAvatarMessage("写真を読み込み中...");
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") return;
      const image = new Image();
      image.onload = () => {
        const size = 192;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const context = canvas.getContext("2d");
        if (!context) {
          setAvatarMessage("写真を処理できませんでした。");
          return;
        }
        const crop = Math.min(image.width, image.height);
        const sx = (image.width - crop) / 2;
        const sy = (image.height - crop) / 2;
        context.drawImage(image, sx, sy, crop, crop, 0, 0, size, size);
        updateUserAvatar(userId, canvas.toDataURL("image/jpeg", 0.78));
      };
      image.onerror = () => setAvatarMessage("写真を読み込めませんでした。別の写真を選んでください。");
      image.src = reader.result;
    };
    reader.onerror = () => setAvatarMessage("写真を読み込めませんでした。");
    reader.readAsDataURL(file);
  }

  if (isMobile) {
    return (
      <RoleGuard>
        <MobileLayout title="今日" user={state.currentUser}>
          <section className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="text-base font-medium text-slate-500">{todayKey}</div>
            <h2 className="mt-1 text-xl font-bold text-slate-950">{todayEvents.length ? "今日の重要事項" : "今日は予定がありません"}</h2>
            <p className="mt-2 text-base text-slate-600">{todayChildEvents.some((event) => event.event_type === "school_holiday") ? "学校休み" : "学校予定あり"} / {todayEvents.some((event) => event.calendar_type === "company") ? "仕事予定あり" : "仕事予定なし"}</p>
          </section>

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
              {["弁当", "ラケット", "教材", "作业", ...defaultChecklists.badminton.slice(0, 4)].map((item) => <span key={item} className="rounded-full bg-emerald-50 px-3 py-2 text-base font-medium text-emerald-800">{item}</span>)}
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold">タスク</h2>
            {activeTasks.slice(0, 4).map((task) => <MobileTaskCard key={task.id} task={task} onToggle={() => setState(toggleTask(task.id))} childMode={state.currentUser?.role === "child_editor"} />)}
          </section>

          <section className="rounded-2xl bg-white p-4 shadow-sm">
            <h2 className="text-xl font-bold">冲突提醒</h2>
            {visibleConflicts.length ? <div className="mt-3 space-y-2">{visibleConflicts.map((conflict) => <div key={conflict.id} className="rounded-xl bg-amber-50 p-3 text-base font-medium text-amber-900">{conflict.title}</div>)}</div> : <p className="mt-2 text-base text-slate-500">high / medium の競合はありません。</p>}
          </section>

          {state.currentUser?.role !== "child_editor" ? (
            <section className="rounded-2xl bg-white p-4 shadow-sm">
              <h2 className="text-xl font-bold">OCR 待確認</h2>
              <p className="mt-2 text-base text-slate-600">{pendingImportCount} 件の候補があります。</p>
              <Link href="/import-inbox" className="mt-3 flex min-h-11 items-center justify-center rounded-xl bg-blue-600 px-4 text-base font-semibold text-white">確認する</Link>
            </section>
          ) : null}
        </MobileLayout>
      </RoleGuard>
    );
  }

  if (isTablet) {
    return (
      <RoleGuard>
        <TabletLayout title="今日">
          <TabletSplitView
            left={<div className="space-y-3">{todayEvents.map((event) => <MobileEventCard key={event.id} event={event} onClick={() => setEditingEvent(event)} />)}</div>}
            right={
              <div className="space-y-4">
                <section className="rounded-2xl bg-white p-5 shadow-sm">
                  <h2 className="text-xl font-bold">今日の詳細</h2>
                  <div className="mt-3 space-y-2">{activeTasks.slice(0, 5).map((task) => <MobileTaskCard key={task.id} task={task} onToggle={() => setState(toggleTask(task.id))} />)}</div>
                </section>
                <section className="rounded-2xl bg-white p-5 shadow-sm">
                  <h2 className="text-xl font-bold">送迎</h2>
                  <div className="mt-3 space-y-3">{todayTransportEvents.map((event) => <MobileEventCard key={event.id} event={event} />)}</div>
                </section>
              </div>
            }
          />
        </TabletLayout>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard>
      <div className="min-h-screen bg-[#f7f7f5] p-4 md:p-7">
        <div className="mx-auto flex min-h-[720px] max-w-7xl overflow-hidden rounded-[34px] border border-black/10 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
          <aside className="hidden w-72 shrink-0 border-r border-slate-200 bg-slate-50/80 px-5 py-6 lg:block">
            <div className="mb-5 flex items-center gap-2 text-xs font-medium text-slate-600">
              <span>9:41</span>
            </div>

            <h1 className="mb-4 text-2xl font-bold tracking-tight">家族予定</h1>

            <button className="mb-5 flex w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm">
              <span className="flex items-center gap-2">
                <Home size={16} className="text-blue-500" />
                わが家
              </span>
              <ChevronLeft size={15} className="-rotate-90 text-slate-500" />
            </button>

            <div className="space-y-3">
              {state.users.map((member) => {
                const style = memberStyleById[member.id as keyof typeof memberStyleById] ?? { role: member.role, color: "from-slate-100 to-slate-200 text-slate-700" };
                const name = member.id === "mom" ? `${member.display_name}（私）` : member.display_name;
                return (
                  <div key={member.id} className="relative flex items-center gap-3">
                    <button
                      className={`grid h-10 w-10 place-items-center overflow-hidden rounded-full bg-gradient-to-br ${style.color} text-lg shadow-sm ring-2 ring-white transition hover:scale-105`}
                      title="アイコン変更"
                      onClick={() => {
                        setAvatarMessage("");
                        setEditingAvatarUserId(editingAvatarUserId === member.id ? null : member.id);
                      }}
                    >
                      {isImageAvatar(member.avatar) ? <img src={member.avatar} alt={`${member.display_name} icon`} className="h-full w-full object-cover" /> : member.avatar ?? "✨"}
                    </button>
                    <div>
                      <div className="text-sm font-semibold leading-tight">{name}</div>
                      <div className="text-xs text-slate-500">{style.role}</div>
                    </div>
                    {editingAvatarUserId === member.id ? (
                      <div className="absolute left-12 top-9 z-10 grid w-44 grid-cols-4 gap-1 rounded-lg border border-slate-200 bg-white p-2 shadow-lg">
                        {avatarMessage ? <div className="col-span-4 rounded-md bg-slate-50 px-2 py-1 text-xs text-slate-600">{avatarMessage}</div> : null}
                        <label className="col-span-4 mb-1 cursor-pointer rounded-md border border-dashed border-slate-300 px-2 py-1.5 text-center text-xs font-medium text-slate-600 hover:bg-slate-50">
                          写真を選ぶ
                          <input
                            className="hidden"
                            type="file"
                            accept="image/*"
                            onChange={(event) => {
                              updateUserAvatarFromFile(member.id, event.target.files?.[0]);
                              event.target.value = "";
                            }}
                          />
                        </label>
                        {avatarOptions.map((avatar) => (
                          <button
                            key={avatar}
                            className={`grid h-8 w-8 place-items-center rounded-md text-lg hover:bg-slate-100 ${member.avatar === avatar ? "bg-blue-50 ring-1 ring-blue-300" : ""}`}
                            onClick={() => updateUserAvatar(member.id, avatar)}
                          >
                            {avatar}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              })}
              <button className="mt-1 flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm shadow-sm">
                <UserPlus size={15} />
                メンバー追加
              </button>
            </div>

            <div className="my-6 h-px bg-slate-200" />

            <nav className="space-y-1.5">
              {menuItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between rounded-md px-3 py-2 text-sm ${item.active ? "bg-blue-100 text-blue-700" : "text-slate-700 hover:bg-slate-100"}`}
                >
                  <span className="flex items-center gap-3">
                    <item.icon size={17} />
                    {item.label}
                  </span>
                  {item.badge ? <span className="grid h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1.5 text-xs font-bold text-white">{item.badge}</span> : null}
                </Link>
              ))}
            </nav>
          </aside>

          <main className="flex min-w-0 flex-1 flex-col bg-white">
            <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-4 sm:px-6">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold tracking-tight">{periodTitle(viewMode, monthDate, selectedDate)}</h2>
                <button className="grid h-8 w-8 place-items-center rounded-full hover:bg-slate-100" title="前へ" onClick={() => shiftPeriod(-1)}>
                  <ChevronLeft size={19} />
                </button>
                <button className="grid h-8 w-8 place-items-center rounded-full hover:bg-slate-100" title="次へ" onClick={() => shiftPeriod(1)}>
                  <ChevronRight size={19} />
                </button>
                <button className="rounded-full border border-slate-200 px-4 py-1.5 text-sm font-medium shadow-sm" onClick={jumpToday}>今日</button>
              </div>

              <div className="flex items-center gap-5">
                <div className="grid grid-cols-3 overflow-hidden rounded-md border border-slate-200 text-sm">
                  {[
                    { value: "month", label: "月" },
                    { value: "week", label: "週" },
                    { value: "day", label: "日" }
                  ].map((item) => (
                    <button
                      key={item.value}
                      className={`${item.value !== "month" ? "border-l border-slate-200" : ""} px-7 py-1.5 ${viewMode === item.value ? "bg-white font-medium text-slate-950 shadow-sm" : "text-slate-500 hover:bg-slate-50"}`}
                      onClick={() => setViewMode(item.value as ViewMode)}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
                <button className="grid h-9 w-9 place-items-center rounded-full hover:bg-slate-100" title="予定を追加" onClick={() => setEditingEvent(createEmptyEvent(selectedDate))}>
                  <Plus size={22} />
                </button>
              </div>
            </header>

            {viewMode !== "day" ? (
              <section className="grid grid-cols-7 border-b border-slate-200 px-4 pt-3 text-center text-sm font-semibold text-slate-700 sm:px-6">
                {weekLabels.map((label) => (
                  <div key={label} className="pb-3">{label}</div>
                ))}
              </section>
            ) : null}

            {viewMode === "month" ? (
              <section className="grid flex-1 grid-cols-7 px-4 pb-5 sm:px-6">
                {monthCells.map((cell) => {
                const dayEvents = eventsByDate[cell.key] ?? [];
                const isToday = cell.key === todayKey;
                const dayOfWeek = cell.date.getDay();
                const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                const isJapaneseHoliday = dayEvents.some(isJapaneseHolidayEvent);
                const isRedDay = isWeekend && !isJapaneseHoliday;
                return (
                  <button
                    key={cell.key}
                    className={`min-h-28 border-b border-r border-slate-200 p-2 text-left first:border-l sm:min-h-32 ${selectedDate === cell.key ? "bg-blue-50/70 ring-2 ring-inset ring-blue-300" : isJapaneseHoliday ? "bg-blue-50/55 hover:bg-blue-50/90" : isRedDay ? "bg-red-50/45 hover:bg-red-50/80" : "hover:bg-slate-50"}`}
                    onClick={() => {
                      setSelectedDate(cell.key);
                      setEditingEvent(null);
                    }}
                  >
                    <div className={`mb-2 flex h-6 w-6 items-center justify-center rounded-full text-sm ${isToday ? "bg-blue-600 font-bold text-white" : isJapaneseHoliday && cell.inMonth ? "font-semibold text-blue-600" : isRedDay && cell.inMonth ? "font-semibold text-red-600" : cell.inMonth ? "text-slate-900" : "text-slate-300"}`}>
                      {cell.day}
                    </div>
                    <div className="space-y-1.5">
                      {dayEvents.slice(0, 3).map((event) => (
                        <div
                          key={event.id}
                          className={`rounded border px-2 py-1 text-[11px] leading-tight ${eventTone(event)}`}
                          onClick={(eventClick) => {
                            eventClick.stopPropagation();
                            setSelectedDate(event.date);
                            setEditingEvent(event);
                          }}
                        >
                          <div className="truncate font-medium">{zhText(event.title)}</div>
                          {timeLabel(event) ? <div className="mt-0.5 text-[10px] opacity-80">{timeLabel(event)}</div> : null}
                        </div>
                      ))}
                      {dayEvents.length > 3 ? <div className="text-[11px] font-medium text-slate-500">+{dayEvents.length - 3} 件</div> : null}
                    </div>
                  </button>
                );
                })}
              </section>
            ) : null}

            {viewMode === "week" ? (
              <section className="grid flex-1 grid-cols-7 px-4 pb-5 sm:px-6">
                {weekCells.map((cell) => {
                  const dayEvents = eventsByDate[cell.key] ?? [];
                  const isToday = cell.key === todayKey;
                  const dayOfWeek = cell.date.getDay();
                  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                  const isJapaneseHoliday = dayEvents.some(isJapaneseHolidayEvent);
                  const isRedDay = isWeekend && !isJapaneseHoliday;
                  return (
                    <button
                      key={cell.key}
                      className={`min-h-[440px] border-b border-r border-slate-200 p-3 text-left first:border-l ${selectedDate === cell.key ? "bg-blue-50/70 ring-2 ring-inset ring-blue-300" : isJapaneseHoliday ? "bg-blue-50/55 hover:bg-blue-50/90" : isRedDay ? "bg-red-50/45 hover:bg-red-50/80" : "hover:bg-slate-50"}`}
                      onClick={() => {
                        setSelectedDate(cell.key);
                        setEditingEvent(null);
                      }}
                    >
                      <div className={`mb-3 flex h-8 w-8 items-center justify-center rounded-full text-sm ${isToday ? "bg-blue-600 font-bold text-white" : isJapaneseHoliday ? "font-semibold text-blue-600" : isRedDay ? "font-semibold text-red-600" : "text-slate-900"}`}>
                        {cell.day}
                      </div>
                      <div className="space-y-2">
                        {dayEvents.map((event) => (
                          <div
                            key={event.id}
                            className={`rounded border px-2 py-1.5 text-[11px] leading-tight ${eventTone(event)}`}
                            onClick={(eventClick) => {
                              eventClick.stopPropagation();
                              setSelectedDate(event.date);
                              setEditingEvent(event);
                            }}
                          >
                            <div className="font-medium">{zhText(event.title)}</div>
                            {timeLabel(event) ? <div className="mt-0.5 text-[10px] opacity-80">{timeLabel(event)}</div> : null}
                          </div>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </section>
            ) : null}

            {viewMode === "day" ? (
              <section className="flex-1 px-4 py-5 sm:px-6">
                <div className="mx-auto max-w-3xl space-y-3">
                  {selectedEvents.length === 0 ? (
                    <button className="w-full rounded-lg border border-dashed border-slate-300 p-6 text-left text-sm text-slate-500" onClick={() => setEditingEvent(createEmptyEvent(selectedDate))}>
                      この日の予定はありません。クリックして追加できます。
                    </button>
                  ) : (
                    selectedEvents.map((event) => (
                      <button key={event.id} className={`w-full rounded-lg border p-4 text-left ${eventTone(event)}`} onClick={() => setEditingEvent(event)}>
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="text-base font-semibold">{zhText(event.title)}</div>
                            <div className="mt-2 flex flex-wrap gap-3 text-xs opacity-75">
                              {event.location ? <span className="flex items-center gap-1"><MapPin size={13} />{zhText(event.location)}</span> : null}
                              <span className="flex items-center gap-1"><Clock size={13} />{timeLabel(event)}</span>
                              {event.transport_owner ? <span>{transportOwnerLabel(event.transport_owner)}</span> : null}
                            </div>
                          </div>
                          <span className="text-sm font-medium opacity-75">{event.start_datetime?.slice(11, 16) ?? "終日"}</span>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </section>
            ) : null}

            <section className="grid gap-4 border-t border-slate-200 bg-slate-50/70 px-6 py-4 lg:grid-cols-[1fr_360px]">
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-semibold">{selectedDate} の予定</h3>
                  <button className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white" onClick={() => setEditingEvent(createEmptyEvent(selectedDate))}>
                    予定を追加
                  </button>
                </div>
                <div className="space-y-2">
                  {selectedEvents.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500">この日の予定はありません。</div>
                  ) : (
                    selectedEvents.map((event) => (
                      <button key={event.id} className={`w-full rounded-lg border p-3 text-left ${eventTone(event)}`} onClick={() => setEditingEvent(event)}>
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-semibold">{zhText(event.title)}</span>
                          <span className="text-xs opacity-75">{timeLabel(event)}</span>
                        </div>
                        <div className="mt-1 flex flex-wrap gap-3 text-xs opacity-75">
                          {event.location ? <span className="flex items-center gap-1"><MapPin size={12} />{zhText(event.location)}</span> : null}
                          {timeLabel(event) ? <span className="flex items-center gap-1"><Clock size={12} />{timeLabel(event)}</span> : null}
                          {event.transport_owner ? <span>{transportOwnerLabel(event.transport_owner)}</span> : null}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-semibold">{editingEvent ? "予定編集" : "予定詳細"}</h3>
                  {editingEvent && state.events.some((event) => event.id === editingEvent.id) ? (
                    <button className="rounded-md p-2 text-red-600 hover:bg-red-50" title="削除" onClick={() => removeEvent(editingEvent.id)}>
                      <Trash2 size={17} />
                    </button>
                  ) : null}
                </div>

                {editingEvent ? (
                  <div className="space-y-3">
                    <label className="grid gap-1 text-sm">
                      タイトル
                      <input className="rounded-md border border-slate-200 px-3 py-2" value={editingEvent.title} onChange={(event) => {
                        setSaveStatus("idle");
                        setEditingEvent({ ...editingEvent, title: event.target.value });
                      }} />
                    </label>
                    <label className="grid gap-1 text-sm">
                      日付
                      <input className="rounded-md border border-slate-200 px-3 py-2" type="date" value={editingEvent.date} onChange={(event) => {
                        const date = event.target.value;
                        setSaveStatus("idle");
                        setEditingEvent({
                          ...editingEvent,
                          date,
                          start_datetime: updateTime(date, editingEvent.start_datetime?.slice(11, 16) ?? ""),
                          end_datetime: updateTime(date, editingEvent.end_datetime?.slice(11, 16) ?? "")
                        });
                        setSelectedDate(date);
                      }} />
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <label className="grid gap-1 text-sm">
                        開始
                        <input className="rounded-md border border-slate-200 px-3 py-2" type="time" value={editingEvent.start_datetime?.slice(11, 16) ?? ""} onChange={(event) => {
                          setSaveStatus("idle");
                          setEditingEvent({ ...editingEvent, start_datetime: updateTime(editingEvent.date, event.target.value), all_day: false });
                        }} />
                      </label>
                      <label className="grid gap-1 text-sm">
                        終了
                        <input className="rounded-md border border-slate-200 px-3 py-2" type="time" value={editingEvent.end_datetime?.slice(11, 16) ?? ""} onChange={(event) => {
                          setSaveStatus("idle");
                          setEditingEvent({ ...editingEvent, end_datetime: updateTime(editingEvent.date, event.target.value), all_day: false });
                        }} />
                      </label>
                    </div>
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={Boolean(editingEvent.all_day)} onChange={(event) => {
                        setSaveStatus("idle");
                        setEditingEvent({ ...editingEvent, all_day: event.target.checked, start_datetime: event.target.checked ? undefined : editingEvent.start_datetime, end_datetime: event.target.checked ? undefined : editingEvent.end_datetime });
                      }} />
                      終日
                    </label>
                    <label className="grid gap-1 text-sm">
                      場所
                      <input className="rounded-md border border-slate-200 px-3 py-2" value={editingEvent.location ?? ""} onChange={(event) => {
                        setSaveStatus("idle");
                        setEditingEvent({ ...editingEvent, location: event.target.value });
                      }} />
                    </label>
                    <label className="grid gap-1 text-sm">
                      種類
                      <select className="rounded-md border border-slate-200 px-3 py-2" value={editingEvent.event_type} onChange={(event) => {
                        setSaveStatus("idle");
                        setEditingEvent({ ...editingEvent, event_type: event.target.value as EventType });
                      }}>
                        {eventTypeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                      </select>
                    </label>
                    <label className="grid gap-1 text-sm">
                      送迎
                      <select className="rounded-md border border-slate-200 px-3 py-2" value={editingEvent.transport_owner ?? ""} onChange={(event) => {
                        const owner = event.target.value || undefined;
                        setSaveStatus("idle");
                        setEditingEvent({
                          ...editingEvent,
                          transport_owner: owner,
                          need_transport: Boolean(owner),
                          pickup_required: owner === "ママ" || owner === "パパ",
                          route_id: owner === "bus" ? "r2" : editingEvent.route_id
                        });
                      }}>
                        {transportOwnerOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                      </select>
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={Boolean(editingEvent.need_parent_action)} onChange={(event) => {
                        setSaveStatus("idle");
                        setEditingEvent({ ...editingEvent, need_parent_action: event.target.checked });
                      }} />
                      保護者対応が必要
                    </label>
                    {saveStatus === "saved" ? <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">保存しました</div> : null}
                    <button className={`flex w-full items-center justify-center gap-2 rounded-md px-4 py-2 font-medium text-white disabled:opacity-40 ${saveStatus === "saved" ? "bg-slate-400" : "bg-blue-600 hover:bg-blue-700"}`} disabled={!editingEvent.title.trim() || saveStatus === "saved"} onClick={saveEvent}>
                      <Save size={17} />
                      {saveStatus === "saved" ? "保存しました" : "保存"}
                    </button>
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500">日付または予定をクリックすると編集できます。</div>
                )}
              </div>
            </section>

            <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-6 py-3 text-xs text-slate-500">
              <div className="flex items-center gap-4">
                <span>{viewMode === "month" ? "今月" : viewMode === "week" ? "今週" : "今日"}の予定 {visibleEvents.length} 件</span>
                <span className="flex items-center gap-1">
                  <AlertTriangle size={14} />
                  競合 {conflictCount} 件
                </span>
              </div>
              <Link href="/backup" className="flex items-center gap-1 rounded-md px-2 py-1 hover:bg-slate-100">
                <Download size={14} />
                バックアップ
              </Link>
            </footer>
          </main>
        </div>
      </div>
    </RoleGuard>
  );
}
