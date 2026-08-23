"use client";

import { motion, useMotionValue, useSpring } from "motion/react";
import { usePathname } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

export type CursorVariant = "dot" | "link" | "cta" | "hidden";

// Mounted at the root so the cursor exists everywhere, not per-component.
const CursorContext = createContext<{
  setOverride: (variant: CursorVariant | null) => void;
} | null>(null);

// Untagged interactive elements get the link state; data-cursor overrides it.
const INTERACTIVE = '[data-cursor], a, button, [role="button"]';

// Scaled, never resized: animating width/height relayouts every frame.
const SIZE = 128;
const DOT_SCALE = 14 / SIZE;
const LINK_SCALE = DOT_SCALE * 1.5;

const DOT_COLOR = "#2563eb";
const LINK_COLOR = "#facc15";
const CTA_COLOR = "#ffffff";

const isVariant = (value: string | undefined): value is CursorVariant =>
  value === "dot" || value === "link" || value === "cta" || value === "hidden";

export function CustomCursorProvider({ children }: { children: React.ReactNode }) {
  const x = useMotionValue(-9999);
  const y = useMotionValue(-9999);
  // Light enough to smooth the pointer stream without visibly lagging the hand.
  const springX = useSpring(x, { damping: 30, stiffness: 700, mass: 0.35 });
  const springY = useSpring(y, { damping: 30, stiffness: 700, mass: 0.35 });

  const [enabled, setEnabled] = useState(false);
  const [visible, setVisible] = useState(false);
  const [variant, setVariant] = useState<CursorVariant>("dot");
  const [reduced, setReduced] = useState(false);

  // Canvas hover wins over DOM hit-testing, which only sees the canvas element.
  const overrideRef = useRef<CursorVariant | null>(null);
  const [override, setOverrideState] = useState<CursorVariant | null>(null);
  const lastPointRef = useRef({ x: -9999, y: -9999 });

  const setOverride = useCallback((next: CursorVariant | null) => {
    if (overrideRef.current === next) return;
    overrideRef.current = next;
    setOverrideState(next);
  }, []);

  // Navigating fires no pointer event, so a stale variant would stick until the pointer next moved. Reset at render time, not in an effect, so it never paints.
  const pathname = usePathname();
  const [variantPathname, setVariantPathname] = useState(pathname);
  if (pathname !== variantPathname) {
    setVariantPathname(pathname);
    setVariant("dot");
  }

  // Re-hit-tests the real DOM once the new page has painted, so a stray pointermove racing the reset above (nav-handoff.tsx's delayed nav) doesn't have the last word.
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      const { x: px, y: py } = lastPointRef.current;
      const hit = document.elementFromPoint(px, py)?.closest?.(INTERACTIVE) as HTMLElement | null;
      const tagged = hit?.dataset.cursor;
      setVariant(!hit ? "dot" : isVariant(tagged) ? tagged : "link");
    });
    return () => cancelAnimationFrame(id);
  }, [pathname]);

  // `pointer: fine` is the honest test for this, not screen width.
  useEffect(() => {
    const query = window.matchMedia("(hover: hover) and (pointer: fine)");
    const apply = () => setEnabled(query.matches);
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, []);

  // Snaps instead of easing under reduced motion; the cursor itself stays.
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduced(query.matches);
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    // Drives the CSS hiding the native cursor, so the two cannot disagree.
    document.documentElement.dataset.customCursor = "on";
    return () => {
      delete document.documentElement.dataset.customCursor;
    };
  }, [enabled]);

  // Lets onMove hide by position too: a drag can suppress pointerout entirely.
  const scrollbarWidthRef = useRef(0);
  useEffect(() => {
    if (!enabled) return;
    const measure = () => {
      const root = document.querySelector<HTMLElement>("[data-scroll-root]");
      scrollbarWidthRef.current = root
        ? root.offsetWidth - root.clientWidth
        : window.innerWidth - document.documentElement.clientWidth;
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    const onMove = (event: PointerEvent) => {
      x.set(event.clientX);
      y.set(event.clientY);
      lastPointRef.current = { x: event.clientX, y: event.clientY };

      const sbw = scrollbarWidthRef.current;
      if (sbw > 0 && event.clientX >= window.innerWidth - sbw) {
        setVisible(false);
        return;
      }

      setVisible(true);
      const target = event.target as Element | null;
      const hit = target?.closest?.(INTERACTIVE) as HTMLElement | null;
      const tagged = hit?.dataset.cursor;
      setVariant(!hit ? "dot" : isVariant(tagged) ? tagged : "link");
    };

    // relatedTarget is null leaving the window, but also over native chrome (the scrollbar) since that isn't a real DOM node either.
    const onOut = (event: PointerEvent) => {
      if (!event.relatedTarget) setVisible(false);
    };

    const onBlur = () => setVisible(false);

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerout", onOut, { passive: true });
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerout", onOut);
      window.removeEventListener("blur", onBlur);
    };
  }, [enabled, x, y]);

  const resolved = override ?? variant;
  const active = resolved === "cta";
  // A custom hover visual (e.g. the hero's own glass lens) is standing in for the cursor here, so this one hides rather than drawing on top of it.
  const scale = !visible || resolved === "hidden" ? 0 : active ? 1 : resolved === "link" ? LINK_SCALE : DOT_SCALE;
  const color = active ? CTA_COLOR : resolved === "link" ? LINK_COLOR : DOT_COLOR;

  return (
    <CursorContext.Provider value={{ setOverride }}>
      {children}

      {enabled && (
        <motion.div
          aria-hidden
          data-cursor-root=""
          className="pointer-events-none fixed top-0 left-0 z-[9999]"
          style={{
            x: reduced ? x : springX,
            y: reduced ? y : springY,
            width: SIZE,
            height: SIZE,
            // Margins not translate, leaving the transform for position and scale.
            marginLeft: -SIZE / 2,
            marginTop: -SIZE / 2,
          }}
        >
          {/* CSS, not Motion: mounted everywhere, so this beats a per-frame JS animation. */}
          <div
            className="flex h-full w-full items-center justify-center rounded-full"
            style={{
              transform: `scale(${scale})`,
              backgroundColor: color,
              transition: reduced
                ? "none"
                : "transform 260ms cubic-bezier(0.34, 1.4, 0.64, 1), background-color 180ms ease-out",
            }}
          >
            <span
              className="font-heading text-center text-2xl leading-[0.92] font-bold text-black"
              style={{
                opacity: active ? 1 : 0,
                transition: reduced
                  ? "none"
                  : `opacity ${active ? "180ms ease-out 80ms" : "80ms ease-out"}`,
              }}
            >
              Open
              <br />
              Project
            </span>
          </div>
        </motion.div>
      )}
    </CursorContext.Provider>
  );
}

// null outside the provider, so callers can no-op rather than crash.
export function useCursor() {
  return useContext(CursorContext);
}
