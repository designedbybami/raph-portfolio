# Next.js Portfolio Foundation Design

## Goal

Create a clean, scalable Next.js foundation for a creative portfolio with dedicated Home, Brand Designs, Artworks, and Shop routes.

## Scope

- Use the Next.js App Router with TypeScript and Tailwind CSS.
- Enable strict TypeScript checks and ESLint.
- Keep source code under `src/`.
- Provide route entry points for `/`, `/brand-designs`, `/artworks`, and `/shop`.
- Configure a global layout, global styles, and baseline SEO metadata.
- Do not add fabricated portfolio entries, product listings, checkout behavior, or third-party UI/state libraries.

## Architecture

`src/app` owns routing and application-wide configuration. Each page route is a small entry point that delegates rendering to a feature module.

`src/features` is feature-first. The initial modules are `home`, `brand-designs`, `artworks`, and `shop`. Future feature-specific components, content loading, and interactions stay inside the relevant module.

`src/shared` is reserved for reusable building blocks that are not tied to a single feature. It contains shared UI components, constants, utilities, and types only when they are needed by more than one feature.

## Project Structure

```text
src/
  app/
    brand-designs/page.tsx
    artworks/page.tsx
    shop/page.tsx
    layout.tsx
    page.tsx
    globals.css
  features/
    home/
    brand-designs/
    artworks/
    shop/
  shared/
    ui/
    lib/
    constants/
    types/
public/
```

Initial feature pages will be intentionally minimal empty states. They establish stable route and component boundaries without presenting placeholder content as genuine work or products.

## User Experience

- Each route must be directly accessible and render a route-specific page title.
- The base layout must be responsive and usable on narrow and wide screens.
- No animations or decorative effects are required for the foundation.
- Any future visual motion must respect `prefers-reduced-motion`.

## SEO and Accessibility

- The root layout defines a site title template and default description.
- Each route defines its own title and description.
- Pages use one semantic `main` landmark and a single visible primary heading.
- The document language is set to English.

## Verification

- `npm run lint` succeeds.
- `npm run build` succeeds.
- Visiting each route renders its own heading without a 404.
- The generated project ignores dependencies, environment files, and build output in Git.

## Constraints

- Follow Bami build standards: feature-first organization, SEO from the start, minimal comments, no em dashes, and no fabricated data presented as real.
- Do not commit or push changes unless explicitly requested.
