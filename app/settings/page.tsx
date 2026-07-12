"use client";

import Link from "next/link";
import { KeyRound, UserRound } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { RoleGuard } from "@/components/RoleGuard";

export default function SettingsPage() {
  return (
    <RoleGuard>
      <AppShell title="設定">
        <div className="grid gap-3 sm:grid-cols-2">
          <Link className="focus-ring flex min-h-20 items-center gap-3 rounded-lg bg-white p-4 shadow-soft hover:bg-slate-50" href="/settings/account">
            <UserRound className="text-blue-600" />
            <div>
              <div className="text-lg font-semibold">アカウント管理</div>
              <div className="text-sm text-slate-500">家族メンバーと権限</div>
            </div>
          </Link>
          <Link className="focus-ring flex min-h-20 items-center gap-3 rounded-lg bg-white p-4 shadow-soft hover:bg-slate-50" href="/settings/password">
            <KeyRound className="text-blue-600" />
            <div>
              <div className="text-lg font-semibold">パスワード設定</div>
              <div className="text-sm text-slate-500">ログインパスワードを変更</div>
            </div>
          </Link>
        </div>
      </AppShell>
    </RoleGuard>
  );
}
