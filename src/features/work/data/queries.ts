import { defineQuery } from "next-sanity";
import { MAX_CAROUSEL_ITEMS } from "@/shared/ui/carousel/constants";

// Matches the `type` option list in studio/schemaTypes/work.ts.
export type WorkType = "artwork" | "brandDesign";

export const WORK_LIST_QUERY = defineQuery(`
  *[_type == "work" && type == $type && defined(slug.current)] | order(_createdAt desc) [0...${MAX_CAROUSEL_ITEMS}] {
    _id,
    title,
    "slug": slug.current,
    image,
    "category": category->title,
    year
  }
`);

export interface WorkListItem {
  _id: string;
  title: string;
  slug: string;
  image: { asset?: { _ref: string } } | null;
  category: string | null;
  year: number | null;
}

export function hasImage(
  work: WorkListItem,
): work is WorkListItem & { image: NonNullable<WorkListItem["image"]> } {
  return Boolean(work.image?.asset);
}

// image/asset stay raw refs for urlFor(); metadata rides alongside for aspect ratio and blur-up.
export const WORK_DETAIL_QUERY = defineQuery(`
  *[_type == "work" && type == $type && slug.current == $slug][0]{
    _id,
    title,
    "slug": slug.current,
    image,
    "imageMeta": image.asset->metadata{ lqip, dimensions{ width, height } },
    "category": category->title,
    client,
    year,
    shortDescription,
    about,
    gallery[]{
      _key,
      alt,
      asset,
      "meta": asset->metadata{ lqip, dimensions{ width, height } }
    }
  }
`);

// Same order as WORK_LIST_QUERY, so prev/next matches the order the ring browses in.
export const WORK_NAV_QUERY = defineQuery(`
  *[_type == "work" && type == $type && defined(slug.current)] | order(_createdAt desc) {
    title,
    "slug": slug.current,
    image
  }
`);

export interface WorkNavItem {
  title: string;
  slug: string;
  image: { asset?: { _ref: string } } | null;
}

export const WORK_SLUGS_QUERY = defineQuery(`
  *[_type == "work" && type == $type && defined(slug.current)]{ "slug": slug.current }
`);

interface ImageMeta {
  lqip: string | null;
  dimensions: { width: number; height: number } | null;
}

export interface WorkGalleryItem {
  _key: string;
  alt: string | null;
  asset?: { _ref: string };
  meta: ImageMeta | null;
}

export interface WorkDetail {
  _id: string;
  title: string;
  slug: string;
  image: { asset?: { _ref: string } } | null;
  imageMeta: ImageMeta | null;
  category: string | null;
  client: string | null;
  year: number | null;
  shortDescription: string | null;
  about: string | null;
  gallery: WorkGalleryItem[] | null;
}
