"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import { type MouseEvent } from "react";
import { useNavHandoffRegistry } from "@/shared/lib/nav-handoff";
import { SOCIAL_LINKS } from "@/shared/lib/site-config";
import { useSoundPreference } from "@/shared/lib/sfx";
import { LetterSwap } from "./letter-swap";
import { StaggeredMenu } from "./staggered-menu";

export const navigationItems = [
  { href: "/artworks", label: "Artworks" },
  { href: "/brand-designs", label: "Brand Designs" },
  // Not a real destination yet: no href, rendered disabled below.
  { href: null, label: "Shop" },
  { href: "/about", label: "About" },
];

// Three bars that flatten to one when muted, rather than a speaker with a slash: reads at 16px and needs no fill.
function SoundIcon({ on }: { on: boolean }) {
  const bars = [
    { x: 4, tall: 7 },
    { x: 9.5, tall: 13 },
    { x: 15, tall: 9 },
  ];
  return (
    <svg aria-hidden viewBox="0 0 20 20" className="h-4 w-4">
      {bars.map(({ x, tall }) => {
        const height = on ? tall : 1.5;
        return (
          <rect
            key={x}
            x={x}
            y={10 - height / 2}
            width="1.5"
            height={height}
            rx="0.75"
            fill="currentColor"
            className="transition-all duration-300 ease-out"
          />
        );
      })}
    </svg>
  );
}

export function SiteHeader() {
  const registry = useNavHandoffRegistry();
  const { soundOn, toggleSound } = useSoundPreference();

  // No registry (any page but the homepage) or nothing registered for this destination falls through to an ordinary navigation.
  const handleNavClick = (event: MouseEvent<HTMLAnchorElement>, href: string) => {
    if (registry?.startShrink(href)) event.preventDefault();
  };

  return (
    <header className="mx-auto flex w-full max-w-[1800px] shrink-0 items-start justify-between gap-8 py-6 sm:py-8">
      <Link href="/" aria-label="Raph Portfolio home" className="shrink-0">
        <Image
          src="/brand/logo/ar-primary-wordmark.svg"
          alt="AR"
          width={152}
          height={76}
          priority
          className="h-auto w-24 sm:w-32"
        />
      </Link>

      {/* Grouped so the logo stays the only left-hand item: three loose flex children would push the nav to the middle. */}
      <div className="flex items-start gap-5 sm:gap-8">
      <nav aria-label="Primary navigation" className="hidden sm:block">
        <ul className="flex max-w-md flex-wrap justify-end gap-x-5 gap-y-2 sm:gap-x-8">
          {navigationItems.map((item) =>
            item.href ? (
              <li key={item.label}>
                <Link href={item.href} onClick={(event) => handleNavClick(event, item.href!)}>
                  <LetterSwap label={item.label} className="font-heading text-lg leading-none sm:text-2xl" />
                </Link>
              </li>
            ) : (
              <li key={item.label} className="relative">
                <motion.div initial="rest" whileHover="hover" className="relative">
                  <span
                    aria-disabled="true"
                    className="pointer-events-none block font-heading text-lg leading-none text-white/40 sm:text-2xl"
                  >
                    {item.label}
                  </span>
                  {/* Tilted sticker, straightens on hover of the whole item. */}
                  <motion.span
                    className="absolute -top-3.5 -right-5 rounded-sm bg-[#facc15] px-1.5 py-0.5 font-heading text-[8px] leading-none text-black sm:-top-4 sm:-right-6 sm:text-[9px]"
                    variants={{ rest: { rotate: -12 }, hover: { rotate: 0 } }}
                    transition={{ type: "spring", stiffness: 300, damping: 18 }}
                  >
                    Coming Soon
                  </motion.span>
                </motion.div>
              </li>
            ),
          )}
        </ul>
      </nav>

        <button
          type="button"
          onClick={toggleSound}
          aria-pressed={soundOn}
          aria-label={soundOn ? "Turn interface sound off" : "Turn interface sound on"}
          className={`mt-0.5 shrink-0 transition-colors duration-300 ease-out sm:mt-1.5 ${soundOn ? "text-white" : "text-white/40"} hover:text-white`}
        >
          <SoundIcon on={soundOn} />
        </button>

        <StaggeredMenu
          className="sm:hidden"
          items={navigationItems.map((item) => ({ label: item.label, link: item.href ?? undefined, disabled: !item.href }))}
          socialItems={SOCIAL_LINKS}
        />
      </div>
    </header>
  );
}
