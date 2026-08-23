import type { Metadata } from "next";
import { WorkIndexPage } from "@/features/work/components/work-index-page";
import { AUTHOR_NAME } from "@/shared/lib/site-config";

const description = "Selected brand identity and visual design work by Àlabí Raphael.";

export const metadata: Metadata = {
  title: "Brand Designs",
  description,
  alternates: { canonical: "/brand-designs" },
  openGraph: { title: "Brand Designs", description },
};

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
