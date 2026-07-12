type OcrStatus = "success" | "fallback_mock" | "failed";

type VisionResult = {
  text: string;
  provider: "google" | "mock";
  status: OcrStatus;
  warning?: string;
  error?: string;
  confidence?: number;
  variantCount?: number;
};

const mockText = `2026年7月2日（木） 保護者会 提出物あり
7月4日（金） バドミントン部 練習 体育館 集合 送迎
R8.7.26 ピアノレッスン 楽譜持参
TXつくば駅 08:10 茗渓学園 08:35 スクールバス`;

function normalizeImages(input: string | string[]) {
  const images = Array.isArray(input) ? input : [input];
  return images
    .map((image) => image.trim())
    .filter(Boolean)
    .slice(0, 4);
}

function pickText(response: any) {
  const fullText = response?.fullTextAnnotation?.text;
  if (typeof fullText === "string" && fullText.trim()) return fullText;
  const text = response?.textAnnotations?.[0]?.description;
  if (typeof text === "string" && text.trim()) return text;
  return "";
}

function pickConfidence(response: any) {
  const pages = response?.fullTextAnnotation?.pages;
  if (!Array.isArray(pages) || !pages.length) return undefined;
  const confidences: number[] = [];
  for (const page of pages) {
    for (const block of page.blocks ?? []) {
      if (typeof block.confidence === "number") confidences.push(block.confidence);
    }
  }
  if (!confidences.length) return undefined;
  return confidences.reduce((sum, value) => sum + value, 0) / confidences.length;
}

async function annotateImage(image: string, languageHints: string[], featureType: "DOCUMENT_TEXT_DETECTION" | "TEXT_DETECTION") {
  const key = process.env.GOOGLE_CLOUD_VISION_API_KEY;
  if (!key) {
    return {
      text: mockText,
      provider: "mock" as const,
      status: "fallback_mock" as const,
      warning: "GOOGLE_CLOUD_VISION_API_KEY is not configured. Mock OCR text was used."
    };
  }

  const body = {
    requests: [
      {
        image: image.startsWith("http") ? { source: { imageUri: image } } : { content: image },
        features: [{ type: featureType }],
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
  const response = json.responses?.[0];
  if (response?.error?.message) throw new Error(response.error.message);

  return {
    text: pickText(response),
    provider: "google" as const,
    status: "success" as const,
    confidence: pickConfidence(response)
  };
}

async function callGoogleVision(filePathOrSignedUrl: string | string[], languageHints: string[]): Promise<VisionResult> {
  const images = normalizeImages(filePathOrSignedUrl);
  if (!images.length) return { text: "", provider: "google", status: "failed", error: "No image data." };

  const normalizedHints = Array.from(new Set(["ja", ...languageHints]));
  const results: VisionResult[] = [];

  for (const image of images) {
    const docResult = await annotateImage(image, normalizedHints, "DOCUMENT_TEXT_DETECTION");
    results.push(docResult);
    if (docResult.provider === "mock" || docResult.text.trim().length >= 12) break;

    const textResult = await annotateImage(image, normalizedHints, "TEXT_DETECTION");
    results.push(textResult);
    if (textResult.text.trim().length >= 12) break;
  }

  const best = results
    .filter((result) => result.text.trim())
    .sort((a, b) => b.text.trim().length - a.text.trim().length)[0];

  if (!best) return { text: "", provider: "google", status: "failed", error: "OCR text was empty.", variantCount: images.length };
  return { ...best, variantCount: images.length };
}

export function ocrImageWithGoogleVision(filePathOrSignedUrl: string | string[], languageHints = ["ja"]) {
  return callGoogleVision(filePathOrSignedUrl, languageHints);
}

export function ocrDocumentWithGoogleVision(filePathOrSignedUrl: string | string[], languageHints = ["ja"]) {
  return callGoogleVision(filePathOrSignedUrl, languageHints);
}
