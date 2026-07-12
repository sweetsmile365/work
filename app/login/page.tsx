"use client";

import { useRouter } from "next/navigation";
import { CalendarDays } from "lucide-react";
import { loginAs } from "@/lib/db";
import type { UserRole } from "@/types/permissions";

const roles: { role: UserRole; label: string; note: string }[] = [
  { role: "admin", label: "ママ", note: "管理者：予定、バックアップ、設定を管理できます" },
  { role: "parent", label: "パパ", note: "保護者：予定、送迎、ルートを確認できます" },
  { role: "child_editor", label: "子ども", note: "自分の予定、タスク、チェックリストを確認できます" }
];

export default function LoginPage() {
  const router = useRouter();

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

        <div className="grid gap-3">
          {roles.map((item) => (
            <button
              key={item.role}
              className="focus-ring min-h-14 rounded-lg border border-slate-200 p-4 text-left text-base hover:bg-slate-50"
              onClick={() => {
                loginAs(item.role);
                router.push("/dashboard");
              }}
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
