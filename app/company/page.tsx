"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { CalendarView } from "@/components/CalendarView";
import { RoleGuard } from "@/components/RoleGuard";
import { loadState, type AppState } from "@/lib/db";

export default function CompanyPage() {
  const [state, setState] = useState<AppState | null>(null);
  useEffect(() => setState(loadState()), []);
  if (!state) return null;
  return <RoleGuard><AppShell title="会社"><CalendarView events={state.events.filter((event) => event.calendar_type === "company")} /></AppShell></RoleGuard>;
}
