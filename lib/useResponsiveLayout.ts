"use client";

import { useEffect, useState } from "react";

export type LayoutMode = "mobile" | "tablet" | "desktop";

function getLayoutMode(width: number): LayoutMode {
  if (width < 768) return "mobile";
  if (width < 1024) return "tablet";
  return "desktop";
}

export function useResponsiveLayout() {
  const [layoutMode, setLayoutMode] = useState<LayoutMode>("desktop");

  useEffect(() => {
    const mobileQuery = window.matchMedia("(max-width: 767px)");
    const tabletQuery = window.matchMedia("(min-width: 768px) and (max-width: 1023px)");

    const update = () => setLayoutMode(getLayoutMode(window.innerWidth));
    update();

    mobileQuery.addEventListener("change", update);
    tabletQuery.addEventListener("change", update);
    window.addEventListener("resize", update);

    return () => {
      mobileQuery.removeEventListener("change", update);
      tabletQuery.removeEventListener("change", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return {
    isMobile: layoutMode === "mobile",
    isTablet: layoutMode === "tablet",
    isDesktop: layoutMode === "desktop",
    layoutMode
  };
}
