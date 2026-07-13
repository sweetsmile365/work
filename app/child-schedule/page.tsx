"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { ChildScheduleCard } from "@/components/ChildScheduleCard";
import { RoleGuard } from "@/components/RoleGuard";
import { MobileEventCard } from "@/components/responsive/MobileEventCard";
import { MobileTaskCard } from "@/components/responsive/MobileTaskCard";
import { TabletSplitView } from "@/components/responsive/TabletSplitView";
import { defaultChecklists, loadState, toggleTask, type AppState } from "@/lib/db";
import { useResponsiveLayout } from "@/lib/useResponsiveLayout";

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function addDays(key: string, days: number) {
  const date = new Date(`${key}T00:00:00+09:00`);
  date.setDate(date.getDate() + days);
  return dateKey(date);
}

export default function ChildSchedulePage() {
  const [state, setState] = useState<AppState | null>(null);
  const { isMobile, isTablet } = useResponsiveLayout();
  useEffect(() => setState(loadState()), []);
  if (!state) return null;

  const today = dateKey(new Date());
  const tomorrow = addDays(today, 1);
  const weekEnd = addDays(today, 6);
  const childEvents = state.events
    .filter((event) => !event.deleted_at && (event.calendar_type === "child_activity" || event.calendar_type === "school"))
    .sort((a, b) => `${a.date}${a.start_datetime ?? ""}`.localeCompare(`${b.date}${b.start_datetime ?? ""}`));
  const todayEvents = childEvents.filter((event) => event.date === today);
  const weekEvents = childEvents.filter((event) => event.date >= today && event.date <= weekEnd);
  const badmintonEvents = weekEvents.filter((event) => event.event_type.startsWith("badminton") || event.title.includes("バドミントン"));
  const transportEvents = weekEvents.filter((event) => event.need_transport || event.transport_owner);
  const activeTasks = state.tasks.filter((task) => task.status !== "done");
  const childMode = state.currentUser?.role === "child_editor";

  const mobileContent = (
    <div className="space-y-5">
      <Link href="/timetable" className="block rounded-2xl border border-blue-100 bg-blue-50 p-4 text-base font-bold text-blue-800">
        学校時間割を見る・編集する
      </Link>
      <section className="space-y-3">
        <h2 className="text-xl font-bold">今日の子どもの予定</h2>
        {todayEvents.length ? todayEvents.map((event) => <MobileEventCard key={event.id} event={event} />) : <div className="rounded-xl bg-white p-4 text-base text-slate-500">今日の予定はありません。</div>}
      </section>
      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="text-xl font-bold">明日の持ち物</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {["弁当", "宿題", "教材", ...defaultChecklists.badminton.slice(0, 4)].map((item) => <span key={item} className="rounded-full bg-emerald-50 px-3 py-2 text-base font-medium text-emerald-800">{item}</span>)}
        </div>
        <p className="mt-3 text-base text-slate-500">対象日：{tomorrow}</p>
      </section>
      <section className="space-y-3">
        <h2 className="text-xl font-bold">今週の予定</h2>
        {weekEvents.slice(0, 6).map((event) => <MobileEventCard key={event.id} event={event} />)}
      </section>
      <section className="space-y-3">
        <h2 className="text-xl font-bold">バドミントン部</h2>
        {badmintonEvents.slice(0, 5).map((event) => <MobileEventCard key={event.id} event={event} />)}
      </section>
      <section className="space-y-3">
        <h2 className="text-xl font-bold">宿題 / 練習</h2>
        {activeTasks.map((task) => <MobileTaskCard key={task.id} task={task} childMode={childMode} onToggle={() => setState(toggleTask(task.id))} />)}
      </section>
      <section className="space-y-3">
        <h2 className="text-xl font-bold">送迎</h2>
        {transportEvents.slice(0, 5).map((event) => <MobileEventCard key={event.id} event={event} />)}
      </section>
      {childMode ? <button className="min-h-12 w-full rounded-xl bg-blue-600 text-base font-semibold text-white">自分の予定を追加</button> : null}
    </div>
  );

  const tabletContent = (
    <TabletSplitView
      left={<div className="space-y-3">{weekEvents.map((event) => <MobileEventCard key={event.id} event={event} />)}</div>}
      right={<div className="space-y-3">{activeTasks.map((task) => <MobileTaskCard key={task.id} task={task} onToggle={() => setState(toggleTask(task.id))} />)}</div>}
    />
  );

  return (
    <RoleGuard>
      <AppShell title="子どもの予定">
        {isMobile ? mobileContent : isTablet ? tabletContent : <ChildScheduleCard events={state.events} tasks={state.tasks} onToggleTask={(id) => setState(toggleTask(id))} />}
      </AppShell>
    </RoleGuard>
  );
}
