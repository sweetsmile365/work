import type { ReactNode } from "react";
import EnglishBookAudio from "@/components/EnglishBookAudio";

export default function MealTimeLayout({
  children
}: {
  children: ReactNode;
}) {
  return (
    <>
      {children}
      <EnglishBookAudio />
    </>
  );
}
