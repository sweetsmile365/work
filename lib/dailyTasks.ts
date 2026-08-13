import type { AppState } from "./db";
import type { ChildTask } from "@/types/activities";

export function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

type DailyTaskDefinition = {
  idPrefix: string;
  title: string;
  task_type: ChildTask["task_type"];
  note: string;
};

const dailyDefinitions: DailyTaskDefinition[] = [
  {
    idPrefix: "daily-english",
    title: "English · 15–20 min",
    task_type: "practice",
    note: "毎日の英語学習"
  },
  {
    idPrefix: "daily-dad-fitness",
    title: "Dad · Fitness 15 min",
    task_type: "other",
    note: "毎日15分"
  },
  {
    idPrefix: "daily-mom-fitness",
    title: "Mom · Fitness 15 min",
    task_type: "other",
    note: "毎日15分"
  }
];

export function ensureDailyTasks(state: AppState, date = new Date()): AppState {
  const day = localDateKey(date);
  const existingIds = new Set(state.tasks.map((task) => task.id));

  const missing: ChildTask[] = dailyDefinitions
    .map((definition) => ({
      id: `${definition.idPrefix}-${day}`,
      title: definition.title,
      task_type: definition.task_type,
      due_date: day,
      status: "todo" as const,
      completed_by_child: false,
      note: definition.note
    }))
    .filter((task) => !existingIds.has(task.id));

  if (missing.length === 0) return state;

  return {
    ...state,
    tasks: [...missing, ...state.tasks]
  };
}

export function isDailyEnglishTask(task: ChildTask) {
  return task.id.startsWith("daily-english-");
}

export function isDailyFitnessTask(task: ChildTask) {
  return (
    task.id.startsWith("daily-dad-fitness-") ||
    task.id.startsWith("daily-mom-fitness-")
  );
}

export function dailyRoutineLabel(task: ChildTask) {
  if (task.id.startsWith("daily-dad-fitness-")) return "Dad";
  if (task.id.startsWith("daily-mom-fitness-")) return "Mom";
  return "";
}
