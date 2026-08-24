"use client";

import Carousel from "./Carousel";

interface CarouselProject {
  file: string;
  name: string;
  type: string;
  year: string;
  slug?: string;
}

// The collapse that precedes this lives in nav-handoff.tsx, before navigation.
export function CarouselWithHandoff({
  projects,
  heading,
  hrefBase,
}: {
  projects: CarouselProject[];
  heading: string;
  // Omit to just spin the ring on click instead of opening `${hrefBase}/${slug}`.
  hrefBase?: string;
}) {
  return (
    <>
      <Carousel projects={projects} heading={heading} hrefBase={hrefBase} />

      {/* The WebGL ring has no DOM per-card, so unlike artwork-slot.tsx's per-card
          badge, this is one shared hint standing in for the cursor's "Open Project"
          cue, which never renders on a coarse pointer. */}
      <span className="pointer-events-none absolute bottom-6 left-1/2 z-20 hidden -translate-x-1/2 items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-xs text-white backdrop-blur-sm pointer-coarse:flex">
        Tap a piece to open
        <svg aria-hidden viewBox="0 0 24 24" fill="none" className="h-3 w-3">
          <path d="M7 17 17 7M8 7h9v9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </>
  );
}
