"use client";

import Image from "next/image";
import { GradualBlur } from "@/shared/ui/gradual-blur";
import { HoverLink } from "@/shared/ui/hover-link";
import { LetterSwap } from "@/shared/ui/letter-swap";
import { Reveal } from "@/shared/ui/reveal";
import { RevealParagraphs } from "@/shared/ui/reveal-words";
import { SiteHeader } from "@/shared/ui/site-header";
import { urlFor } from "@/sanity/lib/image";
import { HeroImage } from "./hero-image";
import type { WorkDetail, WorkNavItem } from "../data/queries";

const HEADER_GUTTER = "px-5 sm:px-8 lg:px-12";
const CONTENT_GUTTER = "px-6 sm:px-12 lg:px-20 xl:px-24";
const SHELL = "mx-auto w-full max-w-[1800px]";
const SECTION = "mt-24 sm:mt-32 lg:mt-40";
// font-body explicitly: globals.css puts the display face on every h1-h6.
const LABEL = "font-body text-[11px] font-medium tracking-[0.22em] text-white/40 uppercase";

// Work is never cropped, so a tall piece is bounded by height, not width.
const HERO_IMAGE = "h-auto max-h-[82vh] w-auto max-w-full rounded-2xl sm:rounded-3xl";

const FALLBACK_RATIO = { width: 1200, height: 1500 };

function paragraphsOf(about: string | null) {
  if (!about) return [];
  return about
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);
}

function ArrowIcon({ direction, hovered }: { direction: "left" | "right"; hovered: boolean }) {
  const nudge = hovered ? (direction === "left" ? "-translate-x-1" : "translate-x-1") : "translate-x-0";
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      className={`h-4 w-4 shrink-0 transition-transform duration-300 ease-out ${nudge} ${direction === "right" ? "rotate-180" : ""}`}
    >
      <path d="M19 12H5M11 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function NavThumb({ item, hovered }: { item: WorkNavItem; hovered: boolean }) {
  if (!item.image?.asset) return null;
  return (
    <span className="block h-14 w-14 shrink-0 overflow-hidden rounded-lg sm:h-16 sm:w-16">
      <Image
        src={urlFor(item.image).width(160).height(160).fit("crop").auto("format").url()}
        alt=""
        width={160}
        height={160}
        unoptimized
        className={`h-full w-full object-cover transition-transform duration-500 ease-out ${hovered ? "scale-110" : "scale-100"}`}
      />
    </span>
  );
}

// Images are Sanity CDN URLs urlFor() already sized, so `unoptimized` avoids reprocessing.
export function WorkDetailPage({
  work,
  prev,
  next,
  basePath,
}: {
  work: WorkDetail;
  prev: WorkNavItem | null;
  next: WorkNavItem | null;
  basePath: string;
}) {
  const hero = work.image?.asset ? work.image : null;
  const heroDimensions = work.imageMeta?.dimensions ?? FALLBACK_RATIO;
  const gallery = (work.gallery ?? []).filter((item) => item.asset);
  const paragraphs = paragraphsOf(work.about);
  const showNav = prev && next && prev.slug !== work.slug;

  return (
    <div className="bg-black text-white">
      <div
        className={`sticky top-0 z-30 -mb-2 bg-gradient-to-b from-black from-75% to-transparent pb-2 backdrop-blur-lg sm:-mb-3 sm:pb-3 ${HEADER_GUTTER}`}
      >
        <SiteHeader />
      </div>

      <main className={`${SHELL} ${CONTENT_GUTTER} relative pb-24 sm:pb-32`}>
        <section className="grid gap-14 pt-2 lg:grid-cols-12 lg:gap-24 lg:pt-8">
          <Reveal className="lg:sticky lg:top-36 lg:col-span-5 lg:self-start">
            <HoverLink href={basePath} className="inline-flex w-fit items-center gap-2">
              {(hovered) => (
                <>
                  <ArrowIcon direction="left" hovered={hovered} />
                  <LetterSwap label="Back" hovered={hovered} className={LABEL} />
                </>
              )}
            </HoverLink>

            <h1 className="mt-6 font-heading text-5xl leading-[0.95] sm:text-7xl lg:text-[5.25rem]">
              {work.title}
            </h1>

            {work.shortDescription && (
              <p className="mt-6 max-w-md text-base leading-7 text-white/70 sm:text-lg">
                {work.shortDescription}
              </p>
            )}

            {(work.client || work.year) && (
              <div className="mt-10 grid grid-cols-2 gap-x-8 gap-y-6">
                {work.client && (
                  <div>
                    <p className={LABEL}>Client</p>
                    <p className="mt-1 font-heading text-xl sm:text-2xl">{work.client}</p>
                  </div>
                )}
                {work.year && (
                  <div>
                    <p className={LABEL}>Year</p>
                    <p className="mt-1 font-heading text-xl sm:text-2xl">{work.year}</p>
                  </div>
                )}
                {work.category && (
                  <div className="col-span-2">
                    <p className={LABEL}>Category</p>
                    <p className="mt-1 font-heading text-xl sm:text-2xl">{work.category}</p>
                  </div>
                )}
              </div>
            )}
          </Reveal>

          <Reveal delay={0.1} className="lg:col-span-7">
            {hero && (
              <HeroImage
                src={urlFor(hero).width(1600).auto("format").url()}
                alt={work.title}
                width={heroDimensions.width}
                height={heroDimensions.height}
                priority
                unoptimized
                placeholder={work.imageMeta?.lqip ? "blur" : "empty"}
                blurDataURL={work.imageMeta?.lqip ?? undefined}
                sizes="(max-width: 1023px) 100vw, 58vw"
                className={HERO_IMAGE}
              />
            )}
          </Reveal>
        </section>

        {paragraphs.length > 0 && (
          <section className={SECTION}>
            <RevealParagraphs
              paragraphs={paragraphs}
              className="mx-auto max-w-[62ch] space-y-5"
              paragraphClassName="text-xl leading-relaxed text-white/75 sm:text-2xl"
            />
          </section>
        )}

        {gallery.length > 0 && (
          <section className={SECTION}>
            <div className="columns-1 gap-4 sm:columns-2 sm:gap-6 lg:gap-8">
              {gallery.map((item, index) => {
                const dimensions = item.meta?.dimensions ?? FALLBACK_RATIO;

                return (
                  <Reveal key={item._key} className="group mb-4 overflow-hidden rounded-2xl break-inside-avoid sm:mb-6 sm:rounded-3xl lg:mb-8">
                    <Image
                      src={urlFor(item).width(1000).auto("format").url()}
                      alt={item.alt ?? `${work.title}, detail ${index + 1}`}
                      width={dimensions.width}
                      height={dimensions.height}
                      unoptimized
                      placeholder={item.meta?.lqip ? "blur" : "empty"}
                      blurDataURL={item.meta?.lqip ?? undefined}
                      sizes="(max-width: 639px) 100vw, 50vw"
                      className="w-full transition-transform duration-700 ease-out group-hover:scale-110"
                    />
                  </Reveal>
                );
              })}
            </div>
          </section>
        )}

        {showNav && (
          <section className={`${SECTION} flex items-center justify-between gap-6 border-t border-white/10 pt-10`}>
            <Reveal>
              <HoverLink href={`${basePath}/${prev.slug}`} className="inline-block">
                {(hovered) => (
                  <span
                    className={`flex items-center gap-4 transition-transform duration-300 ease-out ${hovered ? "-translate-x-1" : ""}`}
                  >
                    <ArrowIcon direction="left" hovered={hovered} />
                    <NavThumb item={prev} hovered={hovered} />
                    <LetterSwap label={prev.title} hovered={hovered} className="font-heading text-lg sm:text-2xl" />
                  </span>
                )}
              </HoverLink>
            </Reveal>

            <Reveal delay={0.05}>
              <HoverLink href={`${basePath}/${next.slug}`} className="inline-block text-right">
                {(hovered) => (
                  <span
                    className={`flex items-center gap-4 transition-transform duration-300 ease-out ${hovered ? "translate-x-1" : ""}`}
                  >
                    <LetterSwap label={next.title} hovered={hovered} className="font-heading text-lg sm:text-2xl" />
                    <NavThumb item={next} hovered={hovered} />
                    <ArrowIcon direction="right" hovered={hovered} />
                  </span>
                )}
              </HoverLink>
            </Reveal>
          </section>
        )}

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
