# Framer to Next.js Integration Guide

A comprehensive step-by-step guide on how to import and integrate Framer website components into a Next.js 15 application.

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Step 1: Import Framer Project with Unframer](#step-1-import-framer-project-with-unframer)
4. [Step 2: Configure TypeScript Path Aliases](#step-2-configure-typescript-path-aliases)
5. [Step 3: Create the Homepage Component](#step-3-create-the-homepage-component)
6. [Step 4: Handle SSR Issues](#step-4-handle-ssr-issues)
7. [Step 5: Set Up CSS and Styling](#step-5-set-up-css-and-styling)
8. [Step 6: Achieve Full-Width Sections](#step-6-achieve-full-width-sections)
9. [Step 7: Customize Brand Colors](#step-7-customize-brand-colors)
10. [Step 8: Replace Framer Navbar with Custom Navbar](#step-8-replace-framer-navbar-with-custom-navbar)
11. [Troubleshooting](#troubleshooting)
12. [File Structure Reference](#file-structure-reference)

---

## Overview

This guide documents the process of integrating a Framer website (TaskFlow template) into a Next.js 15 application. The integration uses the `unframer` CLI tool to export Framer components as React components, then adapts them for use in a Next.js App Router environment.

### Key Challenges Addressed

- **SSR Compatibility**: Framer components use client-side features that break server-side rendering
- **Full-Width Layout**: Framer components have fixed widths (1200px) that need to be overridden
- **CSS Token System**: Framer uses UUID-based CSS variables that need to be defined
- **Dynamic Imports**: Components must be loaded dynamically with SSR disabled

---

## Prerequisites

- Next.js 15 with App Router
- TypeScript configured
- Tailwind CSS (optional but recommended)
- Node.js 18+

### Required Packages

```bash
npm install unframer framer-motion
```

---

## Step 1: Import Framer Project with Unframer

### 1.1 Get Your Framer Project ID

1. Open your Framer project in the browser
2. The URL will be something like: `https://framer.com/projects/TaskFlow--cfe7f02456486a1b`
3. The project ID is the alphanumeric string after `--`: `cfe7f02456486a1b`

### 1.2 Run the Unframer CLI

```bash
npx unframer <project-id>
```

For our TaskFlow template:

```bash
npx unframer cfe7f02456486a1b
```

### 1.3 What Gets Generated

This creates a `/framer` directory in your project root with:

```
framer/
├── chunks/                    # Shared code chunks
│   ├── chunk-OGWUPM25.js
│   ├── chunk-5UNLO6O5.js
│   └── ... (many more)
├── navbar.jsx                 # Navigation component
├── main-hero.jsx              # Hero section
├── features.jsx               # Features section
├── benefits.jsx               # Benefits section
├── video-section.jsx          # Video section
├── solutions.jsx              # Solutions section
├── pricing.jsx                # Pricing section
├── blog-section.jsx           # Blog section
├── testimonials.jsx           # Testimonials section
├── faq.jsx                    # FAQ section
├── cta.jsx                    # Call-to-action section
├── footer.jsx                 # Footer section
└── ... (other components)
```

Each `.jsx` file is a self-contained React component with:
- Embedded CSS styles (injected via `withCSS`)
- Font definitions
- Responsive variants (Desktop, Tablet, Phone)
- Property controls from Framer

---

## Step 2: Configure TypeScript Path Aliases

### 2.1 Update tsconfig.json

Add a path alias for the framer directory:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@framer/*": ["./framer/*"]
    }
  },
  "exclude": ["node_modules", "functions/backup"]
}
```

**Important**: Make sure `framer` is NOT in the `exclude` array.

### 2.2 Verify the Alias Works

You should now be able to import like this:

```typescript
import MainHero from '@framer/main-hero';
```

---

## Step 3: Create the Homepage Component

### 3.1 Create the TaskFlowHome Component

Create `/src/components/framer-home/TaskFlowHome.tsx`:

```tsx
'use client';

import dynamic from 'next/dynamic';

// Loading placeholder for sections
const SectionLoader = () => (
  <div className="w-full h-96 bg-gray-100 animate-pulse" />
);

// Dynamically import all Framer components with SSR disabled
const MainHero = dynamic(
  () => import('@framer/main-hero').then(m => m.default.Responsive || m.default),
  { ssr: false, loading: SectionLoader }
);

const Features = dynamic(
  () => import('@framer/features').then(m => m.default.Responsive || m.default),
  { ssr: false, loading: SectionLoader }
);

const Benefits = dynamic(
  () => import('@framer/benefits').then(m => m.default.Responsive || m.default),
  { ssr: false, loading: SectionLoader }
);

const VideoSection = dynamic(
  () => import('@framer/video-section').then(m => m.default.Responsive || m.default),
  { ssr: false, loading: SectionLoader }
);

const Solutions = dynamic(
  () => import('@framer/solutions').then(m => m.default.Responsive || m.default),
  { ssr: false, loading: SectionLoader }
);

const Pricing = dynamic(
  () => import('@framer/pricing').then(m => m.default.Responsive || m.default),
  { ssr: false, loading: SectionLoader }
);

const BlogSection = dynamic(
  () => import('@framer/blog-section').then(m => m.default.Responsive || m.default),
  { ssr: false, loading: SectionLoader }
);

const Testimonials = dynamic(
  () => import('@framer/testimonials').then(m => m.default.Responsive || m.default),
  { ssr: false, loading: SectionLoader }
);

const Faq = dynamic(
  () => import('@framer/faq').then(m => m.default.Responsive || m.default),
  { ssr: false, loading: SectionLoader }
);

const Cta = dynamic(
  () => import('@framer/cta').then(m => m.default.Responsive || m.default),
  { ssr: false, loading: SectionLoader }
);

const FramerFooter = dynamic(
  () => import('@framer/footer').then(m => m.default.Responsive || m.default),
  { ssr: false, loading: SectionLoader }
);

// Common props for full-width Framer sections
const fullWidthProps = {
  width: '100%',
  style: { width: '100%', maxWidth: '100%' },
};

export function TaskFlowHome() {
  return (
    <div className="w-full min-h-screen bg-[rgb(249,250,251)] overflow-x-hidden">
      {/* Your custom navbar here */}

      {/* Main content - all sections full width */}
      <main className="w-full">
        <MainHero {...fullWidthProps} />
        <Features {...fullWidthProps} />
        <Benefits {...fullWidthProps} />
        <VideoSection {...fullWidthProps} />
        <Solutions {...fullWidthProps} />
        <Pricing {...fullWidthProps} />
        <BlogSection {...fullWidthProps} />
        <Testimonials {...fullWidthProps} />
        <Faq {...fullWidthProps} />
        <Cta {...fullWidthProps} />
        <FramerFooter {...fullWidthProps} />
      </main>
    </div>
  );
}

export default TaskFlowHome;
```

### 3.2 Understanding the Import Pattern

```typescript
() => import('@framer/main-hero').then(m => m.default.Responsive || m.default)
```

This pattern:
1. Dynamically imports the module
2. Tries to get `m.default.Responsive` first (the responsive variant)
3. Falls back to `m.default` if Responsive doesn't exist

The `.Responsive` variant automatically switches between Desktop/Tablet/Phone layouts based on viewport width.

---

## Step 4: Handle SSR Issues

### 4.1 Why SSR Fails

Framer components use browser-only APIs:
- `window` and `document` objects
- `framer-motion` animations
- Dynamic style injection
- Font loading via `fontStore`

### 4.2 The Solution: Dynamic Imports with `ssr: false`

```typescript
const Component = dynamic(
  () => import('@framer/component'),
  { ssr: false }
);
```

### 4.3 Update the Page Component

The page that uses TaskFlowHome must also be a client component:

`/src/app/(marketing)/page.tsx`:

```tsx
'use client';

import dynamic from 'next/dynamic';

// Dynamically import TaskFlowHome with SSR disabled
const TaskFlowHome = dynamic(
  () => import('@/components/framer-home/TaskFlowHome'),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-gray-100 animate-pulse flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }
);

export default function Home() {
  return <TaskFlowHome />;
}
```

---

## Step 5: Set Up CSS and Styling

### 5.1 Create the Framer CSS File

Create `/src/styles/framer.css`:

```css
/* DMA Landing Page Styles - Framer Integration */

/* Import unframer base styles */
@import "unframer/styles/reset.css";
@import "unframer/styles/framer.css";

/* Google Fonts (if needed) */
@import url('https://fonts.googleapis.com/css2?family=Figtree:wght@300;400;500;600;700;800&display=swap');

:root {
    /* ===== Framer Color Tokens ===== */
    /* These are the UUID-based tokens that Framer components reference */

    /* Text colors */
    --token-05a7cdfd-1e0f-43da-a9f6-b4623556492c: rgb(17, 24, 39);
    --token-fd483edb-af45-4817-a4ca-cfb10641cc8b: rgb(107, 114, 128);
    --token-b63e5580-f724-4b9d-a88b-9db74b9d4550: rgb(156, 163, 175);

    /* Background colors */
    --token-08f2dbd6-30f3-4b80-b3ec-25d8f6146ee9: rgb(255, 255, 255);
    --token-d0b7823d-e074-4a91-a0da-87403f8dd55f: rgb(249, 250, 251);
    --token-acd56db7-abb6-41e1-9fd7-b3514fc00033: rgb(243, 244, 246);

    /* Accent colors */
    --token-70ee1060-3c83-4aa7-a752-6352a72d1a9b: rgb(59, 130, 246);
    --token-506c377b-b508-4c02-b37d-a3af474414ea: rgb(239, 246, 255);

    /* Inverted text (for dark backgrounds) */
    --token-2512d5c3-fb46-42ef-a96a-5b1cd92b4a5b: rgb(255, 255, 255);
    --token-2f970c4a-d681-4f67-b8e7-fc961b216d69: rgba(255, 255, 255, 0.8);

    /* Border colors */
    --token-7e2cee24-41e3-44f2-9710-90e095fcc68d: rgb(229, 231, 235);
    --token-e0f2244a-aea1-4399-a845-e123a818ef17: rgb(191, 219, 254);

    /* Additional backgrounds */
    --token-32ef3044-dd29-4196-9941-4b4ea459bfeb: rgb(255, 247, 237);
    --token-7bf9cd8b-da92-434e-a48a-25754bd7f14e: rgb(250, 245, 255);
    --token-71affd06-602e-4d17-ae55-5372707023ae: rgb(233, 213, 255);
    --token-e3b93db3-06d8-4dbc-8698-da85f409404c: rgb(254, 215, 170);
}

/* Base styles */
body {
    font-family: 'Figtree', -apple-system, BlinkMacSystemFont, sans-serif;
    -webkit-font-smoothing: antialiased;
}
```

### 5.2 Finding Token UUIDs

To find which tokens a component uses:

1. Open the component file (e.g., `/framer/main-hero.jsx`)
2. Search for `--token-` in the CSS strings
3. Map each token to its intended color

Example from `main-hero.jsx`:
```javascript
var css2 = [
  '.framer-CUODV .framer-styles-preset-bzw91s { --framer-text-color: var(--token-05a7cdfd-1e0f-43da-a9f6-b4623556492c, #111827); }'
];
```

This tells us `--token-05a7cdfd...` is for text color with fallback `#111827`.

### 5.3 Import CSS in Layout

Update `/src/app/(marketing)/layout.tsx`:

```tsx
import '@/styles/framer.css';

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
```

---

## Step 6: Achieve Full-Width Sections

This is one of the most challenging aspects. Framer components have hardcoded widths.

### 6.1 The Problem

Framer components include CSS like:
```css
.framer-b62lb.framer-eetyh4 {
  width: 1200px;
}
```

And default props:
```javascript
FramerComponent.defaultProps = {
  width: 1200,
  height: 1811,
};
```

### 6.2 Solution Part 1: Pass Width Props

```typescript
const fullWidthProps = {
  width: '100%',
  style: { width: '100%', maxWidth: '100%' },
};

<MainHero {...fullWidthProps} />
```

### 6.3 Solution Part 2: CSS Overrides

Add to `/src/styles/framer.css`:

```css
/* ===== Full-Width Overrides ===== */

/* Reset body margins */
html, body {
    margin: 0 !important;
    padding: 0 !important;
    overflow-x: hidden !important;
}

/* Override Framer's fixed-width sections */
[class*="framer-"].framer-eetyh4,
[class*="framer-"].framer-v-1jhznf3,
[class*="framer-"].framer-v-1yba6oq {
    width: 100% !important;
    max-width: 100% !important;
}

/* Target specific Framer class combinations */
.framer-b62lb.framer-eetyh4 {
    width: 100% !important;
    max-width: 100% !important;
}

/* Generic override for ALL framer section containers */
section[class*="framer-"][class*="framer-"] {
    width: 100% !important;
    max-width: 100% !important;
}

/* Override inline style widths */
[style*="width: 1200px"],
[style*="width:1200px"],
[style*="width: 810px"],
[style*="width:810px"],
[style*="width: 390px"],
[style*="width:390px"] {
    width: 100% !important;
    max-width: 100% !important;
}
```

### 6.4 Why This Works

1. **CSS `!important`** overrides inline styles that don't have `!important`
2. **Attribute selectors** like `[style*="width: 1200px"]` target elements with specific inline styles
3. **Class selectors** target Framer's generated class names
4. **Multiple selectors** ensure coverage across different component variants

### 6.5 Understanding Framer's Responsive Variants

Framer generates different classes for each breakpoint:

| Variant | Class | Default Width |
|---------|-------|---------------|
| Desktop | `.framer-eetyh4` | 1200px |
| Tablet | `.framer-v-1jhznf3` | 810px |
| Phone | `.framer-v-1yba6oq` | 390px |

Override all of them for full-width behavior.

---

## Step 7: Customize Brand Colors

### 7.1 Define Brand Colors

Add to `:root` in `/src/styles/framer.css`:

```css
:root {
    /* DMA Brand Colors */
    --brand-primary: #252F5B;
    --brand-primary-hover: #1a2142;
    --brand-primary-light: #3a4a7a;
    --brand-secondary: #E72B36;
    --brand-secondary-hover: #c9232d;
    --brand-secondary-light: #ff4d58;
}
```

### 7.2 Override Accent Colors Only

Keep original text colors for readability, only change accents:

```css
:root {
    /* Text colors - keep original for readability */
    --unframer-text-primary: rgb(17, 24, 39);
    --unframer-text-secondary: rgb(107, 114, 128);

    /* Accent colors - use brand */
    --unframer-text-blue: var(--brand-primary);
    --unframer-accent-primary: var(--brand-primary);
    --unframer-accent-secondary: var(--brand-secondary);

    /* Token overrides for accents */
    --token-70ee1060-3c83-4aa7-a752-6352a72d1a9b: var(--brand-primary);
}
```

### 7.3 Add Tailwind Brand Colors

In `tailwind.config.js`:

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#252F5B',
          'primary-hover': '#1a2142',
          secondary: '#E72B36',
          'secondary-hover': '#c9232d',
        },
      },
    },
  },
};
```

---

## Step 8: Replace Framer Navbar with Custom Navbar

### 8.1 Why Replace?

The Framer navbar may not integrate well with your auth system, routing, or mobile menu requirements.

### 8.2 Remove Framer Navbar Import

In `TaskFlowHome.tsx`, remove:

```typescript
// Remove this
const Navbar = dynamic(
  () => import('@framer/navbar').then(m => m.default.Responsive || m.default),
  { ssr: false, loading: () => <div className="h-16 bg-white" /> }
);
```

### 8.3 Add Your Custom Navbar

```typescript
import { FramerNavbarWrapper } from '@/components/navigation/framer-navbar-wrapper';

export function TaskFlowHome() {
  return (
    <div className="w-full min-h-screen bg-[rgb(249,250,251)] overflow-x-hidden">
      {/* Custom navbar */}
      <FramerNavbarWrapper />

      {/* Main content */}
      <main className="w-full">
        <MainHero {...fullWidthProps} />
        {/* ... other sections */}
      </main>
    </div>
  );
}
```

---

## Troubleshooting

### Error: "Failed to fetch dynamically imported module"

**Cause**: SSR trying to render client-only components.

**Solution**: Ensure all Framer imports use `dynamic()` with `{ ssr: false }`.

### Error: "ssr: false is not allowed with Server Components"

**Cause**: Page is a Server Component.

**Solution**: Add `'use client'` directive to the page file.

### Error: "Cannot find module '@framer/...'"

**Cause**: Path alias not configured or framer folder excluded.

**Solution**:
1. Check `tsconfig.json` has `"@framer/*": ["./framer/*"]` in paths
2. Ensure `framer` is not in the `exclude` array

### Components Render But Have Fixed Width

**Cause**: Framer's CSS overriding your styles.

**Solution**: Use `!important` in CSS overrides and pass `width: '100%'` props.

### Styles Not Applied / Missing Colors

**Cause**: CSS token variables not defined.

**Solution**:
1. Find token UUIDs in component files
2. Define them in your CSS with appropriate colors

### Console Warning: "Each child should have a unique key"

**Cause**: Framer's internal list rendering.

**Solution**: This is safe to ignore - it's within the Framer component internals.

---

## File Structure Reference

```
project-root/
├── framer/                          # Generated by unframer
│   ├── chunks/                      # Shared code
│   ├── navbar.jsx
│   ├── main-hero.jsx
│   ├── features.jsx
│   └── ... (other sections)
│
├── src/
│   ├── app/
│   │   └── (marketing)/
│   │       ├── layout.tsx           # Imports framer.css
│   │       └── page.tsx             # Uses TaskFlowHome
│   │
│   ├── components/
│   │   └── framer-home/
│   │       └── TaskFlowHome.tsx     # Main integration component
│   │
│   └── styles/
│       └── framer.css               # Framer tokens & overrides
│
├── tsconfig.json                    # Path aliases
└── tailwind.config.js               # Brand colors
```

---

## Summary

### Key Steps Recap

1. **Import**: `npx unframer <project-id>`
2. **Configure**: Add `@framer/*` path alias in tsconfig.json
3. **Create Component**: Use `dynamic()` with `ssr: false` for all imports
4. **Style**: Define CSS tokens and import unframer styles
5. **Full-Width**: Use CSS `!important` overrides + pass width props
6. **Brand**: Override accent tokens while keeping original text colors
7. **Navbar**: Replace with your own for better integration

### Performance Tips

- Use loading skeletons during dynamic imports
- Consider code-splitting large sections
- Lazy load below-the-fold sections
- Preload critical fonts

### Maintenance

- Re-run `npx unframer <id>` to update components from Framer
- Check for new token UUIDs after updates
- Test all responsive breakpoints after changes

---

*Last updated: November 2024*
*Next.js version: 15.x*
*Unframer version: Latest*
