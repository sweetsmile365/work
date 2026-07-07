"use client";

import { useRouter } from "next/navigation";
import { CalendarDays } from "lucide-react";
import { loginAs } from "@/lib/db";
import type { UserRole } from "@/types/permissions";

const roles: { role: UserRole; label: string; note: string }[] = [
  { role: "admin", label: "ママ", note: "admin：すべての管理、バックアップ、設定" },
  { role: "parent", label: "パパ", note: "parent：予定、取り込み、ルート管理" },
  { role: "child_editor", label: "子ども", note: "child_editor：自分の予定の確認と編集" }
];

export default function LoginPage() {
  const router = useRouter();
  return (
    <main className="grid min-h-screen place-items-center px-4 py-8">
      <section className="w-full max-w-md rounded-md bg-white p-5 shadow-soft">
        <div className="mb-5 flex items-center gap-2">
          <CalendarDays />
          <div>
            <h1 className="text-xl font-semibold">Family Schedule Hub</h1>
            <p className="text-sm text-black/55">家族専用スケジュール管理 PWA</p>
          </div>
        </div>
        <div className="grid gap-2">
          {roles.map((item) => (
            <button
              key={item.role}
              className="focus-ring rounded-md border border-black/10 p-3 text-left hover:bg-black/5"
              onClick={() => {
                loginAs(item.role);
                router.push("/dashboard");
              }}
            >
              <div className="font-medium">{item.label}</div>
              <div className="text-sm text-black/55">{item.note}</div>
            </button>
          ))}
        </div>
        <button className="focus-ring mt-4 w-full rounded-md border border-black/10 px-3 py-2 text-sm hover:bg-black/5">パスワードを忘れた場合</button>
      </section>
    </main>
  );
}
