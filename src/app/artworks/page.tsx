import type { Metadata } from "next";
import { WorkIndexPage } from "@/features/work/components/work-index-page";
import { AUTHOR_NAME } from "@/shared/lib/site-config";
import { pageMetadata } from "@/shared/lib/page-metadata";

const description = "Original artwork by Àlabí Raphael, portraits and visual storytelling rooted in Yoruba culture.";

export const metadata: Metadata = pageMetadata({
  title: "Artworks",
  ogTitle: `Artworks by ${AUTHOR_NAME}`,
  description,
  path: "/artworks",
});

export default function Artworks() {
  return (
    <WorkIndexPage
      type="artwork"
      heading="My Artworks"
      basePath="/artworks"
      srHeading={`Artworks by ${AUTHOR_NAME}`}
    />
  );
}
