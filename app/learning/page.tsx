"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Circle, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { MobileLayout } from "@/components/responsive/MobileLayout";
import {
  loadState,
  onStateSynced,
  refreshCloudStateNow,
  saveState,
  type AppState
} from "@/lib/db";
import type { ChildTask } from "@/types/activities";

type SubjectId =
  | "English"
  | "Math"
  | "Science"
  | "Japanese"
  | "Social"
  | "Other";

type Draft = {
  id?: string;
  subject: SubjectId;
  title: string;
  taskType: ChildTask["task_type"];
  dueDate: string;
  note: string;
  status: ChildTask["status"];
};

const subjects: Array<{ value: SubjectId; label: string }> = [
  { value: "English", label: "英語" },
  { value: "Math", label: "数学" },
  { value: "Science", label: "理科" },
  { value: "Japanese", label: "国語" },
  { value: "Social", label: "社会" },
  { value: "Other", label: "その他" }
];

const learningTypes = new Set<ChildTask["task_type"]>([
  "homework",
  "practice",
  "exam_preparation"
]);

const taskTypes: Array<{ value: ChildTask["task_type"]; label: string }> = [
  { value: "homework", label: "宿題" },
  { value: "practice", label: "練習" },
  { value: "exam_preparation", label: "テスト準備" }
];

function emptyDraft(subject: SubjectId = "English"): Draft {
  return {
    subject,
    title: "",
    taskType: "practice",
    dueDate: "",
    note: "",
    status: "todo"
  };
}

function splitTitle(title: string): { subject: SubjectId; title: string } {
  const [first, ...rest] = title.split(" · ");
  if (subjects.some((item) => item.value === first) && rest.length > 0) {
    return { subject: first as SubjectId, title: rest.join(" · ") };
  }
  return { subject: "Other", title };
}

function joinTitle(subject: SubjectId, title: string) {
  const clean = title.trim();
  return subject === "Other" ? clean : `${subject} · ${clean}`;
}

function dueLabel(date?: string) {
  if (!date) return "";
  return new Intl.DateTimeFormat("ja-JP", {
    month: "numeric",
    day: "numeric",
    weekday: "short"
  }).format(new Date(`${date}T00:00:00+09:00`));
}

export default function LearningPage() {
  const [state, setState] = useState<AppState | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);

  useEffect(() => {
    setState(loadState());
    void refreshCloudStateNow();
    const unsubscribe = onStateSynced(setState);
    return unsubscribe;
  }, []);

  const tasks = useMemo(() => {
    return (state?.tasks ?? [])
      .filter((task) => learningTypes.has(task.task_type))
      .sort((a, b) => {
        if (a.status !== b.status) return a.status === "todo" ? -1 : 1;
        return (a.due_date ?? "9999-12-31").localeCompare(
          b.due_date ?? "9999-12-31"
        );
      });
  }, [state]);

  const todoCount = tasks.filter((task) => task.status === "todo").length;
  const doneCount = tasks.filter((task) => task.status === "done").length;

  function persist(next: AppState) {
    saveState(next);
    setState(next);
  }

  function createTask(subject: SubjectId = "English") {
    setDraft(emptyDraft(subject));
  }

  function editTask(task: ChildTask) {
    const parsed = splitTitle(task.title);
    setDraft({
      id: task.id,
      subject: parsed.subject,
      title: parsed.title,
      taskType: task.task_type,
      dueDate: task.due_date ?? "",
      note: task.note ?? "",
      status: task.status
    });
  }

  function saveDraft() {
    if (!state || !draft || !draft.title.trim()) return;

    const old = draft.id
      ? state.tasks.find((task) => task.id === draft.id)
      : undefined;

    const nextTask: ChildTask = {
      id: old?.id ?? crypto.randomUUID(),
      title: joinTitle(draft.subject, draft.title),
      task_type: draft.taskType,
      due_date: draft.dueDate || undefined,
      note: draft.note.trim() || undefined,
      status: draft.status,
      completed_by_child: draft.status === "done"
    };

    const next: AppState = {
      ...state,
      tasks: old
        ? state.tasks.map((task) => (task.id === old.id ? nextTask : task))
        : [nextTask, ...state.tasks]
    };

    persist(next);
    setDraft(null);
  }

  function toggle(task: ChildTask) {
    if (!state) return;
    const status: ChildTask["status"] =
      task.status === "done" ? "todo" : "done";

    persist({
      ...state,
      tasks: state.tasks.map((item) =>
        item.id === task.id
          ? { ...item, status, completed_by_child: status === "done" }
          : item
      )
    });
  }

  function removeTask() {
    if (!state || !draft?.id) return;
    if (!window.confirm("この学習タスクを削除しますか？")) return;

    persist({
      ...state,
      tasks: state.tasks.filter((task) => task.id !== draft.id)
    });
    setDraft(null);
  }

  return (
    <MobileLayout title="Learning / 学習" user={state?.currentUser}>
      <section className="rounded-2xl bg-gradient-to-br from-emerald-50 to-cyan-50 p-4 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm font-semibold text-emerald-700">
              今週の学習
            </div>
            <h2 className="mt-1 text-xl font-bold text-slate-950">
              やることを簡単に整理
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              未完了 {todoCount} · 完了 {doneCount}
            </p>
          </div>

          <button
            type="button"
            onClick={() => createTask()}
            className="grid size-11 shrink-0 place-items-center rounded-full bg-emerald-600 text-white"
            aria-label="学習タスクを追加"
          >
            <Plus size={22} />
          </button>
        </div>
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="text-sm font-bold text-slate-900">快速追加</div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {subjects.map((subject) => (
            <button
              key={subject.value}
              type="button"
              onClick={() => createTask(subject.value)}
              className="min-h-11 rounded-xl border border-slate-200 bg-slate-50 px-2 text-sm font-semibold text-slate-700"
            >
              ＋ {subject.label}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-950">学習タスク</h2>
          <span className="text-sm text-slate-500">{tasks.length}件</span>
        </div>

        {tasks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-7 text-center">
            <div className="font-semibold text-slate-800">
              学習予定はまだ登録されていません
            </div>
            <div className="mt-1 text-sm text-slate-500">
              上の科目ボタンから追加できます。
            </div>
          </div>
        ) : (
          tasks.map((task) => {
            const parsed = splitTitle(task.title);
            const subject =
              subjects.find((item) => item.value === parsed.subject)?.label ??
              "その他";

            return (
              <div
                key={task.id}
                className="rounded-2xl bg-white p-4 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => toggle(task)}
                    className={`mt-0.5 grid size-9 shrink-0 place-items-center rounded-full ${
                      task.status === "done"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-100 text-slate-500"
                    }`}
                    aria-label={
                      task.status === "done" ? "未完了に戻す" : "完了にする"
                    }
                  >
                    {task.status === "done" ? (
                      <Check size={19} />
                    ) : (
                      <Circle size={18} />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => editTask(task)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                        {subject}
                      </span>
                      {task.due_date ? (
                        <span className="text-xs text-slate-500">
                          {dueLabel(task.due_date)}
                        </span>
                      ) : null}
                    </div>

                    <div
                      className={`mt-2 text-base font-semibold ${
                        task.status === "done"
                          ? "text-slate-400 line-through"
                          : "text-slate-950"
                      }`}
                    >
                      {parsed.title}
                    </div>

                    {task.note ? (
                      <div className="mt-1 text-sm text-slate-500">
                        {task.note}
                      </div>
                    ) : null}
                  </button>

                  <button
                    type="button"
                    onClick={() => editTask(task)}
                    className="grid size-9 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-600"
                    aria-label="編集"
                  >
                    <Pencil size={17} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </section>

      {draft ? (
        <div className="fixed inset-0 z-50 bg-slate-950/35">
          <div className="absolute inset-x-0 bottom-0 max-h-[92vh] overflow-y-auto rounded-t-3xl bg-white p-4 pb-[calc(24px+env(safe-area-inset-bottom))] shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">
                {draft.id ? "学習タスクを編集" : "学習タスクを追加"}
              </h2>
              <button
                type="button"
                onClick={() => setDraft(null)}
                className="grid size-11 place-items-center rounded-full bg-slate-100"
                aria-label="閉じる"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid gap-4">
              <label className="grid gap-1 text-sm font-semibold text-slate-700">
                科目
                <select
                  value={draft.subject}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      subject: e.target.value as SubjectId
                    })
                  }
                  className="h-12 rounded-xl border border-slate-200 bg-white px-3 text-base"
                >
                  {subjects.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-1 text-sm font-semibold text-slate-700">
                何をする？
                <input
                  autoFocus
                  value={draft.title}
                  onChange={(e) =>
                    setDraft({ ...draft, title: e.target.value })
                  }
                  placeholder="例：Writing 15 min"
                  className="h-12 rounded-xl border border-slate-200 px-3 text-base"
                />
              </label>

              <label className="grid gap-1 text-sm font-semibold text-slate-700">
                種類
                <select
                  value={draft.taskType}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      taskType: e.target.value as ChildTask["task_type"]
                    })
                  }
                  className="h-12 rounded-xl border border-slate-200 bg-white px-3 text-base"
                >
                  {taskTypes.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-1 text-sm font-semibold text-slate-700">
                期限（なくてもOK）
                <input
                  type="date"
                  value={draft.dueDate}
                  onChange={(e) =>
                    setDraft({ ...draft, dueDate: e.target.value })
                  }
                  className="h-12 rounded-xl border border-slate-200 px-3 text-base"
                />
              </label>

              <label className="grid gap-1 text-sm font-semibold text-slate-700">
                メモ（任意）
                <textarea
                  value={draft.note}
                  onChange={(e) =>
                    setDraft({ ...draft, note: e.target.value })
                  }
                  rows={3}
                  placeholder="例：5 sentences / Elements 29–32"
                  className="rounded-xl border border-slate-200 px-3 py-3 text-base"
                />
              </label>

              <div>
                <div className="mb-2 text-sm font-semibold text-slate-700">
                  状態
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDraft({ ...draft, status: "todo" })}
                    className={`min-h-11 rounded-xl border px-3 font-semibold ${
                      draft.status === "todo"
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200 bg-white text-slate-600"
                    }`}
                  >
                    ○ 未完了
                  </button>
                  <button
                    type="button"
                    onClick={() => setDraft({ ...draft, status: "done" })}
                    className={`min-h-11 rounded-xl border px-3 font-semibold ${
                      draft.status === "done"
                        ? "border-emerald-600 bg-emerald-600 text-white"
                        : "border-slate-200 bg-white text-slate-600"
                    }`}
                  >
                    ✓ 完了
                  </button>
                </div>
              </div>
            </div>

            <div
              className={`mt-5 grid gap-3 ${
                draft.id ? "grid-cols-[0.8fr_1.2fr]" : "grid-cols-1"
              }`}
            >
              {draft.id ? (
                <button
                  type="button"
                  onClick={removeTask}
                  className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 font-semibold text-red-700"
                >
                  <Trash2 size={18} />
                  削除
                </button>
              ) : null}

              <button
                type="button"
                onClick={saveDraft}
                disabled={!draft.title.trim()}
                className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 font-semibold text-white disabled:opacity-40"
              >
                <Save size={18} />
                保存
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </MobileLayout>
  );
}
