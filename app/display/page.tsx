"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell, BookOpenCheck, CalendarDays, Clock3, MapPin, Moon, Sparkles, SunMedium } from "lucide-react";
import { loadState, refreshCloudStateNow, onStateSynced, type AppState } from "@/lib/db";
import type { FamilyEvent } from "@/types/events";

const todayKey = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long"
  }).format(date);

const formatEventDate = (date: string) =>
  new Intl.DateTimeFormat("ja-JP", { month: "numeric", day: "numeric", weekday: "short" }).format(new Date(`${date}T00:00:00+09:00`));

const formatTime = (value?: string) => {
  if (!value) return "終日";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "終日";
  return new Intl.DateTimeFormat("ja-JP", { hour: "2-digit", minute: "2-digit", hour12: false }).format(date);
};

const eventTimeRange = (event: FamilyEvent) => {
  if (event.all_day || !event.start_datetime) return "終日";
  const start = formatTime(event.start_datetime);
  const end = event.end_datetime ? formatTime(event.end_datetime) : "";
  return end ? `${start} - ${end}` : start;
};

const greeting = (date: Date) => {
  const hour = date.getHours();
  if (hour < 5) return "おつかれさま";
  if (hour < 11) return "おはようございます";
  if (hour < 18) return "こんにちは";
  return "こんばんは";
};

const categoryColor = (event: FamilyEvent) => {
  if (event.calendar_type === "school") return "bg-sky-300";
  if (event.calendar_type === "child_activity") return "bg-emerald-300";
  if (event.calendar_type === "company") return "bg-violet-300";
  if (event.calendar_type === "family") return "bg-rose-300";
  if (event.calendar_type.includes("holiday")) return "bg-blue-300";
  return "bg-amber-300";
};

const isVisibleEvent = (event: FamilyEvent) => !event.deleted_at && !event.id.startsWith("dad-company-off-");

const sortEvents = (a: FamilyEvent, b: FamilyEvent) =>
  `${a.date}${a.start_datetime ?? "00:00"}`.localeCompare(`${b.date}${b.start_datetime ?? "00:00"}`);

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 p-5">
      <div className="text-sm font-medium uppercase tracking-[0.18em] text-slate-300">{label}</div>
      <div className="mt-2 text-4xl font-semibold text-white">{value}</div>
    </div>
  );
}

export default function DisplayPage() {
  const [state, setState] = useState<AppState | null>(null);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    setState(loadState());
    void refreshCloudStateNow();

    const unsubscribe = onStateSynced(setState);
    const syncTimer = window.setInterval(() => {
      void refreshCloudStateNow();
    }, 60_000);
    const clockTimer = window.setInterval(() => setNow(new Date()), 30_000);

    return () => {
      unsubscribe();
      window.clearInterval(syncTimer);
      window.clearInterval(clockTimer);
    };
  }, []);

  const data = useMemo(() => {
    const events = (state?.events ?? []).filter(isVisibleEvent).sort(sortEvents);
    const today = todayKey(now);
    const todayEvents = events.filter((event) => event.date === today);
    const upcomingEvents = events.filter((event) => event.date >= today).slice(0, 7);
    const notices = events
      .filter((event) => event.date >= today && (event.need_parent_action || event.parent_task))
      .slice(0, 4);
    const completedTasks = (state?.tasks ?? []).filter((task) => task.status === "done").length;
    const totalTasks = state?.tasks.length ?? 0;
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const childEventsToday = todayEvents.filter((event) => event.calendar_type === "school" || event.calendar_type === "child_activity").length;

    return {
      today,
      todayEvents,
      primaryEvent: todayEvents[0],
      upcomingEvents,
      notices,
      completedTasks,
      totalTasks,
      progress,
      childEventsToday
    };
  }, [state, now]);

  return (
    <main className="min-h-screen overflow-hidden bg-[#08111f] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(56,189,248,0.24),transparent_32%),radial-gradient(circle_at_85%_5%,rgba(167,139,250,0.22),transparent_30%),linear-gradient(135deg,rgba(15,23,42,0.95),rgba(8,17,31,1))]" />
      <section className="relative mx-auto flex min-h-screen w-full max-w-[1920px] flex-col px-6 py-6 sm:px-10 lg:px-14 lg:py-10">
        <header className="flex flex-col gap-6 border-b border-white/10 pb-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-3 text-cyan-200">
              <Sparkles className="h-7 w-7" />
              <span className="text-lg font-semibold tracking-[0.22em]">Family Dashboard v2</span>
            </div>
            <h1 className="mt-5 text-4xl font-semibold tracking-normal text-white sm:text-5xl lg:text-7xl">{greeting(now)}</h1>
            <p className="mt-4 text-xl text-slate-300 lg:text-2xl">{formatDate(now)}</p>
          </div>
          <div className="flex items-center gap-5 rounded-3xl border border-white/10 bg-white/10 px-6 py-5 shadow-2xl shadow-black/20 backdrop-blur">
            {now.getHours() >= 6 && now.getHours() < 18 ? <SunMedium className="h-10 w-10 text-amber-200" /> : <Moon className="h-10 w-10 text-indigo-200" />}
            <div className="text-6xl font-semibold tabular-nums tracking-normal lg:text-8xl">
              {new Intl.DateTimeFormat("ja-JP", { hour: "2-digit", minute: "2-digit", hour12: false }).format(now)}
            </div>
          </div>
        </header>

        <div className="grid flex-1 gap-6 py-8 lg:grid-cols-[1.05fr_1.35fr] xl:grid-cols-[1fr_1.45fr]">
          <section className="grid gap-6">
            <article className="rounded-3xl border border-white/10 bg-white/[0.09] p-7 shadow-2xl shadow-black/20 backdrop-blur">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-cyan-200">
                  <CalendarDays className="h-7 w-7" />
                  <h2 className="text-2xl font-semibold">TODAY</h2>
                </div>
                <span className="rounded-full bg-cyan-300/15 px-4 py-2 text-lg text-cyan-100">{data.todayEvents.length}件</span>
              </div>

              <div className="mt-8 rounded-2xl bg-slate-950/45 p-6">
                {data.primaryEvent ? (
                  <>
                    <div className="text-2xl text-slate-300">{eventTimeRange(data.primaryEvent)}</div>
                    <div className="mt-3 text-4xl font-semibold leading-tight text-white lg:text-5xl">{data.primaryEvent.title}</div>
                    {data.primaryEvent.location ? (
                      <div className="mt-5 flex items-center gap-2 text-xl text-slate-300">
                        <MapPin className="h-6 w-6 text-cyan-200" />
                        {data.primaryEvent.location}
                      </div>
                    ) : null}
                  </>
                ) : (
                  <div className="py-8 text-3xl text-slate-300">今日の予定はありません</div>
                )}
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4">
                <StatCard label="Today total" value={data.todayEvents.length} />
                <StatCard label="School / Child" value={data.childEventsToday} />
              </div>
            </article>

            <article className="rounded-3xl border border-white/10 bg-white/[0.09] p-7 shadow-2xl shadow-black/20 backdrop-blur">
              <div className="flex items-center gap-3 text-emerald-200">
                <BookOpenCheck className="h-7 w-7" />
                <h2 className="text-2xl font-semibold">Learning</h2>
              </div>
              <div className="mt-7 flex items-end justify-between">
                <div>
                  <div className="text-6xl font-semibold">{data.progress}%</div>
                  <p className="mt-3 text-xl text-slate-300">
                    {data.completedTasks} / {data.totalTasks} 完了
                  </p>
                </div>
                <div className="text-right text-lg text-slate-400">課題・準備の進捗</div>
              </div>
              <div className="mt-8 h-5 overflow-hidden rounded-full bg-slate-900">
                <div className="h-full rounded-full bg-gradient-to-r from-emerald-300 to-cyan-300" style={{ width: `${data.progress}%` }} />
              </div>
            </article>
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <article className="rounded-3xl border border-white/10 bg-white/[0.09] p-7 shadow-2xl shadow-black/20 backdrop-blur">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold">Family Calendar / Upcoming</h2>
                <span className="text-lg text-slate-300">Next 7</span>
              </div>
              <div className="mt-6 grid gap-3">
                {data.upcomingEvents.map((event) => (
                  <div key={event.id} className="grid grid-cols-[92px_92px_1fr] items-center gap-4 rounded-2xl border border-white/10 bg-slate-950/35 px-5 py-4">
                    <div className="text-lg font-semibold text-slate-200">{formatEventDate(event.date)}</div>
                    <div className="flex items-center gap-2 text-lg text-slate-300">
                      <Clock3 className="h-5 w-5 text-slate-400" />
                      {eventTimeRange(event)}
                    </div>
                    <div className="flex min-w-0 items-center gap-3">
                      <span className={`h-3.5 w-3.5 shrink-0 rounded-full ${categoryColor(event)}`} />
                      <span className="truncate text-2xl font-medium text-white">{event.title}</span>
                    </div>
                  </div>
                ))}
                {data.upcomingEvents.length === 0 ? <div className="rounded-2xl bg-slate-950/35 p-6 text-xl text-slate-300">今後の予定はありません</div> : null}
              </div>
            </article>

            <article className="rounded-3xl border border-white/10 bg-white/[0.09] p-7 shadow-2xl shadow-black/20 backdrop-blur">
              <div className="flex items-center gap-3 text-amber-200">
                <Bell className="h-7 w-7" />
                <h2 className="text-2xl font-semibold">Quick Notice</h2>
              </div>
              <div className="mt-6 grid gap-4">
                {data.notices.map((event) => (
                  <div key={event.id} className="rounded-2xl border border-amber-200/15 bg-amber-200/10 p-5">
                    <div className="text-lg text-amber-100">
                      {formatEventDate(event.date)} · {eventTimeRange(event)}
                    </div>
                    <div className="mt-2 text-2xl font-semibold leading-snug">{event.parent_task || event.title}</div>
                  </div>
                ))}
                {data.notices.length === 0 ? <div className="rounded-2xl bg-slate-950/35 p-6 text-xl text-slate-300">確認が必要な予定はありません</div> : null}
              </div>
            </article>
          </section>
        </div>

        <footer className="flex flex-col gap-2 border-t border-white/10 pt-5 text-base text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <span>スマホの Family Schedule Hub で予定を編集すると、この画面にも反映されます。</span>
          <span>Cloud sync · 60 sec refresh</span>
        </footer>
      </section>
    </main>
  );
}
