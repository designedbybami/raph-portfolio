import type { Metadata } from "next";
import { AboutPage } from "@/features/about/components/about-page";
import { PROFILE, SHORT_BIO } from "@/features/about/data/profile";

export const metadata: Metadata = {
  title: "About",
  description: SHORT_BIO,
  alternates: { canonical: "/about" },
  openGraph: {
    title: `About ${PROFILE.name}`,
    description: SHORT_BIO,
    type: "profile",
  },
};

export default function About() {
  return <AboutPage />;
}
