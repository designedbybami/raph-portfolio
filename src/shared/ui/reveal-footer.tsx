"use client";

import { animate, motion, useMotionValue, useTransform } from "motion/react";
import { usePathname } from "next/navigation";
import { type ReactNode, useEffect, useRef } from "react";

const MAX_REVEAL_PX = 80;
const DRAG_RESISTANCE = 0.5;
const SNAP_BACK_DELAY_MS = 120;
const SNAP_BACK_DURATION_S = 0.18;
const AT_BOTTOM_EPSILON_PX = 1;

// Just the gallery index pages, whose own wheel-driven ring this would fight.
const SELF_SCROLLING_ROUTES = new Set(["/artworks", "/brand-designs"]);

// Content scrolls normally; only past the very bottom does further pull reveal the footer.
export function RevealFooter({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const disabled = SELF_SCROLLING_ROUTES.has(pathname);

  const scrollRef = useRef<HTMLDivElement>(null);
  const rawOffset = useMotionValue(0);
  const negatedOffset = useTransform(rawOffset, (value) => -value);
  const currentOffsetRef = useRef(0);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartYRef = useRef(0);

  useEffect(() => {
    if (disabled) return;
    const el = scrollRef.current;
    if (!el) return;

    const clamp = (value: number) => Math.min(Math.max(value, 0), MAX_REVEAL_PX);
    const atBottom = () => el.scrollHeight - el.scrollTop - el.clientHeight <= AT_BOTTOM_EPSILON_PX;

    const applyOffset = (next: number) => {
      currentOffsetRef.current = clamp(next);
      rawOffset.stop();
      rawOffset.set(currentOffsetRef.current);
    };

    const snapBack = () => {
      currentOffsetRef.current = 0;
      animate(rawOffset, 0, { type: "tween", duration: SNAP_BACK_DURATION_S, ease: "easeOut" });
    };

    const scheduleSnapBack = () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(snapBack, SNAP_BACK_DELAY_MS);
    };

    // Retracting or extending-at-bottom takes the gesture; else native scroll.
    const handleWheel = (event: WheelEvent) => {
      const retracting = currentOffsetRef.current > 0 && event.deltaY < 0;
      const extending = event.deltaY > 0 && atBottom();
      if (!retracting && !extending) return;

      event.preventDefault();
      applyOffset(currentOffsetRef.current + event.deltaY * DRAG_RESISTANCE);
      scheduleSnapBack();
    };

    const handleTouchStart = (event: TouchEvent) => {
      touchStartYRef.current = event.touches[0].clientY;
    };

    const handleTouchMove = (event: TouchEvent) => {
      const currentY = event.touches[0].clientY;
      const delta = touchStartYRef.current - currentY;
      touchStartYRef.current = currentY;

      const retracting = currentOffsetRef.current > 0 && delta < 0;
      const extending = delta > 0 && atBottom();
      if (!retracting && !extending) return;

      event.preventDefault();
      applyOffset(currentOffsetRef.current + delta * DRAG_RESISTANCE);
    };

    el.addEventListener("wheel", handleWheel, { passive: false });
    el.addEventListener("touchstart", handleTouchStart, { passive: true });
    el.addEventListener("touchmove", handleTouchMove, { passive: false });
    el.addEventListener("touchend", snapBack);

    return () => {
      el.removeEventListener("wheel", handleWheel);
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchmove", handleTouchMove);
      el.removeEventListener("touchend", snapBack);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [rawOffset, disabled]);

  if (disabled) return <>{children}</>;

  return (
    <>
      <div
        className="fixed inset-x-0 bottom-0 flex items-center justify-between rounded-t-3xl bg-white px-5 font-heading text-sm text-black sm:px-8 sm:text-base lg:px-12"
        style={{ height: MAX_REVEAL_PX }}
      >
        <a href="https://github.com/designedbybami" target="_blank" rel="noopener noreferrer">
          Built by DesignedbyBami
        </a>
        <p>
          Made with <span aria-hidden>💖</span> and coffee
        </p>
      </div>
      <div
        ref={scrollRef}
        data-scroll-root=""
        className="relative z-10 h-dvh overflow-y-auto overscroll-none"
      >
        <motion.div style={{ y: negatedOffset }}>{children}</motion.div>
      </div>
    </>
  );
}
