import type { Metadata } from "next";
import { HomePage } from "@/features/home/components/home-page";
import { client } from "@/sanity/client";
import { urlFor } from "@/sanity/lib/image";
import { pageMetadata } from "@/shared/lib/page-metadata";
import {
  WORK_LIST_QUERY,
  hasImage,
  type WorkListItem,
  type WorkType,
} from "@/features/work/data/queries";

const description = "Brand identities, artwork, and merch from Àlabí Raphael, a Lagos-based brand designer and art director.";

// A route's own title.template never applies to a title set in that same segment's
// page.tsx, only to nested children, so this needs to be complete on its own.
export const metadata: Metadata = pageMetadata({
  title: "Àlabí Raphael, Brand Designer & Art Director",
  description,
  path: "/",
});

const options = { next: { revalidate: 60 } };

async function slotItems(type: WorkType, basePath: string) {
  const works = await client.fetch<WorkListItem[]>(WORK_LIST_QUERY, { type }, options);

  return works.filter(hasImage).map((work) => ({
    slug: work.slug,
    alt: work.title,
    src: urlFor(work.image).width(1200).height(1500).fit("crop").auto("format").url(),
    href: `${basePath}/${work.slug}`,
  }));
}

export default async function Home() {
  const [artworkItems, brandItems] = await Promise.all([
    slotItems("artwork", "/artworks"),
    slotItems("brandDesign", "/brand-designs"),
  ]);

  return <HomePage artworkItems={artworkItems} brandItems={brandItems} />;
}
