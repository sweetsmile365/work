"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { RoleGuard } from "@/components/RoleGuard";
import { loadState, type AppState } from "@/lib/db";

export default function SettingsAccountPage() {
  const [state, setState] = useState<AppState | null>(null);
  useEffect(() => setState(loadState()), []);
  if (!state) return null;
  return <RoleGuard><AppShell title="アカウント管理"><div className="rounded-md bg-white shadow-soft">{state.users.map((user) => <div key={user.id} className="grid gap-2 border-b border-black/10 p-4 sm:grid-cols-5"><b>{user.display_name}</b><span>{user.email}</span><span>{user.role}</span><span>{user.color}</span><button className="rounded-md border border-black/10 px-2 py-1 text-sm">パスワード再設定</button></div>)}</div></AppShell></RoleGuard>;
}
