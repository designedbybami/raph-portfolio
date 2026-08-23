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
  return <Carousel projects={projects} heading={heading} hrefBase={hrefBase} />;
}
