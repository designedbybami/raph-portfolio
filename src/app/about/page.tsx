import type { Metadata } from "next";
import { AboutPage } from "@/features/about/components/about-page";
import { PROFILE, SHORT_BIO } from "@/features/about/data/profile";
import { pageMetadata } from "@/shared/lib/page-metadata";

export const metadata: Metadata = pageMetadata({
  title: "About",
  ogTitle: `About ${PROFILE.name}`,
  description: SHORT_BIO,
  path: "/about",
  type: "profile",
  images: [PROFILE.portrait],
});

export default function About() {
  return <AboutPage />;
}
