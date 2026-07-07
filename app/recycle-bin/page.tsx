"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { RoleGuard } from "@/components/RoleGuard";
import { loadState, restoreEvent, type AppState } from "@/lib/db";

export default function RecycleBinPage() {
  const [state, setState] = useState<AppState | null>(null);
  useEffect(() => setState(loadState()), []);
  if (!state) return null;
  const deleted = state.events.filter((event) => event.deleted_at);
  return <RoleGuard><AppShell title="ごみ箱"><div className="rounded-md bg-white shadow-soft">{deleted.map((event) => <div key={event.id} className="flex items-center justify-between border-b border-black/10 p-4"><div><b>{event.title}</b><div className="text-sm text-black/55">{event.deleted_at}</div></div><button className="rounded-md border border-black/10 px-3 py-2" onClick={() => setState(restoreEvent(event.id))}>復元</button></div>)}</div></AppShell></RoleGuard>;
}
