"use client";

import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { RoleGuard } from "@/components/RoleGuard";

export default function SettingsPage() {
  return <RoleGuard><AppShell title="設定"><Link className="focus-ring inline-flex rounded-md bg-ink px-4 py-2 text-white" href="/settings/account">アカウント管理</Link></AppShell></RoleGuard>;
}
