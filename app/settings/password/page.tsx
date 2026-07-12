"use client";

import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { RoleGuard } from "@/components/RoleGuard";
import { updateLoginPassword } from "@/lib/db";

export default function PasswordSettingsPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [nextPassword, setNextPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [saved, setSaved] = useState(false);

  function savePassword() {
    setSaved(false);
    if (!currentPassword.trim()) {
      setMessage("現在のパスワードを入力してください。初期設定のままなら 1234 です。");
      return;
    }
    if (nextPassword.trim().length < 4) {
      setMessage("新しいパスワードは4文字以上にしてください。");
      return;
    }
    if (nextPassword !== confirmPassword) {
      setMessage("新しいパスワードが一致しません。");
      return;
    }
    const result = updateLoginPassword(currentPassword, nextPassword);
    setMessage(result.message);
    setSaved(result.ok);
    if (result.ok) {
      setCurrentPassword("");
      setNextPassword("");
      setConfirmPassword("");
      window.setTimeout(() => setSaved(false), 1800);
    }
  }

  return (
    <RoleGuard>
      <AppShell title="パスワード設定">
        <section className="max-w-xl rounded-lg bg-white p-5 shadow-soft">
          <div className="mb-4 rounded-lg bg-blue-50 p-4 text-base text-blue-900">
            <div className="font-semibold">初期パスワードは 1234 です。</div>
            <div className="mt-1 text-sm">まだ変更していない端末では、現在のパスワード欄に 1234 を入力してください。</div>
          </div>

          <div className="grid gap-4">
            <PasswordField label="現在のパスワード" value={currentPassword} onChange={setCurrentPassword} autoComplete="current-password" placeholder="例：1234" />
            <PasswordField label="新しいパスワード" value={nextPassword} onChange={setNextPassword} autoComplete="new-password" placeholder="4文字以上" />
            <PasswordField label="新しいパスワード確認" value={confirmPassword} onChange={setConfirmPassword} autoComplete="new-password" placeholder="もう一度入力" />
          </div>

          {message ? <div className={`mt-4 rounded-lg p-3 text-base font-medium ${saved ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800"}`}>{message}</div> : null}

          <button
            className={`mt-5 min-h-12 w-full rounded-lg px-4 text-base font-semibold text-white ${saved ? "bg-slate-400" : "bg-blue-600 hover:bg-blue-700"}`}
            onClick={savePassword}
            disabled={saved}
          >
            {saved ? "保存しました" : "保存"}
          </button>

          <p className="mt-4 text-sm text-slate-500">このパスワードは、この端末のブラウザ内に保存されます。別の iPhone / iPad では、その端末でも同じように変更してください。</p>
        </section>
      </AppShell>
    </RoleGuard>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  autoComplete,
  placeholder
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
  placeholder: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-base font-semibold text-slate-800">{label}</span>
      <input
        className="h-12 w-full rounded-lg border border-slate-300 px-4 text-base outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        type="password"
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
