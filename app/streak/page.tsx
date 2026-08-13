"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Circle,
  Flame,
  Home,
  Trophy
} from "lucide-react";
import {
  loadState,
  onStateSynced,
  refreshCloudStateNow,
  saveState,
  toggleTask,
  type AppState
} from "@/lib/db";
import { ensureDailyTasks } from "@/lib/dailyTasks";
import {
  bestStreak,
  currentStreak,
  familyPerfectDaysThisMonth,
  habits,
  localDateKey,
  monthSummary,
  recentDays,
  statusForDate,
  taskForHabitDate,
  todayDoneCount,
  type HabitDayStatus
} from "@/lib/habitStats";

function dayLabel(dateKey: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    month: "numeric",
    day: "numeric"
  }).format(new Date(`${dateKey}T12:00:00+09:00`));
}

function weekdayLabel(dateKey: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    weekday: "short"
  }).format(new Date(`${dateKey}T12:00:00+09:00`));
}

function fullDateLabel(date: Date) {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long"
  }).format(date);
}

function statusClass(status: HabitDayStatus) {
  if (status === "done") {
    return "border-emerald-300/30 bg-emerald-300/15 text-emerald-200";
  }
  if (status === "pending") {
    return "border-amber-300/30 bg-amber-300/10 text-amber-200";
  }
  if (status === "missed") {
    return "border-rose-300/20 bg-rose-300/[0.06] text-rose-300/70";
  }
  return "border-white/5 bg-white/[0.025] text-slate-600";
}

function StatusMark({ status }: { status: HabitDayStatus }) {
  if (status === "done") return <Check size={18} />;
  if (status === "pending") return <Circle size={16} />;
  if (status === "missed") return <span className="text-sm">–</span>;
  return <span className="text-xs">·</span>;
}

export default function StreakPage() {
  const [state, setState] = useState<AppState | null>(null);
  const [now] = useState(() => new Date());

  useEffect(() => {
    let disposed = false;

    const applyDaily = (base: AppState) => {
      const ensured = ensureDailyTasks(base, new Date());
      if (ensured !== base) saveState(ensured);
      if (!disposed) setState(ensured);
    };

    applyDaily(loadState());

    void refreshCloudStateNow().then(() => {
      if (!disposed) applyDaily(loadState());
    });

    const unsubscribe = onStateSynced((next) => {
      applyDaily(next);
    });

    return () => {
      disposed = true;
      unsubscribe();
    };
  }, []);

  const tasks = state?.tasks ?? [];
  const today = localDateKey(now);
  const days = useMemo(() => recentDays(14, now), [now]);

  const summaries = useMemo(
    () =>
      habits.map((habit) => ({
        ...habit,
        current: currentStreak(tasks, habit.key, today),
        best: bestStreak(tasks, habit.key, today),
        month: monthSummary(tasks, habit.key, now),
        todayStatus: statusForDate(tasks, habit.key, today, today)
      })),
    [tasks, today, now]
  );

  const todayDone = todayDoneCount(tasks, now);
  const perfectDays = familyPerfectDaysThisMonth(tasks, now);
  const monthAverage =
    summaries.length > 0
      ? Math.round(
          summaries.reduce((sum, item) => sum + item.month.rate, 0) /
            summaries.length
        )
      : 0;

  function completeToday(key: (typeof habits)[number]["key"]) {
    const task = taskForHabitDate(tasks, key, today);
    if (!task || task.status === "done") return;
    const next = toggleTask(task.id);
    setState(next);
  }

  return (
    <main className="min-h-screen bg-[#06101f] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_15%_0%,rgba(34,211,238,0.12),transparent_30%),radial-gradient(circle_at_90%_10%,rgba(129,140,248,0.12),transparent_28%),linear-gradient(145deg,#06101f,#0b1729_55%,#07111f)]" />

      <div className="relative mx-auto max-w-[1600px] px-4 py-4 sm:px-6 lg:px-8">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <div className="text-sm font-semibold tracking-[0.16em] text-orange-200">
              FAMILY STREAK
            </div>
            <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
              坚持记录 · 継続状況
            </h1>
            <div className="mt-1 text-sm text-slate-400">
              {fullDateLabel(now)}
            </div>
          </div>

          <div className="flex gap-2">
            <Link
              href="/display"
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-white/[0.07] px-4 text-sm font-semibold text-slate-200 active:bg-white/[0.14]"
            >
              <Home size={18} />
              Screen
            </Link>
            <Link
              href="/learning"
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-white/[0.07] px-4 text-sm font-semibold text-slate-200 active:bg-white/[0.14]"
            >
              <ArrowLeft size={18} />
              Learning
            </Link>
          </div>
        </header>

        <section className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-emerald-300/[0.08] p-4">
            <div className="text-sm text-emerald-100">今日完成</div>
            <div className="mt-1 text-4xl font-bold">
              {todayDone}
              <span className="ml-1 text-xl text-slate-400">/ {habits.length}</span>
            </div>
            <div className="mt-2 text-sm text-slate-400">
              三项都完成就是 Family Perfect Day
            </div>
          </div>

          <div className="rounded-2xl bg-orange-300/[0.08] p-4">
            <div className="text-sm text-orange-100">本月平均完成率</div>
            <div className="mt-1 text-4xl font-bold">{monthAverage}%</div>
            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-orange-300"
                style={{ width: `${monthAverage}%` }}
              />
            </div>
          </div>

          <div className="rounded-2xl bg-indigo-300/[0.08] p-4">
            <div className="text-sm text-indigo-100">本月全员完成</div>
            <div className="mt-1 text-4xl font-bold">{perfectDays}日</div>
            <div className="mt-2 text-sm text-slate-400">
              English + Dad + Mom 同日全部完成
            </div>
          </div>
        </section>

        <section className="mt-4 grid gap-3 lg:grid-cols-3">
          {summaries.map((habit) => (
            <article
              key={habit.key}
              className="rounded-2xl bg-white/[0.055] p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-lg font-bold">{habit.label}</div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-orange-300/10 px-3 py-1.5 text-sm font-semibold text-orange-200">
                      <Flame size={16} />
                      连续 {habit.current}日
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-300/10 px-3 py-1.5 text-sm font-semibold text-amber-200">
                      <Trophy size={16} />
                      最长 {habit.best}日
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={habit.todayStatus === "done"}
                  onClick={() => completeToday(habit.key)}
                  className={`grid h-14 w-14 shrink-0 place-items-center rounded-full border transition active:scale-95 ${
                    habit.todayStatus === "done"
                      ? "border-emerald-300/30 bg-emerald-300/15 text-emerald-200"
                      : "border-white/10 bg-white/[0.06] text-slate-300 active:bg-emerald-300/15 active:text-emerald-100"
                  }`}
                  aria-label={`${habit.label} 今日完成`}
                >
                  {habit.todayStatus === "done" ? (
                    <CheckCircle2 size={28} />
                  ) : (
                    <Circle size={27} />
                  )}
                </button>
              </div>

              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-slate-400">本月完成率</span>
                  <span className="font-bold">
                    {habit.month.rate}% · {habit.month.done}/{habit.month.tracked}
                  </span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-emerald-300"
                    style={{ width: `${habit.month.rate}%` }}
                  />
                </div>
              </div>
            </article>
          ))}
        </section>

        <section className="mt-4 rounded-2xl bg-white/[0.045] p-4">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold">最近14天</h2>
              <div className="mt-1 text-sm text-slate-400">
                每一天的坚持情况一眼可见
              </div>
            </div>
            <div className="text-xs text-slate-500">
              ✓ 完成　○ 今天待完成　– 未完成　· 尚未开始记录
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            <div className="min-w-[760px]">
              <div
                className="grid gap-2"
                style={{
                  gridTemplateColumns: `100px repeat(${days.length}, minmax(38px, 1fr))`
                }}
              >
                <div />
                {days.map((day) => (
                  <div key={day} className="text-center text-xs text-slate-500">
                    <div>{weekdayLabel(day)}</div>
                    <div className="mt-0.5 font-semibold text-slate-400">
                      {dayLabel(day)}
                    </div>
                  </div>
                ))}

                {habits.map((habit) => (
                  <div key={habit.key} className="contents">
                    <div className="flex items-center text-sm font-semibold text-slate-300">
                      {habit.shortLabel}
                    </div>

                    {days.map((day) => {
                      const status = statusForDate(tasks, habit.key, day, today);
                      return (
                        <div
                          key={`${habit.key}-${day}`}
                          className={`grid h-10 place-items-center rounded-lg border ${statusClass(
                            status
                          )}`}
                          title={`${habit.label} ${day}`}
                        >
                          <StatusMark status={status} />
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <div className="mt-4 text-center text-xs text-slate-600">
          统计从每日固定任务开始记录的日期起计算；更早的日期不会被算作未完成。
        </div>
      </div>
    </main>
  );
}
