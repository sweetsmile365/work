"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Circle,
  CloudSun,
  Dumbbell,
  Flame,
  MapPin,
  Music2,
  Pause,
  Play,
  Volume2
} from "lucide-react";
import {
  loadState,
  onStateSynced,
  refreshCloudStateNow,
  saveState,
  toggleTask,
  type AppState
} from "@/lib/db";
import {
  ensureDailyTasks,
  isDailyEnglishTask,
  isDailyFitnessTask
} from "@/lib/dailyTasks";
import {
  currentStreak,
  habits,
  localDateKey as habitDateKey,
  statusForDate,
  todayDoneCount
} from "@/lib/habitStats";
import type { ChildTask } from "@/types/activities";
import type { FamilyEvent } from "@/types/events";
import type {
  SchoolTimetable,
  WeekdayKey
} from "@/types/timetable";

type WeatherPoint = {
  id: string;
  label: string;
  latitude: number;
  longitude: number;
};

type WeatherValue = {
  temp?: number;
  code?: number;
  precipitation?: number;
  unavailable?: boolean;
};

type MusicStation = {
  id: string;
  label: string;
  url: string;
  group: "focus" | "radio";
};

type BookPick = {
  category:
    | "management"
    | "technology"
    | "junior"
    | "chinaManagement"
    | "chinaReading";
  categoryLabel: string;
  title: string;
  rank?: number;
  reason: string;
  source: string;
  market?: "JP" | "CN";
  author?: string;
  description: string;
  coverUrl?: string;
};

type BookPickResponse = {
  picks?: BookPick[];
  updatedAt?: string;
};

type SeasonId = "spring" | "summer" | "autumn" | "winter";

type SeasonTheme = {
  id: SeasonId;
  label: string;
  labelJa: string;
  dayBackground: string;
  nightBackground: string;
  glowA: string;
  glowB: string;
};

const seasonThemes: Record<SeasonId, SeasonTheme> = {
  spring: {
    id: "spring",
    label: "SPRING",
    labelJa: "春",
    dayBackground:
      "linear-gradient(145deg,#10202b 0%,#152735 34%,#17332f 68%,#11232d 100%)",
    nightBackground:
      "linear-gradient(145deg,#101826 0%,#182133 40%,#1b2b30 72%,#121e29 100%)",
    glowA: "rgba(244,114,182,0.18)",
    glowB: "rgba(110,231,183,0.13)"
  },
  summer: {
    id: "summer",
    label: "SUMMER",
    labelJa: "夏",
    dayBackground:
      "linear-gradient(145deg,#0d2230 0%,#0f2a35 34%,#12352f 68%,#0d2430 100%)",
    nightBackground:
      "linear-gradient(145deg,#06101f 0%,#0a1c2a 42%,#0a2427 70%,#071620 100%)",
    glowA: "rgba(34,211,238,0.18)",
    glowB: "rgba(52,211,153,0.14)"
  },
  autumn: {
    id: "autumn",
    label: "AUTUMN",
    labelJa: "秋",
    dayBackground:
      "linear-gradient(145deg,#241a15 0%,#2d2018 36%,#2b241d 70%,#1d2025 100%)",
    nightBackground:
      "linear-gradient(145deg,#16110f 0%,#211713 38%,#271c17 70%,#17141a 100%)",
    glowA: "rgba(251,146,60,0.18)",
    glowB: "rgba(245,158,11,0.12)"
  },
  winter: {
    id: "winter",
    label: "WINTER",
    labelJa: "冬",
    dayBackground:
      "linear-gradient(145deg,#14202d 0%,#182735 35%,#1b2b3b 70%,#15232f 100%)",
    nightBackground:
      "linear-gradient(145deg,#07101d 0%,#0c1828 42%,#101d30 72%,#0a1421 100%)",
    glowA: "rgba(147,197,253,0.17)",
    glowB: "rgba(226,232,240,0.13)"
  }
};

function seasonForDate(date: Date): SeasonId {
  const month = date.getMonth() + 1;
  if (month >= 3 && month <= 5) return "spring";
  if (month >= 6 && month <= 8) return "summer";
  if (month >= 9 && month <= 11) return "autumn";
  return "winter";
}

function isDaytime(date: Date) {
  const hour = date.getHours();
  return hour >= 6 && hour < 18;
}

function SeasonalBackdrop({ date }: { date: Date }) {
  const season = seasonForDate(date);
  const theme = seasonThemes[season];
  const daytime = isDaytime(date);
  const particleCount =
    season === "winter" ? 22 : season === "spring" ? 15 : 12;

  return (
    <>
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background: daytime
            ? theme.dayBackground
            : theme.nightBackground
        }}
      />

      <div
        className="pointer-events-none fixed inset-0 opacity-90"
        style={{
          background: `
            radial-gradient(circle at 14% 2%, ${theme.glowA}, transparent 27%),
            radial-gradient(circle at 88% 9%, ${theme.glowB}, transparent 25%),
            radial-gradient(circle at 50% 108%, rgba(255,255,255,0.025), transparent 32%)
          `
        }}
      />

      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background: daytime
            ? "linear-gradient(180deg,rgba(2,8,18,0.10),rgba(2,8,18,0.18))"
            : "linear-gradient(180deg,rgba(0,0,0,0.08),rgba(0,0,0,0.16))"
        }}
      />

      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <style jsx>{`
          @keyframes seasonalDrift {
            0% {
              transform: translate3d(0, -8vh, 0) rotate(0deg);
              opacity: 0;
            }
            12% {
              opacity: 0.55;
            }
            88% {
              opacity: 0.38;
            }
            100% {
              transform: translate3d(var(--season-x, 28px), 110vh, 0)
                rotate(300deg);
              opacity: 0;
            }
          }

          @keyframes summerGlow {
            0%,
            100% {
              opacity: 0.16;
              transform: scale(0.75);
            }
            45% {
              opacity: 0.72;
              transform: scale(1.1);
            }
          }
        `}</style>

        {Array.from({ length: particleCount }).map((_, index) => {
          const left = (index * 37 + 11) % 100;
          const delay = (index * 1.7) % 11;
          const duration = 13 + (index % 7) * 2.2;
          const size =
            season === "winter"
              ? 3 + (index % 4)
              : season === "spring"
                ? 5 + (index % 4)
                : 4 + (index % 3);

          if (season === "summer") {
            return (
              <span
                key={`${season}-${index}`}
                className="absolute rounded-full"
                style={{
                  left: `${left}%`,
                  top: `${14 + ((index * 29) % 72)}%`,
                  width: `${size}px`,
                  height: `${size}px`,
                  background: "rgba(167,243,208,0.8)",
                  boxShadow: "0 0 12px rgba(110,231,183,0.75)",
                  animation: `summerGlow ${3.8 + (index % 5)}s ease-in-out ${delay}s infinite`
                }}
              />
            );
          }

          return (
            <span
              key={`${season}-${index}`}
              className={
                season === "spring"
                  ? "absolute rounded-[65%_35%_70%_30%]"
                  : season === "autumn"
                    ? "absolute rounded-[70%_30%_65%_35%]"
                    : "absolute rounded-full"
              }
              style={{
                left: `${left}%`,
                top: "-4vh",
                width: `${size}px`,
                height:
                  season === "autumn"
                    ? `${Math.max(3, size - 1)}px`
                    : `${size}px`,
                background:
                  season === "spring"
                    ? "rgba(251,207,232,0.72)"
                    : season === "autumn"
                      ? index % 2 === 0
                        ? "rgba(251,146,60,0.62)"
                        : "rgba(245,158,11,0.58)"
                      : "rgba(226,232,240,0.72)",
                boxShadow:
                  season === "winter"
                    ? "0 0 7px rgba(219,234,254,0.3)"
                    : "none",
                ["--season-x" as string]: `${-36 + ((index * 19) % 78)}px`,
                animation: `seasonalDrift ${duration}s linear ${delay}s infinite`
              }}
            />
          );
        })}
      </div>
    </>
  );
}


const weatherLocations: WeatherPoint[] = [
  { id: "hitachi", label: "日立", latitude: 36.599, longitude: 140.651 },
  { id: "tsukuba", label: "つくば", latitude: 36.083, longitude: 140.076 },
  { id: "hitachinaka", label: "ひたちなか", latitude: 36.396, longitude: 140.534 }
];

const musicStations: MusicStation[] = [
  // FOCUS / STUDY
  { id: "relax-classical", label: "Relax Classical", url: "https://relax.stream.publicradio.org/relax.aac", group: "focus" },
  { id: "cello-chamber", label: "Cello / Chamber", url: "https://chambermusic.stream.publicradio.org/chambermusic.aac", group: "focus" },
  { id: "peaceful-piano", label: "Peaceful Piano", url: "https://peacefulpiano.stream.publicradio.org/peacefulpiano.aac", group: "focus" },
  { id: "drone-zone", label: "Drone Zone · Focus", url: "https://ice5.somafm.com/dronezone-128-mp3", group: "focus" },
  { id: "groove-salad", label: "Groove Salad · Study", url: "https://ice.somafm.com/groovesalad", group: "focus" },
  { id: "deep-space-one", label: "Deep Space · Ambient", url: "https://ice5.somafm.com/deepspaceone-128-mp3", group: "focus" },
  { id: "peaceful-guitar", label: "Guitar · Peaceful", url: "https://listen.181fm.com/181-classicalguitar_128k.mp3", group: "focus" },

  // RADIO / NEWS
  { id: "classical", label: "Classical", url: "https://ycradio.stream.publicradio.org/ycradio.aac", group: "radio" },
  { id: "jazz", label: "Jazz", url: "https://ice1.somafm.com/sonicuniverse-128-mp3", group: "radio" },
  { id: "awesome-80s", label: "80s Gold · Hits", url: "https://listen.181fm.com/181-awesome80s_128k.mp3", group: "radio" },
  { id: "abc-news", label: "ABC NewsRadio", url: "https://mediaserviceslive.akamaized.net/hls/live/2038311/newsradio/master.m3u8", group: "radio" },
  { id: "bbc-world", label: "BBC World Service", url: "https://as-hls-ww-live.akamaized.net/pool_87948813/live/ww/bbc_world_service/bbc_world_service.isml/bbc_world_service-audio=96000.norewind.m3u8", group: "radio" }
];

const TODAY_BG_FILENAMES = [
  {
    id: "sun",
    file: "01-sunrise-bay.png"
  },
  {
    id: "mon",
    file: "02-misty-mountain-lake.png"
  },
  {
    id: "tue",
    file: "03-calm-lake-morning.png"
  },
  {
    id: "wed",
    file: "04-golden-river-evening.png"
  },
  {
    id: "thu",
    file: "05-twilight-lotus-pond.png"
  },
  {
    id: "fri",
    file: "06-coastal-dusk.png"
  },
  {
    id: "sat",
    file: "07-moonlit-water-town.png"
  }
] as const;

type TodayBgItem = (typeof TODAY_BG_FILENAMES)[number];
type DayPhase = "day" | "night";

const dayPhaseForDate = (date = new Date()): DayPhase =>
  isDaytime(date) ? "day" : "night";

const todayCardBackgroundForDate = (date = new Date()) => {
  const season = seasonForDate(date);
  const phase = dayPhaseForDate(date);
  const item: TodayBgItem =
    TODAY_BG_FILENAMES[date.getDay() % TODAY_BG_FILENAMES.length];

  return {
    id: item.id,
    season,
    phase,
    image: `/dashboard/today-bg/${season}/${phase}/${item.file}`
  };
};

const todayKey = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const lunarDayName = (day: number) => {
  const names = [
    "",
    "初一", "初二", "初三", "初四", "初五", "初六", "初七", "初八", "初九", "初十",
    "十一", "十二", "十三", "十四", "十五", "十六", "十七", "十八", "十九", "二十",
    "廿一", "廿二", "廿三", "廿四", "廿五", "廿六", "廿七", "廿八", "廿九", "三十"
  ];
  return names[day] ?? String(day);
};

const formatHeaderDate = (date: Date) => {
  const parts = new Intl.DateTimeFormat("zh-CN-u-ca-chinese", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
    timeZone: "Asia/Tokyo"
  }).formatToParts(date) as Array<{ type: string; value: string }>;

  const yearName =
    parts.find((part) => part.type === "yearName")?.value ?? "";
  const month =
    parts.find((part) => part.type === "month")?.value ?? "";
  const dayValue = Number(
    parts.find((part) => part.type === "day")?.value ?? "0"
  );
  const weekday =
    parts.find((part) => part.type === "weekday")?.value ?? "";

  return `农历 ${yearName}年 ${month}${lunarDayName(dayValue)} · ${weekday}`;
};

const formatShortDate = (date: string) =>
  new Intl.DateTimeFormat("ja-JP", {
    month: "numeric",
    day: "numeric",
    weekday: "short"
  }).format(new Date(`${date}T00:00:00+09:00`));

const formatClock = (date: Date) =>
  new Intl.DateTimeFormat("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(date);

const formatTime = (value?: string) => {
  if (!value) return "終日";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "終日";
  return formatClock(date);
};

const eventTimeRange = (event: FamilyEvent) => {
  if (event.all_day || !event.start_datetime) return "終日";
  return event.end_datetime
    ? `${formatTime(event.start_datetime)}-${formatTime(event.end_datetime)}`
    : formatTime(event.start_datetime);
};

const greeting = (date: Date) => {
  const hour = date.getHours();
  if (hour < 5) return "おつかれさま";
  if (hour < 11) return "おはようございます";
  if (hour < 18) return "こんにちは";
  return "こんばんは";
};

const isVisibleEvent = (event: FamilyEvent) =>
  !event.deleted_at && !event.id.startsWith("dad-company-off-");

const eventSortKey = (event: FamilyEvent) =>
  `${event.date}${event.start_datetime ?? "00:00"}`;

const sortEvents = (a: FamilyEvent, b: FamilyEvent) =>
  eventSortKey(a).localeCompare(eventSortKey(b));

const eventStartMs = (event: FamilyEvent) => {
  if (event.all_day || !event.start_datetime) return null;
  const value = new Date(event.start_datetime).getTime();
  return Number.isNaN(value) ? null : value;
};

const eventEndMs = (event: FamilyEvent) => {
  if (event.all_day) return null;

  if (event.end_datetime) {
    const value = new Date(event.end_datetime).getTime();
    if (!Number.isNaN(value)) return value;
  }

  const start = eventStartMs(event);
  return start === null ? null : start + 60 * 60 * 1000;
};

const hasEventEnded = (event: FamilyEvent, now: Date) => {
  if (event.all_day) return false;
  const end = eventEndMs(event);
  return end !== null && end <= now.getTime();
};

const isEventOngoing = (event: FamilyEvent, now: Date) => {
  if (event.all_day) return false;

  const start = eventStartMs(event);
  const end = eventEndMs(event);
  if (start === null || end === null) return false;

  const current = now.getTime();
  return start <= current && current < end;
};

const isEventUpcomingToday = (event: FamilyEvent, now: Date) => {
  if (event.all_day) return false;
  const start = eventStartMs(event);
  return start !== null && start > now.getTime();
};

const selectPrimaryTodayEvent = (
  events: FamilyEvent[],
  now: Date
): FamilyEvent | undefined => {
  const ongoing = events.find((event) => isEventOngoing(event, now));
  if (ongoing) return ongoing;

  const next = events.find((event) => isEventUpcomingToday(event, now));
  if (next) return next;

  return events.find((event) => event.all_day);
};

const categoryColor = (event: FamilyEvent) => {
  if (event.calendar_type === "school") return "bg-sky-300";
  if (event.calendar_type === "child_activity") return "bg-emerald-300";
  if (event.calendar_type === "company") return "bg-violet-300";
  if (event.calendar_type === "family") return "bg-rose-300";
  if (event.calendar_type.includes("holiday")) return "bg-blue-300";
  return "bg-amber-300";
};

type TodayClassItem = {
  period: number;
  subject: string;
  short: string;
  time?: string;
  changed: boolean;
};

type TodayClassSummary = {
  classes: TodayClassItem[];
  label?: string;
};

const SCHOOL_DISPLAY_DEFAULT_FROM = "2026-08-24";

const weekdayKeyForSchoolDate = (date: Date): WeekdayKey | null => {
  const day = date.getDay();
  if (day === 1) return "mon";
  if (day === 2) return "tue";
  if (day === 3) return "wed";
  if (day === 4) return "thu";
  if (day === 5) return "fri";
  return null;
};

const subjectShortLabel = (subject: string) => {
  const normalized = subject.trim();
  const aliases: Record<string, string> = {
    数学: "数",
    国語: "国",
    英語: "英",
    英TT: "英",
    体育: "体",
    生物: "生",
    化学: "化",
    地理: "地",
    歴史: "歴",
    美術: "美",
    音楽: "音",
    家庭: "家",
    総合: "総",
    道徳: "道",
    LHR: "L"
  };

  return aliases[normalized] ?? normalized.slice(0, 1);
};

const subjectPillClass = (subject: string) => {
  if (subject.startsWith("数")) return "border-blue-300/30 bg-blue-300/15 text-blue-100";
  if (subject.startsWith("国")) return "border-rose-300/30 bg-rose-300/15 text-rose-100";
  if (subject.startsWith("英")) return "border-emerald-300/30 bg-emerald-300/15 text-emerald-100";
  if (subject.startsWith("体")) return "border-orange-300/30 bg-orange-300/15 text-orange-100";
  if (subject.startsWith("生")) return "border-lime-300/30 bg-lime-300/15 text-lime-100";
  if (subject.startsWith("化")) return "border-cyan-300/30 bg-cyan-300/15 text-cyan-100";
  if (subject.startsWith("地")) return "border-teal-300/30 bg-teal-300/15 text-teal-100";
  if (subject.startsWith("歴")) return "border-amber-300/30 bg-amber-300/15 text-amber-100";
  if (subject.startsWith("美")) return "border-fuchsia-300/30 bg-fuchsia-300/15 text-fuchsia-100";
  if (subject.startsWith("音")) return "border-violet-300/30 bg-violet-300/15 text-violet-100";
  if (subject.startsWith("家")) return "border-pink-300/30 bg-pink-300/15 text-pink-100";
  if (subject.startsWith("総")) return "border-indigo-300/30 bg-indigo-300/15 text-indigo-100";
  return "border-slate-300/25 bg-slate-300/10 text-slate-100";
};

const resolveTodayClasses = (
  timetable: SchoolTimetable | undefined,
  date: Date,
  todayEvents: FamilyEvent[]
): TodayClassSummary | null => {
  if (!timetable) return null;
  if (timetable.displayEnabled === false) return null;

  const dateKey = todayKey(date);
  const displayFrom =
    timetable.displayFrom || SCHOOL_DISPLAY_DEFAULT_FROM;

  if (dateKey < displayFrom) return null;

  const weekday = weekdayKeyForSchoolDate(date);
  if (!weekday) return null;

  const schoolDayOff = todayEvents.some(
    (event) =>
      event.calendar_type === "school" &&
      (event.is_day_off || event.event_type === "school_holiday")
  );
  if (schoolDayOff) return null;

  const dayOverride = timetable.dailyOverrides?.[dateKey];
  if (dayOverride?.noSchool) return null;

  const baseSlots = timetable.weekdays?.[weekday] ?? [];
  const limit =
    dayOverride?.periodCount !== undefined
      ? Math.max(0, Math.min(dayOverride.periodCount, baseSlots.length))
      : baseSlots.length;

  const classes: TodayClassItem[] = [];

  for (let index = 0; index < limit; index += 1) {
    const key = String(index);
    const hasOverride = Object.prototype.hasOwnProperty.call(
      dayOverride?.slots ?? {},
      key
    );
    const overrideSlot = hasOverride
      ? dayOverride?.slots?.[key]
      : undefined;
    const slot = hasOverride
      ? overrideSlot
      : baseSlots[index];

    if (!slot?.subject?.trim()) continue;

    classes.push({
      period: index + 1,
      subject: slot.subject,
      short: subjectShortLabel(slot.subject),
      time: timetable.dayTimes?.[index],
      changed: hasOverride
    });
  }

  if (classes.length === 0) return null;

  return {
    classes,
    label: dayOverride?.label
  };
};

function TodayClassesStrip({
  summary,
  compact = false
}: {
  summary: TodayClassSummary | null;
  compact?: boolean;
}) {
  if (!summary) return null;

  return (
    <Link
      href="/timetable"
      className={`block rounded-xl border border-sky-200/15 bg-slate-950/35 backdrop-blur-sm ${
        compact ? "px-2.5 py-2" : "px-3 py-2.5"
      }`}
      title="学校時間割を開く"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`font-semibold text-sky-100 ${
            compact ? "text-[10px]" : "text-xs"
          }`}
        >
          今日の授業 · {summary.classes.length}科目
        </span>

        <div className="flex flex-wrap items-center gap-1.5">
          {summary.classes.map((item) => (
            <span
              key={`${item.period}-${item.subject}`}
              className={`relative grid place-items-center rounded-lg border font-bold ${subjectPillClass(
                item.subject
              )} ${
                compact
                  ? "h-7 min-w-7 px-1 text-xs"
                  : "h-8 min-w-8 px-1.5 text-sm"
              }`}
              title={`${item.period}限 ${item.subject}${
                item.time ? ` · ${item.time}` : ""
              }${item.changed ? " · 臨時変更" : ""}`}
            >
              {item.short}
              {item.changed ? (
                <sup className="absolute -right-1 -top-1 text-[9px] text-amber-200">
                  ↻
                </sup>
              ) : null}
            </span>
          ))}
        </div>

        {summary.label ? (
          <span
            className={`truncate text-amber-100 ${
              compact ? "text-[9px]" : "text-[10px]"
            }`}
          >
            {summary.label}
          </span>
        ) : null}
      </div>
    </Link>
  );
}

type TwoDayFlash = {
  category: string;
  kind: "考试" | "常识";
  title: string;
  keyPoint: string;
  hint: string;
  question?: string;
  answer?: string;
};

type TwoDayFlashView = TwoDayFlash & {
  rangeLabel: string;
};


type TodayInHistoryItem = {
  year: string;
  titleJa: string;
  whyJa: string;
  thinkJa: string;
};

const todayInHistoryByMonthDay: Record<string, TodayInHistoryItem> = {
  "08-29": {
    year: "1949",
    titleJa: "ソ連が初の原子爆弾実験に成功",
    whyJa:
      "アメリカだけが核兵器を持つ時代が終わり、冷戦期の核軍拡競争が本格化する大きな転換点になりました。",
    thinkJa:
      "「一つの国だけが強い兵器を持つ場合」と「複数の国が持つ場合」、どちらが安全だと思う？"
  },
  "09-01": {
    year: "1923",
    titleJa: "関東大震災",
    whyJa:
      "東京・横浜を中心に大きな被害が出て、防災・都市計画・災害対応のあり方を考える重要な出来事になりました。",
    thinkJa:
      "大きな災害のあと、町づくりで最初に変えるべきことは何だと思う？"
  },
  "09-02": {
    year: "1945",
    titleJa: "第二次世界大戦の降伏文書に署名",
    whyJa:
      "日本の降伏文書への署名により、第二次世界大戦が正式に終結しました。",
    thinkJa:
      "戦争を終わらせるために、国どうしにはどんな仕組みが必要だと思う？"
  },
  "09-11": {
    year: "2001",
    titleJa: "アメリカ同時多発テロ事件",
    whyJa:
      "国際社会の安全保障やテロ対策、外交政策に大きな影響を与えた出来事です。",
    thinkJa:
      "安全を守ることと自由を守ることは、どう両立できると思う？"
  },
  "09-15": {
    year: "1945",
    titleJa: "第二次世界大戦後の新しい国際秩序へ",
    whyJa:
      "戦後の国際協力や復興を考える流れが強まり、国際機関の役割がより重要になっていきました。",
    thinkJa:
      "国どうしが協力するとき、一番大事なルールは何だと思う？"
  },
  "09-23": {
    year: "1846",
    titleJa: "海王星が観測で確認される",
    whyJa:
      "計算による予測と実際の観測が一致し、科学で「見えないもの」を推理できることを示した象徴的な出来事です。",
    thinkJa:
      "まだ見えていないものを、データだけから予測するには何が必要？"
  },
  "09-29": {
    year: "1829",
    titleJa: "ロンドンの都市警察制度が始まる",
    whyJa:
      "近代的な警察制度の発展につながり、都市の安全をどう守るかという社会制度のモデルになりました。",
    thinkJa:
      "安全な町に必要なのは、ルール・教育・警察のどれだと思う？"
  }
};

function todayInHistoryForDate(date: Date): TodayInHistoryItem {
  const key = `${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;

  return (
    todayInHistoryByMonthDay[key] ?? {
      year: "TODAY",
      titleJa: "今日はどんな歴史があった日？",
      whyJa:
        "毎日ひとつだけ歴史の出来事を覚えると、歴史を「年号」ではなく「流れ」で理解しやすくなります。",
      thinkJa:
        "今日の出来事を一つ調べるなら、政治・科学・文化のどれを選ぶ？"
    }
  );
}

function TodayInHistoryCard({
  date,
  compact = false
}: {
  date: Date;
  compact?: boolean;
}) {
  const item = todayInHistoryForDate(date);

  return (
    <div
      className={`rounded-xl border border-amber-200/15 bg-amber-300/[0.07] ${
        compact ? "px-3 py-2.5" : "px-3 py-3"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="text-[10px] font-black tracking-[0.12em] text-amber-200">
          📜 TODAY IN HISTORY
        </div>
        <div className="shrink-0 text-[10px] font-bold text-amber-100">
          {item.year}
        </div>
      </div>

      <div className={`${compact ? "mt-1 text-xs" : "mt-1.5 text-sm"} font-bold leading-snug text-white`}>
        {item.titleJa}
      </div>

      {!compact ? (
        <>
          <div className="mt-2 text-[11px] leading-relaxed text-slate-300">
            <span className="font-bold text-amber-100">なぜ重要？ </span>
            {item.whyJa}
          </div>
          <div className="mt-2 text-[11px] leading-relaxed text-cyan-100">
            <span className="font-bold">Think: </span>
            {item.thinkJa}
          </div>
        </>
      ) : null}
    </div>
  );
}

const TWO_DAY_FLASH_START = "2026-08-16";

const twoDayFlashes: TwoDayFlash[] = [
  {
    category: "地理",
    kind: "考试",
    title: "时差",
    keyPoint: "15° = 1小时",
    hint: "往东算 → ＋　往西算 → －",
    question: "日本18:00时，伦敦几点？",
    answer: "9:00"
  },
  {
    category: "数学",
    kind: "考试",
    title: "一次方程式",
    keyPoint: "x + 7 = 15 → x = 8",
    hint: "等式两边要做相同的运算",
    question: "x - 5 = 9，x是多少？",
    answer: "14"
  },
  {
    category: "英语",
    kind: "考试",
    title: "三单现",
    keyPoint: "He / She / It → 动词通常 + s",
    hint: "I play. / She plays.",
    question: "He (play) tennis. 怎么写？",
    answer: "He plays tennis."
  },
  {
    category: "理科",
    kind: "考试",
    title: "气体的性质",
    keyPoint: "先看：颜色・气味・水溶性・比空气轻重",
    hint: "做题时按固定顺序确认，不要凭印象猜",
    question: "收集气体时，为什么要先看它是否溶于水？",
    answer: "因为是否溶于水会影响能不能用排水法收集。"
  },
  {
    category: "历史",
    kind: "考试",
    title: "文明",
    keyPoint: "古代文明常在大河流域发展",
    hint: "河流提供水、农业条件和交通便利",
    question: "为什么早期文明常出现在大河附近？",
    answer: "因为水源、灌溉、农业和交通条件较好。"
  },
  {
    category: "常识",
    kind: "常识",
    title: "为什么有四季？",
    keyPoint: "地轴倾斜 + 地球公转",
    hint: "不是因为夏天地球离太阳更近",
    question: "南半球和北半球的季节一样吗？",
    answer: "相反。北半球是夏季时，南半球通常是冬季。"
  }
];

const flashDateFromKey = (dateKey: string) => {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
};

const flashDateLabel = (date: Date) =>
  `${date.getUTCMonth() + 1}/${date.getUTCDate()}`;

const twoDayFlashForDate = (date: Date): TwoDayFlashView => {
  const dateKey = todayKey(date);
  const start = flashDateFromKey(TWO_DAY_FLASH_START);
  const current = flashDateFromKey(dateKey);
  const dayOffset = Math.max(
    0,
    Math.floor((current.getTime() - start.getTime()) / 86_400_000)
  );
  const blockIndex = Math.floor(dayOffset / 2);
  const flash = twoDayFlashes[blockIndex % twoDayFlashes.length];
  const blockStart = new Date(start.getTime() + blockIndex * 2 * 86_400_000);
  const blockEnd = new Date(blockStart.getTime() + 86_400_000);

  return {
    ...flash,
    rangeLabel: `${flashDateLabel(blockStart)}–${flashDateLabel(blockEnd)}`
  };
};

function TwoDayFlashCard({
  flash,
  mode = "full"
}: {
  flash: TwoDayFlashView;
  mode?: "full" | "compact" | "tiny";
}) {
  if (mode === "tiny") {
    return (
      <div className="rounded-xl border border-cyan-200/10 bg-cyan-300/[0.07] px-3 py-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 truncate text-xs font-semibold text-cyan-100">
            ⚡ 今日知识点 · {flash.category}｜{flash.title}
          </div>
          <div className="shrink-0 text-[10px] text-slate-400">
            {flash.rangeLabel}
          </div>
        </div>
      </div>
    );
  }

  if (mode === "compact") {
    return (
      <div className="rounded-xl border border-cyan-200/10 bg-cyan-300/[0.07] px-3 py-3">
        <div className="flex items-center justify-between gap-2">
          <div className="text-[10px] font-bold tracking-[0.12em] text-cyan-200">
            ⚡ 2-DAY FLASH · {flash.category}
          </div>
          <div className="text-[10px] text-slate-400">{flash.rangeLabel}</div>
        </div>
        <div className="mt-1 text-sm font-bold text-white">{flash.title}</div>
        <div className="mt-1 text-sm font-semibold text-emerald-100">
          {flash.keyPoint}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-cyan-200/12 bg-[linear-gradient(145deg,rgba(34,211,238,0.08),rgba(16,185,129,0.05))] p-3.5">
      <div className="flex items-center justify-between gap-2">
        <div className="text-[10px] font-bold tracking-[0.12em] text-cyan-200">
          ⚡ 2-DAY FLASH · {flash.kind}
        </div>
        <div className="rounded-full bg-white/[0.06] px-2 py-1 text-[9px] text-slate-300">
          {flash.rangeLabel}
        </div>
      </div>

      <div className="mt-2 flex items-center gap-2">
        <span className="rounded-full bg-emerald-300/10 px-2 py-1 text-[10px] font-semibold text-emerald-100">
          {flash.category}
        </span>
        <div className="text-base font-bold text-white">{flash.title}</div>
      </div>

      <div className="mt-2 text-[clamp(1rem,1vw,1.2rem)] font-bold text-cyan-100">
        {flash.keyPoint}
      </div>
      <div className="mt-1 text-xs leading-relaxed text-slate-300">
        {flash.hint}
      </div>

      {flash.question && flash.answer ? (
        <details className="mt-2 rounded-lg bg-slate-950/28 px-3 py-2">
          <summary className="cursor-pointer list-none text-xs font-semibold text-amber-100">
            Q. {flash.question}　<span className="text-slate-400">答えを見る</span>
          </summary>
          <div className="mt-2 text-sm font-bold text-white">
            A. {flash.answer}
          </div>
        </details>
      ) : null}
    </div>
  );
}

const weatherLabel = (code?: number) => {
  if (code === undefined) return "取得不可";
  if (code === 0) return "晴れ";
  if ([1, 2].includes(code)) return "ほぼ晴れ";
  if (code === 3) return "くもり";
  if ([45, 48].includes(code)) return "霧";
  if ([51, 53, 55, 56, 57, 61, 80].includes(code)) return "小雨";
  if ([63, 65, 66, 67, 81, 82].includes(code)) return "雨";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "雪";
  if ([95, 96, 99].includes(code)) return "雷雨";
  return "くもり";
};

const learningTypes = new Set<ChildTask["task_type"]>([
  "homework",
  "practice",
  "exam_preparation"
]);

const dueText = (date?: string) => (date ? formatShortDate(date) : "");

async function fetchWeather() {
  const entries = await Promise.all(
    weatherLocations.map(async (location) => {
      try {
        const params = new URLSearchParams({
          latitude: String(location.latitude),
          longitude: String(location.longitude),
          current: "temperature_2m,weather_code",
          hourly: "precipitation_probability",
          timezone: "Asia/Tokyo",
          forecast_days: "1"
        });

        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?${params.toString()}`,
          { cache: "no-store" }
        );

        if (!response.ok) {
          throw new Error(`Weather ${response.status}`);
        }

        const payload = await response.json();
        const localNow = new Date();
        const nowHour = `${todayKey(localNow)}T${String(
          localNow.getHours()
        ).padStart(2, "0")}`;
        const times = Array.isArray(payload?.hourly?.time)
          ? payload.hourly.time
          : [];
        const precipitationValues = Array.isArray(
          payload?.hourly?.precipitation_probability
        )
          ? payload.hourly.precipitation_probability
          : [];
        const hourIndex = times.findIndex((time: string) =>
          time.startsWith(nowHour)
        );

        const temp = Number(payload?.current?.temperature_2m);
        const code = Number(payload?.current?.weather_code);

        const value: WeatherValue = {
          temp: Number.isFinite(temp) ? Math.round(temp) : undefined,
          code: Number.isFinite(code) ? code : undefined,
          precipitation:
            hourIndex >= 0
              ? Number(precipitationValues[hourIndex])
              : undefined
        };

        return [location.id, value] as const;
      } catch {
        return [
          location.id,
          { unavailable: true } satisfies WeatherValue
        ] as const;
      }
    })
  );

  return Object.fromEntries(entries) as Record<string, WeatherValue>;
}


async function fetchBookPicks() {
  try {
    const response = await fetch("/api/book-picks", {
      cache: "no-store"
    });
    if (!response.ok) throw new Error(`Book picks ${response.status}`);
    const payload = (await response.json()) as BookPickResponse;
    return Array.isArray(payload.picks) ? payload.picks : [];
  } catch {
    return [];
  }
}

function SectionTitle({
  title,
  accent
}: {
  title: string;
  accent: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className={`h-2.5 w-2.5 rounded-full ${accent}`} />
      <h2 className="text-[clamp(1.05rem,1.15vw,1.45rem)] font-semibold tracking-[0.12em] text-slate-100">
        {title}
      </h2>
    </div>
  );
}

function WeatherStrip({
  weather
}: {
  weather: Record<string, WeatherValue>;
}) {
  return (
    <div className="h-full min-w-0 rounded-2xl border border-white/[0.06] bg-white/[0.07] px-4 py-3">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold tracking-[0.18em] text-slate-300">
        <CloudSun className="h-4 w-4 text-sky-200" />
        WEATHER
      </div>

      <div className="grid grid-cols-3 gap-4">
        {weatherLocations.map((location) => {
          const value = weather[location.id];

          return (
            <div key={location.id} className="min-w-0">
              <div className="text-sm font-semibold text-slate-200">
                {location.label}
              </div>
              <div className="mt-0.5 flex items-baseline gap-2 whitespace-nowrap text-slate-300">
                <span className="text-2xl font-semibold text-white">
                  {value?.unavailable || value?.temp === undefined
                    ? "--"
                    : value.temp}
                  °
                </span>
                <span className="text-sm">
                  {value?.unavailable
                    ? "取得不可"
                    : weatherLabel(value?.code)}
                </span>
                <span className="text-sm text-sky-200">
                  降水{value?.precipitation ?? "--"}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


function MobileWeather({
  weather
}: {
  weather: Record<string, WeatherValue>;
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {weatherLocations.map((location) => {
        const value = weather[location.id];
        return (
          <div
            key={location.id}
            className="rounded-xl bg-white/[0.055] px-3 py-2"
          >
            <div className="text-xs font-semibold text-slate-300">
              {location.label}
            </div>
            <div className="mt-1 text-lg font-bold text-white">
              {value?.unavailable || value?.temp === undefined
                ? "--"
                : value.temp}
              °
            </div>
            <div className="mt-0.5 truncate text-[11px] text-slate-300">
              {value?.unavailable ? "取得不可" : weatherLabel(value?.code)}
            </div>
          </div>
        );
      })}
    </div>
  );
}


function BookCover({
  book,
  compact = false
}: {
  book: BookPick;
  compact?: boolean;
}) {
  const sizeClass = compact ? "h-12 w-9" : "h-28 w-20";

  return (
    <div
      className={`relative grid shrink-0 place-items-center overflow-hidden rounded-md bg-slate-800 ${sizeClass}`}
    >
      <BookOpen
        className={
          compact ? "h-4 w-4 text-slate-300" : "h-7 w-7 text-slate-300"
        }
      />
      {book.coverUrl ? (
        <img
          src={book.coverUrl}
          alt={`${book.title} 封面`}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover"
          onError={(event) => {
            event.currentTarget.style.display = "none";
          }}
        />
      ) : null}
    </div>
  );
}

function weeklyBookPair(books: BookPick[]) {
  const adultPool = books.filter((book) =>
    ["management", "technology", "chinaManagement"].includes(book.category)
  );
  const childPool = books.filter((book) =>
    ["junior", "chinaReading"].includes(book.category)
  );

  const week = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));

  return {
    adult:
      adultPool.length > 0
        ? adultPool[week % adultPool.length]
        : books[0] ?? null,
    child:
      childPool.length > 0
        ? childPool[week % childPool.length]
        : books.find((book) => book.category === "junior") ?? books[1] ?? null
  };
}

function bookTakeaways(book: BookPick, audience: "adult" | "child") {
  if (audience === "adult") {
    if (book.category === "management") {
      return ["建立更清晰的管理判断框架", "重新思考团队、组织与决策", "把书中的方法连接到实际工作"];
    }
    if (book.category === "technology") {
      return ["理解技术变化背后的长期趋势", "判断AI与科技对工作和社会的影响", "减少只追热点、不看底层逻辑的判断"];
    }
    return ["理解中国商业与科技环境", "比较不同市场的管理与创新方式", "拓展投资与经营判断的视角"];
  }

  if (book.category === "junior") {
    return ["扩大科学、人文或社会知识面", "练习提出问题而不是只记答案", "把阅读内容和学校学习连接起来"];
  }

  return ["建立中文长文阅读习惯", "理解人物、社会和世界的不同视角", "练习用自己的话总结和表达观点"];
}

function childReasonJa(book: BookPick) {
  if (book.category === "junior") {
    return `この本は、中学生が「知っていること」を増やすだけではなく、自分で疑問を持ち、考えるきっかけを作ってくれる本です。${book.description} 学校の勉強だけでは出会いにくいテーマにも触れられるので、視野を広げる読書として今週読む価値があります。`;
  }

  return `この本は、物語や人物の気持ちを追いながら、長い文章を読み続ける力と、自分の考えを言葉にする力を育てるのに向いています。${book.description} 12歳の今だからこそ、登場人物の選択や考え方について家族で話し合う材料にもなります。`;
}

function readingAdvice(book: BookPick, audience: "adult" | "child") {
  if (audience === "adult") {
    return "每天15–20分钟。不要急着读完；每次只记1个值得改变判断或行动的观点。";
  }

  return book.category === "chinaReading"
    ? "每天10–15分钟。读完一小段后，用2–3句话讲给家人听：发生了什么、为什么重要、自己怎么看。"
    : "每天10–15分钟。遇到不懂的地方先做标记，不要求全文查词；读完后说出1个新知识和1个问题。";
}

function WeeklyBookCard({
  book,
  audience,
  compact = false
}: {
  book: BookPick | null;
  audience: "adult" | "child";
  compact?: boolean;
}) {
  if (!book) {
    return (
      <div className="grid min-h-[150px] place-items-center rounded-xl bg-slate-950/30 text-sm text-slate-300">
        今週の本を取得中…
      </div>
    );
  }

  const adult = audience === "adult";
  const takeaways = bookTakeaways(book, audience);

  return (
    <div
      className={`rounded-2xl border ${
        adult
          ? "border-amber-200/15 bg-amber-300/[0.045]"
          : "border-emerald-200/15 bg-emerald-300/[0.045]"
      } ${compact ? "h-full p-3" : "p-4"}`}
    >
      <div className="flex items-start gap-3">
        <BookCover book={book} compact={compact} />

        <div className="min-w-0 flex-1">
          <div
            className={`text-[10px] font-black tracking-[0.12em] ${
              adult ? "text-amber-200" : "text-emerald-200"
            }`}
          >
            {adult ? "👤 FOR ADULT · 40岁" : "🧒 FOR CHILD · 12岁"}
          </div>

          <div className={`${compact ? "mt-1 text-sm" : "mt-1.5 text-base"} font-bold leading-snug text-white`}>
            {book.title}
          </div>

          {book.author ? (
            <div className="mt-1 text-[10px] text-slate-400">{book.author}</div>
          ) : null}

          <div className="mt-1 text-[9px] text-slate-500">
            {book.categoryLabel}
            {book.rank ? ` · #${book.rank}` : ""}
            {book.source ? ` · ${book.source}` : ""}
          </div>
        </div>
      </div>

      <div className="mt-3 rounded-xl bg-slate-950/30 p-3">
        <div className="text-[10px] font-black tracking-[0.1em] text-sky-200">
          {adult ? "为什么这周读" : "今週この本を読む理由"}
        </div>
        <p
          className={`${compact ? "mt-1.5 line-clamp-4 text-[11px]" : "mt-2 text-xs"} leading-relaxed text-slate-200`}
        >
          {adult ? book.description : childReasonJa(book)}
        </p>
      </div>

      {!compact ? (
        <div className="mt-3">
          <div className="text-[10px] font-black tracking-[0.1em] text-violet-200">
            {adult ? "读完希望得到" : "読んでほしいポイント"}
          </div>
          <div className="mt-2 grid gap-1.5">
            {takeaways.map((item) => (
              <div key={item} className="flex gap-2 text-[11px] leading-relaxed text-slate-300">
                <span className={adult ? "text-amber-200" : "text-emerald-200"}>•</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-3 border-t border-white/7 pt-2.5">
        <div className="text-[10px] font-black tracking-[0.1em] text-cyan-200">
          {adult ? "建议读法" : "おすすめの読み方"}
        </div>
        <div className={`${compact ? "mt-1 line-clamp-2" : "mt-1.5"} text-[11px] leading-relaxed text-slate-400`}>
          {readingAdvice(book, audience)}
        </div>
      </div>
    </div>
  );
}

function DesktopBookPickPanel({ books }: { books: BookPick[] }) {
  const pair = weeklyBookPair(books);

  return (
    <div className="grid h-full min-h-0 grid-cols-2 gap-3">
      <WeeklyBookCard book={pair.adult} audience="adult" compact />
      <WeeklyBookCard book={pair.child} audience="child" compact />
    </div>
  );
}

function MobileBookPickPanel({ books }: { books: BookPick[] }) {
  const pair = weeklyBookPair(books);

  return (
    <div className="grid gap-3">
      <WeeklyBookCard book={pair.adult} audience="adult" />
      <WeeklyBookCard book={pair.child} audience="child" />
    </div>
  );
}

function MusicControl() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [stationId, setStationId] = useState(musicStations[0].id);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.45);
  const [error, setError] = useState(false);

  const station =
    musicStations.find((item) => item.id === stationId) ??
    musicStations[0];

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.pause();
    audio.src = station.url;
    audio.volume = volume;
    audio.load();

    setPlaying(false);
    setError(false);
  }, [station.url]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;

    return () => {
      if (!audio) return;
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    };
  }, []);

  const toggle = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    setError(false);

    if (playing) {
      audio.pause();
      setPlaying(false);
      return;
    }

    try {
      await audio.play();
      setPlaying(true);
    } catch {
      setError(true);
      setPlaying(false);
    }
  };

  return (
    <div className="rounded-2xl bg-white/[0.07] px-4 py-3">
      <audio
        ref={audioRef}
        preload="none"
        onError={() => setError(true)}
        onPause={() => setPlaying(false)}
        onPlay={() => setPlaying(true)}
      />

      <div className="mb-2 flex items-center gap-2 text-xs font-semibold tracking-[0.18em] text-slate-300">
        <Music2 className="h-4 w-4 text-violet-200" />
        MUSIC · FOCUS / RADIO
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={toggle}
          className="grid h-10 w-10 place-items-center rounded-full bg-violet-300 text-slate-950 transition hover:bg-violet-200"
          aria-label={playing ? "音楽を停止" : "音楽を再生"}
        >
          {playing ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5 pl-0.5" />
          )}
        </button>

        <select
          value={stationId}
          onChange={(event) => setStationId(event.target.value)}
          className="h-10 max-w-[190px] rounded-xl border border-white/10 bg-slate-950/75 px-3 text-sm text-white outline-none"
          aria-label="音楽・ニュースステーション"
        >
          <optgroup label="FOCUS / STUDY">
            {musicStations.filter((item) => item.group === "focus").map((item) => (
              <option key={item.id} value={item.id}>{item.label}</option>
            ))}
          </optgroup>
          <optgroup label="RADIO / NEWS">
            {musicStations.filter((item) => item.group === "radio").map((item) => (
              <option key={item.id} value={item.id}>{item.label}</option>
            ))}
          </optgroup>
        </select>

        <Volume2 className="h-4 w-4 text-slate-300" />

        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={volume}
          onChange={(event) => setVolume(Number(event.target.value))}
          className="w-20 accent-violet-300"
          aria-label="音量"
        />
      </div>

      <div className="mt-1 h-4 text-xs text-slate-300">
        {error
          ? "再生できません"
          : playing
            ? `${station.label} 再生中`
            : station.label}
      </div>
    </div>
  );
}


export default function DisplayPage() {
  const [state, setState] = useState<AppState | null>(null);
  const [now, setNow] = useState(() => new Date());
  const [weather, setWeather] = useState<
    Record<string, WeatherValue>
  >({});
  const [recentlyCompleted, setRecentlyCompleted] =
    useState<ChildTask | null>(null);
  const [bookPicks, setBookPicks] = useState<BookPick[]>([]);
  const activeDayRef = useRef(todayKey(new Date()));
  const currentTodayBackground = todayCardBackgroundForDate(now);
  const twoDayFlash = twoDayFlashForDate(now);

  useEffect(() => {
    let disposed = false;

    const applyDailyTasks = (baseState: AppState, date = new Date()) => {
      const ensured = ensureDailyTasks(baseState, date);
      if (ensured !== baseState) {
        saveState(ensured);
      }
      if (!disposed) setState(ensured);
      return ensured;
    };

    const initialize = async () => {
      setState(loadState());
      await refreshCloudStateNow();
      if (disposed) return;
      applyDailyTasks(loadState(), new Date());
      void fetchBookPicks().then((picks) => {
        if (!disposed) setBookPicks(picks);
      });
    };

    void initialize();
    void fetchWeather().then((value) => {
      if (!disposed) setWeather(value);
    });

    const unsubscribe = onStateSynced((syncedState) => {
      applyDailyTasks(syncedState, new Date());
    });

    const syncTimer = window.setInterval(async () => {
      await refreshCloudStateNow();
      if (!disposed) {
        applyDailyTasks(loadState(), new Date());
      }
    }, 60_000);

    const clockTimer = window.setInterval(() => {
      const nextNow = new Date();
      setNow(nextNow);

      const nextDay = todayKey(nextNow);
      if (nextDay !== activeDayRef.current) {
        activeDayRef.current = nextDay;
        applyDailyTasks(loadState(), nextNow);
      }
    }, 30_000);

    const weatherTimer = window.setInterval(() => {
      void fetchWeather().then((value) => {
        if (!disposed) setWeather(value);
      });
    }, 30 * 60_000);

    const bookTimer = window.setInterval(() => {
      void fetchBookPicks().then((picks) => {
        if (!disposed) setBookPicks(picks);
      });
    }, 6 * 60 * 60_000);

    return () => {
      disposed = true;
      unsubscribe();
      window.clearInterval(syncTimer);
      window.clearInterval(clockTimer);
      window.clearInterval(weatherTimer);
      window.clearInterval(bookTimer);
    };
  }, []);

  const data = useMemo(() => {
    const today = todayKey(now);

    const events = (state?.events ?? [])
      .filter(isVisibleEvent)
      .sort(sortEvents);

    const todayEvents = events.filter(
      (event) => event.date === today
    );

    const primaryEvent = selectPrimaryTodayEvent(todayEvents, now);
    const todayClasses = resolveTodayClasses(
      state?.schoolTimetable,
      now,
      todayEvents
    );

    const upcomingEvents = events
      .filter((event) => {
        if (event.date > today) return true;
        if (event.date < today) return false;

        return event.all_day || !hasEventEnded(event, now);
      })
      .slice(0, 5);

    const learningTasks = (state?.tasks ?? [])
      .filter(
        (task) =>
          learningTypes.has(task.task_type) &&
          task.status !== "done" &&
          (!isDailyEnglishTask(task) || task.due_date === today)
      )
      .sort((a, b) =>
        (a.due_date ?? "9999-12-31").localeCompare(
          b.due_date ?? "9999-12-31"
        )
      );

    const mainTasks = learningTasks.filter(
      (task) => !task.due_date || task.due_date <= today
    );

    const routineTasks = (state?.tasks ?? [])
      .filter(
        (task) =>
          isDailyFitnessTask(task) &&
          task.due_date === today &&
          task.status !== "done"
      )
      .sort((a, b) => a.title.localeCompare(b.title));

    const childEventsToday = todayEvents.filter(
      (event) =>
        event.calendar_type === "school" ||
        event.calendar_type === "child_activity"
    ).length;

    const habitToday = habitDateKey(now);
    const streaks = habits.map((habit) => ({
      key: habit.key,
      label: habit.shortLabel,
      streak: currentStreak(state?.tasks ?? [], habit.key, habitToday),
      done:
        statusForDate(
          state?.tasks ?? [],
          habit.key,
          habitToday,
          habitToday
        ) === "done"
    }));
    const habitsDoneToday = todayDoneCount(state?.tasks ?? [], now);

    return {
      todayEvents,
      primaryEvent,
      todayClasses,
      upcomingEvents,
      mainTasks,
      routineTasks,
      childEventsToday,
      streaks,
      habitsDoneToday
    };
  }, [state, now]);

  const completeTaskFromScreen = (task: ChildTask) => {
    const next = toggleTask(task.id);
    setState(next);
    setRecentlyCompleted(task);
  };

  const undoCompletedTask = () => {
    if (!recentlyCompleted) return;
    const next = toggleTask(recentlyCompleted.id);
    setState(next);
    setRecentlyCompleted(null);
  };

  return (
    <main className="min-h-[100dvh] bg-[#06101f] text-white lg:h-[100dvh] lg:overflow-hidden">
      <SeasonalBackdrop date={now} />

      <section className="relative mx-auto min-h-[100dvh] max-w-xl px-4 pb-8 pt-4 lg:hidden">
        <header className="border-b border-white/10 pb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <div className="text-xs font-semibold tracking-[0.16em] text-cyan-200">
                  FAMILY DASHBOARD
                </div>
                <span
                  className="rounded-full border border-white/10 bg-white/[0.06] px-2 py-0.5 text-[9px] font-semibold tracking-[0.12em] text-slate-300"
                  title="季節テーマ"
                >
                  {seasonThemes[seasonForDate(now)].label} · {seasonThemes[seasonForDate(now)].labelJa}
                </span>
              </div>
              <div className="mt-1 text-2xl font-bold leading-tight">
                {greeting(now)}
              </div>
              <div className="mt-1 text-sm font-semibold text-slate-200">
                {formatHeaderDate(now)}
              </div>
            </div>
            <div className="shrink-0 text-4xl font-bold tabular-nums">
              {formatClock(now)}
            </div>
          </div>

          <div className="mt-4">
            <MobileWeather weather={weather} />
          </div>

          <div className="mt-3 overflow-x-auto pb-1">
            <div className="min-w-[330px]">
              <MusicControl />
            </div>
          </div>
        </header>

        <div className="mt-4 grid gap-4">
          <section className="rounded-2xl bg-cyan-300/[0.12] p-4">
            <div className="flex items-center gap-3">
              <SectionTitle title="TODAY" accent="bg-cyan-300" />
            </div>

            {data.primaryEvent ? (
              <div className="mt-4">
                <div className="text-sm text-cyan-100">
                  {eventTimeRange(data.primaryEvent)}
                </div>
                <div className="mt-1 text-xl font-bold leading-snug">
                  {data.primaryEvent.title}
                </div>
                {data.primaryEvent.location ? (
                  <div className="mt-2 flex items-center gap-2 text-sm text-slate-300">
                    <MapPin className="h-4 w-4 shrink-0 text-cyan-200" />
                    <span className="truncate">{data.primaryEvent.location}</span>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="mt-4 rounded-xl bg-slate-950/34 p-4 text-center text-sm text-slate-300">
                {data.todayEvents.length > 0 ? "今日の予定は終了しました" : "今日の大きな予定はありません"}
              </div>
            )}

            {data.todayEvents.length > 1 ? (
              <div className="mt-3 grid gap-2">
                {data.todayEvents.slice(1, 4).map((event) => (
                  <div
                    key={event.id}
                    className="flex items-start gap-3 rounded-xl bg-slate-950/34 px-3 py-2"
                  >
                    <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${categoryColor(event)}`} />
                    <div className="min-w-0">
                      <div className="text-xs text-slate-300">
                        {eventTimeRange(event)}
                      </div>
                      <div className="truncate text-sm font-semibold text-slate-200">
                        {event.title}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            {data.todayClasses ? (
              <div className="mt-3">
                <TodayClassesStrip summary={data.todayClasses} />
              </div>
            ) : null}
          </section>

          <section className="rounded-2xl bg-emerald-300/[0.12] p-4">
            <div className="flex items-center justify-between gap-3">
              <SectionTitle
                title="LEARNING · 今日"
                accent="bg-emerald-300"
              />
              <span className="text-xs text-emerald-100/80">
                タップで完了
              </span>
            </div>

            {recentlyCompleted ? (
              <div className="mt-3 flex items-center justify-between gap-2 rounded-xl bg-emerald-300/15 px-3 py-2 text-sm text-emerald-50">
                <div className="min-w-0 truncate">
                  完了: {recentlyCompleted.title}
                </div>
                <button
                  type="button"
                  onClick={undoCompletedTask}
                  className="shrink-0 rounded-lg bg-white/10 px-3 py-2 font-semibold text-white"
                >
                  取消
                </button>
              </div>
            ) : null}

            <div className="mt-3 grid gap-2">
              {data.mainTasks.slice(0, 3).map((task) => (
                <button
                  key={task.id}
                  type="button"
                  onClick={() => completeTaskFromScreen(task)}
                  className="flex min-h-14 items-center gap-3 rounded-xl bg-slate-950/38 px-3 text-left active:bg-emerald-300/15"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border-2 border-emerald-200/80 text-emerald-100">
                    <Circle className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-base font-semibold text-white">
                      {task.title}
                    </span>
                    {task.note ? (
                      <span className="mt-0.5 block truncate text-xs text-slate-300">
                        {task.note}
                      </span>
                    ) : null}
                  </span>
                  {task.due_date ? (
                    <span className="shrink-0 text-xs text-slate-300">
                      {dueText(task.due_date)}
                    </span>
                  ) : null}
                </button>
              ))}

              {data.mainTasks.length === 0 ? (
                <div className="rounded-xl bg-slate-950/34 p-4 text-center text-sm text-slate-300">
                  今日の学習タスクはありません
                </div>
              ) : null}

              {data.mainTasks.length > 3 ? (
                <Link
                  href="/learning"
                  className="flex min-h-11 items-center justify-between rounded-xl border border-white/[0.05] bg-white/[0.025] px-3 text-sm font-semibold text-slate-300"
                >
                  <span>还有 {data.mainTasks.length - 3} 项</span>
                  <span>Learning →</span>
                </Link>
              ) : null}
            </div>

            <div className="mt-3">
              <TwoDayFlashCard
                flash={twoDayFlash}
                mode={
                  data.mainTasks.length >= 4
                    ? "tiny"
                    : data.mainTasks.length === 3
                      ? "compact"
                      : "full"
                }
              />
            </div>

            <div className="mt-3">
              <TodayInHistoryCard date={now} />
            </div>
          </section>

          <section className="rounded-2xl bg-slate-950/42 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Dumbbell className="h-5 w-5 text-emerald-200" />
                <SectionTitle
                  title="DAILY ROUTINE"
                  accent="bg-emerald-300"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href="/fitness"
                  className="shrink-0 rounded-full bg-emerald-300/10 px-3 py-1.5 text-xs font-semibold text-emerald-100 active:bg-emerald-300/20"
                >
                  FITNESS
                </Link>
                <Link
                  href="/recipes"
                  className="shrink-0 rounded-full bg-amber-300/10 px-3 py-1.5 text-xs font-semibold text-amber-100 active:bg-amber-300/20"
                >
                  MEALS
                </Link>
                <Link
                  href="/calendar"
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-cyan-300/10 px-3 py-1.5 text-xs font-semibold text-cyan-100 active:bg-cyan-300/20"
                  aria-label="日程修改"
                  title="Calendar · 日程修改"
                >
                  <CalendarDays className="h-4 w-4" />
                  日程修改
                </Link>
                <Link
                  href="/badminton"
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-sky-300/10 text-base active:bg-sky-300/20"
                  aria-label="バドミントン素振り練習"
                  title="Badminton · 素振り練習"
                >
                  🏸
                </Link>
                <Link
                  href="/meditation"
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-violet-300/10 text-base active:bg-violet-300/20"
                  aria-label="冥想"
                  title="Meditation · 冥想"
                >
                  🧘
                </Link>
              </div>
            </div>

            <Link
              href="/mealtime?audio=1"
              className="mt-3 flex min-h-[74px] items-center justify-between gap-3 rounded-2xl border border-violet-200/25 bg-[linear-gradient(135deg,rgba(139,92,246,0.22),rgba(56,189,248,0.12))] px-4 py-3 shadow-[0_10px_28px_rgba(76,29,149,0.20)] active:bg-violet-300/20"
              aria-label="每日阅读"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-violet-300/15 text-xl">📖</div>
                <div className="min-w-0">
                  <div className="text-sm font-bold tracking-[0.08em] text-violet-100">每日阅读</div>
                  <div className="mt-0.5 truncate text-xs text-slate-300">英语原文 · 音频 · 同步字幕 · 跟读</div>
                </div>
              </div>
              <span className="shrink-0 text-xs font-bold text-cyan-200">OPEN →</span>
            </Link>

            <Link
              href="/english-song"
              className="mt-2 flex min-h-[68px] items-center justify-between gap-3 rounded-2xl border border-fuchsia-200/20 bg-[linear-gradient(135deg,rgba(217,70,239,0.16),rgba(59,130,246,0.10))] px-4 py-3 active:bg-fuchsia-300/20"
              aria-label="English Song 一句一句学英文歌"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-fuchsia-300/15 text-xl">🎵</div>
                <div className="min-w-0">
                  <div className="text-sm font-bold tracking-[0.08em] text-fuchsia-100">
                    English Song
                  </div>
                  <div className="mt-0.5 truncate text-xs text-slate-300">
                    一句一句学英文歌
                  </div>
                </div>
              </div>
              <span className="shrink-0 text-xs font-bold text-cyan-200">OPEN →</span>
            </Link>

            <Link
              href="/ted-learning"
              className="mt-2 flex min-h-[68px] items-center justify-between gap-3 rounded-2xl border border-rose-200/20 bg-[linear-gradient(135deg,rgba(244,63,94,0.15),rgba(249,115,22,0.08))] px-4 py-3 active:bg-rose-300/20"
              aria-label="TED English 英語学習"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-rose-300/15 text-xl">🎤</div>
                <div className="min-w-0">
                  <div className="text-sm font-bold tracking-[0.08em] text-rose-100">
                    TED English
                  </div>
                  <div className="mt-0.5 truncate text-xs text-slate-300">
                    英日字幕 · 单词 · 3问输出
                  </div>
                </div>
              </div>
              <span className="shrink-0 text-xs font-bold text-cyan-200">OPEN →</span>
            </Link>

            <Link
              href="/ai-learning"
              className="mt-2 flex min-h-[68px] items-center justify-between gap-3 rounded-2xl border border-cyan-200/20 bg-[linear-gradient(135deg,rgba(34,211,238,0.16),rgba(59,130,246,0.10))] px-4 py-3 active:bg-cyan-300/20"
              aria-label="AI 20 MIN"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-cyan-300/15 text-xl">🤖</div>
                <div className="min-w-0">
                  <div className="text-sm font-bold tracking-[0.08em] text-cyan-100">
                    AI 20 MIN
                  </div>
                  <div className="mt-0.5 truncate text-xs text-slate-300">
                    AI学習 · AI学习 · AI Learning
                  </div>
                </div>
              </div>
              <span className="shrink-0 text-xs font-bold text-cyan-200">OPEN →</span>
            </Link>

            <div className="mt-3 grid gap-2">
              {data.routineTasks.map((task) => (
                <button
                  key={task.id}
                  type="button"
                  onClick={() => completeTaskFromScreen(task)}
                  className="flex min-h-12 items-center gap-3 rounded-xl bg-emerald-300/10 px-3 text-left active:bg-emerald-300/25"
                >
                  <Circle className="h-5 w-5 shrink-0 text-emerald-200" />
                  <span className="font-semibold text-emerald-50">
                    {task.title.replace(" · ", " ")}
                  </span>
                </button>
              ))}

              {data.routineTasks.length === 0 ? (
                <div className="flex items-center gap-2 rounded-xl bg-emerald-300/10 px-3 py-3 text-sm text-emerald-100">
                  <CheckCircle2 className="h-5 w-5" />
                  今日のFitnessは完了
                </div>
              ) : null}
            </div>
          </section>

          <Link
            href="/streak"
            className="rounded-2xl bg-orange-300/[0.08] p-4 active:bg-orange-300/[0.13]"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Flame className="h-5 w-5 text-orange-200" />
                <div className="font-semibold tracking-[0.1em] text-orange-100">
                  STREAK · 坚持记录
                </div>
              </div>
              <div className="rounded-full bg-emerald-300/10 px-3 py-1 text-sm font-semibold text-emerald-100">
                Today {data.habitsDoneToday}/{habits.length}
              </div>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2">
              {data.streaks.map((habit) => (
                <div
                  key={habit.key}
                  className="rounded-xl bg-slate-950/34 px-3 py-3 text-center"
                >
                  <div className="truncate text-xs text-slate-300">
                    {habit.label}
                  </div>
                  <div className="mt-1 text-lg font-bold text-white">
                    🔥 {habit.streak}日
                  </div>
                  <div
                    className={`mx-auto mt-2 h-2 w-2 rounded-full ${
                      habit.done ? "bg-emerald-300" : "bg-slate-600"
                    }`}
                  />
                </div>
              ))}
            </div>
          </Link>

          <section className="rounded-2xl bg-indigo-300/[0.07] p-4">
            <div className="flex items-center gap-3">
              <SectionTitle title="UPCOMING" accent="bg-indigo-300" />
            </div>

            <div className="mt-3 grid gap-2">
              {data.upcomingEvents.map((event) => (
                <div
                  key={event.id}
                  className="grid grid-cols-[4.8rem_minmax(0,1fr)] gap-3 rounded-xl bg-slate-950/34 px-3 py-2.5"
                >
                  <div className="text-xs text-slate-300">
                    <div className="font-semibold text-slate-300">
                      {formatShortDate(event.date)}
                    </div>
                    <div className="mt-0.5">{eventTimeRange(event)}</div>
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-white">
                      {event.title}
                    </div>
                    {event.location ? (
                      <div className="mt-0.5 truncate text-xs text-slate-300">
                        {event.location}
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl bg-sky-300/[0.06] p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-sky-200" />
                <div className="font-semibold tracking-[0.08em] text-sky-100">
                  BOOK OF THE WEEK
                </div>
              </div>
              <span className="text-[10px] text-slate-300">
                weekly
              </span>
            </div>

            <div className="mt-3">
              <MobileBookPickPanel books={bookPicks.slice(0, 5)} />
            </div>
          </section>
        </div>
      </section>

      <section className="relative mx-auto hidden h-[100dvh] max-w-[1920px] grid-rows-[132px_minmax(0,1fr)_48px] gap-4 px-6 py-4 lg:grid lg:px-8">
        <header className="grid h-[132px] grid-cols-[1.05fr_1.35fr_1.12fr_0.78fr] items-stretch gap-4">
          <div className="flex min-w-0 flex-col justify-center rounded-2xl border border-white/[0.06] bg-white/[0.055] px-5 py-4 shadow-[0_10px_30px_rgba(0,0,0,0.12)]">
            <div className="flex items-center gap-3">
              <div className="text-[clamp(0.95rem,1vw,1.2rem)] font-semibold tracking-[0.16em] text-cyan-200">
                Family Dashboard
              </div>
              <span
                className="rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-[10px] font-semibold tracking-[0.1em] text-slate-300"
                title="季節テーマ"
              >
                {seasonThemes[seasonForDate(now)].label} · {seasonThemes[seasonForDate(now)].labelJa}
              </span>
            </div>

            <div className="mt-4 whitespace-nowrap text-[clamp(2rem,2.5vw,3.25rem)] font-semibold leading-none text-white">
              {greeting(now)}
            </div>

            <div className="mt-3 text-[clamp(0.95rem,1vw,1.2rem)] font-semibold text-slate-200">
              {formatHeaderDate(now)}
            </div>
          </div>

          <WeatherStrip weather={weather} />

          <div className="min-w-0">
            <MusicControl />
          </div>

          <div className="grid min-w-0 place-items-center rounded-2xl border border-white/[0.06] bg-white/[0.055] px-4 py-3 text-center">
            <div>
              <div className="text-[clamp(3.8rem,5vw,6rem)] font-bold leading-none tabular-nums text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.35)]">
                {formatClock(now)}
              </div>
              <div className="mt-3 text-[clamp(1rem,1.05vw,1.25rem)] font-bold tracking-[0.03em] text-slate-100">
                {formatShortDate(todayKey(now))}
              </div>
            </div>
          </div>
        </header>

        <div className="grid min-h-0 grid-rows-[0.96fr_1.04fr] gap-4">
          <section className="grid min-h-0 grid-cols-[0.92fr_1.28fr] gap-4">
            <article
              className="relative min-h-0 overflow-hidden rounded-3xl border border-cyan-200/20 p-5 shadow-[0_12px_40px_rgba(0,0,0,0.24)]"
              style={{
                backgroundImage: `linear-gradient(180deg, rgba(7, 22, 40, 0.18) 0%, rgba(8, 25, 49, 0.45) 42%, rgba(7, 20, 36, 0.72) 72%, rgba(5, 15, 28, 0.84) 100%), url(${currentTodayBackground.image})`,
                backgroundSize: "cover",
                backgroundPosition: "center"
              }}
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_78%,rgba(255,255,255,0.18),transparent_18%),linear-gradient(120deg,rgba(56,189,248,0.08),transparent_30%)]" />
              <div className="absolute inset-0 backdrop-[blur(0.5px)]" />

              <div className="relative z-10 mb-4 flex items-start justify-between gap-3">
                <SectionTitle title="TODAY" accent="bg-cyan-300" />
                <div className="rounded-full border border-white/15 bg-slate-950/25 px-2.5 py-1 text-[10px] font-semibold tracking-[0.08em] text-cyan-100">
                  WEEKLY FLOW
                </div>
              </div>

              {data.primaryEvent ? (
                <div className="relative z-10 grid h-[calc(100%-3rem)] content-between">
                  <div>
                    <div className="text-[clamp(1.15rem,1.25vw,1.55rem)] text-cyan-100">
                      {eventTimeRange(data.primaryEvent)}
                    </div>

                    <div className="mt-3 text-[clamp(2.2rem,2.55vw,3.35rem)] font-semibold leading-tight text-white">
                      {data.primaryEvent.title}
                    </div>

                    {data.primaryEvent.location ? (
                      <div className="mt-4 flex items-center gap-2 text-[clamp(1rem,1.05vw,1.25rem)] text-slate-200">
                        <MapPin className="h-5 w-5 shrink-0 text-cyan-200" />
                        {data.primaryEvent.location}
                      </div>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex min-h-12 items-center gap-2 rounded-xl border border-white/[0.07] bg-slate-950/35 backdrop-blur-sm px-3 text-[clamp(0.95rem,0.95vw,1.1rem)] text-slate-200">
                        <span className="text-cyan-200">▣</span>
                        今日の予定 {data.todayEvents.length}件
                      </div>
                      <div className="flex min-h-12 items-center gap-2 rounded-xl border border-white/[0.07] bg-slate-950/35 backdrop-blur-sm px-3 text-[clamp(0.95rem,0.95vw,1.1rem)] text-slate-200">
                        <span className="text-cyan-200">◎</span>
                        学校・子ども関連 {data.childEventsToday}件
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative z-10 grid h-[calc(100%-3rem)] content-center gap-4">
                  <div className="text-center text-[clamp(1.3rem,1.4vw,1.8rem)] text-slate-300">
                    {data.todayEvents.length > 0 ? "今日の予定は終了しました" : "今日の大きな予定はありません"}
                  </div>
                </div>
              )}
            </article>

            <article className="min-h-0 overflow-hidden rounded-3xl border border-indigo-200/15 bg-[linear-gradient(145deg,rgba(18,43,70,0.92),rgba(14,34,57,0.96))] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.18)]">
              <div className="mb-3">
                <SectionTitle title="UPCOMING" accent="bg-indigo-300" />
              </div>

              <div className="grid min-h-0">
                {data.upcomingEvents.map((event) => (
                  <div
                    key={event.id}
                    className="grid min-h-0 grid-cols-[6.6rem_7.2rem_1rem_minmax(0,1fr)_1.2rem] items-center gap-3 border-b border-white/[0.07] px-2 py-2 last:border-b-0"
                  >
                    <div className="text-[clamp(0.9rem,0.9vw,1.05rem)] font-semibold text-slate-200">
                      {formatShortDate(event.date)}
                    </div>

                    <div className="text-[clamp(0.9rem,0.9vw,1.05rem)] text-slate-300">
                      {eventTimeRange(event)}
                    </div>

                    <span
                      className={`h-3 w-3 rounded-full ${categoryColor(event)}`}
                    />

                    <div className="truncate text-[clamp(1rem,1.05vw,1.25rem)] font-medium leading-tight text-white">
                      {event.title}
                    </div>

                    <ChevronRight className="h-4 w-4 text-slate-500" />
                  </div>
                ))}

                {data.upcomingEvents.length === 0 ? (
                  <div className="rounded-2xl bg-slate-950/30 p-6 text-[clamp(1.2rem,1.2vw,1.5rem)] text-slate-300">
                    今後の予定はありません
                  </div>
                ) : null}
              </div>
            </article>
          </section>

          <section className="grid min-h-0 grid-cols-[1.12fr_0.98fr_1.10fr] gap-4">
            <article className="h-full min-h-0 overflow-hidden rounded-3xl border border-emerald-200/15 bg-[linear-gradient(145deg,rgba(4,74,71,0.88),rgba(5,50,61,0.94))] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.18)]">
              <div className="mb-3 flex items-center justify-between gap-3">
                <SectionTitle
                  title="LEARNING ・ 今日やること"
                  accent="bg-emerald-300"
                />

                <span className="text-[clamp(0.85rem,0.8vw,1rem)] text-emerald-100/80">
                  ○ をタップして完了
                </span>
              </div>

              {recentlyCompleted ? (
                <div className="mb-2 flex items-center justify-between rounded-xl bg-emerald-300/15 px-3 py-2 text-sm text-emerald-50">
                  <div className="flex min-w-0 items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-300" />
                    <span className="truncate">
                      完了: {recentlyCompleted.title}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={undoCompletedTask}
                    className="ml-3 min-h-9 shrink-0 rounded-lg bg-white/10 px-3 font-semibold text-white transition active:scale-95 active:bg-white/20"
                  >
                    取消
                  </button>
                </div>
              ) : null}

              <div className="grid min-h-0 grid-cols-[minmax(0,1fr)_0.38fr] gap-4">
                <div className="grid min-h-0 content-start gap-2">
                  {data.mainTasks.slice(0, 3).map((task) => (
                    <div
                      key={task.id}
                      className="grid min-h-14 grid-cols-[3rem_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-white/[0.05] bg-slate-950/24 px-3 py-2"
                    >
                      <button
                        type="button"
                        onClick={() => completeTaskFromScreen(task)}
                        className="grid h-10 w-10 place-items-center rounded-full border-2 border-emerald-200/90 bg-emerald-300/[0.05] text-emerald-100 transition active:scale-95 active:bg-emerald-300/25"
                        aria-label={`${task.title} を完了にする`}
                        title="タップして完了"
                      >
                        <Circle className="h-5 w-5" />
                      </button>

                      <div className="min-w-0">
                        <div className="line-clamp-2 text-[clamp(1.05rem,1.05vw,1.3rem)] font-medium leading-snug text-white">
                          {task.title}
                        </div>
                        {task.note ? (
                          <div className="mt-0.5 truncate text-[clamp(0.8rem,0.75vw,0.9rem)] text-slate-300">
                            {task.note}
                          </div>
                        ) : null}
                      </div>

                      {task.due_date ? (
                        <div
                          className={`text-[clamp(0.8rem,0.78vw,0.95rem)] ${
                            task.due_date < todayKey(now)
                              ? "font-semibold text-amber-200"
                              : "text-slate-300"
                          }`}
                        >
                          {task.due_date < todayKey(now)
                            ? `期限超過 ${dueText(task.due_date)}`
                            : dueText(task.due_date)}
                        </div>
                      ) : null}
                    </div>
                  ))}

                  {data.mainTasks.length === 0 ? (
                    <div className="grid min-h-[110px] place-items-center rounded-xl bg-slate-950/30 text-center text-[clamp(1.1rem,1.1vw,1.4rem)] text-slate-300">
                      今日の学習タスクはありません
                    </div>
                  ) : null}

                  <Link
                    href="/learning"
                    className="flex min-h-10 items-center justify-between rounded-xl border border-white/[0.05] bg-white/[0.025] px-4 text-sm font-semibold text-slate-300 transition active:bg-white/[0.08]"
                  >
                    <span>
                      {data.mainTasks.length > 3
                        ? `还有 ${data.mainTasks.length - 3} 项`
                        : "＋ 学習ページを開く"}
                    </span>
                    <span>Learning →</span>
                  </Link>
                </div>

                <div className="min-h-0">
                  <TwoDayFlashCard
                    flash={twoDayFlash}
                    mode={
                      data.mainTasks.length >= 4
                        ? "tiny"
                        : data.mainTasks.length === 3
                          ? "compact"
                          : "full"
                    }
                  />
                </div>
              </div>
            </article>

            <div className="min-h-0">
              <article className="flex h-full min-h-0 flex-col rounded-3xl border border-emerald-200/15 bg-[linear-gradient(145deg,rgba(15,78,66,0.9),rgba(10,58,55,0.95))] p-4 shadow-[0_12px_35px_rgba(0,0,0,0.16)]">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <Dumbbell className="h-5 w-5 shrink-0 text-emerald-200" />
                    <div className="truncate text-[clamp(1rem,1vw,1.2rem)] font-semibold tracking-[0.08em] text-emerald-50">
                      DAILY ROUTINE
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-1.5">
                    <Link
                      href="/fitness"
                      className="rounded-full bg-emerald-300/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-100 active:bg-emerald-300/20"
                    >
                      FITNESS
                    </Link>
                    <Link
                      href="/recipes"
                      className="rounded-full bg-amber-300/10 px-2.5 py-1 text-[10px] font-semibold text-amber-100 active:bg-amber-300/20"
                    >
                      MEALS
                    </Link>
                    <Link
                      href="/calendar"
                      className="inline-flex items-center gap-1 rounded-full bg-cyan-300/10 px-2.5 py-1 text-[10px] font-semibold text-cyan-100 active:bg-cyan-300/20"
                      aria-label="日程修改"
                      title="Calendar · 日程修改"
                    >
                      <CalendarDays className="h-3.5 w-3.5" />
                      日程修改
                    </Link>
                    <Link
                      href="/badminton"
                      className="grid h-7 w-7 place-items-center rounded-full bg-sky-300/10 text-sm active:bg-sky-300/20"
                      aria-label="バドミントン素振り練習"
                      title="Badminton · 素振り練習"
                    >
                      🏸
                    </Link>
                    <Link
                      href="/meditation"
                      className="grid h-7 w-7 place-items-center rounded-full bg-violet-300/10 text-sm active:bg-violet-300/20"
                      aria-label="冥想"
                      title="Meditation · 冥想"
                    >
                      🧘
                    </Link>
                  </div>
                </div>

                <div className="mb-3 grid grid-cols-2 gap-2">
                  <Link
                    href="/mealtime?audio=1"
                    className="flex min-h-12 items-center gap-2 rounded-xl border border-violet-200/15 bg-violet-300/10 px-3 active:bg-violet-300/20"
                    aria-label="每日阅读"
                  >
                    <span className="text-base">📖</span>
                    <div className="min-w-0">
                      <div className="truncate text-[11px] font-bold text-violet-100">每日阅读</div>
                      <div className="truncate text-[9px] text-slate-400">音频 · 字幕 · 跟读</div>
                    </div>
                  </Link>

                  <Link
                    href="/english-song"
                    className="flex min-h-12 items-center gap-2 rounded-xl border border-fuchsia-200/15 bg-fuchsia-300/10 px-3 active:bg-fuchsia-300/20"
                    aria-label="English Song 一句一句学英文歌"
                  >
                    <span className="text-base">🎵</span>
                    <div className="min-w-0">
                      <div className="truncate text-[11px] font-bold text-fuchsia-100">English Song</div>
                      <div className="truncate text-[9px] text-slate-400">一句一句学英文歌</div>
                    </div>
                  </Link>

                  <Link
                    href="/ted-learning"
                    className="flex min-h-12 items-center gap-2 rounded-xl border border-rose-200/15 bg-rose-300/10 px-3 active:bg-rose-300/20"
                    aria-label="TED English 英語学習"
                  >
                    <span className="text-base">🎤</span>
                    <div className="min-w-0">
                      <div className="truncate text-[11px] font-bold text-rose-100">TED English</div>
                      <div className="truncate text-[9px] text-slate-400">英日字幕 · 单词 · 输出</div>
                    </div>
                  </Link>

                  <Link
                    href="/ai-learning"
                    className="flex min-h-12 items-center gap-2 rounded-xl border border-cyan-200/15 bg-cyan-300/10 px-3 active:bg-cyan-300/20"
                    aria-label="AI 20 MIN"
                  >
                    <span className="text-base">🤖</span>
                    <div className="min-w-0">
                      <div className="truncate text-[11px] font-bold text-cyan-100">AI 20 MIN</div>
                      <div className="truncate text-[9px] text-slate-400">AI学習 · AI Learning</div>
                    </div>
                  </Link>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {data.routineTasks.map((task) => (
                    <button
                      key={task.id}
                      type="button"
                      onClick={() => completeTaskFromScreen(task)}
                      className="flex min-h-12 items-center gap-2 rounded-xl border border-white/[0.05] bg-emerald-300/10 px-3 text-left text-[clamp(0.85rem,0.82vw,1rem)] font-semibold text-emerald-50 transition active:scale-[0.98] active:bg-emerald-300/25"
                    >
                      <Circle className="h-5 w-5 shrink-0 text-emerald-200" />
                      <span className="min-w-0 truncate">
                        {task.title.replace(" · ", " ")}
                      </span>
                    </button>
                  ))}

                  {data.routineTasks.length === 0 ? (
                    <div className="col-span-2 flex min-h-12 items-center gap-2 rounded-xl bg-emerald-300/10 px-3 text-sm text-emerald-100">
                      <CheckCircle2 className="h-5 w-5 text-emerald-300" />
                      今日のFitnessは完了
                    </div>
                  ) : null}
                </div>
                {data.todayClasses ? (
                  <div className="mt-auto pt-3">
                    <TodayClassesStrip summary={data.todayClasses} compact />
                  </div>
                ) : null}
              </article>
            </div>

            <article className="h-full min-h-0 overflow-hidden rounded-3xl border border-sky-200/10 bg-[linear-gradient(145deg,rgba(18,42,66,0.94),rgba(13,31,51,0.98))] p-4 shadow-[0_12px_35px_rgba(0,0,0,0.16)]">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <BookOpen className="h-5 w-5 shrink-0 text-sky-200" />
                  <div className="truncate text-[clamp(0.95rem,0.95vw,1.15rem)] font-semibold tracking-[0.08em] text-sky-100">
                    BOOK OF THE WEEK · 今週の2冊
                  </div>
                </div>
                <span className="shrink-0 text-[9px] text-slate-400">
                  ADULT + CHILD
                </span>
              </div>

              <DesktopBookPickPanel books={bookPicks.slice(0, 5)} />
            </article>
          </section>
        </div>

        <footer>
          <Link
            href="/streak"
            className="grid min-h-12 grid-cols-[auto_repeat(3,minmax(0,1fr))_auto] items-center gap-3 rounded-2xl border border-white/[0.06] bg-slate-950/42 px-4 py-2 transition active:bg-white/[0.1]"
            aria-label="坚持记录を開く"
          >
            <div className="flex items-center gap-2 pr-2 text-xs font-semibold tracking-[0.14em] text-orange-200">
              <Flame className="h-4 w-4" />
              STREAK
            </div>

            {data.streaks.map((habit) => (
              <div
                key={habit.key}
                className="flex min-w-0 items-center justify-center gap-2 text-sm"
              >
                <span
                  className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                    habit.done ? "bg-emerald-300" : "bg-slate-600"
                  }`}
                />
                <span className="truncate text-slate-300">
                  {habit.label}
                </span>
                <span className="shrink-0 font-semibold text-white">
                  🔥 {habit.streak}日
                </span>
              </div>
            ))}

            <div className="rounded-full bg-emerald-300/10 px-3 py-1 text-sm font-semibold text-emerald-100">
              Today {data.habitsDoneToday}/{habits.length} →
            </div>
          </Link>
        </footer>
      </section>
    </main>
  );
}
