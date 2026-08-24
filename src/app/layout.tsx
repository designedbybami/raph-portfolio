import type { Metadata } from "next";
import localFont from "next/font/local";
import { Montserrat } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { RevealFooter } from "@/shared/ui/reveal-footer";
import { CustomCursorProvider } from "@/shared/ui/cursor/custom-cursor";
import {
  AUTHOR_NAME,
  AUTHOR_ROLE,
  SITE_CREATOR_NAME,
  SITE_CREATOR_URL,
  SITE_NAME,
  SITE_URL,
  SOCIAL_LINKS,
} from "@/shared/lib/site-config";
import "./globals.css";

// No lowercase glyphs (blank space instead); force uppercase anywhere used.
const biggerDisplay = localFont({
  src: "../../public/fonts/biggerdisplay.otf",
  variable: "--font-display",
  display: "swap",
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const description = "Raph's creative portfolio for brand designs, artworks, and shop releases.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description,
  authors: [{ name: AUTHOR_NAME }],
  creator: SITE_CREATOR_NAME,
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: SITE_NAME,
    description,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description,
  },
};

const personId = `${SITE_URL}/#raphael`;

const siteJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": personId,
      name: AUTHOR_NAME,
      url: SITE_URL,
      jobTitle: AUTHOR_ROLE,
      sameAs: SOCIAL_LINKS.map((social) => social.link),
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: SITE_NAME,
      url: SITE_URL,
      author: { "@id": personId },
      creator: {
        "@type": "Person",
        name: SITE_CREATOR_NAME,
        url: SITE_CREATOR_URL,
      },
    },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${biggerDisplay.variable} ${montserrat.variable} h-full antialiased`}
    >
      <body className="h-dvh overflow-hidden bg-black">
        {/* eslint-disable-next-line react/no-danger -- static text, no user input; JSX can't emit a literal HTML comment any other way */}
        <div
          style={{ display: "none" }}
          dangerouslySetInnerHTML={{
            __html: `<!--
      ───────────────────────────────────────────────
      Designed & Developed: DesignedbyBami
      Portfolio : https://bamiboy.com
      Twitter   : https://twitter.com/bamiboy_
      LinkedIn  : https://www.linkedin.com/in/akinade-boluwatife/
      ───────────────────────────────────────────────
    -->`,
          }}
        />
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger -- static, no user input
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd) }}
        />
        {/* The homepage slots ship blank so the reveal can draw them first. With no
            JS to un-hide them, show them outright. */}
        <noscript>
          <style>{`[data-reveal-stack]{opacity:1 !important}`}</style>
        </noscript>
        <CustomCursorProvider>
          <RevealFooter>{children}</RevealFooter>
        </CustomCursorProvider>
        <Analytics />
      </body>
    </html>
  );
}
