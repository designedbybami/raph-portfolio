"use client";

import { useEffect, useState } from "react";
import { LetterSwap } from "@/shared/ui/letter-swap";
import { SiteHeader } from "@/shared/ui/site-header";
import { NavHandoffProvider } from "@/shared/lib/nav-handoff";
import { ArtworkSlot, type Artwork } from "./artwork-slot";

const socialLinks = [
  { href: "https://twitter.com/raph_yfa", label: "Twitter" },
  { href: "https://instagram.com/raph_yfa", label: "Instagram" },
  { href: "https://www.behance.net/idesignart21a4", label: "Behance" },
];

const SLIDE_INTERVAL_MS = 1600;

// Entrance: header and footer are already up, then each slot blob-reveals, the second a beat behind the first.
const REVEAL_DELAY_S = 0.6;
const REVEAL_STAGGER_S = 0.15;
const REVEAL_DURATION_S = 1.8;
// Cycling has to wait it out, or a slot would swap off the image it just revealed.
const ENTRANCE_MS = (REVEAL_DELAY_S + REVEAL_STAGGER_S + REVEAL_DURATION_S) * 1000;

export function HomePage({ artworkItems, brandItems }: { artworkItems: Artwork[]; brandItems: Artwork[] }) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | undefined;
    const startId = setTimeout(() => {
      intervalId = setInterval(() => setTick((current) => current + 1), SLIDE_INTERVAL_MS);
    }, ENTRANCE_MS);
    return () => {
      clearTimeout(startId);
      clearInterval(intervalId);
    };
  }, []);

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-black px-5 text-white sm:px-8 lg:px-12">
      <NavHandoffProvider>
        <SiteHeader />

        <main className="mx-auto w-full min-h-0 max-w-[1600px] flex-1">
          <h1 className="sr-only">Raph Portfolio</h1>
          <section
            aria-label="Artworks and brand designs"
            className="grid h-full grid-cols-1 gap-0 px-8 sm:px-16 lg:px-24 md:grid-cols-2"
          >
            <ArtworkSlot
              artworks={artworkItems}
              activeIndex={tick % artworkItems.length}
              startIndex={0}
              priority
              registryHref="/artworks"
              revealDelay={REVEAL_DELAY_S}
              revealDuration={REVEAL_DURATION_S}
            />
            <ArtworkSlot
              artworks={brandItems}
              activeIndex={tick % brandItems.length}
              startIndex={0}
              priority
              registryHref="/brand-designs"
              revealDelay={REVEAL_DELAY_S + REVEAL_STAGGER_S}
              revealDuration={REVEAL_DURATION_S}
            />
          </section>
        </main>
      </NavHandoffProvider>

      <footer className="mx-auto flex w-full max-w-[1800px] shrink-0 flex-wrap items-center justify-between gap-5 py-6 sm:py-8">
        <div className="flex gap-5 sm:gap-8" aria-label="Social platforms">
          {socialLinks.map((social) => (
            <a key={social.href} href={social.href} target="_blank" rel="noopener noreferrer">
              <LetterSwap label={social.label} className="font-heading text-lg sm:text-xl" />
            </a>
          ))}
        </div>
        <a href="mailto:r_alabi@yahoo.com">
          <LetterSwap label="Reach Out Via Email" className="font-heading text-lg sm:text-xl" />
        </a>
      </footer>
    </div>
  );
}
