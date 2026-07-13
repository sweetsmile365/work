import type { Metadata, Viewport } from "next";
import "./globals.css";
import { CloudSyncRegister } from "@/components/CloudSyncRegister";
import { CloudRefreshButton } from "@/components/CloudRefreshButton";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";

export const metadata: Metadata = {
  title: "Family Schedule Hub",
  description: "家族専用の予定管理 PWA",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "Family Hub",
    statusBarStyle: "default"
  }
};

export const viewport: Viewport = {
  themeColor: "#fbfaf7",
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <ServiceWorkerRegister />
        <CloudSyncRegister />
        <CloudRefreshButton />
        {children}
      </body>
    </html>
  );
}
