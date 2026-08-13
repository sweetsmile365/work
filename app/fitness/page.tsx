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


type AnimationKind =
  | "warmup"
  | "deadlift"
  | "goblet"
  | "row"
  | "carry"
  | "halo"
  | "cooldown"
  | "breathing"
  | "shoulders"
  | "ankles"
  | "walk1"
  | "walk2"
  | "relax"
  | "catcow"
  | "child"
  | "lunge"
  | "downward"
  | "figure4"
  | "twist";

function ExerciseAnimation({
  kind,
  person
}: {
  kind: AnimationKind;
  person: Person;
}) {
  const isDad = person === "dad";

  const label =
    kind === "deadlift"
      ? "HIP HINGE"
      : kind === "goblet"
        ? "SQUAT"
        : kind === "row"
          ? "ROW"
          : kind === "carry"
            ? "CARRY"
            : kind === "halo"
              ? "HALO"
              : kind === "catcow"
                ? "CAT ↔ COW"
                : kind === "child"
                  ? "CHILD'S POSE"
                  : kind === "lunge"
                    ? "LOW LUNGE"
                    : kind === "downward"
                      ? "DOWNWARD DOG"
                      : kind === "figure4"
                        ? "FIGURE-4"
                        : kind === "twist"
                          ? "TWIST"
                          : kind === "breathing"
                            ? "BREATHE"
                            : kind.startsWith("walk")
                              ? "GENTLE WALK"
                              : kind === "shoulders"
                                ? "SHOULDERS"
                                : kind === "ankles"
                                  ? "ANKLES"
                                  : kind === "relax"
                                    ? "RELAX"
                                    : kind === "warmup"
                                      ? "WARM-UP"
                                      : "COOL-DOWN";

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/5 bg-slate-950/30">
      <style jsx>{`
        @keyframes breathe {
          0%, 100% { transform: scale(0.88); opacity: 0.45; }
          50% { transform: scale(1.15); opacity: 0.9; }
        }
        @keyframes deadliftBody {
          0%, 100% { transform: rotate(0deg) translate(0, 0); }
          50% { transform: rotate(26deg) translate(10px, 7px); }
        }
        @keyframes deadliftBell {
          0%, 100% { transform: translateY(-34px); }
          50% { transform: translateY(0); }
        }
        @keyframes squatBody {
          0%, 100% { transform: translateY(-26px); }
          50% { transform: translateY(8px); }
        }
        @keyframes squatKnees {
          0%, 100% { transform: scaleX(0.85); }
          50% { transform: scaleX(1.18); }
        }
        @keyframes rowArm {
          0%, 100% { transform: rotate(27deg); }
          50% { transform: rotate(-22deg); }
        }
        @keyframes carryWalk {
          0%, 100% { transform: translateX(-16px); }
          50% { transform: translateX(16px); }
        }
        @keyframes carryLegA {
          0%, 100% { transform: rotate(18deg); }
          50% { transform: rotate(-18deg); }
        }
        @keyframes carryLegB {
          0%, 100% { transform: rotate(-18deg); }
          50% { transform: rotate(18deg); }
        }
        @keyframes halo {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes shoulder {
          0%, 100% { transform: rotate(-10deg); }
          50% { transform: rotate(16deg); }
        }
        @keyframes ankle {
          0%, 100% { transform: rotate(-16deg); }
          50% { transform: rotate(16deg); }
        }
        @keyframes catcow {
          0%, 100% { transform: translateY(0) scaleY(0.9); }
          50% { transform: translateY(-7px) scaleY(1.12); }
        }
        @keyframes childpose {
          0%, 100% { transform: translateX(2px); }
          50% { transform: translateX(-8px); }
        }
        @keyframes lunge {
          0%, 100% { transform: translateY(-4px); }
          50% { transform: translateY(8px); }
        }
        @keyframes downward {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes figure4 {
          0%, 100% { transform: rotate(-4deg); }
          50% { transform: rotate(7deg); }
        }
        @keyframes twist {
          0%, 100% { transform: rotate(-11deg); }
          50% { transform: rotate(11deg); }
        }
        @keyframes warmup {
          0%, 100% { transform: rotate(-13deg); }
          50% { transform: rotate(13deg); }
        }
      `}</style>

      <div className="absolute left-4 top-3 z-10 rounded-full bg-white/[0.07] px-3 py-1 text-[10px] font-bold tracking-[0.14em] text-slate-300">
        MOTION GUIDE · {label}
      </div>

      <svg
        viewBox="0 0 420 250"
        className="h-[230px] w-full sm:h-[270px]"
        role="img"
        aria-label={`${label} 动作示意`}
      >
        <defs>
          <radialGradient id="floorGlow" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="rgba(52,211,153,0.18)" />
            <stop offset="100%" stopColor="rgba(52,211,153,0)" />
          </radialGradient>
        </defs>

        <ellipse cx="210" cy="220" rx="150" ry="20" fill="url(#floorGlow)" />
        <line x1="55" y1="219" x2="365" y2="219" stroke="rgba(148,163,184,0.22)" strokeWidth="2" />

        {(kind === "breathing" || kind === "relax") && (
          <>
            <circle
              cx="210"
              cy="120"
              r="58"
              fill="rgba(52,211,153,0.13)"
              stroke="rgba(110,231,183,0.55)"
              strokeWidth="2"
              style={{ transformOrigin: "210px 120px", animation: "breathe 5s ease-in-out infinite" }}
            />
            <circle cx="210" cy="88" r="15" fill="rgba(226,232,240,0.9)" />
            <line x1="210" y1="104" x2="210" y2="164" stroke="rgba(226,232,240,0.9)" strokeWidth="8" strokeLinecap="round" />
            <line x1="210" y1="126" x2="178" y2="148" stroke="rgba(226,232,240,0.8)" strokeWidth="7" strokeLinecap="round" />
            <line x1="210" y1="126" x2="242" y2="148" stroke="rgba(226,232,240,0.8)" strokeWidth="7" strokeLinecap="round" />
            <text x="210" y="198" textAnchor="middle" fill="rgba(167,243,208,0.9)" fontSize="13">
              INHALE 4 sec · EXHALE 5 sec
            </text>
          </>
        )}

        {(kind === "walk1" || kind === "walk2" || kind === "carry") && (
          <g style={{ animation: "carryWalk 2.3s ease-in-out infinite" }}>
            <circle cx="210" cy="72" r="14" fill="rgba(226,232,240,0.95)" />
            <line x1="210" y1="88" x2="210" y2="148" stroke="rgba(226,232,240,0.92)" strokeWidth="8" strokeLinecap="round" />
            <line x1="210" y1="105" x2="182" y2="142" stroke="rgba(226,232,240,0.85)" strokeWidth="7" strokeLinecap="round" />
            <line x1="210" y1="105" x2="238" y2="142" stroke="rgba(226,232,240,0.85)" strokeWidth="7" strokeLinecap="round" />
            <g style={{ transformOrigin: "210px 148px", animation: "carryLegA 1.15s ease-in-out infinite" }}>
              <line x1="210" y1="148" x2="187" y2="207" stroke="rgba(226,232,240,0.9)" strokeWidth="8" strokeLinecap="round" />
            </g>
            <g style={{ transformOrigin: "210px 148px", animation: "carryLegB 1.15s ease-in-out infinite" }}>
              <line x1="210" y1="148" x2="233" y2="207" stroke="rgba(226,232,240,0.9)" strokeWidth="8" strokeLinecap="round" />
            </g>
            {kind === "carry" ? (
              <>
                <line x1="238" y1="142" x2="245" y2="171" stroke="rgba(226,232,240,0.85)" strokeWidth="7" strokeLinecap="round" />
                <circle cx="246" cy="184" r="12" fill="rgba(96,165,250,0.9)" />
                <path d="M238 178 Q246 166 254 178" fill="none" stroke="rgba(147,197,253,1)" strokeWidth="5" />
              </>
            ) : null}
          </g>
        )}

        {kind === "deadlift" && (
          <>
            <g style={{ transformOrigin: "210px 150px", animation: "deadliftBody 3s ease-in-out infinite" }}>
              <circle cx="210" cy="68" r="14" fill="rgba(226,232,240,0.95)" />
              <line x1="210" y1="84" x2="210" y2="148" stroke="rgba(226,232,240,0.92)" strokeWidth="8" strokeLinecap="round" />
              <line x1="210" y1="105" x2="185" y2="160" stroke="rgba(226,232,240,0.85)" strokeWidth="7" strokeLinecap="round" />
              <line x1="210" y1="105" x2="235" y2="160" stroke="rgba(226,232,240,0.85)" strokeWidth="7" strokeLinecap="round" />
              <line x1="210" y1="148" x2="190" y2="207" stroke="rgba(226,232,240,0.9)" strokeWidth="8" strokeLinecap="round" />
              <line x1="210" y1="148" x2="232" y2="207" stroke="rgba(226,232,240,0.9)" strokeWidth="8" strokeLinecap="round" />
            </g>
            <g style={{ animation: "deadliftBell 3s ease-in-out infinite" }}>
              <circle cx="210" cy="190" r="15" fill="rgba(96,165,250,0.92)" />
              <path d="M199 181 Q210 165 221 181" fill="none" stroke="rgba(147,197,253,1)" strokeWidth="6" />
            </g>
            <path d="M276 151 C304 163 305 187 280 199" fill="none" stroke="rgba(110,231,183,0.75)" strokeWidth="3" strokeDasharray="6 6" />
            <text x="292" y="141" textAnchor="middle" fill="rgba(167,243,208,0.9)" fontSize="12">HIP BACK</text>
          </>
        )}

        {kind === "goblet" && (
          <g style={{ animation: "squatBody 3s ease-in-out infinite" }}>
            <circle cx="210" cy="66" r="14" fill="rgba(226,232,240,0.95)" />
            <line x1="210" y1="82" x2="210" y2="142" stroke="rgba(226,232,240,0.92)" strokeWidth="8" strokeLinecap="round" />
            <line x1="210" y1="104" x2="191" y2="118" stroke="rgba(226,232,240,0.86)" strokeWidth="7" strokeLinecap="round" />
            <line x1="210" y1="104" x2="229" y2="118" stroke="rgba(226,232,240,0.86)" strokeWidth="7" strokeLinecap="round" />
            <circle cx="210" cy="121" r="13" fill="rgba(96,165,250,0.92)" />
            <path d="M200 113 Q210 99 220 113" fill="none" stroke="rgba(147,197,253,1)" strokeWidth="5" />
            <g style={{ transformOrigin: "210px 142px", animation: "squatKnees 3s ease-in-out infinite" }}>
              <line x1="210" y1="142" x2="178" y2="176" stroke="rgba(226,232,240,0.9)" strokeWidth="8" strokeLinecap="round" />
              <line x1="178" y1="176" x2="168" y2="211" stroke="rgba(226,232,240,0.9)" strokeWidth="8" strokeLinecap="round" />
              <line x1="210" y1="142" x2="242" y2="176" stroke="rgba(226,232,240,0.9)" strokeWidth="8" strokeLinecap="round" />
              <line x1="242" y1="176" x2="252" y2="211" stroke="rgba(226,232,240,0.9)" strokeWidth="8" strokeLinecap="round" />
            </g>
          </g>
        )}

        {kind === "row" && (
          <>
            <circle cx="180" cy="80" r="14" fill="rgba(226,232,240,0.95)" />
            <line x1="190" y1="94" x2="232" y2="137" stroke="rgba(226,232,240,0.92)" strokeWidth="8" strokeLinecap="round" />
            <line x1="232" y1="137" x2="214" y2="207" stroke="rgba(226,232,240,0.9)" strokeWidth="8" strokeLinecap="round" />
            <line x1="232" y1="137" x2="260" y2="207" stroke="rgba(226,232,240,0.9)" strokeWidth="8" strokeLinecap="round" />
            <g style={{ transformOrigin: "217px 118px", animation: "rowArm 2s ease-in-out infinite" }}>
              <line x1="217" y1="118" x2="248" y2="157" stroke="rgba(226,232,240,0.86)" strokeWidth="7" strokeLinecap="round" />
              <circle cx="253" cy="168" r="12" fill="rgba(96,165,250,0.92)" />
            </g>
            <path d="M276 172 L276 122" stroke="rgba(110,231,183,0.8)" strokeWidth="3" strokeDasharray="5 5" />
            <path d="M270 129 L276 119 L282 129" fill="none" stroke="rgba(110,231,183,0.8)" strokeWidth="3" />
          </>
        )}

        {kind === "halo" && (
          <>
            <circle cx="210" cy="95" r="15" fill="rgba(226,232,240,0.95)" />
            <line x1="210" y1="111" x2="210" y2="177" stroke="rgba(226,232,240,0.92)" strokeWidth="8" strokeLinecap="round" />
            <line x1="210" y1="177" x2="190" y2="215" stroke="rgba(226,232,240,0.9)" strokeWidth="8" strokeLinecap="round" />
            <line x1="210" y1="177" x2="230" y2="215" stroke="rgba(226,232,240,0.9)" strokeWidth="8" strokeLinecap="round" />
            <circle cx="210" cy="95" r="48" fill="none" stroke="rgba(110,231,183,0.35)" strokeWidth="2" strokeDasharray="5 5" />
            <g style={{ transformOrigin: "210px 95px", animation: "halo 5s linear infinite" }}>
              <line x1="210" y1="133" x2="210" y2="56" stroke="rgba(226,232,240,0.82)" strokeWidth="6" strokeLinecap="round" />
              <circle cx="210" cy="46" r="12" fill="rgba(96,165,250,0.92)" />
            </g>
          </>
        )}

        {(kind === "warmup" || kind === "cooldown" || kind === "shoulders") && (
          <>
            <circle cx="210" cy="78" r="14" fill="rgba(226,232,240,0.95)" />
            <line x1="210" y1="94" x2="210" y2="161" stroke="rgba(226,232,240,0.92)" strokeWidth="8" strokeLinecap="round" />
            <line x1="210" y1="161" x2="188" y2="211" stroke="rgba(226,232,240,0.9)" strokeWidth="8" strokeLinecap="round" />
            <line x1="210" y1="161" x2="232" y2="211" stroke="rgba(226,232,240,0.9)" strokeWidth="8" strokeLinecap="round" />
            <g style={{ transformOrigin: "210px 111px", animation: "warmup 2.4s ease-in-out infinite" }}>
              <line x1="210" y1="111" x2="165" y2="123" stroke="rgba(226,232,240,0.85)" strokeWidth="7" strokeLinecap="round" />
              <line x1="210" y1="111" x2="255" y2="123" stroke="rgba(226,232,240,0.85)" strokeWidth="7" strokeLinecap="round" />
            </g>
          </>
        )}

        {kind === "ankles" && (
          <>
            <circle cx="210" cy="72" r="14" fill="rgba(226,232,240,0.95)" />
            <line x1="210" y1="88" x2="210" y2="150" stroke="rgba(226,232,240,0.92)" strokeWidth="8" strokeLinecap="round" />
            <line x1="210" y1="150" x2="190" y2="202" stroke="rgba(226,232,240,0.9)" strokeWidth="8" strokeLinecap="round" />
            <line x1="210" y1="150" x2="235" y2="185" stroke="rgba(226,232,240,0.9)" strokeWidth="8" strokeLinecap="round" />
            <g style={{ transformOrigin: "235px 185px", animation: "ankle 1.8s ease-in-out infinite" }}>
              <line x1="235" y1="185" x2="260" y2="196" stroke="rgba(110,231,183,0.95)" strokeWidth="8" strokeLinecap="round" />
            </g>
          </>
        )}

        {kind === "catcow" && (
          <g style={{ animation: "catcow 4s ease-in-out infinite", transformOrigin: "210px 140px" }}>
            <circle cx="145" cy="130" r="12" fill="rgba(226,232,240,0.95)" />
            <path d="M158 140 Q210 112 260 142" fill="none" stroke="rgba(226,232,240,0.92)" strokeWidth="10" strokeLinecap="round" />
            <line x1="175" y1="143" x2="165" y2="194" stroke="rgba(226,232,240,0.88)" strokeWidth="8" strokeLinecap="round" />
            <line x1="245" y1="143" x2="254" y2="194" stroke="rgba(226,232,240,0.88)" strokeWidth="8" strokeLinecap="round" />
            <line x1="164" y1="194" x2="138" y2="204" stroke="rgba(226,232,240,0.88)" strokeWidth="8" strokeLinecap="round" />
            <line x1="254" y1="194" x2="280" y2="204" stroke="rgba(226,232,240,0.88)" strokeWidth="8" strokeLinecap="round" />
          </g>
        )}

        {kind === "child" && (
          <g style={{ animation: "childpose 4s ease-in-out infinite" }}>
            <circle cx="150" cy="175" r="12" fill="rgba(226,232,240,0.95)" />
            <path d="M163 174 Q215 145 270 172" fill="none" stroke="rgba(226,232,240,0.92)" strokeWidth="10" strokeLinecap="round" />
            <line x1="270" y1="172" x2="310" y2="201" stroke="rgba(226,232,240,0.88)" strokeWidth="8" strokeLinecap="round" />
            <line x1="163" y1="180" x2="104" y2="198" stroke="rgba(110,231,183,0.9)" strokeWidth="7" strokeLinecap="round" />
          </g>
        )}

        {kind === "lunge" && (
          <g style={{ animation: "lunge 3.6s ease-in-out infinite" }}>
            <circle cx="206" cy="66" r="14" fill="rgba(226,232,240,0.95)" />
            <line x1="206" y1="82" x2="206" y2="143" stroke="rgba(226,232,240,0.92)" strokeWidth="8" strokeLinecap="round" />
            <line x1="206" y1="104" x2="178" y2="130" stroke="rgba(226,232,240,0.85)" strokeWidth="7" strokeLinecap="round" />
            <line x1="206" y1="104" x2="234" y2="130" stroke="rgba(226,232,240,0.85)" strokeWidth="7" strokeLinecap="round" />
            <line x1="206" y1="143" x2="166" y2="176" stroke="rgba(226,232,240,0.9)" strokeWidth="8" strokeLinecap="round" />
            <line x1="166" y1="176" x2="135" y2="211" stroke="rgba(226,232,240,0.9)" strokeWidth="8" strokeLinecap="round" />
            <line x1="206" y1="143" x2="250" y2="180" stroke="rgba(226,232,240,0.9)" strokeWidth="8" strokeLinecap="round" />
            <line x1="250" y1="180" x2="288" y2="211" stroke="rgba(226,232,240,0.9)" strokeWidth="8" strokeLinecap="round" />
          </g>
        )}

        {kind === "downward" && (
          <g style={{ animation: "downward 3.8s ease-in-out infinite" }}>
            <circle cx="118" cy="181" r="11" fill="rgba(226,232,240,0.95)" />
            <line x1="130" y1="177" x2="210" y2="105" stroke="rgba(226,232,240,0.92)" strokeWidth="9" strokeLinecap="round" />
            <line x1="210" y1="105" x2="290" y2="207" stroke="rgba(226,232,240,0.9)" strokeWidth="9" strokeLinecap="round" />
            <line x1="130" y1="180" x2="86" y2="210" stroke="rgba(226,232,240,0.88)" strokeWidth="8" strokeLinecap="round" />
            <line x1="210" y1="105" x2="238" y2="207" stroke="rgba(226,232,240,0.88)" strokeWidth="8" strokeLinecap="round" />
          </g>
        )}

        {kind === "figure4" && (
          <g style={{ animation: "figure4 4s ease-in-out infinite", transformOrigin: "210px 160px" }}>
            <circle cx="120" cy="158" r="12" fill="rgba(226,232,240,0.95)" />
            <line x1="133" y1="158" x2="225" y2="158" stroke="rgba(226,232,240,0.92)" strokeWidth="9" strokeLinecap="round" />
            <line x1="225" y1="158" x2="282" y2="198" stroke="rgba(226,232,240,0.9)" strokeWidth="8" strokeLinecap="round" />
            <line x1="225" y1="158" x2="258" y2="124" stroke="rgba(110,231,183,0.95)" strokeWidth="8" strokeLinecap="round" />
            <line x1="258" y1="124" x2="293" y2="160" stroke="rgba(110,231,183,0.95)" strokeWidth="8" strokeLinecap="round" />
          </g>
        )}

        {kind === "twist" && (
          <g style={{ animation: "twist 5s ease-in-out infinite", transformOrigin: "210px 160px" }}>
            <circle cx="118" cy="159" r="12" fill="rgba(226,232,240,0.95)" />
            <line x1="131" y1="159" x2="226" y2="159" stroke="rgba(226,232,240,0.92)" strokeWidth="9" strokeLinecap="round" />
            <line x1="180" y1="159" x2="155" y2="130" stroke="rgba(226,232,240,0.82)" strokeWidth="7" strokeLinecap="round" />
            <line x1="180" y1="159" x2="155" y2="188" stroke="rgba(226,232,240,0.82)" strokeWidth="7" strokeLinecap="round" />
            <line x1="226" y1="159" x2="267" y2="132" stroke="rgba(110,231,183,0.95)" strokeWidth="8" strokeLinecap="round" />
            <line x1="267" y1="132" x2="310" y2="159" stroke="rgba(110,231,183,0.95)" strokeWidth="8" strokeLinecap="round" />
          </g>
        )}

        {isDad && kind !== "warmup" && kind !== "cooldown" ? (
          <text x="24" y="234" fill="rgba(148,163,184,0.75)" fontSize="10">
            Kettlebell: use a controllable weight · form first
          </text>
        ) : (
          <text x="24" y="234" fill="rgba(148,163,184,0.75)" fontSize="10">
            Move slowly · no bouncing · breathe naturally
          </text>
        )}
      </svg>
    </div>
  );
}

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

            <div className="mt-5">
              <ExerciseAnimation
                kind={current.id as AnimationKind}
                person={person}
              />
            </div>

            <div className="mt-5 text-center">
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
              <div className="mt-3 rounded-xl bg-white/[0.04] px-3 py-2 text-xs leading-relaxed text-slate-500">
                动画是动作方向示意，不是精确人体姿势判定。重量、幅度和速度仍以安全和舒适为优先。
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
