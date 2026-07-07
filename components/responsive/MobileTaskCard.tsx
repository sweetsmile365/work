"use client";

import type { ChildTask } from "@/types/activities";
import { zhText } from "@/lib/displayText";

export function MobileTaskCard({ task, onToggle, childMode = false }: { task: ChildTask; onToggle: () => void; childMode?: boolean }) {
  const done = task.status === "done";
  return (
    <label className="flex min-h-14 items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <input className="h-6 w-6 shrink-0" type="checkbox" checked={done} onChange={onToggle} />
      <span className={`text-base font-medium ${done ? "text-slate-400 line-through" : "text-slate-900"}`}>{zhText(task.title)}</span>
      {childMode ? <span className="ml-auto rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">自分</span> : null}
    </label>
  );
}
