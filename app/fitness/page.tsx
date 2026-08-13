"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  Dumbbell,
  HeartPulse,
  Home,
  Pause,
  Play,
  RotateCcw,
  Timer,
  Wind
} from "lucide-react";
import {
  loadState,
  onStateSynced,
  refreshCloudStateNow,
  saveState,
  toggleTask,
  type AppState
} from "@/lib/db";
import { ensureDailyTasks, localDateKey } from "@/lib/dailyTasks";

type Person = "dad" | "mom";
type MomMode = "recovery" | "normal";

type RoutineStep = {
  id: string;
  title: string;
  duration: number;
  cue: string;
  detail: string;
};

const dadRoutine: RoutineStep[] = [
  {
    id: "warmup",
    title: "Warm-up · ウォームアップ",
    duration: 120,
    cue: "肩・股関節をゆっくり動かす",
    detail: "その場歩き、肩回し、ヒップヒンジ練習。急に立ち上がらず、呼吸を止めない。"
  },
  {
    id: "deadlift",
    title: "Kettlebell Deadlift",
    duration: 120,
    cue: "背中を丸めず、股関節から動く",
    detail: "足の中央にケトルベル。お尻を後ろへ引き、床を押して立つ。重さよりフォーム優先。"
  },
  {
    id: "goblet",
    title: "Goblet Squat",
    duration: 120,
    cue: "胸の前で保持・ゆっくり上下",
    detail: "膝とつま先の向きをそろえる。深さは無理のない範囲。息を止めない。"
  },
  {
    id: "row",
    title: "One-arm Row",
    duration: 120,
    cue: "左右 60秒ずつ",
    detail: "体幹を安定させ、肘を腰の方向へ引く。肩をすくめない。"
  },
  {
    id: "carry",
    title: "Suitcase Carry / March",
    duration: 120,
    cue: "左右 60秒ずつ",
    detail: "片手でケトルベルを持ち、まっすぐ立って歩くかその場足踏み。体を傾けない。"
  },
  {
    id: "halo",
    title: "Kettlebell Halo",
    duration: 120,
    cue: "軽い重量でゆっくり",
    detail: "頭の周りを小さくゆっくり回す。肩や首に違和感があれば省略。"
  },
  {
    id: "cooldown",
    title: "Cool-down",
    duration: 180,
    cue: "呼吸を整えて終了",
    detail: "ゆっくり歩き、肩・股関節を軽く動かす。急に座り込まない。"
  }
];

const momRecoveryRoutine: RoutineStep[] = [
  {
    id: "breathing",
    title: "ゆっくり呼吸",
    duration: 120,
    cue: "力まない・息を止めない",
    detail: "楽な姿勢で自然な呼吸。お腹や骨盤底に強く力を入れない。"
  },
  {
    id: "shoulders",
    title: "肩・手首をやさしく動かす",
    duration: 120,
    cue: "痛みのない小さな範囲",
    detail: "肩回し、手首回し。深い前屈や強いひねりは行わない。"
  },
  {
    id: "ankles",
    title: "足首運動",
    duration: 120,
    cue: "座位または立位でゆっくり",
    detail: "つま先の上げ下げ、足首回し。血流を促す程度の軽い動き。"
  },
  {
    id: "walk1",
    title: "Gentle Walk",
    duration: 180,
    cue: "会話できる楽なペース",
    detail: "室内でもOK。傷の痛み・出血・圧迫感が増えるなら中止。"
  },
  {
    id: "walk2",
    title: "Gentle Walk",
    duration: 180,
    cue: "無理せず続ける",
    detail: "疲れたら途中で休む。速歩きや坂道は必要ない。"
  },
  {
    id: "relax",
    title: "Relax / 呼吸",
    duration: 180,
    cue: "楽な姿勢で終了",
    detail: "呼吸を整える。今日は柔軟性を伸ばすことより、回復を優先。"
  }
];

const momNormalRoutine: RoutineStep[] = [
  {
    id: "breathing",
    title: "Breathing + Shoulder Roll",
    duration: 90,
    cue: "ゆっくり呼吸・肩をほぐす",
    detail: "鼻から吸ってゆっくり吐く。肩を前後に小さく回す。"
  },
  {
    id: "catcow",
    title: "Cat–Cow",
    duration: 120,
    cue: "背骨をゆっくり動かす",
    detail: "四つ這いで呼吸に合わせて丸める・反らす。痛みのない範囲で。"
  },
  {
    id: "child",
    title: "Child's Pose",
    duration: 90,
    cue: "背中と肩をゆるめる",
    detail: "膝幅を楽に取り、お尻をかかと方向へ。圧迫感があれば中止。"
  },
  {
    id: "lunge",
    title: "Low Lunge",
    duration: 120,
    cue: "左右 60秒ずつ",
    detail: "股関節前側をやさしく伸ばす。腰を反りすぎない。"
  },
  {
    id: "downward",
    title: "Downward Dog",
    duration: 120,
    cue: "膝は曲げてもOK",
    detail: "背中を長く保ち、かかとは床につかなくてよい。肩に無理をしない。"
  },
  {
    id: "figure4",
    title: "Figure-4 Stretch",
    duration: 120,
    cue: "左右 60秒ずつ",
    detail: "お尻まわりをゆっくり伸ばす。反動をつけない。"
  },
  {
    id: "twist",
    title: "Supine Twist",
    duration: 120,
    cue: "左右 60秒ずつ",
    detail: "仰向けで軽くひねる。痛みや圧迫感があれば小さくするか省略。"
  },
  {
    id: "relax",
    title: "Savasana / Relax",
    duration: 120,
    cue: "呼吸を整える",
    detail: "楽な姿勢で全身の力を抜いて終了。"
  }
];

function formatSeconds(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}

function taskId(person: Person, day: string) {
  return `daily-${person === "dad" ? "dad" : "mom"}-fitness-${day}`;
}

export default function FitnessPage() {
  const [state, setState] = useState<AppState | null>(null);
  const [person, setPerson] = useState<Person>("dad");
  const [momMode, setMomMode] = useState<MomMode>("recovery");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(dadRoutine[0].duration);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);

  const today = localDateKey(new Date());

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

  const routine =
    person === "dad"
      ? dadRoutine
      : momMode === "recovery"
        ? momRecoveryRoutine
        : momNormalRoutine;

  const current = routine[currentIndex] ?? routine[0];

  useEffect(() => {
    setCurrentIndex(0);
    setSecondsLeft(routine[0].duration);
    setRunning(false);
    setFinished(false);
  }, [person, momMode]);

  useEffect(() => {
    if (!running) return;

    const timer = window.setInterval(() => {
      setSecondsLeft((value) => {
        if (value > 1) return value - 1;

        if (currentIndex < routine.length - 1) {
          const nextIndex = currentIndex + 1;
          setCurrentIndex(nextIndex);
          return routine[nextIndex].duration;
        }

        setRunning(false);
        setFinished(true);
        return 0;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [running, currentIndex, routine]);

  const completedBefore = useMemo(
    () =>
      routine
        .slice(0, currentIndex)
        .reduce((sum, step) => sum + step.duration, 0),
    [routine, currentIndex]
  );

  const elapsed =
    completedBefore + Math.max(0, current.duration - secondsLeft);
  const total = routine.reduce((sum, step) => sum + step.duration, 0);
  const progress = Math.min(100, Math.round((elapsed / total) * 100));

  const todayTask = state?.tasks.find((task) => task.id === taskId(person, today));
  const alreadyDone = todayTask?.status === "done";

  function goToStep(index: number) {
    const safe = Math.max(0, Math.min(index, routine.length - 1));
    setCurrentIndex(safe);
    setSecondsLeft(routine[safe].duration);
    setRunning(false);
    setFinished(false);
  }

  function reset() {
    setCurrentIndex(0);
    setSecondsLeft(routine[0].duration);
    setRunning(false);
    setFinished(false);
  }

  function markDone() {
    const task = state?.tasks.find((item) => item.id === taskId(person, today));
    if (!task || task.status === "done") return;
    const next = toggleTask(task.id);
    setState(next);
  }

  return (
    <main className="min-h-[100dvh] bg-[#06101f] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_15%_0%,rgba(16,185,129,0.14),transparent_30%),radial-gradient(circle_at_90%_10%,rgba(59,130,246,0.13),transparent_26%),linear-gradient(145deg,#06101f,#0b1729_55%,#07111f)]" />

      <div className="relative mx-auto max-w-[1500px] px-4 py-4 sm:px-6 lg:px-8">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <div className="text-xs font-semibold tracking-[0.16em] text-emerald-200">
              FAMILY FITNESS · 15 MIN
            </div>
            <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
              Fitness / Stretch & Yoga
            </h1>
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
              href="/streak"
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-white/[0.07] px-4 text-sm font-semibold text-slate-200 active:bg-white/[0.14]"
            >
              <ArrowLeft size={18} />
              Streak
            </Link>
          </div>
        </header>

        <section className="mt-4 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setPerson("dad")}
            className={`min-h-20 rounded-2xl border p-4 text-left transition ${
              person === "dad"
                ? "border-blue-300/40 bg-blue-300/15"
                : "border-white/5 bg-white/[0.04]"
            }`}
          >
            <div className="flex items-center gap-2 text-sm text-blue-200">
              <Dumbbell size={19} />
              DAD
            </div>
            <div className="mt-1 text-lg font-bold">Kettlebell 15 min</div>
          </button>

          <button
            type="button"
            onClick={() => setPerson("mom")}
            className={`min-h-20 rounded-2xl border p-4 text-left transition ${
              person === "mom"
                ? "border-emerald-300/40 bg-emerald-300/15"
                : "border-white/5 bg-white/[0.04]"
            }`}
          >
            <div className="flex items-center gap-2 text-sm text-emerald-200">
              <HeartPulse size={19} />
              MOM
            </div>
            <div className="mt-1 text-lg font-bold">Stretch & Yoga 15 min</div>
          </button>
        </section>

        {person === "mom" ? (
          <section className="mt-3 rounded-2xl border border-amber-300/20 bg-amber-300/[0.08] p-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="font-semibold text-amber-100">
                  Mom mode
                </div>
                <div className="mt-0.5 text-xs text-slate-400">
                  最近の手術・傷がある間は Recovery を優先
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMomMode("recovery")}
                  className={`min-h-10 rounded-xl px-3 text-sm font-semibold ${
                    momMode === "recovery"
                      ? "bg-amber-300 text-slate-950"
                      : "bg-white/[0.06] text-slate-300"
                  }`}
                >
                  Recovery
                </button>
                <button
                  type="button"
                  onClick={() => setMomMode("normal")}
                  className={`min-h-10 rounded-xl px-3 text-sm font-semibold ${
                    momMode === "normal"
                      ? "bg-emerald-300 text-slate-950"
                      : "bg-white/[0.06] text-slate-300"
                  }`}
                >
                  Normal Yoga
                </button>
              </div>
            </div>
          </section>
        ) : null}

        <section className="mt-4 grid gap-4 lg:grid-cols-[1.08fr_0.92fr]">
          <article className="rounded-3xl bg-white/[0.055] p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-semibold tracking-[0.14em] text-slate-400">
                  STEP {currentIndex + 1} / {routine.length}
                </div>
                <h2 className="mt-2 text-2xl font-bold leading-tight sm:text-4xl">
                  {current.title}
                </h2>
                <div className="mt-2 text-base text-emerald-100 sm:text-lg">
                  {current.cue}
                </div>
              </div>

              <div
                className={`rounded-full px-3 py-1.5 text-sm font-semibold ${
                  alreadyDone
                    ? "bg-emerald-300/15 text-emerald-200"
                    : "bg-white/[0.06] text-slate-400"
                }`}
              >
                {alreadyDone ? "✓ 今日完成" : "今日 未完成"}
              </div>
            </div>

            <div className="mt-7 text-center">
              <div className="text-[clamp(4.5rem,11vw,9rem)] font-bold leading-none tabular-nums">
                {formatSeconds(secondsLeft)}
              </div>

              <div className="mx-auto mt-6 h-3 max-w-2xl overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-emerald-300 transition-[width]"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="mt-2 text-sm text-slate-500">
                Total progress {progress}%
              </div>
            </div>

            <div className="mt-7 grid grid-cols-[1fr_1.45fr_1fr] gap-3">
              <button
                type="button"
                onClick={() => goToStep(currentIndex - 1)}
                disabled={currentIndex === 0}
                className="flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-white/[0.06] font-semibold text-slate-200 disabled:opacity-30"
              >
                <ChevronLeft size={22} />
                Back
              </button>

              <button
                type="button"
                onClick={() => setRunning((value) => !value)}
                className="flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-emerald-300 text-lg font-bold text-slate-950 active:scale-[0.98]"
              >
                {running ? <Pause size={24} /> : <Play size={24} />}
                {running ? "Pause" : finished ? "Restart" : "Start"}
              </button>

              <button
                type="button"
                onClick={() => goToStep(currentIndex + 1)}
                disabled={currentIndex === routine.length - 1}
                className="flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-white/[0.06] font-semibold text-slate-200 disabled:opacity-30"
              >
                Next
                <ChevronRight size={22} />
              </button>
            </div>

            <div className="mt-3 flex justify-center">
              <button
                type="button"
                onClick={reset}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-semibold text-slate-400 active:bg-white/[0.06]"
              >
                <RotateCcw size={17} />
                Reset
              </button>
            </div>

            <div className="mt-5 rounded-2xl bg-slate-950/25 p-4">
              <div className="text-sm font-semibold text-slate-300">
                How to
              </div>
              <div className="mt-2 text-base leading-relaxed text-slate-200">
                {current.detail}
              </div>
            </div>

            {finished || alreadyDone ? (
              <button
                type="button"
                onClick={markDone}
                disabled={alreadyDone}
                className={`mt-4 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl text-lg font-bold ${
                  alreadyDone
                    ? "bg-emerald-300/15 text-emerald-200"
                    : "bg-emerald-300 text-slate-950"
                }`}
              >
                <CheckCircle2 size={23} />
                {alreadyDone ? "今日のFitness 完了" : "今日のFitnessを完了にする"}
              </button>
            ) : null}
          </article>

          <article className="rounded-3xl bg-white/[0.045] p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {person === "dad" ? (
                  <Dumbbell className="h-5 w-5 text-blue-200" />
                ) : (
                  <Wind className="h-5 w-5 text-emerald-200" />
                )}
                <h2 className="font-bold">15-minute routine</h2>
              </div>
              <div className="flex items-center gap-1 text-xs text-slate-500">
                <Timer size={14} />
                {Math.round(total / 60)} min
              </div>
            </div>

            <div className="mt-4 grid gap-2">
              {routine.map((step, index) => (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => goToStep(index)}
                  className={`grid grid-cols-[2.3rem_minmax(0,1fr)_3.5rem] items-center gap-3 rounded-xl px-3 py-3 text-left transition ${
                    index === currentIndex
                      ? "bg-emerald-300/15"
                      : "bg-slate-950/20 active:bg-white/[0.08]"
                  }`}
                >
                  <div
                    className={`grid h-8 w-8 place-items-center rounded-full text-sm font-bold ${
                      index < currentIndex
                        ? "bg-emerald-300 text-slate-950"
                        : index === currentIndex
                          ? "bg-white text-slate-950"
                          : "bg-white/[0.06] text-slate-500"
                    }`}
                  >
                    {index < currentIndex ? "✓" : index + 1}
                  </div>

                  <div className="min-w-0">
                    <div className="truncate font-semibold text-white">
                      {step.title}
                    </div>
                    <div className="mt-0.5 truncate text-xs text-slate-500">
                      {step.cue}
                    </div>
                  </div>

                  <div className="text-right text-sm tabular-nums text-slate-400">
                    {formatSeconds(step.duration)}
                  </div>
                </button>
              ))}
            </div>
          </article>
        </section>

        <section className="mt-4 rounded-2xl border border-white/5 bg-white/[0.025] px-4 py-3 text-xs leading-relaxed text-slate-500">
          痛み、めまい、胸痛、息苦しさ、出血の増加、気分不良があれば中止してください。
          重量・可動域は「今日できる範囲」を優先します。
        </section>
      </div>
    </main>
  );
}
