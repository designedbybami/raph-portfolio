# Next.js Portfolio Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a locally runnable Next.js application with typed App Router routes for Home, Brand Designs, Artworks, and Shop.

**Architecture:** Next.js App Router files in `src/app` own URL routing and metadata. Each route renders a feature-owned page component from `src/features`, while `src/shared` reserves space for cross-feature code.

**Tech Stack:** Next.js, React, TypeScript, Tailwind CSS v4, ESLint, npm.

## Global Constraints

- Use TypeScript, Tailwind CSS, ESLint, App Router, and the `src/` directory.
- Routes must be `/`, `/brand-designs`, `/artworks`, and `/shop`.
- Do not add fabricated portfolio or product data, checkout behavior, or third-party UI/state libraries.
- Use feature-first organization and configure page metadata from the start.
- Do not commit or push changes.

---

## File Structure

- `package.json`: scripts and dependencies created by Next.js.
- `src/app/layout.tsx`: root HTML, default metadata, and global styles import.
- `src/app/page.tsx`: renders the Home feature route.
- `src/app/brand-designs/page.tsx`: renders the Brand Designs feature route.
- `src/app/artworks/page.tsx`: renders the Artworks feature route.
- `src/app/shop/page.tsx`: renders the Shop feature route.
- `src/features/*/components/*-page.tsx`: one minimal page component for each route.
- `src/shared/{ui,lib,constants,types}/.gitkeep`: keeps the shared feature-first boundaries visible until reusable code exists.

### Task 1: Scaffold the local Next.js application

**Files:**
- Create: `package.json`, `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `postcss.config.mjs`, `.gitignore`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`

**Interfaces:**
- Produces: `npm run dev`, `npm run lint`, and `npm run build` commands.

- [ ] **Step 1: Generate the app**

Run: `npx create-next-app@latest . --ts --tailwind --eslint --app --src-dir --use-npm --import-alias "@/*" --yes`

- [ ] **Step 2: Confirm the scaffold is valid**

Run: `npm run lint`
Expected: Exit code 0.

### Task 2: Establish feature-first route boundaries

**Files:**
- Create: `src/features/home/components/home-page.tsx`
- Create: `src/features/brand-designs/components/brand-designs-page.tsx`
- Create: `src/features/artworks/components/artworks-page.tsx`
- Create: `src/features/shop/components/shop-page.tsx`
- Create: `src/shared/ui/.gitkeep`, `src/shared/lib/.gitkeep`, `src/shared/constants/.gitkeep`, `src/shared/types/.gitkeep`
- Modify: `src/app/page.tsx`, `src/app/brand-designs/page.tsx`, `src/app/artworks/page.tsx`, `src/app/shop/page.tsx`, `src/app/layout.tsx`

**Interfaces:**
- Produces: default-exported `HomePage`, `BrandDesignsPage`, `ArtworksPage`, and `ShopPage` components.
- Produces: route files with page-specific `metadata` exports.

- [ ] **Step 1: Add the four feature page components**

Each component exports a semantic `main` with one matching `h1` and a short empty-state message.

- [ ] **Step 2: Add route entry points**

Import the matching feature page as the default route component and export route-specific metadata.

- [ ] **Step 3: Set application metadata**

Set `lang="en"`, title template, and default description in `src/app/layout.tsx`.

- [ ] **Step 4: Verify the app**

Run: `npm run lint` and `npm run build`
Expected: Both commands exit with code 0.
