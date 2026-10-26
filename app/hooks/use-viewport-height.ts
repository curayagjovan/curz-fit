"use client";

import { useLayoutEffect } from "react";

export function useViewportHeightSync() {
  useLayoutEffect(() => {
    const root = document.documentElement;

    const update = () => {
      const height = window.visualViewport?.height ?? window.innerHeight;
      root.style.setProperty("--app-vh", `${height}px`);
    };

    update();

    window.visualViewport?.addEventListener("resize", update);
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);

    return () => {
      window.visualViewport?.removeEventListener("resize", update);
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
  }, []);
}
