"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { CalendarView } from "@/components/CalendarView";
import { RoleGuard } from "@/components/RoleGuard";
import { MobileEventCard } from "@/components/responsive/MobileEventCard";
import { TabletSplitView } from "@/components/responsive/TabletSplitView";
import { loadState, softDeleteEvent, type AppState } from "@/lib/db";
import { useResponsiveLayout } from "@/lib/useResponsiveLayout";
import type { FamilyEvent } from "@/types/events";

type MobileCalendarMode = "today" | "week" | "list";

const weekdayLabels = ["日", "月", "火", "水", "木", "金", "土"];

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function parseDate(key: string) {
  return new Date(`${key}T00:00:00+09:00`);
}

function addDays(key: string, days: number) {
  const date = parseDate(key);
  date.setDate(date.getDate() + days);
  return dateKey(date);
}

function weekRange(key: string) {
  const date = parseDate(key);
  const start = new Date(date);
  start.setDate(date.getDate() - date.getDay());
  return { start: dateKey(start), end: addDays(dateKey(start), 6) };
}

function monthLabel(key: string) {
  const date = parseDate(key);
  return `${date.getFullYear()}年${date.getMonth() + 1}月`;
}

function shortDateLabel(key: string) {
  const date = parseDate(key);
  return `${date.getMonth() + 1}/${date.getDate()} (${weekdayLabels[date.getDay()]})`;
}

function rangeLabel(mode: MobileCalendarMode, anchorDate: string) {
  if (mode === "today") return shortDateLabel(anchorDate);
  if (mode === "week") {
    const range = weekRange(anchorDate);
    return `${shortDateLabel(range.start)} - ${shortDateLabel(range.end)}`;
  }
  return `${monthLabel(anchorDate)}から30日`;
}

function activeEvents(events: FamilyEvent[]) {
  return events
    .filter((event) => !event.deleted_at && !event.id.startsWith("dad-company-off-"))
    .sort((a, b) => `${a.date}${a.start_datetime ?? ""}`.localeCompare(`${b.date}${b.start_datetime ?? ""}`));
}

export default function CalendarPage() {
  const [state, setState] = useState<AppState | null>(null);
  const [mode, setMode] = useState<MobileCalendarMode>("week");
  const [anchorDate, setAnchorDate] = useState(() => dateKey(new Date()));
  const [selectedDate, setSelectedDate] = useState(() => dateKey(new Date()));
  const { isMobile, isTablet } = useResponsiveLayout();

  useEffect(() => setState(loadState()), []);
  if (!state) return null;

  const today = dateKey(new Date());
  const range = weekRange(anchorDate);
  const events = activeEvents(state.events);
  const eventsByDate = events.reduce<Record<string, FamilyEvent[]>>((acc, event) => {
    acc[event.date] = [...(acc[event.date] ?? []), event];
    return acc;
  }, {});

  const mobileEvents = events.filter((event) => {
    if (mode === "today") return event.date === selectedDate;
    if (mode === "week") return event.date >= range.start && event.date <= range.end;
    return event.date >= anchorDate && event.date <= addDays(anchorDate, 30);
  });

  const selectedDateEvents = eventsByDate[selectedDate] ?? [];
  const weekDays = Array.from({ length: 7 }, (_, index) => addDays(range.start, index));
  const selected = mobileEvents[0];
  const grouped = mobileEvents.reduce<Record<string, FamilyEvent[]>>((acc, event) => {
    acc[event.date] = [...(acc[event.date] ?? []), event];
    return acc;
  }, {});

  function moveDate(direction: -1 | 1) {
    const step = mode === "list" ? 30 : mode === "week" ? 7 : 1;
    const next = addDays(anchorDate, step * direction);
    setAnchorDate(next);
    setSelectedDate(next);
  }

  function resetToToday() {
    setAnchorDate(today);
    setSelectedDate(today);
  }

  function changeMode(nextMode: MobileCalendarMode) {
    setMode(nextMode);
    setAnchorDate(selectedDate);
  }

  const mobileContent = (
    <div className="space-y-5">
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <button className="min-h-11 rounded-xl border border-slate-200 px-4 text-base font-semibold text-slate-700" onClick={() => moveDate(-1)}>
            前へ
          </button>
          <div className="min-w-0 text-center">
            <div className="text-xl font-bold text-slate-950">{monthLabel(anchorDate)}</div>
            <div className="text-sm font-medium text-slate-500">{rangeLabel(mode, anchorDate)}</div>
          </div>
          <button className="min-h-11 rounded-xl border border-slate-200 px-4 text-base font-semibold text-slate-700" onClick={() => moveDate(1)}>
            次へ
          </button>
        </div>
        <button className="mt-3 min-h-11 w-full rounded-xl bg-slate-100 text-base font-semibold text-slate-700" onClick={resetToToday}>
          今日に戻る
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[
          ["today", "今日"],
          ["week", "本週"],
          ["list", "リスト"]
        ].map(([value, label]) => (
          <button key={value} className={`min-h-11 rounded-xl text-base font-semibold ${mode === value ? "bg-blue-600 text-white" : "bg-white text-slate-700 shadow-sm"}`} onClick={() => changeMode(value as MobileCalendarMode)}>
            {label}
          </button>
        ))}
      </div>

      {mode === "week" ? (
        <div className="grid grid-cols-7 gap-1 rounded-2xl bg-white p-2 shadow-sm">
          {weekDays.map((day) => {
            const date = parseDate(day);
            const active = selectedDate === day;
            const count = eventsByDate[day]?.length ?? 0;
            return (
              <button
                key={day}
                className={`min-h-[72px] rounded-xl px-1 text-center ${active ? "bg-blue-600 text-white" : "bg-slate-50 text-slate-700"}`}
                onClick={() => {
                  setSelectedDate(day);
                  setAnchorDate(day);
                }}
              >
                <div className="text-sm font-semibold">{weekdayLabels[date.getDay()]}</div>
                <div className="text-lg font-bold">{date.getDate()}</div>
                <div className={`mx-auto mt-1 h-1.5 w-1.5 rounded-full ${count ? active ? "bg-white" : "bg-blue-500" : "bg-transparent"}`} />
              </button>
            );
          })}
        </div>
      ) : null}

      {mode === "week" ? (
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-950">{shortDateLabel(selectedDate)} の予定</h2>
          {selectedDateEvents.map((event) => <MobileEventCard key={event.id} event={event} />)}
          {selectedDateEvents.length === 0 ? <div className="rounded-xl bg-white p-5 text-base text-slate-500 shadow-sm">予定はありません</div> : null}
        </section>
      ) : (
        <>
          {Object.entries(grouped).map(([date, dayEvents]) => (
            <section key={date} className="space-y-3">
              <h2 className="text-xl font-bold text-slate-950">{shortDateLabel(date)}</h2>
              {dayEvents.map((event) => <MobileEventCard key={event.id} event={event} />)}
            </section>
          ))}
          {mobileEvents.length === 0 ? <div className="rounded-xl bg-white p-5 text-base text-slate-500 shadow-sm">予定はありません</div> : null}
        </>
      )}
    </div>
  );

  const tabletContent = (
    <TabletSplitView
      left={<div className="space-y-3">{mobileEvents.map((event) => <MobileEventCard key={event.id} event={event} />)}</div>}
      right={
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="text-xl font-bold">詳細</h2>
          {selected ? <div className="mt-4"><MobileEventCard event={selected} /></div> : <p className="mt-4 text-slate-500">予定を選んでください。</p>}
        </div>
      }
    />
  );

  return (
    <RoleGuard>
      <AppShell title="日历">
        {isMobile ? mobileContent : isTablet ? tabletContent : <CalendarView events={state.events} onDelete={(id) => setState(softDeleteEvent(id, state.currentUser?.id))} />}
      </AppShell>
    </RoleGuard>
  );
}
