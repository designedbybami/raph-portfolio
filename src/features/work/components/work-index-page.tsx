import { SiteHeader } from "@/shared/ui/site-header";
import { CarouselWithHandoff } from "@/shared/ui/carousel/carousel-with-handoff";
import { client } from "@/sanity/client";
import { urlFor } from "@/sanity/lib/image";
import { WORK_LIST_QUERY, hasImage, type WorkListItem, type WorkType } from "../data/queries";

const options = { next: { revalidate: 60 } };

export async function WorkIndexPage({
  type,
  heading,
  basePath,
  srHeading,
}: {
  type: WorkType;
  heading: string;
  basePath: string;
  srHeading: string;
}) {
  const works = await client.fetch<WorkListItem[]>(WORK_LIST_QUERY, { type }, options);

  const projects = works.filter(hasImage).map((work) => ({
    file: urlFor(work.image).width(820).height(1024).fit("crop").auto("format").url(),
    name: work.title,
    type: work.category ?? "",
    year: work.year ? String(work.year) : "",
    slug: work.slug,
  }));

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-black text-white">
      {/* The on-screen heading is canvas-drawn, invisible to crawlers, hence this. */}
      <h1 className="sr-only">{srHeading}</h1>
      <div className="relative z-20 px-5 sm:px-8 lg:px-12">
        <SiteHeader />
      </div>
      <CarouselWithHandoff projects={projects} heading={heading} hrefBase={basePath} />
    </div>
  );
}
