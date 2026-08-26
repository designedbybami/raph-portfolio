"use client";

import { useCallback, useState } from "react";
import { playAmbientCue, playCue } from "@/shared/lib/sfx";
import { useHaptics } from "@/shared/lib/use-haptics";

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
  const [entryComplete, setEntryComplete] = useState(false);
  const { tap, springSettle } = useHaptics();
  const showGuidance = useCallback(() => {
    setEntryComplete(true);
    springSettle();
    playAmbientCue("snap");
  }, [springSettle]);

  const handleSpreadStart = useCallback(() => playAmbientCue("expand"), []);

  const handleTap = useCallback(
    (isTouch: boolean) => {
      if (isTouch) tap();
      playCue("open");
    },
    [tap],
  );

  const guidanceWord = (word: string, index: number) => (
    <span
      key={`${word}-${index}`}
      className="inline-block motion-reduce:!translate-y-0 motion-reduce:!transition-none"
      style={{
        opacity: entryComplete ? 1 : 0,
        transform: `translateY(${entryComplete ? 0 : 10}px)`,
        transition:
          "opacity 420ms cubic-bezier(0.25, 1, 0.5, 1), transform 420ms cubic-bezier(0.25, 1, 0.5, 1)",
        transitionDelay: entryComplete ? `${index * 45}ms` : "0ms",
      }}
    >
      {word}
    </span>
  );

  return (
    <>
      <Carousel
        projects={projects}
        heading={heading}
        hrefBase={hrefBase}
        onEntryComplete={showGuidance}
        onSpreadStart={handleSpreadStart}
        onTap={handleTap}
      />

      <div
        aria-hidden={!entryComplete}
        className="pointer-events-none absolute bottom-6 left-1/2 z-20 hidden -translate-x-1/2 flex-col items-center gap-1 text-center text-xs text-white pointer-coarse:flex lg:hidden"
      >
        <span className="flex gap-[0.28em] whitespace-nowrap">
          {"Swipe up or down to browse"
            .split(" ")
            .map((word, index) => guidanceWord(word, index))}
        </span>
        <span className="flex gap-[0.28em] whitespace-nowrap sm:hidden">
          {"Tap to view"
            .split(" ")
            .map((word, index) => guidanceWord(word, index + 7))}
        </span>
      </div>
    </>
  );
}
