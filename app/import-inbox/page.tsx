"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import { Camera, FileText, Upload } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ImportInboxTable } from "@/components/ImportInboxTable";
import { RoleGuard } from "@/components/RoleGuard";
import { MobileImportCandidateCard } from "@/components/responsive/MobileImportCandidateCard";
import { TabletSplitView } from "@/components/responsive/TabletSplitView";
import { confirmCandidate, createImportFromText, ignoreCandidate, loadState, updateCandidate, type AppState } from "@/lib/db";
import { useResponsiveLayout } from "@/lib/useResponsiveLayout";

const sample = `2026年7月22日（水） 保護者会 提出物あり
7月24日（金） バドミントン部 練習 体育館 集合 送迎
R8.7.26 ピアノレッスン 楽譜持参
TXつくば駅 08:10 茗溪学園 08:35 スクールバス`;

type OcrState = "idle" | "reading" | "running" | "success" | "fallback_mock" | "failed";

function readFileAsBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const value = String(reader.result ?? "");
      resolve(value.includes(",") ? value.split(",")[1] : value);
    };
    reader.onerror = () => reject(new Error("ファイルを読み込めませんでした。"));
    reader.readAsDataURL(file);
  });
}

export default function ImportInboxPage() {
  const [state, setState] = useState<AppState | null>(null);
  const [text, setText] = useState(sample);
  const [ocrOpen, setOcrOpen] = useState(false);
  const [ocrState, setOcrState] = useState<OcrState>("idle");
  const [statusMessage, setStatusMessage] = useState("写真をアップロードするか、OCR 原文を貼り付けてください。");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const { isMobile, isTablet } = useResponsiveLayout();

  useEffect(() => setState(loadState()), []);
  if (!state) return null;

  function parseCurrentText(sourceType = "pasted_text") {
    const trimmed = text.trim();
    if (!trimmed) {
      setStatusMessage("OCR 原文が空です。写真を読み込むか、テキストを貼り付けてください。");
      setOcrState("failed");
      return;
    }
    const next = createImportFromText(trimmed, { sourceType, ocrStatus: ocrState === "success" ? "success" : "fallback_mock" });
    setState(next);
    setStatusMessage(`候補を ${next.importCandidates.filter((item) => !item.confirmed && !item.ignored).length} 件作成しました。`);
    setOcrOpen(true);
  }

  async function runOcrFromFile(file?: File) {
    if (!file) return;
    setOcrState("reading");
    setStatusMessage("写真を読み込み中...");
    try {
      const image = await readFileAsBase64(file);
      setOcrState("running");
      setStatusMessage("OCR 実行中...");
      const res = await fetch("/api/ocr/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image, languageHints: ["ja", "en"] })
      });
      const data = await res.json();
      if (!res.ok || data.status === "failed") throw new Error(data.error ?? "OCR に失敗しました。");
      setText(data.text ?? "");
      setOcrState(data.status === "fallback_mock" ? "fallback_mock" : "success");
      const next = createImportFromText(data.text ?? "", { sourceType: "image_upload", ocrStatus: data.status });
      setState(next);
      setStatusMessage(data.status === "fallback_mock" ? "Google Vision 未設定のためサンプル結果で候補を作成しました。" : "OCR が完了しました。候補を確認してください。");
      setOcrOpen(true);
    } catch (error) {
      setOcrState("failed");
      setStatusMessage(error instanceof Error ? error.message : "OCR に失敗しました。");
    }
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    void runOcrFromFile(event.target.files?.[0]);
    event.target.value = "";
  }

  function refresh(next: AppState) {
    setState(next);
  }

  const pendingCount = state.importCandidates.filter((item) => !item.confirmed && !item.ignored).length;

  const uploadPanel = (
    <section className="rounded-2xl bg-white p-4 shadow-sm">
      <h2 className="text-xl font-bold">取り込み</h2>
      <p className="mt-1 text-base text-slate-600">写真・スクリーンショット・OCR 原文から予定候補を作ります。</p>
      <input ref={cameraInputRef} className="hidden" type="file" accept="image/*" capture="environment" onChange={handleFileChange} />
      <input ref={fileInputRef} className="hidden" type="file" accept="image/*,.png,.jpg,.jpeg,.webp" onChange={handleFileChange} />
      <div className="mt-3 grid grid-cols-2 gap-3">
        <button className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 text-base font-semibold text-white" onClick={() => cameraInputRef.current?.click()}><Camera size={20} />撮影</button>
        <button className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-base font-semibold" onClick={() => fileInputRef.current?.click()}><Upload size={20} />写真を選択</button>
      </div>
      <button className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 text-base font-semibold" onClick={() => parseCurrentText("pasted_text")}><FileText size={20} />OCR 原文から候補作成</button>
      <div className={`mt-3 rounded-xl p-3 text-base ${ocrState === "failed" ? "bg-red-50 text-red-700" : ocrState === "success" ? "bg-emerald-50 text-emerald-700" : "bg-slate-50 text-slate-600"}`}>
        OCR 状態：{ocrState === "idle" ? "待機中" : ocrState === "reading" ? "読み込み中" : ocrState === "running" ? "実行中" : ocrState === "success" ? "成功" : ocrState === "fallback_mock" ? "サンプル結果" : "失敗"} / 未確認 {pendingCount} 件
        <div className="mt-1 text-sm">{statusMessage}</div>
      </div>
      <details className="mt-3 rounded-xl border border-slate-200 p-3" open={ocrOpen} onToggle={(event) => setOcrOpen(event.currentTarget.open)}>
        <summary className="cursor-pointer text-base font-semibold">OCR 原文</summary>
        <textarea className="mt-3 min-h-40 w-full rounded-xl border border-slate-200 p-3 text-base" value={text} onChange={(event) => setText(event.target.value)} />
      </details>
    </section>
  );

  const candidateCards = (
    <div className="space-y-3">
      {state.importCandidates.filter((candidate) => !candidate.ignored).map((candidate) => (
        <MobileImportCandidateCard
          key={candidate.id}
          candidate={candidate}
          onConfirm={() => refresh(confirmCandidate(candidate.id))}
          onIgnore={() => refresh(ignoreCandidate(candidate.id))}
          onUpdate={(patch) => refresh(updateCandidate(candidate.id, patch))}
        />
      ))}
      {state.importCandidates.filter((candidate) => !candidate.ignored).length === 0 ? <div className="rounded-xl bg-white p-4 text-base text-slate-500">候補はまだありません。</div> : null}
    </div>
  );

  return (
    <RoleGuard>
      <AppShell title="取り込み Inbox">
        {isMobile ? (
          <div className="space-y-4">{uploadPanel}{candidateCards}</div>
        ) : isTablet ? (
          <TabletSplitView left={uploadPanel} right={candidateCards} />
        ) : (
          <>
            <div className="mb-4">{uploadPanel}</div>
            <ImportInboxTable
              candidates={state.importCandidates}
              busCandidates={state.busCandidates}
              onConfirm={(id) => refresh(confirmCandidate(id))}
              onIgnore={(id) => refresh(ignoreCandidate(id))}
            />
          </>
        )}
      </AppShell>
    </RoleGuard>
  );
}
