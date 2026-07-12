const mockText = `2026年7月22日（水） 保護者会 提出物あり
7月24日（金） バドミントン部 練習 体育館 集合 送迎
R8.7.26 ピアノレッスン 楽譜持参
TXつくば駅 08:10 茗溪学園 08:35 スクールバス`;

async function callGoogleVision(filePathOrSignedUrl: string, languageHints: string[]) {
  const key = process.env.GOOGLE_CLOUD_VISION_API_KEY;
  if (!key) {
    return {
      text: mockText,
      provider: "mock",
      status: "fallback_mock" as const,
      warning: "GOOGLE_CLOUD_VISION_API_KEY が未設定です。サンプル OCR 結果を返しました。"
    };
  }

  const body = {
    requests: [
      {
        image: filePathOrSignedUrl.startsWith("http")
          ? { source: { imageUri: filePathOrSignedUrl } }
          : { content: filePathOrSignedUrl },
        features: [{ type: "DOCUMENT_TEXT_DETECTION" }],
        imageContext: { languageHints }
      }
    ]
  };

  const res = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${key}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`Google Vision OCR failed: ${res.status}`);
  const json = await res.json();
  return { text: json.responses?.[0]?.fullTextAnnotation?.text ?? "", provider: "google", status: "success" as const };
}

export function ocrImageWithGoogleVision(filePathOrSignedUrl: string, languageHints = ["ja"]) {
  return callGoogleVision(filePathOrSignedUrl, languageHints);
}

export function ocrDocumentWithGoogleVision(filePathOrSignedUrl: string, languageHints = ["ja"]) {
  return callGoogleVision(filePathOrSignedUrl, languageHints);
}
