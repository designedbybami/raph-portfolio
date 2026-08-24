import type { Metadata } from "next";
import { WorkIndexPage } from "@/features/work/components/work-index-page";
import { AUTHOR_NAME } from "@/shared/lib/site-config";
import { pageMetadata } from "@/shared/lib/page-metadata";

const description = "Selected brand identity and visual design work by Àlabí Raphael.";

export const metadata: Metadata = pageMetadata({
  title: "Brand Designs",
  ogTitle: `Brand design work by ${AUTHOR_NAME}`,
  description,
  path: "/brand-designs",
});

export default function BrandDesigns() {
  return (
    <WorkIndexPage
      type="brandDesign"
      heading="Brand Designs"
      basePath="/brand-designs"
      srHeading={`Brand design work by ${AUTHOR_NAME}`}
    />
  );
}
