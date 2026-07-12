"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { EventForm } from "@/components/EventForm";
import { RoleGuard } from "@/components/RoleGuard";
import { addEvent, loadState, type AppState } from "@/lib/db";

export default function AddEventPage() {
  const [state, setState] = useState<AppState | null>(null);
  const [saved, setSaved] = useState(false);
  const router = useRouter();

  useEffect(() => setState(loadState()), []);
  if (!state) return null;

  return (
    <RoleGuard>
      <AppShell title="手動入力">
        <div className="mx-auto max-w-3xl space-y-4">
          <section className="rounded-lg bg-white p-4 shadow-soft">
            <h2 className="text-xl font-bold">予定を手動で追加</h2>
            <p className="mt-1 text-base text-slate-600">日付、時間、送迎担当を入力して家族カレンダーに保存します。</p>
          </section>
          {saved ? <div className="rounded-lg bg-emerald-50 p-3 text-base font-medium text-emerald-700">保存しました。カレンダーへ移動します。</div> : null}
          <EventForm routes={state.routes} onSubmit={(draft) => {
            const childDraft = state.currentUser?.role === "child_editor" ? { ...draft, event_type: "personal_event" as const, calendar_type: "personal" as const } : draft;
            setState(addEvent({ ...childDraft, created_by: state.currentUser?.id }));
            setSaved(true);
            window.setTimeout(() => router.push("/calendar"), 600);
          }} />
        </div>
      </AppShell>
    </RoleGuard>
  );
}
