"use client";

import { useEffect, useState } from "react";
import {
  ChevronDown,
  Dumbbell,
  Pencil,
  RotateCcw,
  Save,
  Video
} from "lucide-react";

export type DadMoveKind =
  | "deadlift"
  | "goblet"
  | "row"
  | "carry"
  | "halo";

export type DadPlanMove = {
  kind: DadMoveKind;
  title: string;
  reps: string;
  cue: string;
  detail: string;
};

export type DadPlanDay = {
  label: string;
  focus: string;
  intensity: "normal" | "light" | "recovery";
  moves: DadPlanMove[];
};

export type DadPlanConfig = {
  version: 1;
  videoUrl: string;
  days: Record<string, DadPlanDay>;
};

export type DadRoutineStep = {
  id: string;
  title: string;
  duration: number;
  cue: string;
  detail: string;
};

const STORAGE_KEY = "family-fitness-dad-kettlebell-plan-v1";

const moveOptions: Array<{
  kind: DadMoveKind;
  title: string;
  cue: string;
  detail: string;
}> = [
  {
    kind: "deadlift",
    title: "Kettlebell Deadlift",
    cue: "8–12 reps · ヒップヒンジ",
    detail:
      "足の中央にケトルベル。背中を丸めず、お尻を後ろへ引いて床を押して立つ。"
  },
  {
    kind: "goblet",
    title: "Goblet Squat",
    cue: "8–12 reps · ゆっくり",
    detail:
      "胸の前で保持。膝とつま先を同じ方向へ。深さより姿勢を優先。"
  },
  {
    kind: "row",
    title: "One-arm Row",
    cue: "左右 8–12 reps",
    detail:
      "体幹を安定させ、肘を腰の方向へ引く。肩をすくめず左右を均等に。"
  },
  {
    kind: "carry",
    title: "Suitcase Carry / March",
    cue: "左右 30–45 sec",
    detail:
      "片手で保持し、まっすぐ歩くかその場足踏み。体を横へ傾けない。"
  },
  {
    kind: "halo",
    title: "Kettlebell Halo",
    cue: "左右 5–8 circles · 軽量",
    detail:
      "軽い重量で頭の周りを小さく回す。首を反らさず、肩に痛みがあれば省略。"
  }
];

function move(kind: DadMoveKind, overrides: Partial<DadPlanMove> = {}): DadPlanMove {
  const base = moveOptions.find((item) => item.kind === kind) ?? moveOptions[0];
  return {
    kind,
    title: base.title,
    reps: base.cue,
    cue: base.cue,
    detail: base.detail,
    ...overrides
  };
}

export const DEFAULT_DAD_KETTLEBELL_PLAN: DadPlanConfig = {
  version: 1,
  videoUrl: "/fitness/videos/dad-kettlebell-week-plan.mp4",
  days: {
    "1": {
      label: "MON · 全身",
      focus: "Full Body · 全身をバランスよく",
      intensity: "normal",
      moves: [
        move("deadlift"),
        move("goblet"),
        move("row"),
        move("carry"),
        move("halo")
      ]
    },
    "2": {
      label: "TUE · 腰腹",
      focus: "Core · 腰腹は「曲げる」より安定させる",
      intensity: "light",
      moves: [
        move("carry", {
          title: "Suitcase March · Core",
          reps: "左右 40 sec",
          cue: "体を横へ倒さない"
        }),
        move("halo", {
          title: "Halo · Core + Shoulder",
          reps: "左右 5–8 circles",
          cue: "肋骨を開かずゆっくり"
        }),
        move("deadlift", {
          reps: "8–10 reps · 軽め",
          cue: "腹圧を保ってヒンジ"
        }),
        move("goblet", {
          title: "Goblet Hold + Squat",
          reps: "8–10 reps",
          cue: "胸の前で安定"
        }),
        move("carry", {
          title: "Suitcase Carry · Other Side",
          reps: "左右 30–45 sec",
          cue: "歩幅を小さく姿勢優先"
        })
      ]
    },
    "3": {
      label: "WED · 臀腿",
      focus: "Glutes & Legs · 臀腿",
      intensity: "normal",
      moves: [
        move("deadlift", {
          title: "Deadlift · Glute Focus",
          reps: "8–12 reps",
          cue: "お尻を後ろへ"
        }),
        move("goblet", {
          title: "Goblet Squat · Legs",
          reps: "8–12 reps",
          cue: "膝とつま先をそろえる"
        }),
        move("deadlift", {
          title: "Slow Deadlift",
          reps: "6–10 reps · 3秒で下ろす",
          cue: "ハムストリングを感じる"
        }),
        move("goblet", {
          title: "Goblet Squat · Tempo",
          reps: "6–10 reps · ゆっくり",
          cue: "反動を使わない"
        }),
        move("carry", {
          title: "Suitcase March",
          reps: "左右 30–45 sec",
          cue: "臀部と体幹を安定"
        })
      ]
    },
    "4": {
      label: "THU · 技術 / 回復",
      focus: "Technique Day · 軽量でフォーム確認",
      intensity: "recovery",
      moves: [
        move("deadlift", {
          title: "Hip Hinge Practice",
          reps: "6–8 reps · very light",
          cue: "重量より軌道"
        }),
        move("goblet", {
          title: "Easy Goblet Squat",
          reps: "6–8 reps · very light",
          cue: "可動域を無理しない"
        }),
        move("row", {
          title: "Easy One-arm Row",
          reps: "左右 6–8 reps",
          cue: "肩をすくめない"
        }),
        move("halo", {
          reps: "左右 4–6 circles",
          cue: "最軽量で肩をほぐす"
        }),
        move("carry", {
          title: "Easy Carry / Walk",
          reps: "左右 30 sec",
          cue: "会話できる強度"
        })
      ]
    },
    "5": {
      label: "FRI · 肩背",
      focus: "Back & Shoulder · 肩背",
      intensity: "normal",
      moves: [
        move("row", {
          title: "One-arm Row · Back",
          reps: "左右 8–12 reps",
          cue: "肘を腰へ引く"
        }),
        move("halo", {
          title: "Halo · Shoulder Mobility",
          reps: "左右 5–8 circles",
          cue: "軽量・首を反らさない"
        }),
        move("carry", {
          title: "Suitcase Carry · Posture",
          reps: "左右 30–45 sec",
          cue: "肩の高さをそろえる"
        }),
        move("row", {
          title: "Slow Row",
          reps: "左右 6–10 reps",
          cue: "下ろす時もコントロール"
        }),
        move("goblet", {
          title: "Goblet Squat · Posture",
          reps: "8–10 reps",
          cue: "胸郭を安定"
        })
      ]
    },
    "6": {
      label: "SAT · 手臂 + 軽全身",
      focus: "Arms + Light Conditioning · 手臂は軽め",
      intensity: "light",
      moves: [
        move("row", {
          title: "Row · Arm + Back",
          reps: "左右 8–10 reps",
          cue: "腕だけで引かない"
        }),
        move("halo", {
          title: "Halo · Arms / Shoulder",
          reps: "左右 5–8 circles",
          cue: "軽量"
        }),
        move("carry", {
          title: "Carry · Grip",
          reps: "左右 30–45 sec",
          cue: "握りすぎず姿勢維持"
        }),
        move("deadlift", {
          title: "Easy Deadlift",
          reps: "8–10 reps",
          cue: "フォーム確認"
        }),
        move("goblet", {
          title: "Easy Goblet Squat",
          reps: "8–10 reps",
          cue: "息を止めない"
        })
      ]
    },
    "0": {
      label: "SUN · Recovery",
      focus: "Recovery · 15分の習慣だけ残す",
      intensity: "recovery",
      moves: [
        move("carry", {
          title: "Easy Walk / March",
          reps: "60 sec · very light",
          cue: "疲労抜き"
        }),
        move("halo", {
          title: "Very Light Halo",
          reps: "左右 4–5 circles",
          cue: "肩を楽に"
        }),
        move("deadlift", {
          title: "Hinge Technique",
          reps: "5–6 reps · very light",
          cue: "動作確認のみ"
        }),
        move("goblet", {
          title: "Bodyweight / Light Squat",
          reps: "6–8 reps",
          cue: "痛みのない範囲"
        }),
        move("carry", {
          title: "Easy Walk + Breathing",
          reps: "60 sec",
          cue: "心拍を上げない"
        })
      ]
    }
  }
};

function cloneDefault(): DadPlanConfig {
  return JSON.parse(JSON.stringify(DEFAULT_DAD_KETTLEBELL_PLAN)) as DadPlanConfig;
}

export function loadDadPlan(): DadPlanConfig {
  if (typeof window === "undefined") return cloneDefault();

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return cloneDefault();

    const parsed = JSON.parse(raw) as DadPlanConfig;
    if (parsed?.version !== 1 || !parsed.days) return cloneDefault();
    return parsed;
  } catch {
    return cloneDefault();
  }
}

export function buildDadRoutine(
  date: Date,
  config?: DadPlanConfig | null
): DadRoutineStep[] {
  const plan = config ?? DEFAULT_DAD_KETTLEBELL_PLAN;
  const day = plan.days[String(date.getDay())] ?? plan.days["1"];

  const warmup: DadRoutineStep = {
    id: "warmup",
    title: "Warm-up · ウォームアップ",
    duration: 120,
    cue:
      day.intensity === "normal"
        ? "肩・股関節・ヒップヒンジ"
        : "ゆっくり動いて状態確認",
    detail:
      "その場歩き、肩回し、ヒップヒンジ練習。最初の2分で今日の疲労や痛みを確認。"
  };

  const exerciseSteps: DadRoutineStep[] = day.moves.slice(0, 5).map((item) => ({
    id: item.kind,
    title: item.title,
    duration: 120,
    cue: `${item.reps} · ${item.cue}`,
    detail: item.detail
  }));

  const cooldown: DadRoutineStep = {
    id: "cooldown",
    title: "Cool-down · 整理",
    duration: 180,
    cue: "3分 · 呼吸を整える",
    detail:
      "ゆっくり歩き、肩・股関節を軽く動かす。息を止めず、心拍を落ち着かせて終了。"
  };

  return [warmup, ...exerciseSteps, cooldown];
}

function dayOrder() {
  return ["1", "2", "3", "4", "5", "6", "0"];
}

export function DadKettlebellWeeklyPlan({
  value,
  onChange
}: {
  value?: DadPlanConfig | null;
  onChange?: (next: DadPlanConfig) => void;
}) {
  const [plan, setPlan] = useState<DadPlanConfig>(() => value ?? cloneDefault());
  const [selectedDay, setSelectedDay] = useState(() =>
    String(new Date().getDay())
  );
  const [editing, setEditing] = useState(false);
  const [videoOpen, setVideoOpen] = useState(true);

  useEffect(() => {
    const loaded = loadDadPlan();
    setPlan(loaded);
    onChange?.(loaded);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!value) return;
    setPlan(value);
  }, [value]);

  const day = plan.days[selectedDay] ?? plan.days["1"];
  const todayDay = String(new Date().getDay());

  function commit(next: DadPlanConfig) {
    setPlan(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // local storage can be unavailable in private/restricted modes.
    }
    onChange?.(next);
  }

  function updateDay(patch: Partial<DadPlanDay>) {
    commit({
      ...plan,
      days: {
        ...plan.days,
        [selectedDay]: {
          ...day,
          ...patch
        }
      }
    });
  }

  function updateMove(index: number, patch: Partial<DadPlanMove>) {
    const moves = day.moves.map((item, moveIndex) =>
      moveIndex === index ? { ...item, ...patch } : item
    );
    updateDay({ moves });
  }

  function changeKind(index: number, kind: DadMoveKind) {
    updateMove(index, move(kind));
  }

  function resetPlan() {
    const next = cloneDefault();
    commit(next);
    setSelectedDay(String(new Date().getDay()));
  }

  const intensityLabel =
    day.intensity === "normal"
      ? "NORMAL"
      : day.intensity === "light"
        ? "LIGHT"
        : "RECOVERY";

  return (
    <section className="mt-4 rounded-3xl border border-blue-300/10 bg-blue-300/[0.045] p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.14em] text-blue-200">
            <Dumbbell size={17} />
            DAD · WEEKLY KETTLEBELL PLAN
          </div>
          <div className="mt-1 text-xl font-bold text-white">
            每天 15 min · 分主题训练
          </div>
          <div className="mt-1 text-xs leading-relaxed text-slate-400">
            2 min warm-up + 5 × 2 min + 3 min cool-down
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
              day.intensity === "normal"
                ? "bg-blue-300/15 text-blue-100"
                : day.intensity === "light"
                  ? "bg-amber-300/15 text-amber-100"
                  : "bg-emerald-300/15 text-emerald-100"
            }`}
          >
            {intensityLabel}
          </span>

          <button
            type="button"
            onClick={() => setEditing((current) => !current)}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-xl bg-white/[0.07] px-3 text-xs font-semibold text-slate-200"
          >
            {editing ? <Save size={14} /> : <Pencil size={14} />}
            {editing ? "DONE" : "編集"}
          </button>

          <button
            type="button"
            onClick={resetPlan}
            className="grid h-9 w-9 place-items-center rounded-xl bg-white/[0.05] text-slate-400"
            title="默认计划に戻す"
          >
            <RotateCcw size={15} />
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-7">
        {dayOrder().map((key) => {
          const item = plan.days[key];
          const active = selectedDay === key;
          const isToday = todayDay === key;

          return (
            <button
              key={key}
              type="button"
              onClick={() => setSelectedDay(key)}
              className={`min-h-12 rounded-xl px-2 text-xs font-semibold transition ${
                active
                  ? "bg-blue-300 text-slate-950"
                  : "bg-slate-950/25 text-slate-300 active:bg-white/[0.08]"
              }`}
            >
              <div>{item.label.split(" · ")[0]}</div>
              {isToday ? (
                <div
                  className={`mt-0.5 text-[9px] ${
                    active ? "text-slate-700" : "text-blue-200"
                  }`}
                >
                  TODAY
                </div>
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="mt-4 rounded-2xl bg-slate-950/25 p-4">
        {editing ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs text-slate-400">
              Day label
              <input
                value={day.label}
                onChange={(event) => updateDay({ label: event.target.value })}
                className="mt-1 min-h-10 w-full rounded-xl border border-white/10 bg-slate-950/45 px-3 text-sm text-white outline-none"
              />
            </label>

            <label className="text-xs text-slate-400">
              Focus
              <input
                value={day.focus}
                onChange={(event) => updateDay({ focus: event.target.value })}
                className="mt-1 min-h-10 w-full rounded-xl border border-white/10 bg-slate-950/45 px-3 text-sm text-white outline-none"
              />
            </label>

            <label className="text-xs text-slate-400 sm:col-span-2">
              Reference video path / URL
              <input
                value={plan.videoUrl}
                onChange={(event) =>
                  commit({ ...plan, videoUrl: event.target.value })
                }
                className="mt-1 min-h-10 w-full rounded-xl border border-white/10 bg-slate-950/45 px-3 text-sm text-white outline-none"
              />
            </label>
          </div>
        ) : (
          <>
            <div className="text-sm font-bold text-white">{day.label}</div>
            <div className="mt-1 text-sm text-blue-100">{day.focus}</div>
          </>
        )}
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-white/[0.06] bg-slate-950/30">
        <button
          type="button"
          onClick={() => setVideoOpen((current) => !current)}
          className="flex min-h-12 w-full items-center justify-between gap-3 px-4 text-left"
        >
          <span className="flex items-center gap-2 text-sm font-semibold text-white">
            <Video size={17} className="text-blue-200" />
            上传的壶铃一周训练参考
          </span>
          <ChevronDown
            size={17}
            className={`text-slate-500 transition ${
              videoOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {videoOpen ? (
          <div className="border-t border-white/[0.05] p-3">
            <video
              key={plan.videoUrl}
              src={plan.videoUrl}
              controls
              playsInline
              preload="metadata"
              className="mx-auto max-h-[560px] w-full rounded-xl bg-black object-contain"
            />
            <div className="mt-2 text-[11px] leading-relaxed text-slate-500">
              原图写的是「每动作15次 / 6–8组」。这里不照搬高训练量；
              Dad Fitness 改为15分钟可持续版本，先保证动作质量。
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-4 grid gap-2">
        {day.moves.map((item, index) => (
          <div
            key={`${selectedDay}-${index}`}
            className="rounded-2xl bg-slate-950/24 p-3"
          >
            <div className="grid grid-cols-[2.2rem_minmax(0,1fr)] gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-blue-300/12 text-sm font-bold text-blue-100">
                {index + 1}
              </div>

              <div className="min-w-0">
                {editing ? (
                  <div className="grid gap-2">
                    <select
                      value={item.kind}
                      onChange={(event) =>
                        changeKind(index, event.target.value as DadMoveKind)
                      }
                      className="min-h-10 rounded-xl border border-white/10 bg-slate-900 px-3 text-sm text-white"
                    >
                      {moveOptions.map((option) => (
                        <option key={option.kind} value={option.kind}>
                          {option.title}
                        </option>
                      ))}
                    </select>

                    <input
                      value={item.title}
                      onChange={(event) =>
                        updateMove(index, { title: event.target.value })
                      }
                      className="min-h-10 rounded-xl border border-white/10 bg-slate-950/45 px-3 text-sm text-white"
                      placeholder="Title"
                    />

                    <div className="grid gap-2 sm:grid-cols-2">
                      <input
                        value={item.reps}
                        onChange={(event) =>
                          updateMove(index, { reps: event.target.value })
                        }
                        className="min-h-10 rounded-xl border border-white/10 bg-slate-950/45 px-3 text-sm text-white"
                        placeholder="Reps / time"
                      />
                      <input
                        value={item.cue}
                        onChange={(event) =>
                          updateMove(index, { cue: event.target.value })
                        }
                        className="min-h-10 rounded-xl border border-white/10 bg-slate-950/45 px-3 text-sm text-white"
                        placeholder="Technique cue"
                      />
                    </div>

                    <textarea
                      value={item.detail}
                      onChange={(event) =>
                        updateMove(index, { detail: event.target.value })
                      }
                      rows={2}
                      className="rounded-xl border border-white/10 bg-slate-950/45 px-3 py-2 text-sm text-white"
                      placeholder="Detail"
                    />
                  </div>
                ) : (
                  <>
                    <div className="font-semibold text-white">{item.title}</div>
                    <div className="mt-1 text-xs text-blue-100">
                      {item.reps}
                    </div>
                    <div className="mt-1 text-xs leading-relaxed text-slate-400">
                      {item.cue}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 rounded-xl bg-amber-300/[0.06] px-3 py-2 text-[11px] leading-relaxed text-amber-100/80">
        重量以能够保持动作质量为准。出现疼痛、胸痛、明显头晕或异常呼吸困难时停止。
      </div>
    </section>
  );
}
