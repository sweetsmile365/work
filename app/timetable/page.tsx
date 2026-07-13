"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BookOpen, Check, Save } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { RoleGuard } from "@/components/RoleGuard";
import { loadState, saveSchoolTimetable } from "@/lib/db";
import { useResponsiveLayout } from "@/lib/useResponsiveLayout";
import type { SchoolTimetable, WeekdayKey } from "@/types/timetable";

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

function todayWeekday(): WeekdayKey {
  const day = new Date().getDay();
  return day === 2 ? "tue" : day === 3 ? "wed" : day === 4 ? "thu" : day === 5 ? "fri" : "mon";
}

function normalizeTimetable(timetable: SchoolTimetable): SchoolTimetable {
  const maxPeriods = Math.max(7, ...weekdays.map((day) => timetable.weekdays[day.key]?.length ?? 0));
  return {
    ...timetable,
    dayTimes: Array.from({ length: maxPeriods }, (_, index) => timetable.dayTimes[index] ?? ""),
    weekdays: weekdays.reduce((acc, day) => {
      acc[day.key] = Array.from({ length: maxPeriods }, (_, index) => timetable.weekdays[day.key]?.[index] ?? { subject: "" });
      return acc;
    }, {} as SchoolTimetable["weekdays"]),
    afterSchoolNotes: timetable.afterSchoolNotes ?? {}
  };
}

export default function TimetablePage() {
  const [draft, setDraft] = useState<SchoolTimetable | null>(null);
  const [selectedDay, setSelectedDay] = useState<WeekdayKey>(todayWeekday());
  const [saved, setSaved] = useState(false);
  const { isMobile } = useResponsiveLayout();

  useEffect(() => {
    setDraft(normalizeTimetable(loadState().schoolTimetable));
  }, []);

  const selectedDayLabel = useMemo(() => weekdays.find((day) => day.key === selectedDay)?.label ?? "月曜日", [selectedDay]);

  if (!draft) return null;

  function updateSlot(day: WeekdayKey, periodIndex: number, field: "subject" | "items" | "memo", value: string) {
    setSaved(false);
    setDraft((current) => {
      if (!current) return current;
      const next = normalizeTimetable(current);
      next.weekdays[day] = next.weekdays[day].map((slot, index) => (index === periodIndex ? { ...slot, [field]: value } : slot));
      return next;
    });
  }

  function updateAfterSchool(day: WeekdayKey, value: string) {
    setSaved(false);
    setDraft((current) => current ? { ...current, afterSchoolNotes: { ...current.afterSchoolNotes, [day]: value } } : current);
  }

  function updateTime(periodIndex: number, value: string) {
    setSaved(false);
    setDraft((current) => current ? { ...current, dayTimes: current.dayTimes.map((time, index) => index === periodIndex ? value : time) } : current);
  }

  function handleSave() {
    if (!draft) return;
    saveSchoolTimetable(normalizeTimetable(draft));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  }

  const mobileView = (
    <div className="space-y-4">
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-semibold text-blue-700"><BookOpen size={18} /> 学校時間割</div>
        <h2 className="mt-1 text-xl font-bold text-slate-950">{draft.gradeClass}</h2>
        <p className="mt-1 text-base text-slate-600">日程とは分けて、毎週の授業だけを管理します。</p>
      </div>

      <div className="grid grid-cols-5 gap-2">
        {weekdays.map((day) => (
          <button key={day.key} className={`min-h-11 rounded-xl text-base font-bold ${selectedDay === day.key ? "bg-blue-600 text-white" : "bg-white text-slate-700 shadow-sm"}`} onClick={() => setSelectedDay(day.key)}>
            {day.short}
          </button>
        ))}
      </div>

      <section className="space-y-3">
        <h3 className="text-xl font-bold">{selectedDayLabel}</h3>
        {draft.weekdays[selectedDay].map((slot, index) => (
          <div key={`${selectedDay}-${index}`} className={`rounded-2xl border p-4 shadow-sm ${subjectStyles[slot.subject] ?? "border-slate-200 bg-white text-slate-900"}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold opacity-70">{index + 1}限 {draft.dayTimes[index]}</div>
                <input className="mt-1 min-h-11 w-full bg-transparent text-xl font-bold outline-none" value={slot.subject} onChange={(event) => updateSlot(selectedDay, index, "subject", event.target.value)} placeholder="科目" />
              </div>
            </div>
            <input className="mt-3 min-h-11 w-full rounded-xl border border-white/70 bg-white/70 px-3 text-base outline-none" value={slot.items ?? ""} onChange={(event) => updateSlot(selectedDay, index, "items", event.target.value)} placeholder="準備物" />
            <input className="mt-2 min-h-11 w-full rounded-xl border border-white/70 bg-white/70 px-3 text-base outline-none" value={slot.memo ?? ""} onChange={(event) => updateSlot(selectedDay, index, "memo", event.target.value)} placeholder="メモ / 宿題" />
          </div>
        ))}
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <label className="text-base font-bold">放課後メモ</label>
          <input className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 px-3 text-base" value={draft.afterSchoolNotes[selectedDay] ?? ""} onChange={(event) => updateAfterSchool(selectedDay, event.target.value)} placeholder="部活・委員会など" />
        </div>
      </section>
    </div>
  );

  const desktopView = (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-white p-4 shadow-soft">
        <div>
          <div className="text-sm font-semibold text-blue-700">学校時間割</div>
          <input className="mt-1 rounded-md border border-slate-200 px-3 py-2 text-2xl font-bold" value={draft.gradeClass} onChange={(event) => setDraft({ ...draft, gradeClass: event.target.value })} />
        </div>
        <Link href="/child-schedule" className="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold hover:bg-slate-50">子どもの予定へ</Link>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-soft">
        <div className="grid grid-cols-[80px_repeat(5,minmax(130px,1fr))] border-b border-slate-200 bg-slate-50">
          <div className="p-3 text-sm font-bold text-slate-600">時限</div>
          {weekdays.map((day) => <div key={day.key} className="border-l border-slate-200 p-3 text-center text-base font-bold">{day.label}</div>)}
        </div>
        {draft.dayTimes.map((time, periodIndex) => (
          <div key={periodIndex} className="grid grid-cols-[80px_repeat(5,minmax(130px,1fr))] border-b border-slate-100 last:border-b-0">
            <div className="space-y-2 bg-slate-50 p-2">
              <div className="text-center text-base font-bold">{periodIndex + 1}</div>
              <input className="w-full rounded border border-slate-200 px-1 py-1 text-center text-xs" value={time} onChange={(event) => updateTime(periodIndex, event.target.value)} />
            </div>
            {weekdays.map((day) => {
              const slot = draft.weekdays[day.key][periodIndex];
              return (
                <div key={day.key} className="border-l border-slate-100 p-2">
                  <div className={`rounded-lg border p-2 ${subjectStyles[slot.subject] ?? "border-slate-200 bg-white text-slate-900"}`}>
                    <input className="min-h-10 w-full bg-transparent text-base font-bold outline-none" value={slot.subject} onChange={(event) => updateSlot(day.key, periodIndex, "subject", event.target.value)} placeholder="科目" />
                    <input className="mt-2 min-h-9 w-full rounded border border-white/70 bg-white/75 px-2 text-sm outline-none" value={slot.items ?? ""} onChange={(event) => updateSlot(day.key, periodIndex, "items", event.target.value)} placeholder="準備物" />
                    <input className="mt-2 min-h-9 w-full rounded border border-white/70 bg-white/75 px-2 text-sm outline-none" value={slot.memo ?? ""} onChange={(event) => updateSlot(day.key, periodIndex, "memo", event.target.value)} placeholder="メモ" />
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        <div className="grid grid-cols-[80px_repeat(5,minmax(130px,1fr))] bg-slate-50">
          <div className="p-3 text-sm font-bold">放課後</div>
          {weekdays.map((day) => (
            <div key={day.key} className="border-l border-slate-200 p-2">
              <input className="min-h-10 w-full rounded-md border border-slate-200 bg-white px-2 text-sm" value={draft.afterSchoolNotes[day.key] ?? ""} onChange={(event) => updateAfterSchool(day.key, event.target.value)} placeholder="部活など" />
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
        <button className="fixed bottom-[calc(148px+env(safe-area-inset-bottom))] left-4 right-4 z-40 flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 text-base font-bold text-white shadow-lg md:bottom-6 md:left-auto md:right-6 md:w-auto md:px-5" onClick={handleSave}>
          {saved ? <Check size={20} /> : <Save size={20} />}
          {saved ? "保存しました" : "時間割を保存"}
        </button>
      </AppShell>
    </RoleGuard>
  );
}
