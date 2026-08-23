"use client";

import { motion, useSpring } from "motion/react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { type PointerEvent, useEffect, useRef, useState } from "react";
import { NAV_HANDOFF_MOVE_S, useNavHandoffRegistry } from "@/shared/lib/nav-handoff";
import { useHydrated } from "@/shared/lib/use-hydrated";
import { useShaderEnabled } from "@/shared/lib/use-shader-enabled";

// Pulls in Three.js, so it stays out of the initial page bundle.
const FluidImageReveal = dynamic(
  () => import("@/shared/ui/fluid-image-reveal").then((mod) => mod.FluidImageReveal),
  { ssr: false },
);

export interface Artwork {
  slug: string;
  alt: string;
  src: string;
  href: string;
}

const TILT_DEGREES = 8;
// Grace on top of the reveal's own runtime before giving up on it. Tight on purpose: a slow chunk that blows this budget drops to plain images rather than holding a blank slot while it catches up.
const REVEAL_TIMEOUT_BUFFER_MS = 1500;

export function ArtworkSlot({
  artworks,
  activeIndex,
  startIndex,
  priority,
  registryHref,
  revealDelay,
  revealDuration,
}: {
  artworks: Artwork[];
  activeIndex: number;
  startIndex: number;
  priority: boolean;
  // The nav destination this slot stands in for. Only used to publish what is showing; each artwork's own click still goes to its own href.
  registryHref: string;
  revealDelay: number;
  revealDuration: number;
}) {
  const [displayedIndex, setDisplayedIndex] = useState(activeIndex);
  const [isHovered, setIsHovered] = useState(false);
  const isHoveredRef = useRef(false);
  const shaderEnabled = useShaderEnabled();
  const hydrated = useHydrated();
  const [revealDone, setRevealDone] = useState(false);

  useEffect(() => {
    if (!isHoveredRef.current) {
      setDisplayedIndex(activeIndex);
    }
  }, [activeIndex]);

  // The stack is hidden until the reveal reports back, so if its chunk never loads (or never signals) this un-hides it rather than leaving a blank slot.
  useEffect(() => {
    const timer = setTimeout(
      () => setRevealDone(true),
      (revealDelay + revealDuration) * 1000 + REVEAL_TIMEOUT_BUFFER_MS,
    );
    return () => clearTimeout(timer);
  }, [revealDelay, revealDuration]);

  const tiltX = useSpring(0, { damping: 20, stiffness: 150 });
  const tiltY = useSpring(0, { damping: 20, stiffness: 150 });

  const handlePointerEnter = () => {
    isHoveredRef.current = true;
    setIsHovered(true);
  };

  const handlePointerMove = (event: PointerEvent<HTMLAnchorElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    tiltY.set(((event.clientX - bounds.left) / bounds.width - 0.5) * TILT_DEGREES);
    tiltX.set(((event.clientY - bounds.top) / bounds.height - 0.5) * -TILT_DEGREES);
  };

  const handlePointerLeave = () => {
    isHoveredRef.current = false;
    setIsHovered(false);
    tiltX.set(0);
    tiltY.set(0);
  };

  const activeArtwork = artworks[displayedIndex];
  const linkRef = useRef<HTMLAnchorElement>(null);

  // Publishes whatever is showing right now, read by the nav bar at click time.
  const registry = useNavHandoffRegistry();
  useEffect(() => {
    if (!registry) return;
    return registry.register(registryHref, () => {
      if (!linkRef.current) return null;
      const rect = linkRef.current.getBoundingClientRect();
      return {
        src: activeArtwork.src,
        alt: activeArtwork.alt,
        rect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height },
      };
    });
  }, [registry, registryHref, activeArtwork]);

  // The source cuts instantly, hidden under an overlay that starts out covering it exactly; the other slot fades as the overlay crosses to centre.
  const shrinkingHref = registry?.shrinkingHref ?? null;
  const isSource = shrinkingHref === registryHref;

  // Whatever is on screen at mount, before the slot starts cycling.
  const revealSrc = artworks[startIndex]?.src;
  const showReveal = hydrated && shaderEnabled && !!revealSrc && !revealDone;
  // Blank through SSR and hydration too, not just once the client says shaders are on: a hard refresh paints the server HTML long before hydration decides, which is what let the image show ahead of its own reveal.
  const hideForReveal = (!hydrated || showReveal) && !revealDone;

  return (
    <motion.div
      className="h-full"
      animate={{ opacity: shrinkingHref ? 0 : 1 }}
      transition={isSource ? { duration: 0 } : { duration: NAV_HANDOFF_MOVE_S, ease: "easeOut" }}
    >
      <Link
        ref={linkRef}
        href={activeArtwork.href}
        aria-label={activeArtwork.alt}
        // The global cursor grows into its CTA over anything marked this way.
        data-cursor="cta"
        className="relative block h-full overflow-hidden"
        style={{ perspective: 800 }}
        onPointerEnter={handlePointerEnter}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
      >
        {/* Blank (not just covered) until the reveal takes over: without this the plain
            image paints as soon as it loads, and the reveal — a separate lazy chunk —
            only shows up once Three.js finishes arriving, well after. */}
        <div data-reveal-stack="" style={{ opacity: hideForReveal ? 0 : 1 }}>
          {artworks.map((artwork, index) => (
            <motion.div
              key={index}
              className="absolute inset-0"
              animate={{ opacity: index === displayedIndex ? 1 : 0, scale: isHovered ? 1.04 : 1 }}
              transition={{ opacity: { duration: 0.7, ease: "easeInOut" }, scale: { type: "spring", stiffness: 200, damping: 20 } }}
              style={{ rotateX: tiltX, rotateY: tiltY }}
            >
              <Image
                src={artwork.src}
                alt={artwork.alt}
                fill
                unoptimized={artwork.src.startsWith("http")}
                priority={priority && index === startIndex}
                // Matches the CORS mode the reveal's texture loader uses, so both share one cache entry. Without it the plain fetch lands first and the texture request can't reuse it, and the reveal silently falls back.
                crossOrigin="anonymous"
                sizes="(max-width: 767px) calc(100vw - 2.5rem), (max-width: 1023px) calc(100vw - 5rem), 780px"
                className="object-contain"
              />
            </motion.div>
          ))}
        </div>

        {/* The blob paints the same picture while the stack above is blank, so there is
            nothing to reconcile when this unmounts onto it — same image, same contain
            fit, already fully opaque. Never intercepts the link underneath. */}
        {showReveal && (
          <FluidImageReveal
            src={revealSrc}
            fit="contain"
            delay={revealDelay}
            duration={revealDuration}
            className="pointer-events-none absolute inset-0 z-10"
            onReady={() => setRevealDone(true)}
            onUnavailable={() => setRevealDone(true)}
          />
        )}
      </Link>
    </motion.div>
  );
}
