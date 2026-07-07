"use client";

import type { FamilyUser } from "@/lib/db";

export function AccountForm({ user }: { user: FamilyUser }) {
  return (
    <section className="max-w-2xl rounded-md bg-white p-4 shadow-soft">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-full text-lg font-semibold text-white" style={{ background: user.color }}>{user.display_name.slice(0, 1)}</div>
        <div>
          <h2 className="font-semibold">{user.display_name}</h2>
          <p className="text-sm text-black/55">{user.email}</p>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Info label="ロール" value={user.role} />
        <Info label="カレンダー色" value={user.color} />
        <Info label="通知" value={user.notification_enabled ? "オン" : "オフ"} />
        <Info label="言語" value={user.preferred_language} />
        <Info label="タイムゾーン" value={user.timezone} />
        <button className="focus-ring rounded-md border border-black/10 px-3 py-2 text-left hover:bg-black/5">パスワード変更</button>
      </div>
    </section>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-md border border-black/10 p-3"><div className="text-xs text-black/50">{label}</div><div className="font-medium">{value}</div></div>;
}
