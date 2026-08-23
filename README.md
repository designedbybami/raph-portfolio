# Raph Portfolio

The portfolio website for **Àlabí Raphael**, a Lagos-based Brand Designer and Art Director. It presents artwork, brand design work, and an About page, with a standalone Sanity Studio for editorial content.

Designed and developed by [designedbybami](https://github.com/designedbybami).

## Stack

- Next.js 16, App Router, React 19, TypeScript, and Tailwind CSS 4
- Sanity Content Lake and standalone Sanity Studio
- Motion, Three.js, and custom WebGL carousel interactions
- `next/font` with BiggerDisplay for headings and Montserrat for body copy

## Routes

`/artworks` and `/brand-designs` are both powered by the same `src/features/work/` feature. `type: artwork` and `type: brandDesign` are a filter on the same Sanity `work` document type, not separate code paths.

| Route | Purpose | Content source |
| --- | --- | --- |
| `/` | Portfolio landing page | Sanity `work` documents |
| `/artworks` | Artwork carousel | Sanity `work`, `type: artwork` |
| `/artworks/[slug]` | Artwork detail page, `VisualArtwork` structured data | Sanity |
| `/brand-designs` | Brand design carousel | Sanity `work`, `type: brandDesign` |
| `/brand-designs/[slug]` | Brand design detail page, `CreativeWork` structured data | Sanity |
| `/about` | Raphael's profile and experience | Local profile data |
| `/shop` | Reserved for future shop work | Not indexed |

## Getting started

Install the website dependencies and run the development server:

```bash
npm install
npm run dev
```

In development, the site runs at [http://localhost:3000](http://localhost:3000). The production site is [alabiraphael.com](https://alabiraphael.com).

### Environment variables

Create `.env.local` in the project root:

```bash
NEXT_PUBLIC_SITE_URL=https://alabiraphael.com
NEXT_PUBLIC_SANITY_PROJECT_ID=your-project-id
NEXT_PUBLIC_SANITY_DATASET=production
```

`https://alabiraphael.com` is the production URL. It powers canonical URLs, the sitemap, robots file, and structured data. Use `http://localhost:3000` locally only when you need local canonical URLs.

### Commands

```bash
npm run dev
npm run lint
npm run build
npm run start
```

## Sanity Studio

The Studio is a separate app in `studio/` and has its own dependencies.

```bash
cd studio
npm install
npm run dev
```

The Sanity schema contains two document types:

- `work`: portfolio pieces with a title, slug, cover image, type, category, client, year, descriptions, gallery, and featured flag.
- `category`: reusable labels such as Portrait, Branding, Logo, and Packaging.

Each `work` must have a `type` of `artwork` or `brandDesign`, which is what routes it to `/artworks` or `/brand-designs`. Every image should include meaningful alternative text.

## Project structure

```text
src/
  app/              Next.js routes, metadata, sitemap, robots
  features/         Feature-specific pages, components, and data
    about/
    home/
    shop/
    work/           Shared artwork + brand-design feature (index, detail, Sanity queries)
  sanity/           Sanity client and image helpers
  shared/           Reusable UI and site configuration
studio/             Standalone Sanity Studio and schemas
public/
  brand/logo/       Stable wordmark assets
  fonts/            Bundled fonts
  icons/            Stable interface icons
  images/           About page profile portrait
```

## Content and asset rules

- Sanity should own editable portfolio images, galleries, and future shop media.
- `public/` is for stable app assets such as the wordmark, fonts, icons, and fallbacks.
- The BiggerDisplay font is uppercase-only. Use `font-heading` for display type and Montserrat, via `font-body`, for readable text.

## SEO and authorship

Raphael is the portfolio author and the `Person` represented in metadata and structured data. `designedbybami` is listed as the website creator and receives the visible footer credit.

The app includes page metadata, canonical URLs, Open Graph assets, `robots.txt`, `sitemap.xml`, and Schema.org data. Ensure the public site URL is configured before launch.

## Current status

- Artwork and Brand Design listing and detail pages are both connected to Sanity, via the shared `work` feature.
- About page, shared navigation, custom cursor, and reveal footer are in place.
- Shop is a future feature and intentionally excluded from search indexing.
- Deployment, production environment variables, and final QA remain.
