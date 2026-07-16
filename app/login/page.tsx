"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, LockKeyhole } from "lucide-react";
import { loginAs, verifyLoginPassword } from "@/lib/db";
import type { UserRole } from "@/types/permissions";

const roles: { role: UserRole; label: string; note: string }[] = [
  { role: "admin", label: "ママ", note: "管理者：予定、バックアップ、設定を管理できます" },
  { role: "parent", label: "パパ", note: "保護者：予定、送迎、ルートを確認できます" },
  { role: "child_editor", label: "子ども", note: "自分の予定、タスク、チェックリストを確認できます" }
];

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submittingRole, setSubmittingRole] = useState<UserRole | null>(null);

  function handleLogin(role: UserRole) {
    setSubmittingRole(role);
    setError("");
    if (!verifyLoginPassword(password)) {
      setSubmittingRole(null);
      setError("パスワードが違います。");
      return;
    }
    loginAs(role);
    router.push("/dashboard");
  }

  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-4 py-8">
      <section className="w-full max-w-md rounded-lg bg-white p-5 shadow-soft">
        <div className="mb-5 flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-full bg-blue-50 text-blue-600">
            <CalendarDays />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-950">Family Schedule Hub</h1>
            <p className="text-base text-slate-500">家族専用の予定管理 PWA</p>
          </div>
        </div>

        <label className="mb-4 block">
          <span className="mb-2 flex items-center gap-2 text-base font-semibold text-slate-800">
            <LockKeyhole size={18} />
            ログインパスワード
          </span>
          <input
            className="h-12 w-full rounded-lg border border-slate-300 px-4 text-base outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            type="password"
            inputMode="text"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="パスワードを入力"
          />
        </label>

        {error ? <div className="mb-3 rounded-lg bg-red-50 p-3 text-base font-medium text-red-700">{error}</div> : null}

        <div className="grid gap-3">
          {roles.map((item) => (
            <button
              key={item.role}
              className="focus-ring min-h-14 rounded-lg border border-slate-200 p-4 text-left text-base hover:bg-slate-50 disabled:opacity-60"
              disabled={submittingRole === item.role}
              onClick={() => handleLogin(item.role)}
            >
              <div className="text-lg font-semibold text-slate-950">{item.label}</div>
              <div className="mt-1 text-base text-slate-500">{item.note}</div>
            </button>
          ))}
        </div>

        <p className="mt-4 text-center text-sm text-slate-400">家族の端末で同じリンクから開けます</p>
      </section>
    </main>
  );
}
