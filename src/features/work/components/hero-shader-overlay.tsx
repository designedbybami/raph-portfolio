"use client";

import { Glass, ImageTexture, Shader, WaveDistortion } from "shaders/react";
import type { GpuFailureReason } from "shaders/core";

// Isolated so the caller can code-split it away from the initial page bundle (shaders/react pulls in Three.js's WebGPU renderer).
export function HeroShaderOverlay({
  url,
  center,
  onReady,
  onUnavailable,
  className,
}: {
  url: string;
  center: { x: number; y: number };
  onReady: () => void;
  onUnavailable?: (reason: GpuFailureReason) => void;
  className?: string;
}) {
  return (
    <Shader disableTelemetry className={className} onReady={onReady} onUnavailable={onUnavailable}>
      {/* The "stuck forever" bug was the caller's scale-0 starting class deadlocking init, not these values, see hero-image.tsx. */}
      <Glass
        center={center}
        scale={0.28}
        edgeSoftness={0.18}
        refraction={0.75}
        blur={0.08}
        thickness={0.35}
        aberration={0.45}
        innerZoom={1.25}
        highlight={0.18}
      >
        <WaveDistortion strength={0.02} frequency={1.5} speed={0.5}>
          <ImageTexture url={url} objectFit="cover" />
        </WaveDistortion>
      </Glass>
    </Shader>
  );
}
