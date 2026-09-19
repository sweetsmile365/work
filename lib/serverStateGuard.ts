import type { UserRole } from "@/types/permissions";

type RecordValue = Record<string, unknown>;

function object(value: unknown): RecordValue {
  return value && typeof value === "object" && !Array.isArray(value) ? value as RecordValue : {};
}

function same(left: unknown, right: unknown) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function byId(value: unknown) {
  return new Map((Array.isArray(value) ? value : [])
    .filter((item): item is RecordValue => Boolean(item) && typeof item === "object" && typeof (item as RecordValue).id === "string")
    .map((item) => [String(item.id), item]));
}

function onlyChildNoteChanged(before: RecordValue, after: RecordValue) {
  const left = { ...before };
  const right = { ...after };
  delete left.child_note;
  delete right.child_note;
  return same(left, right);
}

function childCanWrite(previous: RecordValue, next: RecordValue) {
  const previousEvents = byId(previous.events);
  const nextEvents = byId(next.events);

  for (const [id, before] of previousEvents) {
    const after = nextEvents.get(id);
    if (!after) return false;
    if (same(before, after)) continue;
    if (before.event_type === "personal_event" && before.created_by === "child") continue;
    if (!onlyChildNoteChanged(before, after)) return false;
  }

  for (const [id, after] of nextEvents) {
    if (!previousEvents.has(id) && !(after.event_type === "personal_event" && after.created_by === "child")) return false;
  }

  const previousTasks = byId(previous.tasks);
  const nextTasks = byId(next.tasks);
  if (previousTasks.size !== nextTasks.size) return false;
  for (const [id, before] of previousTasks) {
    const after = nextTasks.get(id);
    if (!after) return false;
    const left = { ...before };
    const right = { ...after };
    delete left.status;
    delete left.completed_by_child;
    delete right.status;
    delete right.completed_by_child;
    if (!same(left, right)) return false;
  }

  for (const key of ["users", "routes", "busTimetables", "imports", "importCandidates", "busCandidates", "schoolTimetable"]) {
    if (!same(previous[key], next[key])) return false;
  }
  return true;
}

function parentCanWrite(previous: RecordValue, next: RecordValue) {
  const previousEvents = byId(previous.events);
  const nextEvents = byId(next.events);
  const protectedTypes = new Set(["japan_public_holiday", "china_public_holiday_reference", "china_adjusted_workday_reference"]);
  for (const [id, before] of previousEvents) {
    const after = nextEvents.get(id);
    if (protectedTypes.has(String(before.event_type)) && !same(before, after)) return false;
  }
  for (const [id, after] of nextEvents) {
    if (!previousEvents.has(id) && protectedTypes.has(String(after.event_type))) return false;
  }
  return true;
}

export function canWriteSharedState(role: UserRole, previousState: unknown, requestedState: unknown) {
  if (role === "admin") return true;
  const previous = object(previousState);
  const next = object(requestedState);
  if (role === "parent") return parentCanWrite(previous, next);
  return childCanWrite(previous, next);
}
