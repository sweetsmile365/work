"use client";

import { useEffect, useState } from "react";
import { Camera, Upload } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ImportInboxTable } from "@/components/ImportInboxTable";
import { RoleGuard } from "@/components/RoleGuard";
import { MobileImportCandidateCard } from "@/components/responsive/MobileImportCandidateCard";
import { TabletSplitView } from "@/components/responsive/TabletSplitView";
import { confirmCandidate, createImportFromText, loadState, type AppState } from "@/lib/db";
import { useResponsiveLayout } from "@/lib/useResponsiveLayout";

const sample = `2026年7月22日（水） 保護者会 提出物あり
2026年7月24日（金） バドミントン部 練習 体育館 集合 送迎
R8.7.26 ピアノレッスン 楽譜持参
TXつくば駅 08:10 茗溪学園 08:35 スクールバス`;

export default function ImportInboxPage() {
  const [state, setState] = useState<AppState | null>(null);
  const [text, setText] = useState(sample);
  const [ocrOpen, setOcrOpen] = useState(false);
  const { isMobile, isTablet } = useResponsiveLayout();
  useEffect(() => setState(loadState()), []);
  if (!state) return null;

  const runMockOcr = async () => {
    const res = await fetch("/api/ocr/image", { method: "POST", body: JSON.stringify({ image: "mock" }) });
    const data = await res.json();
    setText(data.text);
    setState(createImportFromText(data.text));
  };

  const uploadPanel = (
    <section className="rounded-2xl bg-white p-4 shadow-sm">
      <h2 className="text-xl font-bold">取り込み</h2>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <button className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 text-base font-semibold text-white" onClick={runMockOcr}><Camera size={20} />拍照</button>
        <button className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-base font-semibold" onClick={() => setState(createImportFromText(text))}><Upload size={20} />上传</button>
      </div>
      <div className="mt-3 rounded-xl bg-slate-50 p-3 text-base text-slate-600">OCR 状态：待确认 {state.importCandidates.filter((item) => !item.confirmed && !item.ignored).length} 件</div>
      <details className="mt-3 rounded-xl border border-slate-200 p-3" open={ocrOpen} onToggle={(event) => setOcrOpen(event.currentTarget.open)}>
        <summary className="cursor-pointer text-base font-semibold">OCR 原文</summary>
        <textarea className="mt-3 min-h-32 w-full rounded-xl border border-slate-200 p-3 text-base" value={text} onChange={(event) => setText(event.target.value)} />
      </details>
    </section>
  );

  const candidateCards = (
    <div className="space-y-3">
      {state.importCandidates.map((candidate) => <MobileImportCandidateCard key={candidate.id} candidate={candidate} onConfirm={() => setState(confirmCandidate(candidate.id))} />)}
      {state.importCandidates.length === 0 ? <div className="rounded-xl bg-white p-4 text-base text-slate-500">候補はまだありません。</div> : null}
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
            <div className="mb-4 grid gap-3 rounded-md bg-white p-4 shadow-soft">
              <textarea className="focus-ring min-h-36 rounded-md border border-black/10 p-3" value={text} onChange={(e) => setText(e.target.value)} />
              <div className="flex flex-wrap gap-2">
                <button className="focus-ring rounded-md bg-ink px-4 py-2 text-white" onClick={() => setState(createImportFromText(text))}>OCR テキストを手動貼り付け</button>
                <button className="focus-ring rounded-md border border-black/10 px-4 py-2" onClick={runMockOcr}>OCR を再実行</button>
              </div>
              <p className="text-sm text-yellow-700">OCR が未設定の場合は模擬認識結果を使います。候補は確認後に正式カレンダーへ入ります。</p>
            </div>
            <ImportInboxTable candidates={state.importCandidates} busCandidates={state.busCandidates} onConfirm={(id) => setState(confirmCandidate(id))} />
          </>
        )}
      </AppShell>
    </RoleGuard>
  );
}
