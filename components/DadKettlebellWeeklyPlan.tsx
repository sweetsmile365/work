"use client";

import { useEffect, useState } from "react";
import { Dumbbell, Pencil, RotateCcw, Save } from "lucide-react";

type DayPlan = {
  label: string;
  focus: string;
  moves: string[];
};

type Plan = Record<string, DayPlan>;
const KEY = "dad-kettlebell-week-v1";

const DEFAULT_PLAN: Plan = {
  "1": { label: "MON · 全身", focus: "Full Body", moves: ["Deadlift", "Goblet Squat", "One-arm Row", "Suitcase Carry", "Halo"] },
  "2": { label: "TUE · 腰腹", focus: "Core Stability", moves: ["Suitcase March", "Halo", "Light Deadlift", "Goblet Hold + Squat", "Carry"] },
  "3": { label: "WED · 臀腿", focus: "Glutes & Legs", moves: ["Deadlift", "Goblet Squat", "Slow Deadlift", "Tempo Squat", "Suitcase March"] },
  "4": { label: "THU · 技术/恢复", focus: "Technique Day", moves: ["Hip Hinge Practice", "Easy Goblet Squat", "Easy Row", "Very Light Halo", "Easy Carry"] },
  "5": { label: "FRI · 肩背", focus: "Back & Shoulder", moves: ["One-arm Row", "Halo", "Suitcase Carry", "Slow Row", "Goblet Squat"] },
  "6": { label: "SAT · 手臂+轻全身", focus: "Arms + Light Conditioning", moves: ["Row", "Halo", "Carry · Grip", "Easy Deadlift", "Easy Goblet Squat"] },
  "0": { label: "SUN · Recovery", focus: "Recovery", moves: ["Easy Walk / March", "Very Light Halo", "Hinge Technique", "Light Squat", "Easy Walk + Breathing"] }
};

function clonePlan(): Plan {
  return JSON.parse(JSON.stringify(DEFAULT_PLAN)) as Plan;
}

export function DadKettlebellWeeklyPlan() {
  const [plan, setPlan] = useState<Plan>(() => clonePlan());
  const [selectedDay, setSelectedDay] = useState(String(new Date().getDay()));
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setPlan(JSON.parse(raw) as Plan);
    } catch {}
  }, []);

  const today = String(new Date().getDay());
  const day = plan[selectedDay] ?? DEFAULT_PLAN["1"];

  function save(next: Plan) {
    setPlan(next);
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
  }

  function updateMove(index: number, value: string) {
    const moves = [...day.moves];
    moves[index] = value;
    save({ ...plan, [selectedDay]: { ...day, moves } });
  }

  function reset() {
    const next = clonePlan();
    save(next);
    setSelectedDay(today);
  }

  return (
    <section className="mt-4 rounded-3xl border border-blue-300/10 bg-blue-300/[0.045] p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold tracking-[0.14em] text-blue-200">
            <Dumbbell size={17} />
            DAD · WEEKLY KETTLEBELL
          </div>
          <h2 className="mt-1 text-xl font-bold text-white">每天 15 min · 分主题训练</h2>
          <div className="mt-1 text-xs text-slate-400">
            2 min warm-up + 5个动作 × 2 min + 3 min cool-down
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-xl bg-white/[0.07] px-3 text-xs font-semibold text-slate-200"
          >
            {editing ? <Save size={14} /> : <Pencil size={14} />}
            {editing ? "DONE" : "编辑"}
          </button>
          <button
            type="button"
            onClick={reset}
            className="grid h-9 w-9 place-items-center rounded-xl bg-white/[0.05] text-slate-400"
          >
            <RotateCcw size={15} />
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-7">
        {["1","2","3","4","5","6","0"].map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setSelectedDay(key)}
            className={`min-h-12 rounded-xl px-2 text-xs font-bold ${
              selectedDay === key
                ? "bg-blue-300 text-slate-950"
                : "bg-slate-950/30 text-slate-300"
            }`}
          >
            {plan[key].label.split(" · ")[0]}
            {key === today ? <div className="mt-0.5 text-[9px] opacity-70">TODAY</div> : null}
          </button>
        ))}
      </div>

      <div className="mt-4 rounded-2xl bg-slate-950/25 p-4">
        {editing ? (
          <div className="grid gap-2 sm:grid-cols-2">
            <input
              value={day.label}
              onChange={(e) =>
                save({ ...plan, [selectedDay]: { ...day, label: e.target.value } })
              }
              className="min-h-10 rounded-xl border border-white/10 bg-slate-950/50 px-3 text-sm text-white"
            />
            <input
              value={day.focus}
              onChange={(e) =>
                save({ ...plan, [selectedDay]: { ...day, focus: e.target.value } })
              }
              className="min-h-10 rounded-xl border border-white/10 bg-slate-950/50 px-3 text-sm text-white"
            />
          </div>
        ) : (
          <>
            <div className="font-bold text-white">{day.label}</div>
            <div className="mt-1 text-sm text-blue-100">{day.focus}</div>
          </>
        )}
      </div>

      <div className="mt-4 grid gap-2 md:grid-cols-5">
        {day.moves.map((move, index) => (
          <div key={`${selectedDay}-${index}`} className="rounded-2xl bg-slate-950/25 p-3">
            <div className="text-[10px] font-bold text-blue-200">{index + 1} · 2 MIN</div>
            {editing ? (
              <input
                value={move}
                onChange={(e) => updateMove(index, e.target.value)}
                className="mt-2 min-h-10 w-full rounded-xl border border-white/10 bg-slate-950/50 px-2 text-xs text-white"
              />
            ) : (
              <div className="mt-2 text-sm font-semibold text-white">{move}</div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
