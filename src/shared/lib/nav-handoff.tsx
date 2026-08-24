"use client";

import { AnimatePresence, motion } from "motion/react";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useHydrated } from "@/shared/lib/use-hydrated";

export interface NavHandoffSnapshot {
  src: string;
  alt: string;
  rect: { top: number; left: number; width: number; height: number };
}

type SnapshotGetter = () => NavHandoffSnapshot | null;

interface NavHandoffRegistry {
  register: (href: string, getter: SnapshotGetter) => () => void;
  // False when there is nothing to animate, so the caller can fall through to an ordinary navigation.
  startShrink: (href: string) => boolean;
  shrinkingHref: string | null;
}

const NavHandoffContext = createContext<NavHandoffRegistry | null>(null);

const MOVE_S = 0.5;
// A beat at full size on arrival, so travelling and collapsing read as two moments.
const HOLD_S = 0.12;
const COLLAPSE_S = 0.78;
const TOTAL_S = MOVE_S + HOLD_S + COLLAPSE_S;
const EASE_MOVE = [0.22, 1, 0.36, 1] as const;
// Only gently accelerating: a hard ease-in barely moves, then vanishes in a few frames.
const EASE_COLLAPSE = [0.32, 0, 0.67, 0] as const;
const EASE_OUT = [0.4, 0, 1, 1] as const;

interface Shrinking extends NavHandoffSnapshot {
  href: string;
  dx: number;
  dy: number;
  // Retires the overlay once the route lands, without a reset effect.
  fromPath: string;
}

// Lets a nav link read what is currently on screen for its destination at click time, without the header and the page content knowing about each other.
export function NavHandoffProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const registryRef = useRef(new Map<string, SnapshotGetter>());
  const [shrinking, setShrinking] = useState<Shrinking | null>(null);
  const active = shrinking?.fromPath === pathname ? shrinking : null;

  const mounted = useHydrated();

  const registry = useMemo<NavHandoffRegistry>(
    () => ({
      register: (href, getter) => {
        registryRef.current.set(href, getter);
        return () => {
          if (registryRef.current.get(href) === getter) registryRef.current.delete(href);
        };
      },
      startShrink: (href) => {
        if (active) return true;

        const snapshot = registryRef.current.get(href)?.();
        if (!snapshot) return false;

        const { rect } = snapshot;
        setShrinking({
          ...snapshot,
          href,
          dx: window.innerWidth / 2 - (rect.left + rect.width / 2),
          dy: window.innerHeight / 2 - (rect.top + rect.height / 2),
          fromPath: pathname,
        });
        return true;
      },
      shrinkingHref: active?.href ?? null,
    }),
    [active, pathname],
  );

  return (
    <NavHandoffContext.Provider value={registry}>
      {children}

      {/* Portaled: RevealFooter wraps every page in a motion.div, which always carries a
          transform, which hijacks position:fixed descendants onto its own box instead of
          the viewport (see gradual-blur.tsx for the same fix). */}
      {mounted &&
        createPortal(
          <AnimatePresence>
            {active && (
              <motion.img
                key="nav-shrink"
                src={active.src}
                alt=""
                aria-hidden
                className="pointer-events-none fixed z-50 rounded-2xl object-contain"
                style={{
                  top: active.rect.top,
                  left: active.rect.left,
                  width: active.rect.width,
                  height: active.rect.height,
                }}
                initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
                animate={{
                  x: [0, active.dx, active.dx, active.dx, active.dx],
                  y: [0, active.dy, active.dy, active.dy, active.dy],
                  scale: [1, 1, 1, 0.04, 0],
                  opacity: [1, 1, 1, 1, 0],
                }}
                transition={{
                  duration: TOTAL_S,
                  times: [0, MOVE_S / TOTAL_S, (MOVE_S + HOLD_S) / TOTAL_S, 0.95, 1],
                  ease: [EASE_MOVE, "linear", EASE_COLLAPSE, EASE_OUT],
                }}
                onAnimationComplete={() => router.push(active.href)}
              />
            )}
          </AnimatePresence>,
          document.body,
        )}
    </NavHandoffContext.Provider>
  );
}

// null outside a provider, e.g. any page other than the homepage.
export function useNavHandoffRegistry() {
  return useContext(NavHandoffContext);
}

export const NAV_HANDOFF_MOVE_S = MOVE_S;
