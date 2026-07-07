"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { CalendarView } from "@/components/CalendarView";
import { RoleGuard } from "@/components/RoleGuard";
import { MobileEventCard } from "@/components/responsive/MobileEventCard";
import { TabletSplitView } from "@/components/responsive/TabletSplitView";
import { loadState, softDeleteEvent, type AppState } from "@/lib/db";
import { useResponsiveLayout } from "@/lib/useResponsiveLayout";
import type { FamilyEvent } from "@/types/events";

type MobileCalendarMode = "today" | "week" | "list";

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function addDays(key: string, days: number) {
  const date = new Date(`${key}T00:00:00+09:00`);
  date.setDate(date.getDate() + days);
  return dateKey(date);
}

function weekRange(today: string) {
  const date = new Date(`${today}T00:00:00+09:00`);
  const start = new Date(date);
  start.setDate(date.getDate() - date.getDay());
  return { start: dateKey(start), end: addDays(dateKey(start), 6) };
}

function activeEvents(events: FamilyEvent[]) {
  return events.filter((event) => !event.deleted_at && !event.id.startsWith("dad-company-off-")).sort((a, b) => `${a.date}${a.start_datetime ?? ""}`.localeCompare(`${b.date}${b.start_datetime ?? ""}`));
}

export default function CalendarPage() {
  const [state, setState] = useState<AppState | null>(null);
  const [mode, setMode] = useState<MobileCalendarMode>("week");
  const { isMobile, isTablet } = useResponsiveLayout();
  useEffect(() => setState(loadState()), []);
  if (!state) return null;

  const today = dateKey(new Date());
  const range = weekRange(today);
  const events = activeEvents(state.events);
  const mobileEvents = events.filter((event) => {
    if (mode === "today") return event.date === today;
    if (mode === "week") return event.date >= range.start && event.date <= range.end;
    return event.date >= today;
  });
  const selected = mobileEvents[0];
  const grouped = useMemo(() => {
    return mobileEvents.reduce<Record<string, FamilyEvent[]>>((acc, event) => {
      acc[event.date] = [...(acc[event.date] ?? []), event];
      return acc;
    }, {});
  }, [mobileEvents]);

  const mobileContent = (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        {[
          ["today", "今日"],
          ["week", "本周"],
          ["list", "列表"]
        ].map(([value, label]) => (
          <button key={value} className={`min-h-11 rounded-xl text-base font-semibold ${mode === value ? "bg-blue-600 text-white" : "bg-white text-slate-700"}`} onClick={() => setMode(value as MobileCalendarMode)}>
            {label}
          </button>
        ))}
      </div>
      {Object.entries(grouped).map(([date, dayEvents]) => (
        <section key={date} className="space-y-3">
          <h2 className="text-lg font-bold">{date}</h2>
          {dayEvents.map((event) => <MobileEventCard key={event.id} event={event} />)}
        </section>
      ))}
      {mobileEvents.length === 0 ? <div className="rounded-xl bg-white p-5 text-base text-slate-500">予定はありません。</div> : null}
    </div>
  );

  const tabletContent = (
    <TabletSplitView
      left={<div className="space-y-3">{mobileEvents.map((event) => <MobileEventCard key={event.id} event={event} />)}</div>}
      right={<div className="rounded-xl bg-white p-5 shadow-sm"><h2 className="text-xl font-bold">詳細</h2>{selected ? <div className="mt-4"><MobileEventCard event={selected} /></div> : <p className="mt-4 text-slate-500">予定を選んでください。</p>}</div>}
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
