"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Bell,
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
  {
    id: "classical",
    label: "Classical",
    url: "https://ycradio.stream.publicradio.org/ycradio.aac"
  },
  {
    id: "piano",
    label: "Piano",
    url: "https://pianosolo.streamguys1.com/live"
  },
  {
    id: "peaceful-guitar",
    label: "Guitar · Peaceful",
    url: "https://listen.181fm.com/181-classicalguitar_128k.mp3"
  },
  {
    id: "japanese-ambient-kyoto",
    label: "日本纯音乐 · Kyoto",
    url: "https://server.laradio.online:59009/live"
  },
  {
    id: "jazz",
    label: "Jazz",
    url: "https://ice1.somafm.com/sonicuniverse-128-mp3"
  },
  {
    id: "study",
    label: "Study / Relax",
    url: "https://relax.stream.publicradio.org/relax.aac"
  },
  {
    id: "abc-news",
    label: "ABC NewsRadio",
    url: "https://mediaserviceslive.akamaized.net/hls/live/2038311/newsradio/master.m3u8"
  },
  {
    id: "bbc-world",
    label: "BBC World Service",
    url: "https://as-hls-ww-live.akamaized.net/pool_87948813/live/ww/bbc_world_service/bbc_world_service.isml/bbc_world_service-audio=96000.norewind.m3u8"
  }
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

const formatHeaderDate = (date: Date) =>
  new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long"
  }).format(date);

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

function DesktopBookPickPanel({ books }: { books: BookPick[] }) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const activeBook =
    books.find((book) => book.category === selectedCategory) ??
    books[0] ??
    null;

  if (!activeBook) {
    return (
      <div className="grid min-h-[150px] place-items-center rounded-xl bg-slate-950/30 text-sm text-slate-300">
        今週の本を取得中…
      </div>
    );
  }

  return (
    <div className="grid min-h-0 gap-2">
      <div className="grid min-h-0 grid-cols-[4.6rem_minmax(0,1fr)] gap-3 rounded-xl border border-white/[0.06] bg-slate-950/34 p-3">
        <BookCover book={activeBook} />

        <div className="min-w-0">
          <div className="text-[9px] font-bold tracking-[0.08em] text-sky-200">
            {activeBook.categoryLabel}
            {activeBook.rank ? ` · #${activeBook.rank}` : ""}
          </div>

          <div className="mt-1 line-clamp-2 text-[clamp(1rem,1vw,1.2rem)] font-bold leading-snug text-white">
            {activeBook.title}
          </div>

          {activeBook.author ? (
            <div className="mt-1 truncate text-[10px] text-slate-300">
              {activeBook.author}
            </div>
          ) : null}

          <div className="mt-2 line-clamp-3 text-[10px] leading-relaxed text-slate-300">
            {activeBook.description}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-1.5">
        {books.slice(0, 5).map((book, index) => {
          const active = book.category === activeBook.category;
          return (
            <button
              key={book.category}
              type="button"
              onClick={() => setSelectedCategory(book.category)}
              className={`min-w-0 rounded-lg border px-1.5 py-1.5 text-center transition active:scale-[0.97] ${
                active
                  ? "border-sky-300/35 bg-sky-300/15"
                  : "border-white/[0.05] bg-white/[0.035]"
              }`}
              aria-label={`${book.title} を表示`}
              title={book.title}
            >
              <div className="text-[8px] font-bold text-sky-200">
                {index + 1}
              </div>
              <div className="mt-0.5 truncate text-[8px] text-slate-300">
                {book.market ?? "JP"}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MobileBookPickCard({ book }: { book: BookPick }) {
  return (
    <details className="group rounded-xl bg-slate-950/34">
      <summary className="flex cursor-pointer list-none items-center gap-3 px-3 py-2.5">
        <BookCover book={book} compact />
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-bold tracking-[0.06em] text-sky-200">
            {book.categoryLabel}
            {book.rank ? ` · #${book.rank}` : ""}
          </div>
          <div className="mt-0.5 truncate text-sm font-semibold text-white">
            {book.title}
          </div>
          <div className="mt-0.5 truncate text-[11px] text-slate-300">
            {book.author ? `${book.author} · ` : ""}
            {book.reason}
          </div>
        </div>
        <span className="text-xs text-slate-300 transition group-open:rotate-180">
          ▾
        </span>
      </summary>

      <div className="border-t border-white/5 px-3 pb-3 pt-3">
        <div className="flex gap-3">
          <BookCover book={book} />
          <div className="min-w-0 flex-1">
            <div className="text-sm leading-relaxed text-slate-200">
              {book.description}
            </div>
            <div className="mt-2 text-[10px] text-slate-300">
              {book.source} · 每周更新
            </div>
          </div>
        </div>
      </div>
    </details>
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
        MUSIC / NEWS
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
          {musicStations.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
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

    const upcomingEvents = events
      .filter((event) => {
        if (event.date > today) return true;
        if (event.date < today) return false;

        return event.all_day || !hasEventEnded(event, now);
      })
      .slice(0, 5);

    const notices = events
      .filter(
        (event) =>
          event.date >= today &&
          (event.need_parent_action || event.parent_task)
      )
      .slice(0, 3);

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

    const mainTasks = learningTasks
      .filter(
        (task) =>
          !task.due_date || task.due_date <= today
      )
      .slice(0, 5);

    const nextTasks = learningTasks
      .filter(
        (task) =>
          Boolean(task.due_date) &&
          (task.due_date ?? "") > today
      )
      .slice(0, 2);

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
      upcomingEvents,
      notices,
      mainTasks,
      nextTasks,
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
              {data.mainTasks.map((task) => (
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
                  href="/mealtime"
                  className="shrink-0 rounded-full bg-violet-300/10 px-3 py-1.5 text-xs font-semibold text-violet-100 active:bg-violet-300/20"
                  aria-label="ごはん時間のニュースと英語"
                  title="NEWS + ENGLISH · ごはん時間の英語"
                >
                  📰 ENGLISH
                </Link>
                <Link
                  href="/schedule"
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-cyan-300/10 text-cyan-100 active:bg-cyan-300/20"
                  aria-label="日程"
                  title="Schedule · 日程"
                >
                  <CalendarDays className="h-4 w-4" />
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

          {data.notices.length > 0 ? (
            <section className="rounded-2xl bg-amber-300/[0.12] p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-amber-100">
                <Bell className="h-5 w-5" />
                QUICK NOTICE
              </div>
              <div className="mt-3 grid gap-2">
                {data.notices.slice(0, 2).map((event) => (
                  <div
                    key={event.id}
                    className="rounded-xl bg-amber-200/10 px-3 py-2.5"
                  >
                    <div className="text-xs text-amber-100">
                      {formatShortDate(event.date)} {eventTimeRange(event)}
                    </div>
                    <div className="mt-1 text-sm font-semibold text-white">
                      {event.title}
                    </div>
                    {event.parent_task ? (
                      <div className="mt-1 text-xs text-slate-300">
                        {event.parent_task}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          <section className="rounded-2xl bg-sky-300/[0.06] p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-sky-200" />
                <div className="font-semibold tracking-[0.08em] text-sky-100">
                  BOOK PICK
                </div>
              </div>
              <span className="text-[10px] text-slate-300">
                weekly
              </span>
            </div>

            <div className="mt-3 grid gap-2">
              {bookPicks.slice(0, 5).map((book) => (
                <MobileBookPickCard key={book.category} book={book} />
              ))}
            </div>
          </section>
        </div>
      </section>

      <section className="relative mx-auto hidden h-[100dvh] max-w-[1920px] grid-rows-[auto_minmax(0,1fr)_auto] gap-3 px-6 py-4 lg:grid lg:px-8">
        <header className="grid min-h-[132px] grid-cols-[minmax(250px,0.9fr)_minmax(0,1.35fr)_minmax(0,1fr)_minmax(170px,0.7fr)] items-stretch gap-4 border-b border-white/10 pb-3">
          <div className="flex min-w-0 flex-col justify-center">
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

        <div className="grid min-h-0 grid-rows-[1.02fr_0.98fr] gap-4">
          <section className="grid min-h-0 grid-cols-[0.95fr_1.25fr] gap-4">
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
              ) : (
                <div className="relative z-10 grid h-[calc(100%-3rem)] place-items-center text-center text-[clamp(1.3rem,1.4vw,1.8rem)] text-slate-300">
                  {data.todayEvents.length > 0 ? "今日の予定は終了しました" : "今日の大きな予定はありません"}
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

          <section className="grid min-h-0 grid-cols-[1.5fr_0.82fr_0.72fr] gap-4">
            <article className="min-h-0 overflow-hidden rounded-3xl border border-emerald-200/15 bg-[linear-gradient(145deg,rgba(4,74,71,0.88),rgba(5,50,61,0.94))] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.18)]">
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

              {data.mainTasks.length > 0 ? (
                <div className="grid min-h-0 grid-cols-[minmax(0,1fr)_0.34fr] gap-4">
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

                    <Link
                      href="/learning"
                      className="flex min-h-10 items-center rounded-xl border border-white/[0.05] bg-white/[0.025] px-4 text-sm font-semibold text-slate-300 transition active:bg-white/[0.08]"
                    >
                      ＋ 学習ページを開く
                    </Link>
                  </div>

                  <div className="min-h-0">
                    <div className="mb-2 text-xs font-semibold tracking-[0.12em] text-emerald-100">
                      NEXT
                    </div>

                    <div className="grid gap-2">
                      {data.nextTasks.slice(0, 1).map((task) => (
                        <div
                          key={task.id}
                          className="rounded-xl border border-emerald-200/[0.08] bg-emerald-300/10 px-3 py-3"
                        >
                          <div className="line-clamp-3 text-[clamp(1rem,1vw,1.2rem)] font-medium leading-snug text-white">
                            → {task.title}
                          </div>

                          {task.due_date ? (
                            <div className="mt-2 text-sm text-slate-300">
                              {dueText(task.due_date)}
                            </div>
                          ) : null}
                        </div>
                      ))}

                      {data.nextTasks.length === 0 ? (
                        <div className="text-sm text-slate-300">
                          次の学習タスクはありません
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid min-h-[160px] place-items-center rounded-2xl bg-slate-950/30 text-center text-[clamp(1.25rem,1.3vw,1.65rem)] text-slate-300">
                  今日の学習タスクはありません
                </div>
              )}
            </article>

            <div className="grid min-h-0 grid-rows-[1fr_auto] gap-3">
              <article className="min-h-0 rounded-3xl border border-emerald-200/15 bg-[linear-gradient(145deg,rgba(15,78,66,0.9),rgba(10,58,55,0.95))] p-4 shadow-[0_12px_35px_rgba(0,0,0,0.16)]">
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
                      href="/mealtime"
                      className="rounded-full bg-violet-300/10 px-2.5 py-1 text-[10px] font-semibold text-violet-100 active:bg-violet-300/20"
                      aria-label="ごはん時間のニュースと英語"
                      title="NEWS + ENGLISH · ごはん時間の英語"
                    >
                      📰 ENGLISH
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
              </article>

              {data.notices.length > 0 ? (
                <article className="rounded-2xl border border-amber-200/10 bg-amber-200/[0.09] px-4 py-3">
                  <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.1em] text-amber-100">
                    <Bell className="h-4 w-4" />
                    QUICK NOTICE
                  </div>
                  <div className="mt-1 truncate text-[clamp(0.9rem,0.9vw,1.05rem)] font-semibold text-white">
                    {formatShortDate(data.notices[0].date)}{" "}
                    {data.notices[0].title}
                  </div>
                </article>
              ) : (
                <article className="flex items-center gap-2 rounded-2xl border border-white/[0.05] bg-slate-950/30 px-4 py-3 text-xs text-slate-300">
                  <AlertCircle className="h-4 w-4 text-amber-200" />
                  確認が必要な予定はありません
                </article>
              )}
            </div>

            <article className="min-h-0 overflow-hidden rounded-3xl border border-sky-200/10 bg-[linear-gradient(145deg,rgba(18,42,66,0.94),rgba(13,31,51,0.98))] p-4 shadow-[0_12px_35px_rgba(0,0,0,0.16)]">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <BookOpen className="h-5 w-5 shrink-0 text-sky-200" />
                  <div className="truncate text-[clamp(0.95rem,0.95vw,1.15rem)] font-semibold tracking-[0.08em] text-sky-100">
                    BOOK PICK · 今週のおすすめ
                  </div>
                </div>
                <span className="shrink-0 text-[9px] text-slate-400">
                  JP + CN
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
