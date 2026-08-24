"use client";

import Image from "next/image";
import { useRef, useState, type PointerEvent } from "react";
import { GradualBlur } from "@/shared/ui/gradual-blur";
import { HoverAnchor } from "@/shared/ui/hover-link";
import { LetterSwap } from "@/shared/ui/letter-swap";
import { Reveal } from "@/shared/ui/reveal";
import { RevealParagraphs } from "@/shared/ui/reveal-words";
import { SiteHeader } from "@/shared/ui/site-header";
import { Sticker } from "@/shared/ui/sticker";
import { FavoriteTrack } from "./favorite-track";
import { BIO_PARAGRAPHS, EXPERIENCE, PROFILE, SHORT_BIO, SKILLS, TOOLS } from "../data/profile";

const HEADER_GUTTER = "px-5 sm:px-8 lg:px-12";
const CONTENT_GUTTER = "px-6 sm:px-12 lg:px-20 xl:px-24";
const SHELL = "mx-auto w-full max-w-[1800px]";
const SECTION = "mt-24 sm:mt-32 lg:mt-40";
// font-body explicitly: globals.css puts the display face on every h1-h6.
const LABEL = "font-body text-[11px] font-medium tracking-[0.22em] text-white/40 uppercase";
// #2563eb matches the custom cursor's default dot.
const PILL =
  "rounded-full border border-white/12 px-4 py-2 text-sm text-white/70 transition-colors duration-300 ease-out hover:border-[#2563eb] hover:bg-[#2563eb] hover:text-white active:border-[#2563eb] active:bg-[#2563eb] active:text-white";
const PILL_ACTIVE = "border-[#2563eb] bg-[#2563eb] text-white";

function InteractivePill({ label }: { label: string }) {
  const [active, setActive] = useState(false);

  const activatePen = (event: PointerEvent<HTMLLIElement>) => {
    if (event.pointerType === "pen") setActive(true);
  };

  return (
    <li
      className={`${PILL} ${active ? PILL_ACTIVE : ""}`}
      onPointerEnter={activatePen}
      onPointerDown={() => setActive(true)}
      onPointerUp={(event) => {
        if (event.pointerType !== "pen") setActive(false);
      }}
      onPointerCancel={() => setActive(false)}
      onPointerLeave={() => setActive(false)}
    >
      {label}
    </li>
  );
}

function ArrowIcon({ hovered }: { hovered: boolean }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      className={`h-4 w-4 shrink-0 transition-transform duration-300 ease-out ${hovered ? "translate-x-1 -translate-y-1" : ""}`}
    >
      <path d="M7 17 17 7M8 7h9v9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ContactLink({ href, label, external }: { href: string; label: string; external?: boolean }) {
  return (
    <HoverAnchor href={href} external={external} className="inline-flex items-center gap-3">
      {(hovered) => (
        <>
          <LetterSwap label={label} hovered={hovered} className="font-heading text-2xl sm:text-4xl" />
          <ArrowIcon hovered={hovered} />
        </>
      )}
    </HoverAnchor>
  );
}

export function AboutPage() {
  const portraitRef = useRef<HTMLDivElement>(null);

  return (
    <div className="bg-black text-white">
      <div
        className={`sticky top-0 z-30 -mb-2 bg-gradient-to-b from-black from-75% to-transparent pb-2 backdrop-blur-lg sm:-mb-3 sm:pb-3 ${HEADER_GUTTER}`}
      >
        <SiteHeader />
      </div>

      <main className={`${SHELL} ${CONTENT_GUTTER} relative pb-24 sm:pb-32`}>
        <section className="grid items-end gap-8 pt-2 lg:grid-cols-12 lg:gap-12 lg:pt-8">
          <Reveal className="lg:col-span-8">
            <h1 className="font-heading text-5xl leading-[0.95] sm:text-7xl lg:text-[8.5rem]">
              {PROFILE.displayName}
            </h1>
          </Reveal>

          <Reveal delay={0.1} className="lg:col-span-4">
            <p className="text-base leading-7 text-white/70 sm:text-lg">{SHORT_BIO}</p>
          </Reveal>
        </section>

        <section className={`${SECTION} grid gap-14 lg:grid-cols-12 lg:gap-20`}>
          <Reveal className="lg:col-span-5">
            <div ref={portraitRef} className="relative">
              <div className="overflow-hidden rounded-2xl sm:rounded-3xl">
                <Image
                  src={PROFILE.portrait}
                  alt={`Portrait of ${PROFILE.name}`}
                  width={PROFILE.portraitSize.width}
                  height={PROFILE.portraitSize.height}
                  priority
                  sizes="(max-width: 1023px) 100vw, 40vw"
                  className="h-auto w-full"
                />
              </div>

              <Sticker
                boundsRef={portraitRef}
                rotate={-4}
                className="hidden w-80 sm:block"
                style={{ bottom: "6%", left: "-10%" }}
              >
                <FavoriteTrack label={LABEL} />
              </Sticker>

              <Sticker
                boundsRef={portraitRef}
                rotate={6}
                className="hidden sm:block"
                style={{ top: "6%", right: "-4%" }}
              >
                <span className="flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-4 py-2.5 text-sm whitespace-nowrap text-white/80 shadow-2xl shadow-black/60 backdrop-blur-sm">
                  📍 {PROFILE.location}
                </span>
              </Sticker>
            </div>

            <div className="mt-6 sm:hidden">
              <FavoriteTrack label={LABEL} />
            </div>

            <div className="mt-8 grid grid-cols-2 gap-x-8 gap-y-6 sm:block">
              <div>
                <p className={LABEL}>Role</p>
                <p className="mt-1 font-heading text-xl sm:text-2xl">{PROFILE.role}</p>
              </div>
              <div className="sm:hidden">
                <p className={LABEL}>Based in</p>
                <p className="mt-1 font-heading text-xl sm:text-2xl">{PROFILE.location}</p>
              </div>
            </div>
          </Reveal>

          <div className="lg:col-span-7">
            <RevealParagraphs
              paragraphs={BIO_PARAGRAPHS}
              className="max-w-[62ch] space-y-6"
              paragraphClassName="text-xl leading-relaxed text-white/75 sm:text-2xl"
            />
          </div>
        </section>

        <section className={SECTION}>
          <Reveal>
            <p className={LABEL}>Experience</p>
          </Reveal>

          <div className="mt-8">
            {EXPERIENCE.map((entry, index) => (
              <Reveal
                key={`${entry.company}-${entry.role}`}
                delay={index * 0.04}
                className="grid gap-3 border-t border-white/10 py-8 lg:grid-cols-12 lg:gap-8"
              >
                <div className="lg:col-span-5">
                  <h2 className="font-heading text-2xl sm:text-3xl">{entry.company}</h2>
                  <p className="mt-2 text-sm text-white/50">{entry.role}</p>
                </div>
                <p className={`${LABEL} lg:col-span-3 lg:pt-2`}>
                  {entry.period} / {entry.place}
                </p>
                <p className="text-base leading-7 text-white/70 lg:col-span-4">{entry.note}</p>
              </Reveal>
            ))}
          </div>
        </section>

        <section className={`${SECTION} grid gap-12 lg:grid-cols-12 lg:gap-20`}>
          <Reveal className="lg:col-span-7">
            <p className={LABEL}>What he does</p>
            <ul className="mt-6 flex flex-wrap gap-3">
              {SKILLS.map((skill) => (
                <InteractivePill key={skill} label={skill} />
              ))}
            </ul>
          </Reveal>

          <Reveal delay={0.08} className="lg:col-span-5">
            <p className={LABEL}>Tools</p>
            <ul className="mt-6 flex flex-wrap gap-3">
              {TOOLS.map((tool) => (
                <InteractivePill key={tool} label={tool} />
              ))}
            </ul>
          </Reveal>
        </section>

        <section className={`${SECTION} border-t border-white/10 pt-12 text-center`}>
          <Reveal>
            <p className="mx-auto max-w-4xl font-heading text-4xl leading-tight sm:text-6xl lg:text-[5.5rem]">
              Open to freelance or full-time
              <br />
              work.
            </p>
          </Reveal>

          <Reveal delay={0.08} className="mt-10 flex flex-wrap justify-center gap-x-14 gap-y-6">
            <ContactLink href={`mailto:${PROFILE.email}`} label="Email" />
            <ContactLink href={PROFILE.behance} label="Behance" external />
          </Reveal>
        </section>

        <GradualBlur
          position="bottom"
          target="page"
          height="6rem"
          strength={1.25}
          divCount={8}
          curve="bezier"
          exponential
        />
      </main>
    </div>
  );
}
