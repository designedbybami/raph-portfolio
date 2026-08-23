import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { WorkDetailPage } from "@/features/work/components/work-detail-page";
import { fetchWork, fetchWorkNeighbours, fetchWorkSlugs } from "@/features/work/data/fetch";
import { urlFor } from "@/sanity/lib/image";
import { AUTHOR_NAME, SITE_URL } from "@/shared/lib/site-config";

const TYPE = "brandDesign";
const BASE_PATH = "/brand-designs";

export async function generateStaticParams() {
  const slugs = await fetchWorkSlugs(TYPE);
  return slugs.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const work = await fetchWork(TYPE, slug);
  if (!work) return { title: "Brand design not found" };

  const description = work.shortDescription ?? `${work.title}, brand design by ${AUTHOR_NAME}.`;

  return {
    title: work.title,
    description,
    alternates: { canonical: `${BASE_PATH}/${work.slug}` },
    openGraph: {
      type: "article",
      title: work.title,
      description,
      images: work.image?.asset
        ? [urlFor(work.image).width(1200).height(630).fit("crop").auto("format").url()]
        : [],
    },
  };
}

export default async function BrandDesignDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const work = await fetchWork(TYPE, slug);
  if (!work) notFound();

  const { prev, next } = await fetchWorkNeighbours(TYPE, slug);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: work.title,
    description: work.shortDescription ?? undefined,
    image: work.image?.asset ? urlFor(work.image).width(1200).url() : undefined,
    dateCreated: work.year ? String(work.year) : undefined,
    genre: work.category ?? undefined,
    creator: { "@type": "Person", name: AUTHOR_NAME },
    url: `${SITE_URL}${BASE_PATH}/${work.slug}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger -- static, no user input beyond Sanity CMS content
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <WorkDetailPage work={work} prev={prev} next={next} basePath={BASE_PATH} />
    </>
  );
}
