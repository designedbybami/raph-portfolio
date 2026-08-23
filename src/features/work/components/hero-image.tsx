"use client";

import dynamic from "next/dynamic";
import Image, { type ImageProps } from "next/image";
import { type PointerEvent, useEffect, useRef, useState } from "react";
import { useCursor } from "@/shared/ui/cursor/custom-cursor";
import { useShaderEnabled } from "@/shared/lib/use-shader-enabled";

const HeroShaderOverlay = dynamic(
  () => import("./hero-shader-overlay").then((mod) => mod.HeroShaderOverlay),
  { ssr: false },
);

// Wraps the plain Image with a liquid-glass lens that follows the cursor. Gated on device affordability and prefers-reduced-motion.
export function HeroImage({ src, alt, className, ...imgProps }: ImageProps & { src: string }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const cursor = useCursor();
  const enabled = useShaderEnabled();
  const [unavailable, setUnavailable] = useState(false);
  const [inView, setInView] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [ready, setReady] = useState(false);
  const [center, setCenter] = useState({ x: 0.5, y: 0.5 });

  // Mounts ahead of the first hover, not on it: GPU init takes long enough to be visible as a lag before the lens appears otherwise.
  useEffect(() => {
    if (!enabled || !hostRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
        if (!entry.isIntersecting) setReady(false);
      },
      { rootMargin: "300px 0px" },
    );
    observer.observe(hostRef.current);
    return () => observer.disconnect();
  }, [enabled]);

  // Unclamped, so the lens tracks the pointer the whole way out to the edges.
  const centerFromEvent = (event: PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) / rect.width,
      y: (event.clientY - rect.top) / rect.height,
    };
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    setCenter(centerFromEvent(event));
  };

  const handlePointerEnter = (event: PointerEvent<HTMLDivElement>) => {
    setHovering(true);
    setCenter(centerFromEvent(event));
    // The lens is standing in for the pointer here; the dot would double up on it.
    cursor?.setOverride("hidden");
  };

  const handlePointerLeave = () => {
    setHovering(false);
    cursor?.setOverride(null);
  };

  const active = hovering && ready;

  return (
    <div
      ref={hostRef}
      className={`relative inline-block overflow-hidden ${className ?? ""}`}
      onPointerEnter={handlePointerEnter}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      {/* crossOrigin matches what the glass overlay's texture loader uses, so both share
          one cache entry — otherwise the plain fetch lands first and the texture
          request can't reuse it, and the lens never loads its image. */}
      <Image src={src} alt={alt} className={className} crossOrigin="anonymous" {...imgProps} />
      {enabled && !unavailable && inView && (
        <HeroShaderOverlay
          url={typeof src === "string" ? src : ""}
          center={center}
          className={`absolute inset-0 transition-opacity duration-150 ease-out ${active ? "opacity-100" : "opacity-0"}`}
          onReady={() => setReady(true)}
          // The library logs nothing on its own when it can't run at all.
          onUnavailable={(reason) => {
            console.warn("[hero-shader] unavailable, falling back to the plain image:", reason);
            setUnavailable(true);
          }}
        />
      )}
    </div>
  );
}
