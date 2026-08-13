import type { ChildTask } from "@/types/activities";

export type HabitKey = "english" | "dadFitness" | "momFitness";

export type HabitDefinition = {
  key: HabitKey;
  label: string;
  shortLabel: string;
  idPrefix: string;
};

export const habits: HabitDefinition[] = [
  {
    key: "english",
    label: "English 15–20 min",
    shortLabel: "English",
    idPrefix: "daily-english-"
  },
  {
    key: "dadFitness",
    label: "Dad Fitness 15 min",
    shortLabel: "Dad",
    idPrefix: "daily-dad-fitness-"
  },
  {
    key: "momFitness",
    label: "Mom Fitness 15 min",
    shortLabel: "Mom",
    idPrefix: "daily-mom-fitness-"
  }
];

export type HabitDayStatus = "done" | "pending" | "missed" | "untracked";

export function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function dateFromKey(key: string) {
  return new Date(`${key}T12:00:00+09:00`);
}

export function addDays(key: string, amount: number) {
  const date = dateFromKey(key);
  date.setDate(date.getDate() + amount);
  return localDateKey(date);
}

export function habitByKey(key: HabitKey) {
  return habits.find((habit) => habit.key === key) ?? habits[0];
}

export function taskHabit(task: ChildTask): HabitDefinition | undefined {
  return habits.find((habit) => task.id.startsWith(habit.idPrefix));
}

export function taskForHabitDate(
  tasks: ChildTask[],
  key: HabitKey,
  dateKey: string
) {
  const habit = habitByKey(key);
  const expectedId = `${habit.idPrefix}${dateKey}`;
  return tasks.find(
    (task) =>
      task.id === expectedId ||
      (task.id.startsWith(habit.idPrefix) && task.due_date === dateKey)
  );
}

export function firstTrackedDate(tasks: ChildTask[], key: HabitKey) {
  const habit = habitByKey(key);
  const dates = tasks
    .filter((task) => task.id.startsWith(habit.idPrefix))
    .map((task) => task.due_date ?? task.id.slice(habit.idPrefix.length))
    .filter((date): date is string => /^\d{4}-\d{2}-\d{2}$/.test(date))
    .sort();

  return dates[0];
}

export function statusForDate(
  tasks: ChildTask[],
  key: HabitKey,
  dateKey: string,
  todayKey = localDateKey()
): HabitDayStatus {
  const first = firstTrackedDate(tasks, key);
  if (!first || dateKey < first) return "untracked";

  const task = taskForHabitDate(tasks, key, dateKey);
  if (task?.status === "done") return "done";
  if (dateKey === todayKey) return "pending";
  return "missed";
}

export function currentStreak(
  tasks: ChildTask[],
  key: HabitKey,
  todayKey = localDateKey()
) {
  const first = firstTrackedDate(tasks, key);
  if (!first) return 0;

  const todayStatus = statusForDate(tasks, key, todayKey, todayKey);
  let cursor = todayStatus === "done" ? todayKey : addDays(todayKey, -1);
  let streak = 0;

  while (cursor >= first) {
    if (statusForDate(tasks, key, cursor, todayKey) !== "done") break;
    streak += 1;
    cursor = addDays(cursor, -1);
  }

  return streak;
}

export function bestStreak(
  tasks: ChildTask[],
  key: HabitKey,
  todayKey = localDateKey()
) {
  const first = firstTrackedDate(tasks, key);
  if (!first) return 0;

  let best = 0;
  let run = 0;
  let cursor = first;

  while (cursor <= todayKey) {
    if (statusForDate(tasks, key, cursor, todayKey) === "done") {
      run += 1;
      best = Math.max(best, run);
    } else if (cursor !== todayKey) {
      run = 0;
    }
    cursor = addDays(cursor, 1);
  }

  return best;
}

export function monthSummary(
  tasks: ChildTask[],
  key: HabitKey,
  now = new Date()
) {
  const today = localDateKey(now);
  const monthStart = `${today.slice(0, 7)}-01`;
  const first = firstTrackedDate(tasks, key);

  if (!first) {
    return { done: 0, tracked: 0, rate: 0 };
  }

  let cursor = first > monthStart ? first : monthStart;
  let done = 0;
  let tracked = 0;

  while (cursor <= today) {
    tracked += 1;
    if (statusForDate(tasks, key, cursor, today) === "done") done += 1;
    cursor = addDays(cursor, 1);
  }

  return {
    done,
    tracked,
    rate: tracked > 0 ? Math.round((done / tracked) * 100) : 0
  };
}

export function recentDays(count = 14, now = new Date()) {
  const today = localDateKey(now);
  return Array.from({ length: count }, (_, index) =>
    addDays(today, index - count + 1)
  );
}

export function familyPerfectDaysThisMonth(
  tasks: ChildTask[],
  now = new Date()
) {
  const today = localDateKey(now);
  const monthStart = `${today.slice(0, 7)}-01`;
  const firstDates = habits
    .map((habit) => firstTrackedDate(tasks, habit.key))
    .filter((value): value is string => Boolean(value));

  if (firstDates.length !== habits.length) return 0;

  const sortedStarts = [...firstDates, monthStart].sort();
  const familyStart = sortedStarts[sortedStarts.length - 1] ?? monthStart;
  let cursor = familyStart;
  let perfect = 0;

  while (cursor <= today) {
    const allDone = habits.every(
      (habit) => statusForDate(tasks, habit.key, cursor, today) === "done"
    );
    if (allDone) perfect += 1;
    cursor = addDays(cursor, 1);
  }

  return perfect;
}

export function todayDoneCount(tasks: ChildTask[], now = new Date()) {
  const today = localDateKey(now);
  return habits.filter(
    (habit) => statusForDate(tasks, habit.key, today, today) === "done"
  ).length;
}
