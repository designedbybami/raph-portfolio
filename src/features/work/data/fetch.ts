import { client } from "@/sanity/client";
import {
  WORK_DETAIL_QUERY,
  WORK_NAV_QUERY,
  WORK_SLUGS_QUERY,
  type WorkDetail,
  type WorkNavItem,
  type WorkType,
} from "./queries";

const options = { next: { revalidate: 60 } };

export const fetchWork = (type: WorkType, slug: string) =>
  client.fetch<WorkDetail | null>(WORK_DETAIL_QUERY, { type, slug }, options);

export const fetchWorkSlugs = (type: WorkType) =>
  client.fetch<{ slug: string }[]>(WORK_SLUGS_QUERY, { type });

// Wraps around at both ends, so the last item's "next" is the first.
export async function fetchWorkNeighbours(type: WorkType, slug: string) {
  const nav = await client.fetch<WorkNavItem[]>(WORK_NAV_QUERY, { type }, options);
  const index = nav.findIndex((item) => item.slug === slug);
  if (index < 0) return { prev: null, next: null };

  return {
    prev: nav[(index - 1 + nav.length) % nav.length],
    next: nav[(index + 1) % nav.length],
  };
}
