"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { AccountForm } from "@/components/AccountForm";
import { RoleGuard } from "@/components/RoleGuard";
import { loadState, type AppState } from "@/lib/db";

export default function AccountPage() {
  const [state, setState] = useState<AppState | null>(null);
  useEffect(() => setState(loadState()), []);
  if (!state) return null;
  return <RoleGuard><AppShell title="マイアカウント">{state.currentUser ? <AccountForm user={state.currentUser} /> : null}</AppShell></RoleGuard>;
}
