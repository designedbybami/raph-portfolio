import type { MetadataRoute } from "next";
import { fetchWorkSlugs } from "@/features/work/data/fetch";
import { SITE_URL } from "@/shared/lib/site-config";

// /shop left out: disabled in the nav, noindexed on the route itself.
const STATIC_ROUTES: Array<{ path: string; priority: number }> = [
  { path: "", priority: 1 },
  { path: "/artworks", priority: 0.9 },
  { path: "/brand-designs", priority: 0.9 },
  { path: "/about", priority: 0.8 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [artworkSlugs, brandSlugs] = await Promise.all([
    fetchWorkSlugs("artwork"),
    fetchWorkSlugs("brandDesign"),
  ]);

  const staticEntries = STATIC_ROUTES.map(({ path, priority }) => ({
    url: `${SITE_URL}${path}`,
    lastModified: new Date(),
    priority,
  }));

  const workEntries = [
    ...artworkSlugs.map(({ slug }) => `/artworks/${slug}`),
    ...brandSlugs.map(({ slug }) => `/brand-designs/${slug}`),
  ].map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: new Date(),
    priority: 0.6,
  }));

  return [...staticEntries, ...workEntries];
}
