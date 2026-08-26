"use client";

import { useWebHaptics } from "web-haptics/react";
import type { HapticPreset } from "web-haptics";

// A safe-dial settle: quick oscillation that decays in strength and duration
// while spacing out, then one firmer click as it locks into place. Fires once
// when the carousel ring finishes launching, not the built-in nudge/success.
const SPRING_SETTLE: HapticPreset = {
  pattern: [
    { duration: 20, intensity: 1 },
    { delay: 40, duration: 16, intensity: 0.7 },
    { delay: 55, duration: 14, intensity: 0.5 },
    { delay: 70, duration: 12, intensity: 0.35 },
    { delay: 90, duration: 10, intensity: 0.22 },
    { delay: 130, duration: 25, intensity: 0.55 },
  ],
};

// Tight, quick pulses building to a firm final one, echoing the staggered
// menu's own cascading layers/items landing almost at once. Fired when the
// open or close timeline actually reaches its edge, not on the button press.
const STAGGER_SNAP: HapticPreset = {
  pattern: [
    { duration: 10, intensity: 0.5 },
    { delay: 25, duration: 10, intensity: 0.7 },
    { delay: 25, duration: 14, intensity: 1 },
  ],
};

// One shared instance's worth of semantics, so call sites say what the tap
// means (open, choose, settle) instead of picking a preset name ad hoc.
// No-ops itself on devices without the Vibration API (all of iOS, desktop).
export function useHaptics() {
  const { trigger } = useWebHaptics();

  return {
    // Opening a project, a nav item, a menu toggle.
    tap: () => trigger("light"),
    // Moving between items in an ordered set (carousel prev/next).
    select: () => trigger("selection"),
    // The carousel ring settling to rest after its entry animation.
    springSettle: () => trigger(SPRING_SETTLE),
    // The staggered mobile menu reaching fully open or fully closed.
    menuSnap: () => trigger(STAGGER_SNAP),
  };
}
