# Framer Homepage Reconstruction Plan

## Executive Summary

This plan outlines the step-by-step process to reconstruct the DMA homepage using pixel-perfect Framer components from the exported "Wallet Template" via the `unframer` library.

### Key Decisions
| Aspect | Decision |
|--------|----------|
| Design Fidelity | Pixel-perfect Framer |
| Implementation | Use `unframer` library |
| Hero Content | Keep abstract design (floating cards) |
| Navigation | Keep current `FramerNavbarUnified` |
| Footer | Use Framer footer via unframer |
| Colors | Keep exact Framer palette |
| Language | English |

### Color Palette (Framer/Wallet Template)
```css
--page-background: rgb(255, 250, 245);  /* Cream/Sand */
--section-dark: rgb(15, 15, 15);        /* Dark sections */
--dark-1: rgb(18, 17, 17);              /* Darkest */
--dark-2: rgb(23, 23, 23);              /* Cards */
--dark-3: rgb(41, 41, 41);              /* Borders */
--accent-red: rgb(231, 43, 54);         /* Primary accent */
--white: rgb(255, 255, 255);
--white-65: rgba(255, 255, 255, 0.65);
--sand: rgb(242, 239, 235);
```

---

## Phase 1: Foundation Setup

### 1.1 Verify Dependencies
**Status**: Already installed
```json
{
  "unframer": "^3.2.17",
  "framer-motion": "^11.18.2"
}
```

### 1.2 Move Framer Export to Proper Location
**Current**: `_framer_backup/`
**Target**: `src/framer/` (cleaner import paths)

```bash
# Move and rename folder
mv _framer_backup src/framer
```

### 1.3 Update TypeScript Config
Add path alias in `tsconfig.json`:
```json
{
  "compilerOptions": {
    "paths": {
      "@/framer/*": ["./src/framer/*"]
    }
  }
}
```

### 1.4 Configure Framer Styles
Update `src/styles/framer.css` to import unframer base styles:

```css
/* Import unframer base styles */
@import "unframer/styles/reset.css";
@import "unframer/styles/framer.css";

/* Import local Framer export styles */
@import "@/framer/styles.css";
```

---

## Phase 2: Component Structure

### 2.1 File Structure Overview
```
src/
├── framer/                          # Framer export (moved from _framer_backup)
│   ├── hero.jsx                     # Hero section
│   ├── features.jsx                 # Features/Bento grid
│   ├── security.jsx                 # Security section
│   ├── integrations.jsx             # Integrations section
│   ├── navigation/
│   │   ├── navbar.jsx               # Navbar (NOT using - keeping current)
│   │   └── footer.jsx               # Footer section
│   ├── chunks/                      # Shared components/utilities
│   │   ├── chunk-*.js               # Various component chunks
│   │   └── chunk-H6CE2FPO.js        # Routes config
│   └── styles.css                   # Framer CSS variables
│
├── components/
│   ├── home/
│   │   ├── index.ts                 # Re-export Framer sections
│   │   ├── FramerHero.tsx           # Wrapper for hero.jsx
│   │   ├── FramerFeatures.tsx       # Wrapper for features.jsx
│   │   ├── FramerSecurity.tsx       # Wrapper for security.jsx
│   │   ├── FramerIntegrations.tsx   # Wrapper for integrations.jsx
│   │   └── FramerFooter.tsx         # Wrapper for footer.jsx
│   │
│   └── navigation/
│       └── framer-navbar-wrapper.tsx # Keep existing (NOT changing)
│
├── app/(marketing)/
│   └── page.tsx                     # Homepage - uses Framer sections
│
└── styles/
    └── framer.css                   # Combined Framer styles
```

### 2.2 Framer Export Components Analysis

| File | Purpose | Size | Key Features |
|------|---------|------|--------------|
| `hero.jsx` | Hero section | ~50KB | Phone mockup, floating cards, animations |
| `features.jsx` | Bento grid | ~30KB | Push notifications, transactions, portfolio cards |
| `security.jsx` | Security section | ~25KB | Feature list, signing message card |
| `integrations.jsx` | App integrations | ~20KB | Floating app cards with tilt effect |
| `navigation/footer.jsx` | Footer | ~40KB | CTA, newsletter, social links |

---

## Phase 3: Implementation Steps

### Step 3.1: Move Framer Export
```bash
# From project root
mv _framer_backup src/framer
```

### Step 3.2: Update Routes Configuration
Edit `src/framer/chunks/chunk-H6CE2FPO.js` to map to DMA routes:

```javascript
var routes = {
  "Fl6yrjvpP": { "path": "/blog" },
  "SnVPyW5ou": { "path": "/blog/:slug" },
  "UawE2tXef": { "path": "/thank-you" },
  "augiA20Il": { "path": "/" },
  "fdAzj6m95": { "path": "/support" },
  "gYrhetWRH": { "path": "/404" }
};
```

### Step 3.3: Create Wrapper Components

Each Framer component needs a React wrapper for proper integration.

**Pattern for wrappers:**
```tsx
// src/components/home/FramerHero.tsx
'use client';

import dynamic from 'next/dynamic';

// Dynamic import to avoid SSR issues with unframer
const Hero = dynamic(
  () => import('@/framer/hero').then(mod => mod.default),
  {
    ssr: false,
    loading: () => <div className="min-h-screen bg-[rgb(255,250,245)]" />
  }
);

export function FramerHero() {
  return <Hero />;
}
```

### Step 3.4: Update Homepage

**File**: `src/app/(marketing)/page.tsx`

```tsx
'use client';

import '@/styles/framer.css';
import { FramerNavbarWrapper } from '@/components/navigation/framer-navbar-wrapper';
import {
  FramerHero,
  FramerFeatures,
  FramerSecurity,
  FramerIntegrations,
  FramerFooter
} from '@/components/home';

export default function Home() {
  return (
    <div
      className="flex min-h-screen flex-col overflow-hidden supports-[overflow:clip]:overflow-clip"
      style={{ backgroundColor: 'var(--unframer-page-background, rgb(255, 250, 245))' }}
    >
      {/* Keep existing navbar */}
      <FramerNavbarWrapper />

      {/* Framer sections */}
      <main className="grow">
        <FramerHero />
        <FramerFeatures />
        <FramerSecurity />
        <FramerIntegrations />
      </main>

      {/* Framer footer */}
      <FramerFooter />
    </div>
  );
}
```

### Step 3.5: Update Exports Index

**File**: `src/components/home/index.ts`

```ts
// Framer section components (pixel-perfect from template)
export { FramerHero } from './FramerHero';
export { FramerFeatures } from './FramerFeatures';
export { FramerSecurity } from './FramerSecurity';
export { FramerIntegrations } from './FramerIntegrations';
export { FramerFooter } from './FramerFooter';

// Legacy components (keep for reference/fallback)
// export { HeroSection } from './HeroSection';
// export { FeaturesSection } from './FeaturesSection';
// etc.
```

---

## Phase 4: Content Customization

### 4.1 Text Content Changes
The Framer template uses Bitcoin wallet terminology. Update to generic/abstract content:

| Original (Wallet Template) | New (Generic/Abstract) |
|---------------------------|------------------------|
| "Reimagine How You Interact With Bitcoin" | Keep or replace with DMA-relevant headline |
| "Bitcoin Swap" | Generic transaction/action |
| "Magic Eden", "Ora", etc. | Keep as abstract floating cards |
| "Download for free" | Keep CTA style |

### 4.2 Preserving Abstract Design
Per requirements, keep floating cards and abstract design elements. No need to replace images with DMA-specific content.

### 4.3 External Resources
The Framer components load assets from:
- `https://framerusercontent.com/images/*` - Images/icons
- `https://fonts.gstatic.com/*` - Google Fonts (Figtree)

These should continue to work. If needed, download and host locally.

---

## Phase 5: Styling Integration

### 5.1 CSS Variables Mapping
Ensure CSS variables are available globally. Update `src/styles/framer.css`:

```css
/* Import unframer base */
@import "unframer/styles/reset.css";
@import "unframer/styles/framer.css";

:root {
    /* Framer Wallet Template colors */
    --unframer-white-65: rgba(255, 255, 255, 0.65);
    --unframer-background-stripes: rgba(0, 0, 0, 0.04);
    --unframer-blue: rgb(37, 47, 91);
    --unframer-sand-2: rgb(217, 214, 208);
    --unframer-dark-75: rgba(18, 17, 17, 0.75);
    --unframer-dark-2: rgb(23, 23, 23);
    --unframer-dark-1: rgb(18, 17, 17);
    --unframer-accent: rgb(231, 43, 54);
    --unframer-page-background: rgb(255, 250, 245);
    --unframer-dark-12: rgba(0, 0, 0, 0.12);
    --unframer-section-background: rgb(15, 15, 15);
    --unframer-dark-3: rgb(41, 41, 41);
    --unframer-white: rgb(255, 255, 255);
    --unframer-sand: rgb(242, 239, 235);

    /* Token mappings (required by Framer components) */
    --token-00b3173a-bf27-48f6-80de-26413c57d260: rgba(255, 255, 255, 0.65);
    --token-096d9ffc-dddd-4da9-a09a-0f4a85298957: rgba(0, 0, 0, 0.04);
    --token-0bd562c1-651e-4389-a8e0-9dfd78c95d67: rgb(37, 47, 91);
    --token-15b77526-7f93-4ce8-bf10-86d1154edcee: rgb(217, 214, 208);
    --token-41d30f55-9b4e-44cc-b8c9-7a9dbf3b173f: rgba(18, 17, 17, 0.75);
    --token-436ce9a2-c31c-4db6-83af-0ba60656da02: rgb(23, 23, 23);
    --token-5063bcbd-dba6-4769-9a1b-4b773f3c147f: rgb(18, 17, 17);
    --token-7b599e07-0947-4e56-b5d5-01368705c2d8: rgb(231, 43, 54);
    --token-a5a397af-bb8d-4024-9287-ba201fae94e5: rgb(255, 250, 245);
    --token-b6307651-ebd4-4774-a2be-020dda9944f3: rgba(0, 0, 0, 0.12);
    --token-c967cee1-a84f-4075-ba43-5a339a131241: rgb(15, 15, 15);
    --token-ca401f14-83e2-45d5-8367-d11b7be38e85: rgb(41, 41, 41);
    --token-cfd9c4d0-b28d-461b-9e29-c8d966d1a1a4: rgb(255, 255, 255);
    --token-ee4e1a2d-af5a-4f91-bfd9-0904c3822deb: rgb(242, 239, 235);
}
```

### 5.2 Font Loading
Figtree font is loaded by unframer components automatically. Ensure it's also available for non-Framer components:

```css
/* In framer.css or globals.css */
@import url('https://fonts.googleapis.com/css2?family=Figtree:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400;1,500;1,700&display=swap');
```

---

## Phase 6: Testing & Verification

### 6.1 Visual Comparison Checklist

| Section | Check Item | Status |
|---------|------------|--------|
| **Hero** | Cream background | |
| | Phone mockup visible | |
| | Floating transaction cards | |
| | Smoky/gradient effects | |
| | CTA button styling | |
| **Features** | Dark background | |
| | Bento grid layout | |
| | Push notification card | |
| | Transaction card | |
| | Portfolio insights card | |
| | Astronaut quote card | |
| **Security** | Gradient split bg | |
| | Security features list | |
| | Signing message card | |
| | Proper typography | |
| **Integrations** | Light background | |
| | Floating app cards | |
| | Tilt/3D effect on hover | |
| | Card shadows | |
| **Footer** | Dark background | |
| | Newsletter form | |
| | Social links | |
| | CTA section | |

### 6.2 Responsive Breakpoints
Test at these widths:
- Mobile: 320px, 375px, 414px
- Tablet: 768px, 810px
- Desktop: 1024px, 1200px, 1440px

### 6.3 Animation Verification
- Scroll animations trigger correctly
- Hover effects work
- No janky transitions
- Performance is smooth (60fps)

---

## Phase 7: Cleanup & Documentation

### 7.1 Remove Legacy Components
After verification, clean up old custom implementations:
```bash
# These can be removed or moved to an archive folder:
# src/components/home/HeroSection.tsx
# src/components/home/FeaturesSection.tsx
# src/components/home/SecuritySection.tsx
# src/components/home/IntegrationsSection.tsx
# src/components/home/FooterSection.tsx
# src/components/home/BentoCard.tsx
# src/components/home/FeatureCardTilted.tsx
```

### 7.2 Update CLAUDE.md
Add notes about Framer components:
```markdown
## Framer Components

The homepage uses pixel-perfect Framer components via the `unframer` library.

### Source
- Exported from: "Wallet Template (copy)" Framer project
- Location: `src/framer/`

### Usage
Components are wrapped in React components at `src/components/home/Framer*.tsx`

### Styling
- CSS variables defined in `src/styles/framer.css`
- Colors follow Framer Wallet Template palette
```

---

## Implementation Order

1. **Foundation** (15 min)
   - Move `_framer_backup` to `src/framer`
   - Verify imports work

2. **Styles** (10 min)
   - Update `src/styles/framer.css` with token variables
   - Ensure fonts load

3. **Create Wrappers** (30 min)
   - `FramerHero.tsx`
   - `FramerFeatures.tsx`
   - `FramerSecurity.tsx`
   - `FramerIntegrations.tsx`
   - `FramerFooter.tsx`

4. **Update Homepage** (10 min)
   - Replace current sections with Framer wrappers
   - Keep navbar

5. **Test & Verify** (20 min)
   - Visual comparison with screenshots
   - Responsive testing
   - Animation testing

6. **Cleanup** (10 min)
   - Archive legacy components
   - Update documentation

**Total estimated time: ~95 minutes**

---

## Troubleshooting

### Common Issues

**Issue**: "Module not found" errors
**Solution**: Check import paths, ensure `src/framer` exists

**Issue**: Styles not applying
**Solution**: Verify CSS imports in correct order, check token variables

**Issue**: SSR errors with unframer
**Solution**: Use `dynamic()` import with `ssr: false`

**Issue**: Animations not working
**Solution**: Ensure `framer-motion` is installed and compatible version

**Issue**: Fonts not loading
**Solution**: Check network tab, verify Google Fonts URLs are accessible

---

## Reference Screenshots

The following screenshots were provided for visual reference:
1. Hero: Cream bg, phone mockup, floating cards
2. Features: Dark bento grid layout
3. Security: Gradient split with feature list
4. Integrations: Light bg with floating app cards
5. Footer: Dark with newsletter and social links

---

## Approval Checklist

Before starting implementation:
- [ ] User approves this plan
- [ ] Dependencies verified
- [ ] Framer export folder accessible
- [ ] Development server running
