"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { useHydrated } from "@/shared/lib/use-hydrated";

export type GradualBlurPosition = "top" | "bottom" | "left" | "right";
export type GradualBlurCurve = "linear" | "bezier" | "ease-in" | "ease-out" | "ease-in-out";
export type GradualBlurAnimated = boolean | "scroll";

export interface GradualBlurProps {
  position?: GradualBlurPosition;
  strength?: number;
  height?: string;
  width?: string;
  divCount?: number;
  exponential?: boolean;
  curve?: GradualBlurCurve;
  opacity?: number;
  animated?: GradualBlurAnimated;
  duration?: string;
  easing?: string;
  hoverIntensity?: number;
  target?: "parent" | "page";
  zIndex?: number;
  onAnimationComplete?: () => void;
  className?: string;
  style?: CSSProperties;
}

const CURVE_FUNCTIONS: Record<GradualBlurCurve, (p: number) => number> = {
  linear: (p) => p,
  bezier: (p) => p * p * (3 - 2 * p),
  "ease-in": (p) => p * p,
  "ease-out": (p) => 1 - Math.pow(1 - p, 2),
  "ease-in-out": (p) => (p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2),
};

const GRADIENT_DIRECTION: Record<GradualBlurPosition, string> = {
  top: "to top",
  bottom: "to bottom",
  left: "to left",
  right: "to right",
};

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

const toPx = (value: string) => (value.endsWith("rem") ? parseFloat(value) * 16 : parseFloat(value));

function useIntersectionOnce(ref: React.RefObject<HTMLDivElement | null>, shouldObserve: boolean) {
  const [isVisible, setIsVisible] = useState(!shouldObserve);
  useEffect(() => {
    if (!shouldObserve || !ref.current) return;
    const observer = new IntersectionObserver(([entry]) => setIsVisible(entry.isIntersecting), { threshold: 0.1 });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref, shouldObserve]);
  return isVisible;
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduced(query.matches);
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, []);
  return reduced;
}

// Found via a sentinel at the original mount point, not the portaled node.
function useNearestScrollParent(sentinelRef: React.RefObject<HTMLSpanElement | null>, enabled: boolean) {
  const [scrollParent, setScrollParent] = useState<HTMLElement | null>(null);
  useEffect(() => {
    if (!enabled) return;
    let el = sentinelRef.current?.parentElement ?? null;
    while (el && el !== document.body) {
      const overflowY = getComputedStyle(el).overflowY;
      if (overflowY === "auto" || overflowY === "scroll") {
        setScrollParent(el);
        return;
      }
      el = el.parentElement;
    }
    setScrollParent(null); // falls back to window scroll
  }, [sentinelRef, enabled]);
  return scrollParent;
}

// Eases opacity down as the scroll container nears the edge this is anchored to.
function useEndFade(scrollParent: HTMLElement | null, enabled: boolean, position: GradualBlurPosition, fadeZonePx: number) {
  const [fade, setFade] = useState(1);
  const active = enabled && (position === "top" || position === "bottom");
  useEffect(() => {
    if (!active) return;
    const target: HTMLElement | (Window & typeof globalThis) = scrollParent ?? window;
    const read = () => {
      const scrollTop = scrollParent ? scrollParent.scrollTop : window.scrollY;
      const clientHeight = scrollParent ? scrollParent.clientHeight : window.innerHeight;
      const scrollHeight = scrollParent ? scrollParent.scrollHeight : document.documentElement.scrollHeight;
      const distance = position === "bottom" ? scrollHeight - scrollTop - clientHeight : scrollTop;
      setFade(clamp01(distance / Math.max(1, fadeZonePx)));
    };
    read();
    target.addEventListener("scroll", read, { passive: true });
    window.addEventListener("resize", read);
    return () => {
      target.removeEventListener("scroll", read);
      window.removeEventListener("resize", read);
    };
  }, [scrollParent, active, position, fadeZonePx]);
  return active ? fade : 1;
}

// Ported from React Bits' GradualBlur (reactbits.dev), plus reduced-motion and an end-of-scroll fade-out.
export function GradualBlur({
  position = "bottom",
  strength = 2,
  height = "6rem",
  width,
  divCount = 5,
  exponential = false,
  curve = "linear",
  opacity = 1,
  animated = false,
  duration = "0.3s",
  easing = "ease-out",
  hoverIntensity,
  target = "parent",
  zIndex = 1000,
  onAnimationComplete,
  className = "",
  style,
}: GradualBlurProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLSpanElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const reduced = useReducedMotion();

  const isPage = target === "page";
  const isVertical = position === "top" || position === "bottom";

  // Portals to body: an ancestor's transform would hijack position:fixed.
  const mounted = useHydrated();

  const scrollParent = useNearestScrollParent(sentinelRef, isPage);
  const endFade = useEndFade(scrollParent, isPage, position, toPx(height));

  // Excludes the scrollbar so the overlay doesn't blur it too.
  const [scrollbarWidth, setScrollbarWidth] = useState(0);
  useEffect(() => {
    if (!isPage) return;
    const measure = () =>
      setScrollbarWidth(
        scrollParent
          ? scrollParent.offsetWidth - scrollParent.clientWidth
          : window.innerWidth - document.documentElement.clientWidth,
      );
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [isPage, scrollParent]);

  const isVisible = useIntersectionOnce(containerRef, animated === "scroll" && !reduced);

  useEffect(() => {
    if (isVisible && animated === "scroll" && onAnimationComplete) {
      const timer = setTimeout(onAnimationComplete, reduced ? 0 : parseFloat(duration) * 1000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, animated, onAnimationComplete, duration, reduced]);

  const blurLayers = useMemo(() => {
    const increment = 100 / divCount;
    const currentStrength = isHovered && hoverIntensity ? strength * hoverIntensity : strength;
    const curveFn = CURVE_FUNCTIONS[curve];
    const direction = GRADIENT_DIRECTION[position];

    return Array.from({ length: divCount }, (_, index) => {
      const i = index + 1;
      const progress = curveFn(i / divCount);
      const blurValue = exponential
        ? Math.pow(2, progress * 4) * 0.0625 * currentStrength
        : 0.0625 * (progress * divCount + 1) * currentStrength;

      const p1 = Math.round((increment * i - increment) * 10) / 10;
      const p2 = Math.round(increment * i * 10) / 10;
      const p3 = Math.round((increment * i + increment) * 10) / 10;
      const p4 = Math.round((increment * i + increment * 2) * 10) / 10;

      let gradient = `transparent ${p1}%, black ${p2}%`;
      if (p3 <= 100) gradient += `, black ${p3}%`;
      if (p4 <= 100) gradient += `, transparent ${p4}%`;
      const mask = `linear-gradient(${direction}, ${gradient})`;

      return (
        <div
          key={i}
          className="absolute inset-0"
          style={{
            maskImage: mask,
            WebkitMaskImage: mask,
            backdropFilter: `blur(${blurValue.toFixed(3)}rem)`,
            WebkitBackdropFilter: `blur(${blurValue.toFixed(3)}rem)`,
            transition:
              animated && animated !== "scroll" && !reduced ? `backdrop-filter ${duration} ${easing}` : undefined,
          }}
        />
      );
    });
  }, [divCount, isHovered, hoverIntensity, strength, curve, position, exponential, animated, duration, easing, reduced]);

  const containerStyle: CSSProperties = {
    position: isPage ? "fixed" : "absolute",
    pointerEvents: hoverIntensity ? "auto" : "none",
    opacity: (reduced ? 1 : isVisible ? 1 : 0) * opacity * endFade,
    transition: reduced ? undefined : "opacity 200ms ease-out",
    zIndex: isPage ? zIndex + 100 : zIndex,
    ...style,
  };
  if (isVertical) {
    containerStyle.height = height;
    containerStyle.width = width || "100%";
    containerStyle[position] = 0;
    containerStyle.left = 0;
    containerStyle.right = isPage ? scrollbarWidth : 0;
  } else {
    containerStyle.width = width || height;
    containerStyle.height = "100%";
    containerStyle[position] = 0;
    containerStyle.top = 0;
    containerStyle.bottom = 0;
  }

  const node = (
    <div
      ref={containerRef}
      aria-hidden
      className={`isolate ${className}`}
      style={containerStyle}
      onMouseEnter={hoverIntensity ? () => setIsHovered(true) : undefined}
      onMouseLeave={hoverIntensity ? () => setIsHovered(false) : undefined}
    >
      <div className="gradual-blur-inner relative h-full w-full">{blurLayers}</div>
    </div>
  );

  return (
    <>
      {isPage && <span ref={sentinelRef} className="hidden" />}
      {isPage ? mounted && createPortal(node, document.body) : node}
    </>
  );
}
