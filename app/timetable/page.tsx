"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  CalendarDays,
  Check,
  RotateCcw,
  Save
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { RoleGuard } from "@/components/RoleGuard";
import { loadState, saveSchoolTimetable } from "@/lib/db";
import { useResponsiveLayout } from "@/lib/useResponsiveLayout";
import type {
  SchoolTimetable,
  TimetableDayOverride,
  WeekdayKey
} from "@/types/timetable";

const SCHOOL_DISPLAY_DEFAULT_FROM = "2026-08-24";

const weekdays: Array<{ key: WeekdayKey; label: string; short: string }> = [
  { key: "mon", label: "月曜日", short: "月" },
  { key: "tue", label: "火曜日", short: "火" },
  { key: "wed", label: "水曜日", short: "水" },
  { key: "thu", label: "木曜日", short: "木" },
  { key: "fri", label: "金曜日", short: "金" }
];

const subjectStyles: Record<string, string> = {
  数学: "bg-blue-50 text-blue-800 border-blue-200",
  国語: "bg-rose-50 text-rose-800 border-rose-200",
  英語: "bg-emerald-50 text-emerald-800 border-emerald-200",
  英TT: "bg-emerald-50 text-emerald-800 border-emerald-200",
  体育: "bg-orange-50 text-orange-800 border-orange-200",
  美術: "bg-fuchsia-50 text-fuchsia-800 border-fuchsia-200",
  音楽: "bg-violet-50 text-violet-800 border-violet-200",
  生物: "bg-lime-50 text-lime-800 border-lime-200",
  化学: "bg-cyan-50 text-cyan-800 border-cyan-200",
  歴史: "bg-amber-50 text-amber-800 border-amber-200",
  地理: "bg-teal-50 text-teal-800 border-teal-200",
  家庭: "bg-pink-50 text-pink-800 border-pink-200",
  総合: "bg-indigo-50 text-indigo-800 border-indigo-200",
  道徳: "bg-slate-50 text-slate-800 border-slate-200",
  LHR: "bg-slate-50 text-slate-800 border-slate-200"
};

function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function weekdayKeyForDate(dateKey: string): WeekdayKey | null {
  const day = new Date(`${dateKey}T12:00:00+09:00`).getDay();
  if (day === 1) return "mon";
  if (day === 2) return "tue";
  if (day === 3) return "wed";
  if (day === 4) return "thu";
  if (day === 5) return "fri";
  return null;
}

function todayWeekday(): WeekdayKey {
  return weekdayKeyForDate(localDateKey()) ?? "mon";
}

function normalizeTimetable(timetable: SchoolTimetable): SchoolTimetable {
  const maxPeriods = Math.max(
    7,
    timetable.dayTimes?.length ?? 0,
    ...weekdays.map((day) => timetable.weekdays?.[day.key]?.length ?? 0)
  );

  return {
    ...timetable,
    displayEnabled: timetable.displayEnabled ?? true,
    displayFrom: timetable.displayFrom ?? SCHOOL_DISPLAY_DEFAULT_FROM,
    dailyOverrides: timetable.dailyOverrides ?? {},
    dayTimes: Array.from(
      { length: maxPeriods },
      (_, index) => timetable.dayTimes?.[index] ?? ""
    ),
    weekdays: weekdays.reduce((acc, day) => {
      acc[day.key] = Array.from(
        { length: maxPeriods },
        (_, index) =>
          timetable.weekdays?.[day.key]?.[index] ?? { subject: "" }
      );
      return acc;
    }, {} as SchoolTimetable["weekdays"]),
    afterSchoolNotes: timetable.afterSchoolNotes ?? {}
  };
}

function getOverride(
  timetable: SchoolTimetable,
  dateKey: string
): TimetableDayOverride {
  return timetable.dailyOverrides?.[dateKey] ?? {};
}

function hasOwnSlot(
  slots: TimetableDayOverride["slots"],
  periodIndex: number
) {
  return Object.prototype.hasOwnProperty.call(
    slots ?? {},
    String(periodIndex)
  );
}

export default function TimetablePage() {
  const [draft, setDraft] = useState<SchoolTimetable | null>(null);
  const [selectedDay, setSelectedDay] =
    useState<WeekdayKey>(todayWeekday());
  const [overrideDate, setOverrideDate] = useState(localDateKey());
  const [saved, setSaved] = useState(false);
  const { isMobile } = useResponsiveLayout();

  useEffect(() => {
    setDraft(normalizeTimetable(loadState().schoolTimetable));
  }, []);

  const selectedDayLabel = useMemo(
    () =>
      weekdays.find((day) => day.key === selectedDay)?.label ?? "月曜日",
    [selectedDay]
  );

  const overrideWeekday = useMemo(
    () => weekdayKeyForDate(overrideDate),
    [overrideDate]
  );

  if (!draft) return null;

  const dayOverride = getOverride(draft, overrideDate);
  const overrideBaseSlots = overrideWeekday
    ? draft.weekdays[overrideWeekday]
    : [];
  const overrideDayLabel = overrideWeekday
    ? weekdays.find((day) => day.key === overrideWeekday)?.label ?? ""
    : "土日";

  function updateSlot(
    day: WeekdayKey,
    periodIndex: number,
    field: "subject" | "items" | "memo",
    value: string
  ) {
    setSaved(false);
    setDraft((current) => {
      if (!current) return current;
      const next = normalizeTimetable(current);
      return {
        ...next,
        weekdays: {
          ...next.weekdays,
          [day]: next.weekdays[day].map((slot, index) =>
            index === periodIndex ? { ...slot, [field]: value } : slot
          )
        }
      };
    });
  }

  function updateAfterSchool(day: WeekdayKey, value: string) {
    setSaved(false);
    setDraft((current) =>
      current
        ? {
            ...current,
            afterSchoolNotes: {
              ...current.afterSchoolNotes,
              [day]: value
            }
          }
        : current
    );
  }

  function updateTime(periodIndex: number, value: string) {
    setSaved(false);
    setDraft((current) =>
      current
        ? {
            ...current,
            dayTimes: current.dayTimes.map((time, index) =>
              index === periodIndex ? value : time
            )
          }
        : current
    );
  }

  function updateDisplaySettings(
    patch: Partial<
      Pick<SchoolTimetable, "displayEnabled" | "displayFrom">
    >
  ) {
    setSaved(false);
    setDraft((current) =>
      current ? { ...current, ...patch } : current
    );
  }

  function setDayOverride(
    updater: (current: TimetableDayOverride) => TimetableDayOverride
  ) {
    setSaved(false);
    setDraft((current) => {
      if (!current) return current;
      const previous = getOverride(current, overrideDate);
      const nextOverride = updater(previous);

      return {
        ...current,
        dailyOverrides: {
          ...(current.dailyOverrides ?? {}),
          [overrideDate]: nextOverride
        }
      };
    });
  }

  function updateOverrideSubject(periodIndex: number, value: string) {
    const baseSlot = overrideBaseSlots[periodIndex] ?? { subject: "" };

    setDayOverride((current) => {
      const slots = { ...(current.slots ?? {}) };

      if (!value.trim() || value.trim() === baseSlot.subject) {
        delete slots[String(periodIndex)];
      } else {
        const previous = slots[String(periodIndex)];
        const previousSlot =
          previous && typeof previous === "object" ? previous : baseSlot;

        slots[String(periodIndex)] = {
          ...previousSlot,
          subject: value
        };
      }

      return {
        ...current,
        slots
      };
    });
  }

  function cancelOverridePeriod(periodIndex: number) {
    setDayOverride((current) => ({
      ...current,
      slots: {
        ...(current.slots ?? {}),
        [String(periodIndex)]: null
      }
    }));
  }

  function resetOverridePeriod(periodIndex: number) {
    setDayOverride((current) => {
      const slots = { ...(current.slots ?? {}) };
      delete slots[String(periodIndex)];
      return { ...current, slots };
    });
  }

  function resetWholeDayOverride() {
    setSaved(false);
    setDraft((current) => {
      if (!current) return current;
      const dailyOverrides = { ...(current.dailyOverrides ?? {}) };
      delete dailyOverrides[overrideDate];
      return { ...current, dailyOverrides };
    });
  }

  function effectiveSubject(periodIndex: number) {
    if (dayOverride.noSchool) return "";
    if (
      dayOverride.periodCount !== undefined &&
      periodIndex >= dayOverride.periodCount
    ) {
      return "";
    }

    if (hasOwnSlot(dayOverride.slots, periodIndex)) {
      const overrideSlot = dayOverride.slots?.[String(periodIndex)];
      return overrideSlot?.subject ?? "";
    }

    return overrideBaseSlots[periodIndex]?.subject ?? "";
  }

  function handleSave() {
    if (!draft) return;
    saveSchoolTimetable(normalizeTimetable(draft));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  }

  const displaySettings = (
    <section className="rounded-2xl border border-blue-100 bg-blue-50/80 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sm font-bold text-blue-800">
            Dashboard 授業表示
          </div>
          <div className="mt-1 text-sm text-slate-600">
            開学日以降、平日の固定時間割を Dashboard に自動表示します。
          </div>
        </div>

        <button
          type="button"
          onClick={() =>
            updateDisplaySettings({
              displayEnabled: !(draft.displayEnabled ?? true)
            })
          }
          className={`rounded-full px-4 py-2 text-sm font-bold ${
            draft.displayEnabled ?? true
              ? "bg-blue-600 text-white"
              : "bg-slate-200 text-slate-600"
          }`}
        >
          {draft.displayEnabled ?? true ? "表示 ON" : "表示 OFF"}
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <label className="text-sm font-semibold text-slate-700">
          表示開始日
        </label>
        <input
          type="date"
          value={draft.displayFrom ?? SCHOOL_DISPLAY_DEFAULT_FROM}
          onChange={(event) =>
            updateDisplaySettings({ displayFrom: event.target.value })
          }
          className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm"
        />
        <span className="text-xs text-slate-500">
          現在の設定: {draft.displayFrom ?? SCHOOL_DISPLAY_DEFAULT_FROM} から
        </span>
      </div>
    </section>
  );

  const dailyOverrideEditor = (
    <section className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm font-bold text-amber-800">
            <CalendarDays size={18} />
            当日だけ変更
          </div>
          <div className="mt-1 text-sm text-slate-600">
            換課・休講・短縮授業はここで変更。固定時間割には影響しません。
          </div>
        </div>

        <button
          type="button"
          onClick={resetWholeDayOverride}
          className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-white px-3 py-2 text-xs font-bold text-amber-800"
        >
          <RotateCcw size={14} />
          この日の変更を全部戻す
        </button>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-[180px_1fr_160px]">
        <label className="grid gap-1 text-sm font-semibold text-slate-700">
          日付
          <input
            type="date"
            value={overrideDate}
            onChange={(event) => setOverrideDate(event.target.value)}
            className="rounded-lg border border-amber-200 bg-white px-3 py-2"
          />
        </label>

        <label className="grid gap-1 text-sm font-semibold text-slate-700">
          この日のメモ
          <input
            value={dayOverride.label ?? ""}
            onChange={(event) =>
              setDayOverride((current) => ({
                ...current,
                label: event.target.value
              }))
            }
            placeholder="例: 短縮授業 / 定期テスト / 特別時間割"
            className="rounded-lg border border-amber-200 bg-white px-3 py-2"
          />
        </label>

        <label className="grid gap-1 text-sm font-semibold text-slate-700">
          授業数
          <select
            value={
              dayOverride.periodCount === undefined
                ? "normal"
                : String(dayOverride.periodCount)
            }
            onChange={(event) =>
              setDayOverride((current) => ({
                ...current,
                periodCount:
                  event.target.value === "normal"
                    ? undefined
                    : Number(event.target.value)
              }))
            }
            className="rounded-lg border border-amber-200 bg-white px-3 py-2"
          >
            <option value="normal">通常どおり</option>
            {draft.dayTimes.map((_, index) => (
              <option key={index + 1} value={index + 1}>
                {index + 1}限まで
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="mt-3 flex cursor-pointer items-center gap-2 rounded-xl bg-white/80 px-3 py-2 text-sm font-semibold text-slate-700">
        <input
          type="checkbox"
          checked={Boolean(dayOverride.noSchool)}
          onChange={(event) =>
            setDayOverride((current) => ({
              ...current,
              noSchool: event.target.checked
            }))
          }
        />
        この日は「授業なし」
      </label>

      <div className="mt-4">
        <div className="mb-2 text-sm font-bold text-slate-800">
          {overrideDate} · {overrideDayLabel}
        </div>

        {!overrideWeekday ? (
          <div className="rounded-xl bg-white p-4 text-sm text-slate-500">
            土日は固定時間割がありません。特別登校日は Calendar の予定として管理してください。
          </div>
        ) : (
          <div className="grid gap-2">
            {draft.dayTimes.map((time, periodIndex) => {
              const base = overrideBaseSlots[periodIndex]?.subject ?? "";
              const effective = effectiveSubject(periodIndex);
              const changed = hasOwnSlot(
                dayOverride.slots,
                periodIndex
              );
              const canceled =
                changed &&
                dayOverride.slots?.[String(periodIndex)] === null;
              const hiddenByCount =
                dayOverride.periodCount !== undefined &&
                periodIndex >= dayOverride.periodCount;

              return (
                <div
                  key={periodIndex}
                  className={`grid items-center gap-2 rounded-xl border bg-white p-3 md:grid-cols-[84px_110px_minmax(160px,1fr)_auto] ${
                    changed || hiddenByCount
                      ? "border-amber-300"
                      : "border-slate-200"
                  }`}
                >
                  <div className="text-sm font-bold text-slate-700">
                    {periodIndex + 1}限
                    <div className="text-xs font-normal text-slate-400">
                      {time}
                    </div>
                  </div>

                  <div className="text-sm text-slate-500">
                    通常: <span className="font-bold">{base || "—"}</span>
                  </div>

                  <input
                    value={canceled ? "" : effective}
                    disabled={
                      Boolean(dayOverride.noSchool) || hiddenByCount
                    }
                    onChange={(event) =>
                      updateOverrideSubject(
                        periodIndex,
                        event.target.value
                      )
                    }
                    placeholder={canceled ? "休講" : "変更科目"}
                    className="min-h-10 rounded-lg border border-slate-200 px-3 text-base font-bold disabled:bg-slate-100 disabled:text-slate-400"
                  />

                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      disabled={
                        Boolean(dayOverride.noSchool) || hiddenByCount
                      }
                      onClick={() =>
                        cancelOverridePeriod(periodIndex)
                      }
                      className="rounded-lg bg-rose-50 px-2.5 py-2 text-xs font-bold text-rose-700 disabled:opacity-40"
                    >
                      休講
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        resetOverridePeriod(periodIndex)
                      }
                      className="rounded-lg bg-slate-100 px-2.5 py-2 text-xs font-bold text-slate-600"
                    >
                      戻す
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {Object.keys(dayOverride.slots ?? {}).length > 0 ||
      dayOverride.noSchool ||
      dayOverride.periodCount !== undefined ||
      dayOverride.label ? (
        <div className="mt-3 rounded-xl bg-amber-100 px-3 py-2 text-xs font-semibold text-amber-900">
          この日は臨時変更あり。Dashboard では変更された科目に ↻ を表示します。
        </div>
      ) : null}
    </section>
  );

  const mobileView = (
    <div className="space-y-4">
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-semibold text-blue-700">
          <BookOpen size={18} /> 学校時間割
        </div>
        <h2 className="mt-1 text-xl font-bold text-slate-950">
          {draft.gradeClass}
        </h2>
        <p className="mt-1 text-base text-slate-600">
          毎週の固定時間割 + 日付ごとの臨時変更を管理します。
        </p>
      </div>

      {displaySettings}
      {dailyOverrideEditor}

      <div className="grid grid-cols-5 gap-2">
        {weekdays.map((day) => (
          <button
            key={day.key}
            className={`min-h-11 rounded-xl text-base font-bold ${
              selectedDay === day.key
                ? "bg-blue-600 text-white"
                : "bg-white text-slate-700 shadow-sm"
            }`}
            onClick={() => setSelectedDay(day.key)}
          >
            {day.short}
          </button>
        ))}
      </div>

      <section className="space-y-3">
        <h3 className="text-xl font-bold">{selectedDayLabel}</h3>
        {draft.weekdays[selectedDay].map((slot, index) => (
          <div
            key={`${selectedDay}-${index}`}
            className={`rounded-2xl border p-4 shadow-sm ${
              subjectStyles[slot.subject] ??
              "border-slate-200 bg-white text-slate-900"
            }`}
          >
            <div className="text-sm font-semibold opacity-70">
              {index + 1}限 {draft.dayTimes[index]}
            </div>
            <input
              className="mt-1 min-h-11 w-full bg-transparent text-xl font-bold outline-none"
              value={slot.subject}
              onChange={(event) =>
                updateSlot(
                  selectedDay,
                  index,
                  "subject",
                  event.target.value
                )
              }
              placeholder="科目"
            />
            <input
              className="mt-3 min-h-11 w-full rounded-xl border border-white/70 bg-white/70 px-3 text-base outline-none"
              value={slot.items ?? ""}
              onChange={(event) =>
                updateSlot(
                  selectedDay,
                  index,
                  "items",
                  event.target.value
                )
              }
              placeholder="準備物"
            />
            <input
              className="mt-2 min-h-11 w-full rounded-xl border border-white/70 bg-white/70 px-3 text-base outline-none"
              value={slot.memo ?? ""}
              onChange={(event) =>
                updateSlot(
                  selectedDay,
                  index,
                  "memo",
                  event.target.value
                )
              }
              placeholder="メモ / 宿題"
            />
          </div>
        ))}

        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <label className="text-base font-bold">放課後メモ</label>
          <input
            className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 px-3 text-base"
            value={draft.afterSchoolNotes[selectedDay] ?? ""}
            onChange={(event) =>
              updateAfterSchool(selectedDay, event.target.value)
            }
            placeholder="部活・委員会など"
          />
        </div>
      </section>
    </div>
  );

  const desktopView = (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-white p-4 shadow-soft">
        <div>
          <div className="text-sm font-semibold text-blue-700">
            学校時間割
          </div>
          <input
            className="mt-1 rounded-md border border-slate-200 px-3 py-2 text-2xl font-bold"
            value={draft.gradeClass}
            onChange={(event) =>
              setDraft({ ...draft, gradeClass: event.target.value })
            }
          />
        </div>
        <Link
          href="/child-schedule"
          className="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold hover:bg-slate-50"
        >
          子どもの予定へ
        </Link>
      </div>

      {displaySettings}
      {dailyOverrideEditor}

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-soft">
        <div className="grid grid-cols-[80px_repeat(5,minmax(130px,1fr))] border-b border-slate-200 bg-slate-50">
          <div className="p-3 text-sm font-bold text-slate-600">
            時限
          </div>
          {weekdays.map((day) => (
            <div
              key={day.key}
              className="border-l border-slate-200 p-3 text-center text-base font-bold"
            >
              {day.label}
            </div>
          ))}
        </div>

        {draft.dayTimes.map((time, periodIndex) => (
          <div
            key={periodIndex}
            className="grid grid-cols-[80px_repeat(5,minmax(130px,1fr))] border-b border-slate-100 last:border-b-0"
          >
            <div className="space-y-2 bg-slate-50 p-2">
              <div className="text-center text-base font-bold">
                {periodIndex + 1}
              </div>
              <input
                className="w-full rounded border border-slate-200 px-1 py-1 text-center text-xs"
                value={time}
                onChange={(event) =>
                  updateTime(periodIndex, event.target.value)
                }
              />
            </div>

            {weekdays.map((day) => {
              const slot = draft.weekdays[day.key][periodIndex];
              return (
                <div
                  key={day.key}
                  className="border-l border-slate-100 p-2"
                >
                  <div
                    className={`rounded-lg border p-2 ${
                      subjectStyles[slot.subject] ??
                      "border-slate-200 bg-white text-slate-900"
                    }`}
                  >
                    <input
                      className="min-h-10 w-full bg-transparent text-base font-bold outline-none"
                      value={slot.subject}
                      onChange={(event) =>
                        updateSlot(
                          day.key,
                          periodIndex,
                          "subject",
                          event.target.value
                        )
                      }
                      placeholder="科目"
                    />
                    <input
                      className="mt-2 min-h-9 w-full rounded border border-white/70 bg-white/75 px-2 text-sm outline-none"
                      value={slot.items ?? ""}
                      onChange={(event) =>
                        updateSlot(
                          day.key,
                          periodIndex,
                          "items",
                          event.target.value
                        )
                      }
                      placeholder="準備物"
                    />
                    <input
                      className="mt-2 min-h-9 w-full rounded border border-white/70 bg-white/75 px-2 text-sm outline-none"
                      value={slot.memo ?? ""}
                      onChange={(event) =>
                        updateSlot(
                          day.key,
                          periodIndex,
                          "memo",
                          event.target.value
                        )
                      }
                      placeholder="メモ"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        <div className="grid grid-cols-[80px_repeat(5,minmax(130px,1fr))] bg-slate-50">
          <div className="p-3 text-sm font-bold">放課後</div>
          {weekdays.map((day) => (
            <div
              key={day.key}
              className="border-l border-slate-200 p-2"
            >
              <input
                className="min-h-10 w-full rounded-md border border-slate-200 bg-white px-2 text-sm"
                value={draft.afterSchoolNotes[day.key] ?? ""}
                onChange={(event) =>
                  updateAfterSchool(day.key, event.target.value)
                }
                placeholder="部活など"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <RoleGuard>
      <AppShell title="学校時間割">
        {isMobile ? mobileView : desktopView}

        <button
          className="fixed bottom-[calc(148px+env(safe-area-inset-bottom))] left-4 right-4 z-40 flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 text-base font-bold text-white shadow-lg md:bottom-6 md:left-auto md:right-6 md:w-auto md:px-5"
          onClick={handleSave}
        >
          {saved ? <Check size={20} /> : <Save size={20} />}
          {saved ? "保存しました" : "時間割を保存"}
        </button>
      </AppShell>
    </RoleGuard>
  );
}
