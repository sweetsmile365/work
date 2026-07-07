"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { RoleGuard } from "@/components/RoleGuard";
import { addBusTimetable, loadState, type AppState } from "@/lib/db";
import { canManageBusTimetable } from "@/lib/permissions";
import { zhText } from "@/lib/displayText";

export default function BusTimetablePage() {
  const [state, setState] = useState<AppState | null>(null);
  useEffect(() => setState(loadState()), []);
  if (!state) return null;
  const editable = canManageBusTimetable(state.currentUser!.role);
  return (
    <RoleGuard>
      <AppShell title="バス時刻表">
        {editable ? <button className="focus-ring mb-4 rounded-md bg-ink px-4 py-2 text-white" onClick={() => setState(addBusTimetable({ route_id: state.routes[0]?.id ?? "", line_name: "コピー便", direction_name: "茗溪学園方面", from_label: "並木大橋", to_label: "茗溪学園", service_day_type: "weekday", departure_time: "08:40", arrival_time: "09:02", estimated_minutes: 22, bus_type: "public_bus" }))}>前の便をコピー</button> : null}
        <div className="rounded-md bg-white shadow-soft">
          {state.busTimetables.map((item) => <div key={item.id} className="grid gap-2 border-b border-black/10 p-4 sm:grid-cols-[1fr_1fr_120px]"><div className="font-medium">{zhText(item.line_name)}</div><div className="text-sm text-black/60">{zhText(item.from_label)} → {zhText(item.to_label)}</div><div>{item.departure_time} → {item.arrival_time}</div></div>)}
        </div>
      </AppShell>
    </RoleGuard>
  );
}
