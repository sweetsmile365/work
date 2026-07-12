import { ocrDocumentWithGoogleVision, ocrImageWithGoogleVision } from "./googleVision";

export async function runOcr(kind: "image" | "pdf", filePathOrSignedUrl: string | string[], languageHints = ["ja"]) {
  try {
    return kind === "image"
      ? await ocrImageWithGoogleVision(filePathOrSignedUrl, languageHints)
      : await ocrDocumentWithGoogleVision(filePathOrSignedUrl, languageHints);
  } catch (error) {
    return { text: "", provider: "google", status: "failed" as const, error: error instanceof Error ? error.message : "OCR failed" };
  }
}
