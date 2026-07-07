"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { EventForm } from "@/components/EventForm";
import { RoleGuard } from "@/components/RoleGuard";
import { addEvent, loadState, type AppState } from "@/lib/db";

export default function AddEventPage() {
  const [state, setState] = useState<AppState | null>(null);
  const router = useRouter();
  useEffect(() => setState(loadState()), []);
  if (!state) return null;
  return (
    <RoleGuard>
      <AppShell title="予定を追加">
        <EventForm routes={state.routes} onSubmit={(draft) => {
          const childDraft = state.currentUser?.role === "child_editor" ? { ...draft, event_type: "personal_event" as const, calendar_type: "personal" as const } : draft;
          setState(addEvent({ ...childDraft, created_by: state.currentUser?.id }));
          router.push("/calendar");
        }} />
      </AppShell>
    </RoleGuard>
  );
}
