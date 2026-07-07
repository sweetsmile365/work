"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { CalendarView } from "@/components/CalendarView";
import { RoleGuard } from "@/components/RoleGuard";
import { loadState, type AppState } from "@/lib/db";

export default function HolidaysPage() {
  const [state, setState] = useState<AppState | null>(null);
  useEffect(() => setState(loadState()), []);
  if (!state) return null;
  return <RoleGuard><AppShell title="休日"><CalendarView events={state.events.filter((event) => event.calendar_type.includes("holiday"))} /></AppShell></RoleGuard>;
}
