import type { Metadata } from "next";
import { SITE_NAME } from "./site-config";

// The root layout's own opengraph-image.png, referenced by its always-resolvable
// route path (not the file's on-disk location) so pages that set their own
// openGraph still get a real image: Next does not merge openGraph/twitter between
// layout and page, a page-level openGraph/twitter object fully replaces the parent's.
const DEFAULT_OG_IMAGE = "/opengraph-image.png";

export function pageMetadata({
  title,
  ogTitle,
  description,
  path,
  type = "website",
  images,
  robots,
}: {
  title: string;
  // Defaults to title. openGraph/twitter titles aren't run through title.template, so pass one explicitly to include the site name or extra context.
  ogTitle?: string;
  description: string;
  path: string;
  type?: "website" | "article" | "profile";
  images?: string[];
  robots?: Metadata["robots"];
}): Metadata {
  const resolvedOgTitle = ogTitle ?? title;
  const ogImages = images ?? [DEFAULT_OG_IMAGE];
  // A raw newline anywhere in the string (CMS free text, e.g. Sanity's shortDescription)
  // makes Next silently drop the whole description tag rather than just the line break.
  const cleanDescription = description.replace(/\s+/g, " ").trim();

  return {
    title,
    description: cleanDescription,
    alternates: { canonical: path },
    ...(robots ? { robots } : {}),
    openGraph: {
      title: resolvedOgTitle,
      description: cleanDescription,
      url: path,
      siteName: SITE_NAME,
      type,
      images: ogImages,
    },
    twitter: {
      card: "summary_large_image",
      title: resolvedOgTitle,
      description: cleanDescription,
      images: ogImages,
    },
  };
}
