"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  Bell,
  CheckCircle2,
  Circle,
  CloudSun,
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
  toggleTask,
  type AppState
} from "@/lib/db";
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

const displayPriority = (event: FamilyEvent) => {
  if (event.calendar_type === "child_activity") return 0;
  if (event.calendar_type === "school") return 1;
  if (event.calendar_type === "family" || event.calendar_type === "personal") return 2;
  if (event.need_parent_action || event.parent_task) return 3;
  if (event.event_type === "company_holiday") return 8;
  if (event.title.includes("OFF")) return 9;
  return 4;
};

const sortEvents = (a: FamilyEvent, b: FamilyEvent) => {
  if (a.date !== b.date) return a.date.localeCompare(b.date);
  const priority = displayPriority(a) - displayPriority(b);
  if (priority !== 0) return priority;
  if (a.all_day !== b.all_day) return a.all_day ? 1 : -1;
  return eventSortKey(a).localeCompare(eventSortKey(b));
};

const pickPrimaryEvent = (events: FamilyEvent[]) =>
  [...events].sort((a, b) => {
    const priority = displayPriority(a) - displayPriority(b);
    if (priority !== 0) return priority;
    if (a.all_day !== b.all_day) return a.all_day ? 1 : -1;
    return eventSortKey(a).localeCompare(eventSortKey(b));
  })[0];

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
    <div className="min-w-[520px] rounded-2xl bg-white/[0.07] px-4 py-3">
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

        <Volume2 className="h-4 w-4 text-slate-400" />

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

      <div className="mt-1 h-4 text-xs text-slate-400">
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

  useEffect(() => {
    setState(loadState());
    void refreshCloudStateNow();
    void fetchWeather().then(setWeather);

    const unsubscribe = onStateSynced(setState);

    const syncTimer = window.setInterval(() => {
      void refreshCloudStateNow();
    }, 60_000);

    const clockTimer = window.setInterval(() => {
      setNow(new Date());
    }, 30_000);

    const weatherTimer = window.setInterval(() => {
      void fetchWeather().then(setWeather);
    }, 30 * 60_000);

    return () => {
      unsubscribe();
      window.clearInterval(syncTimer);
      window.clearInterval(clockTimer);
      window.clearInterval(weatherTimer);
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

    const upcomingEvents = events
      .filter((event) => event.date >= today)
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
          task.status !== "done"
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

    const childEventsToday = todayEvents.filter(
      (event) =>
        event.calendar_type === "school" ||
        event.calendar_type === "child_activity"
    ).length;

    return {
      todayEvents,
      primaryEvent: pickPrimaryEvent(todayEvents),
      upcomingEvents,
      notices,
      mainTasks,
      nextTasks,
      childEventsToday
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

  const isDayScene = now.getHours() >= 6 && now.getHours() < 18;

  return (
    <main className={`h-[100dvh] overflow-hidden text-white ${isDayScene ? "bg-sky-200" : "bg-[#06101f]"}`}>
      <div
        className={`pointer-events-none fixed inset-0 ${
          isDayScene
            ? "bg-[linear-gradient(180deg,rgba(125,211,252,0.94)_0%,rgba(186,230,253,0.84)_38%,rgba(134,239,172,0.44)_100%)]"
            : "bg-[radial-gradient(circle_at_15%_0%,rgba(34,211,238,0.16),transparent_28%),radial-gradient(circle_at_88%_10%,rgba(129,140,248,0.16),transparent_26%),linear-gradient(145deg,#06101f,#0b1729_55%,#07111f)]"
        }`}
      />

      {isDayScene ? (
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute right-[8%] top-[7%] h-40 w-40 rounded-full bg-amber-200/90 shadow-[0_0_70px_rgba(253,224,71,0.65)]" />
          <div className="absolute right-[6%] top-[4%] h-64 w-64 rounded-full bg-amber-100/20 blur-3xl" />
          <div className="absolute left-[9%] top-[13%] h-16 w-44 rounded-full bg-white/55 blur-sm" />
          <div className="absolute left-[15%] top-[10%] h-20 w-60 rounded-full bg-white/35 blur-md" />
          <div className="absolute right-[28%] top-[18%] h-14 w-48 rounded-full bg-white/35 blur-sm" />
          <div className="absolute bottom-0 left-0 h-40 w-full bg-[linear-gradient(180deg,transparent,rgba(21,128,61,0.32))]" />
          <div className="absolute bottom-8 left-[7%] h-3 w-3 rounded-full bg-pink-300 shadow-[42px_18px_0_rgba(244,114,182,0.75),96px_-6px_0_rgba(251,191,36,0.75),164px_22px_0_rgba(248,113,113,0.78),230px_4px_0_rgba(236,72,153,0.72),305px_20px_0_rgba(250,204,21,0.7)]" />
          <div className="absolute left-[6%] top-[26%] text-3xl font-semibold text-slate-700/28">⌒ ⌒</div>
          <div className="absolute left-[23%] top-[18%] text-2xl font-semibold text-slate-700/22">⌒</div>
          <div className="absolute right-[18%] top-[30%] text-2xl font-semibold text-slate-700/22">⌒ ⌒</div>
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,17,31,0.16),rgba(7,17,31,0.58))]" />
        </div>
      ) : (
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute left-[6%] top-[8%] h-1 w-1 rounded-full bg-white/90 shadow-[130px_60px_0_rgba(255,255,255,0.75),260px_22px_0_rgba(255,255,255,0.85),390px_110px_0_rgba(255,255,255,0.65),580px_42px_0_rgba(255,255,255,0.82),780px_92px_0_rgba(255,255,255,0.7),980px_38px_0_rgba(255,255,255,0.9),1180px_132px_0_rgba(255,255,255,0.72),1420px_66px_0_rgba(255,255,255,0.76),1620px_115px_0_rgba(255,255,255,0.7)]" />
          <div className="absolute left-[22%] top-[-18%] h-[760px] w-[1180px] -rotate-12 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(224,242,254,0.28),rgba(125,211,252,0.11)_28%,rgba(168,85,247,0.10)_45%,transparent_68%)] blur-xl" />
          <div className="absolute right-[9%] top-[12%] h-24 w-24 rounded-full bg-slate-100/80 shadow-[0_0_45px_rgba(255,255,255,0.35)]" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.08),rgba(2,6,23,0.42))]" />
        </div>
      )}

      <section className="relative mx-auto grid h-[100dvh] max-w-[1920px] grid-rows-[auto_minmax(0,1fr)_auto] gap-4 px-6 py-4 lg:px-8">
        <header className="grid grid-cols-[minmax(260px,1fr)_auto] items-center gap-5 border-b border-white/10 pb-3">
          <div className="min-w-0">
            <div className="text-[clamp(1rem,1vw,1.25rem)] font-semibold tracking-[0.18em] text-cyan-200">
              Family Dashboard v2
            </div>

            <div className="mt-1 text-[clamp(1.9rem,2.6vw,3.6rem)] font-semibold leading-none">
              {greeting(now)}
            </div>

            <div className="mt-2 text-[clamp(1rem,1.05vw,1.35rem)] text-slate-300">
              {formatHeaderDate(now)}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <WeatherStrip weather={weather} />
            <MusicControl />

            <div className="min-w-[210px] text-right text-[clamp(4rem,5.4vw,6.5rem)] font-semibold leading-none tabular-nums">
              {formatClock(now)}
            </div>
          </div>
        </header>

        <div className="grid min-h-0 grid-rows-[0.86fr_1.14fr] gap-4">
          <section className="grid min-h-0 grid-cols-[0.9fr_1.55fr] gap-4">
            <article className="min-h-0 rounded-3xl bg-cyan-300/[0.08] p-5">
              <div className="mb-4 flex items-center justify-between">
                <SectionTitle title="TODAY" accent="bg-cyan-300" />

                <span className="rounded-full bg-cyan-300/15 px-3 py-1 text-[clamp(0.95rem,0.9vw,1.1rem)] text-cyan-100">
                  {data.todayEvents.length}件
                </span>
              </div>

              {data.primaryEvent ? (
                <div className="grid h-[calc(100%-3.2rem)] content-between">
                  <div>
                    <div className="text-[clamp(1.15rem,1.35vw,1.7rem)] text-cyan-100">
                      {eventTimeRange(data.primaryEvent)}
                    </div>

                    <div className="mt-3 text-[clamp(1.85rem,2.1vw,2.8rem)] font-semibold leading-tight">
                      {data.primaryEvent.title}
                    </div>
                    {data.primaryEvent.location ? (
                      <div className="mt-4 flex items-center gap-2 text-[clamp(1.05rem,1.1vw,1.4rem)] text-slate-300">
                        <MapPin className="h-5 w-5 shrink-0 text-cyan-200" />
                        {data.primaryEvent.location}
                      </div>
                    ) : null}
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-[clamp(1rem,1vw,1.25rem)] text-slate-300">
                    <div>
                      今日の予定 {data.todayEvents.length}件
                    </div>
                    <div>
                      学校・子ども関連 {data.childEventsToday}件
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid h-[calc(100%-3.2rem)] place-items-center text-center text-[clamp(1.35rem,1.5vw,1.9rem)] text-slate-300">
                  今日の大きな予定はありません
                </div>
              )}
            </article>

            <article className="min-h-0 rounded-3xl bg-indigo-300/[0.08] p-5">
              <div className="mb-4 flex items-center justify-between">
                <SectionTitle
                  title="UPCOMING"
                  accent="bg-indigo-300"
                />

                <span className="text-[clamp(0.9rem,0.85vw,1.05rem)] text-slate-400">
                  Next 5
                </span>
              </div>

              <div className="grid gap-2">
                {data.upcomingEvents.map((event) => (
                  <div
                    key={event.id}
                    className="grid grid-cols-[7rem_7.4rem_1rem_minmax(0,1fr)] items-start gap-3 rounded-xl bg-slate-950/28 px-4 py-2.5"
                  >
                    <div className="text-[clamp(1rem,0.95vw,1.2rem)] font-semibold text-slate-200">
                      {formatShortDate(event.date)}
                    </div>

                    <div className="whitespace-nowrap text-[clamp(1rem,0.95vw,1.2rem)] text-slate-300">
                      {eventTimeRange(event)}
                    </div>

                    <span
                      className={`mt-2 h-3 w-3 rounded-full ${categoryColor(
                        event
                      )}`}
                    />

                    <div className="text-[clamp(1.1rem,1.15vw,1.45rem)] font-medium leading-snug">
                      {event.title}
                    </div>
                  </div>
                ))}

                {data.upcomingEvents.length === 0 ? (
                  <div className="rounded-2xl bg-slate-950/30 p-6 text-[clamp(1.25rem,1.25vw,1.6rem)] text-slate-300">
                    今後の予定はありません
                  </div>
                ) : null}
              </div>
            </article>
          </section>

          <section className="grid min-h-0 grid-cols-[1.55fr_0.9fr] gap-4">
            <article className="min-h-0 rounded-3xl bg-emerald-300/[0.08] p-5">
              <div className="mb-4 flex items-center justify-between">
                <SectionTitle
                  title="LEARNING ・ 今日やること"
                  accent="bg-emerald-300"
                />

                <span className="text-[clamp(0.9rem,0.85vw,1.05rem)] text-emerald-100/80">
                  ○ をタップして完了
                </span>
              </div>

              {recentlyCompleted ? (
                <div className="mb-3 flex items-center justify-between rounded-xl bg-emerald-300/15 px-4 py-2 text-sm text-emerald-50">
                  <div className="flex min-w-0 items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-300" />
                    <span className="truncate">
                      完了: {recentlyCompleted.title}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={undoCompletedTask}
                    className="ml-3 min-h-10 shrink-0 rounded-lg bg-white/10 px-4 font-semibold text-white transition active:scale-95 active:bg-white/20"
                  >
                    取消
                  </button>
                </div>
              ) : null}

              {data.mainTasks.length > 0 ? (
                <div className="grid min-h-0 grid-cols-[1fr_0.58fr] gap-5">
                  <div className="min-h-0 rounded-2xl bg-slate-950/25 p-4">
                    <div className="mb-3 text-[clamp(0.95rem,0.9vw,1.1rem)] font-semibold tracking-[0.12em] text-emerald-100">
                      主要タスク
                    </div>

                    <div className="grid gap-2">
                      {data.mainTasks.map((task) => (
                        <div
                          key={task.id}
                          className="grid grid-cols-[3.25rem_minmax(0,1fr)_auto] items-center gap-3 rounded-xl px-2 py-2 text-white transition hover:bg-emerald-300/[0.06]"
                        >
                          <button
                            type="button"
                            onClick={() =>
                              completeTaskFromScreen(task)
                            }
                            className="grid h-11 w-11 place-items-center rounded-full border-2 border-emerald-200/90 bg-emerald-300/[0.05] text-emerald-100 transition active:scale-95 active:bg-emerald-300/25"
                            aria-label={`${task.title} を完了にする`}
                            title="タップして完了"
                          >
                            <Circle className="h-6 w-6" />
                          </button>

                          <div className="min-w-0">
                            <div className="text-[clamp(1.25rem,1.25vw,1.65rem)] leading-snug">
                              {task.title}
                            </div>

                            {task.note ? (
                              <div className="mt-0.5 text-[clamp(0.9rem,0.85vw,1rem)] text-slate-400">
                                {task.note}
                              </div>
                            ) : null}
                          </div>

                          {task.due_date ? (
                            <div
                              className={`pt-1 text-[clamp(0.9rem,0.85vw,1rem)] ${
                                task.due_date < todayKey(now)
                                  ? "font-semibold text-amber-200"
                                  : "text-slate-400"
                              }`}
                            >
                              {task.due_date < todayKey(now)
                                ? `期限超過 ${dueText(task.due_date)}`
                                : dueText(task.due_date)}
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="min-h-0 rounded-2xl bg-slate-950/25 p-4">
                    <div className="mb-3 text-[clamp(0.95rem,0.9vw,1.1rem)] font-semibold tracking-[0.12em] text-emerald-100">
                      NEXT
                    </div>

                    <div className="grid gap-3">
                      {data.nextTasks.map((task) => (
                        <div
                          key={task.id}
                          className="rounded-xl bg-emerald-300/10 px-4 py-3"
                        >
                          <div className="text-[clamp(1.25rem,1.25vw,1.65rem)] font-medium leading-snug">
                            → {task.title}
                          </div>

                          {task.due_date ? (
                            <div className="mt-1 text-[clamp(0.9rem,0.85vw,1rem)] text-slate-400">
                              {dueText(task.due_date)}
                            </div>
                          ) : null}
                        </div>
                      ))}

                      {data.nextTasks.length === 0 ? (
                        <div className="text-[clamp(1.15rem,1.1vw,1.45rem)] text-slate-300">
                          次の学習タスクはありません
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid min-h-[180px] place-items-center rounded-2xl bg-slate-950/25 text-center text-[clamp(1.35rem,1.45vw,1.9rem)] text-slate-300">
                  今日の学習タスクはありません
                </div>
              )}
            </article>

            <article className="min-h-0 rounded-3xl bg-amber-300/[0.08] p-5">
              <div className="mb-4 flex items-center gap-3">
                <Bell className="h-6 w-6 text-amber-200" />
                <SectionTitle
                  title="QUICK NOTICE"
                  accent="bg-amber-300"
                />
              </div>

              <div className="grid gap-3">
                {data.notices.map((event) => (
                  <div
                    key={event.id}
                    className="rounded-2xl bg-amber-200/10 px-4 py-3"
                  >
                    <div className="text-[clamp(0.95rem,0.9vw,1.1rem)] text-amber-100">
                      {formatShortDate(event.date)}{" "}
                      {eventTimeRange(event)}
                    </div>

                    <div className="mt-1 text-[clamp(1.15rem,1.18vw,1.5rem)] font-semibold leading-snug">
                      {event.title}
                    </div>

                    {event.parent_task ? (
                      <div className="mt-1 text-[clamp(1rem,0.95vw,1.18rem)] text-slate-300">
                        {event.parent_task}
                      </div>
                    ) : null}
                  </div>
                ))}

                {data.notices.length === 0 ? (
                  <div className="flex items-center gap-2 rounded-2xl bg-slate-950/25 p-5 text-[clamp(1.1rem,1.05vw,1.35rem)] text-slate-300">
                    <AlertCircle className="h-5 w-5 text-amber-200" />
                    確認が必要な予定はありません
                  </div>
                ) : null}
              </div>
            </article>
          </section>
        </div>

        <footer className="flex items-center justify-between border-t border-white/10 pt-2 text-xs text-slate-500">
          <span>
            スマホで予定を編集すると、この画面にも反映されます。
          </span>
          <span>Cloud sync · 60 sec refresh</span>
        </footer>
      </section>
    </main>
  );
}
