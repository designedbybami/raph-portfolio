// `||`, not `??`: .env.local sets this to "", which `??` would not catch.
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://alabiraphael.com";

export const SITE_NAME = "Raph Portfolio";
// Matches the About page profile (features/about/data/profile.ts) so structured data agrees with what's actually on the page.
export const AUTHOR_NAME = "Àlabí Raphael";
export const AUTHOR_ROLE = "Brand Designer & Art Director";
export const SITE_CREATOR_NAME = "designedbybami";
export const SITE_CREATOR_URL = "https://github.com/designedbybami";

export const SOCIAL_LINKS = [
  { label: "Twitter", link: "https://twitter.com/raph_yfa" },
  { label: "Instagram", link: "https://instagram.com/raph_yfa" },
  { label: "Behance", link: "https://www.behance.net/idesignart21a4" },
];
