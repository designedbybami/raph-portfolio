import type { Metadata } from "next";
import { HomePage } from "@/features/home/components/home-page";
import { client } from "@/sanity/client";
import { urlFor } from "@/sanity/lib/image";
import {
  WORK_LIST_QUERY,
  hasImage,
  type WorkListItem,
  type WorkType,
} from "@/features/work/data/queries";

const description = "Brand identities, artwork, and merch from Àlabí Raphael, a Lagos-based brand designer and art director.";

export const metadata: Metadata = {
  title: "Home",
  description,
  alternates: { canonical: "/" },
  openGraph: { title: "Raph Portfolio", description },
};

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
