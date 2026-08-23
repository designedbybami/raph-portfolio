// Kept as plain data rather than Sanity: none of it is client-editable yet.

export const PROFILE = {
  name: "Àlabí Raphael",
  // biggerdisplay.otf has no accented glyphs, so the display-face headline uses the unaccented form. Everywhere set in Montserrat keeps the real spelling.
  displayName: "Alabi Raphael",
  role: "Brand Designer & Art Director",
  location: "Lagos, Nigeria",
  email: "r_alabi@yahoo.com",
  behance: "https://www.behance.net/idesignart21a4",
  portrait: "/images/about/client.jpg",
  portraitSize: { width: 1170, height: 1123 },
} as const;

export const SHORT_BIO =
  "Brand Designer and Art Director from Lagos, building visual identities for gospel artists, entertainment brands, and global campaigns for five years and counting.";

export const BIO_PARAGRAPHS = [
  "For the last five years, Àlabí has turned brand stories into things people can see and feel, working with gospel artists, entertainment labels, and global releases that have reached over a million viewers.",
  "He believes good design, like a good proverb, says more with less. Every identity he builds is meant to carry weight quietly, the kind that holds a brand together long after the first impression fades.",
  "Based in Lagos and working with clients everywhere, he is as comfortable directing a global album rollout as he is mentoring the next designer coming up behind him.",
];

export const EXPERIENCE = [
  {
    role: "Brand Designer & Creative Lead",
    company: "Khaime AI",
    period: "2026 — Present",
    place: "Remote",
    note: "Leading brand strategy and creative direction across product and marketing.",
  },
  {
    role: "Lead Graphic Designer",
    company: "Rox Nation",
    period: "2020 — Present",
    place: "Lagos",
    note: "10+ large-scale campaigns reaching over a million viewers, with a 45% lift in social impressions.",
  },
  {
    role: "Head of Design",
    company: "GallantBiz Media",
    period: "2020 — Present",
    place: "Lagos",
    note: "Directed design for 50+ clients and mentored junior designers across remote teams.",
  },
  {
    role: "Visual Brand Strategist",
    company: "Tim Godfrey",
    period: "2020 — Present",
    place: "Remote",
    note: "Visual identities for 3 studio albums and 5 global tours, growing streaming engagement by 50%.",
  },
  {
    role: "Lead Graphic Designer & Art Director",
    company: "FastFast Africa",
    period: "2022",
    place: "Lagos",
    note: "End-to-end creative direction across 150+ web and social assets.",
  },
];

export const SKILLS = [
  "Brand Identity",
  "Art Direction",
  "Visual Storytelling",
  "Typography & Layout",
  "Album Art",
  "Digital & Print",
  "Social Graphics",
  "Motion Support",
];

export const TOOLS = ["Photoshop", "Illustrator", "CorelDRAW", "Figma"];

// id is the tail of a Spotify track URL (open.spotify.com/track/<id>).
export const FAVORITE_TRACK: { id: string; title: string; artist: string } | null = {
  id: "7tzWMecezO4TtpjyPqDTHr",
  title: "Beautiful",
  artist: "Mali Music",
};
