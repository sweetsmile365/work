"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { RoleGuard } from "@/components/RoleGuard";
import { addRoute, loadState, type AppState } from "@/lib/db";
import { canManageRoutes } from "@/lib/permissions";
import { zhText } from "@/lib/displayText";

export default function RoutesPage() {
  const [state, setState] = useState<AppState | null>(null);
  useEffect(() => setState(loadState()), []);
  if (!state) return null;
  const editable = canManageRoutes(state.currentUser!.role);
  return (
    <RoleGuard>
      <AppShell title="ルート">
        {editable ? <button className="focus-ring mb-4 rounded-md bg-ink px-4 py-2 text-white" onClick={() => setState(addRoute({ name: "新しいルート", from_label: "家", to_label: "学校", transport_mode: "bus", estimated_minutes: 20, buffer_minutes: 10, default_departure_reminder_minutes: 10 }))}>ルートを追加</button> : null}
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {state.routes.map((route) => <article key={route.id} className="rounded-md bg-white p-4 shadow-soft"><h2 className="font-semibold">{zhText(route.name)}</h2><p className="text-sm text-black/55">{zhText(route.from_label)} → {zhText(route.to_label)}</p><p className="text-sm">{route.transport_mode} / {route.estimated_minutes}+{route.buffer_minutes} 分</p></article>)}
        </div>
      </AppShell>
    </RoleGuard>
  );
}
