"use client";

import { useSyncExternalStore } from "react";

interface NetworkInformationLike {
  saveData?: boolean;
  effectiveType?: string;
}

// Bandwidth/CPU affordability, not "can it render" — a device can render fine and still not be able to afford downloading a WebGL/WebGPU renderer.
function deviceCanAffordShader() {
  const connection = (navigator as Navigator & { connection?: NetworkInformationLike }).connection;
  if (connection?.saveData) return false;
  if (connection?.effectiveType === "2g" || connection?.effectiveType === "slow-2g") return false;
  const deviceMemory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  if (deviceMemory && deviceMemory < 4) return false;
  return true;
}

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

// Server snapshot is false, so shaders stay client-only and can't desync hydration.
export function useShaderEnabled() {
  return useSyncExternalStore(
    (onChange) => {
      const query = window.matchMedia(REDUCED_MOTION);
      query.addEventListener("change", onChange);
      return () => query.removeEventListener("change", onChange);
    },
    () => !window.matchMedia(REDUCED_MOTION).matches && deviceCanAffordShader(),
    () => false,
  );
}
