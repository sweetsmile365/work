"use client";

import type { ChildTask } from "@/types/activities";
import type { FamilyEvent } from "@/types/events";
import { defaultChecklists } from "@/lib/db";
import { Checklist } from "./Checklist";
import { zhText } from "@/lib/displayText";

export function ChildScheduleCard({ events, tasks, onToggleTask }: { events: FamilyEvent[]; tasks: ChildTask[]; onToggleTask: (id: string) => void }) {
  const childEvents = events.filter((event) => event.calendar_type === "child_activity" || event.calendar_type === "school").filter((event) => !event.deleted_at);
  return (
    <div className="grid gap-4 lg:grid-cols-[1.3fr_.7fr]">
      <section className="rounded-md bg-white p-4 shadow-soft">
        <h2 className="mb-3 font-semibold">子どもの予定</h2>
        <div className="space-y-3">
          {childEvents.map((event) => (
            <article key={event.id} className="rounded-md border border-black/10 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-medium">{zhText(event.title)}</div>
                <div className="text-sm text-black/55">{event.date} {event.start_datetime?.slice(11, 16)}</div>
              </div>
              <div className="mt-1 text-sm text-black/60">{zhText(event.location)} {event.transport_owner ? `送迎：${event.transport_owner}` : ""}</div>
              {event.need_transport && !event.transport_owner ? <div className="mt-2 rounded bg-red-50 px-2 py-1 text-sm text-red-700">送迎が必要ですが、担当が未設定です。</div> : null}
            </article>
          ))}
        </div>
      </section>
      <section className="rounded-md bg-white p-4 shadow-soft">
        <h2 className="mb-3 font-semibold">タスクと持ち物</h2>
        <div className="space-y-3">
          {tasks.map((task) => (
            <label key={task.id} className="flex items-center gap-2 rounded-md border border-black/10 p-2 text-sm">
              <input type="checkbox" checked={task.status === "done"} onChange={() => onToggleTask(task.id)} />
              <span className={task.status === "done" ? "text-black/40 line-through" : ""}>{zhText(task.title)}</span>
            </label>
          ))}
          <Checklist title="バドミントン部の基本持ち物" items={defaultChecklists.badminton} />
        </div>
      </section>
    </div>
  );
}
