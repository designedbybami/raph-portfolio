import type { Metadata } from "next";
import { WorkIndexPage } from "@/features/work/components/work-index-page";
import { AUTHOR_NAME } from "@/shared/lib/site-config";

const description = "Original artwork by Àlabí Raphael, portraits and visual storytelling rooted in Yoruba culture.";

export const metadata: Metadata = {
  title: "Artworks",
  description,
  alternates: { canonical: "/artworks" },
  openGraph: { title: "Artworks", description },
};

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
