# Framer Typography System

This document describes the DMA Academion typography system, adapted from Framer's design language.

## Table of Contents

1. [Overview](#overview)
2. [Core Principles](#core-principles)
3. [Typography Scale](#typography-scale)
4. [Font Weights](#font-weights)
5. [Usage Guide](#usage-guide)
6. [Component Patterns](#component-patterns)
7. [Migration Checklist](#migration-checklist)

---

## Overview

DMA Academion uses **Inter** as the primary typeface across all interfaces. The typography system is based on Framer's design principles, featuring:

- **Minimal weight palette**: 400, 500, 700, 900 only
- **Universal letter spacing**: -0.01em on all text
- **Responsive scaling**: Aggressive heading reductions, stable body text
- **OpenType features**: Enhanced Inter rendering (cv03, cv04, cv09, cv11, blwf)

---

## Core Principles

### 1. Letter Spacing
**All text uses -0.01em letter spacing** (Framer's universal standard)

```css
/* Applied globally */
letter-spacing: -0.01em;
```

### 2. Font Weights
Framer uses a **minimal weight palette** for visual hierarchy:

| Weight | Value | Usage |
|--------|-------|-------|
| `font-normal` | 400 | Body text, badges, captions |
| `font-medium` | 500 | Enhanced body, buttons, subtle emphasis |
| `font-bold` | 700 | All headings (H1-H6), strong structure |
| `font-black` | 900 | Extra emphasis (inline bold within paragraphs) |

**⚠️ Avoid**: `font-semibold` (600) and `font-light` (300) - not part of Framer's system

### 3. Responsive Typography
- **Headings scale aggressively**: H2 reduces 33% from desktop to mobile (36px → 24px)
- **Body text stays stable**: 18px across all breakpoints for readability

---

## Typography Scale

### Headings

#### H1 - Display Heading
- **Desktop**: 48px (text-4xl)
- **Line height**: 54px (1.125)
- **Weight**: Bold (700)
- **Usage**: Page titles, hero sections

```tsx
<h1 className="text-4xl font-bold">Az új DMA Akadémia</h1>
```

#### H2 - Section Heading (Responsive)
- **Desktop**: 36px (text-3xl)
- **Tablet**: 30px (text-2xl) - below 1024px
- **Mobile**: 24px (text-xl) - below 640px
- **Line height**: 42px / 36px / 30px
- **Weight**: Bold (700)
- **Usage**: Major section headings

```tsx
<h2 className="text-2xl md:text-3xl font-bold">Kiemelt tartalmak</h2>
```

#### H3 - Subsection Heading
- **Size**: 24px (text-xl)
- **Line height**: 30px (1.25)
- **Weight**: Bold (700)
- **Usage**: Card titles, subsection headings

```tsx
<h3 className="text-xl font-bold">Kurzus címe</h3>
```

#### H4 - Small Heading
- **Size**: 20px (text-lg)
- **Line height**: 28px (1.4)
- **Weight**: Bold (700)
- **Usage**: Sidebar headings, small sections

```tsx
<h4 className="text-lg font-bold">Modul címe</h4>
```

#### H5 - Micro Heading (Responsive)
- **Desktop**: 16px (text-sm)
- **Mobile**: 14px (text-xs) - below 640px
- **Line height**: 22px / 20px
- **Weight**: Bold (700)
- **Usage**: List item titles, compact cards

```tsx
<h5 className="text-sm md:text-base font-bold">Lecke címe</h5>
```

#### H6 - Minimal Heading
- **Size**: 14px (text-xs)
- **Line height**: 20px (1.429)
- **Weight**: Bold (700)
- **Usage**: Small labels, compact UI elements

```tsx
<h6 className="text-xs font-bold">Kategória</h6>
```

---

### Body Text

#### Body Large (Primary)
- **Size**: 18px (text-base)
- **Line height**: 24px (1.333)
- **Weight**: Normal (400)
- **Usage**: Main body text, descriptions, paragraphs

```tsx
<p className="text-base font-normal">
  Ez a DMA Akadémia hivatalos platformja...
</p>
```

**Utility Class**:
```tsx
<p className="body-large">Main content text</p>
```

#### Body Medium (Enhanced)
- **Size**: 18px (text-base)
- **Line height**: 24px (1.333)
- **Weight**: Medium (500)
- **Usage**: Emphasized content, testimonials, feature descriptions

```tsx
<p className="text-base font-medium">
  „Fantasztikus kurzus volt!" - Tóth János
</p>
```

**Utility Class**:
```tsx
<p className="body-medium">Enhanced emphasis text</p>
```

#### Body Regular (Secondary)
- **Size**: 16px (text-sm)
- **Line height**: 22px (1.375)
- **Weight**: Normal (400)
- **Usage**: Secondary descriptions, metadata, supporting text

```tsx
<p className="text-sm font-normal">
  Fedezd fel a legújabb tananyagokat
</p>
```

**Utility Class**:
```tsx
<p className="body-regular">Secondary body text</p>
```

#### Body Small (Captions)
- **Size**: 14px (text-xs)
- **Line height**: 20px (1.429)
- **Weight**: Normal (400)
- **Usage**: Captions, badges, small notes, metadata

```tsx
<p className="text-xs font-normal">
  Létrehozva: 2024.11.24
</p>
```

**Utility Class**:
```tsx
<p className="body-small">Caption or badge text</p>
```

---

### Component Typography

#### Buttons
- **Size**: 16px (text-sm)
- **Line height**: 22px
- **Weight**: Medium (500)

```tsx
<button className="text-sm font-medium">
  Kurzus megtekintése
</button>
```

**Utility Class**:
```tsx
<button className="btn-typography">Click me</button>
```

#### Badges
- **Size**: 14px (text-xs)
- **Line height**: 20px
- **Weight**: Normal (400)

```tsx
<span className="text-xs font-normal">Webinár</span>
```

**Utility Class**:
```tsx
<span className="badge-typography">Label</span>
```

#### Inline Bold
- **Weight**: Black (900)
- **Usage**: Strong emphasis within paragraphs

```tsx
<p className="text-base">
  Ez egy <span className="font-black">nagyon fontos</span> üzenet.
</p>
```

**Utility Class**:
```tsx
<span className="inline-bold">emphasized text</span>
```

---

## Usage Guide

### Tailwind Classes

Use these Tailwind utility classes for typography:

```tsx
// Headings
<h1 className="text-4xl font-bold">H1</h1>
<h2 className="text-2xl md:text-3xl font-bold">H2</h2>
<h3 className="text-xl font-bold">H3</h3>
<h4 className="text-lg font-bold">H4</h4>
<h5 className="text-sm md:text-base font-bold">H5</h5>
<h6 className="text-xs font-bold">H6</h6>

// Body text
<p className="text-base font-normal">Body Large</p>
<p className="text-base font-medium">Body Medium</p>
<p className="text-sm font-normal">Body Regular</p>
<p className="text-xs font-normal">Body Small</p>

// Components
<button className="text-sm font-medium">Button</button>
<span className="text-xs font-normal">Badge</span>
```

### Custom Utility Classes

Use semantic utility classes for cleaner code:

```tsx
<p className="body-large">Primary content</p>
<p className="body-medium">Enhanced emphasis</p>
<p className="body-regular">Secondary content</p>
<p className="body-small">Caption or metadata</p>
<button className="btn-typography">Action</button>
<span className="badge-typography">Label</span>
<strong className="inline-bold">Emphasis</strong>
```

---

## Component Patterns

### Card Component

```tsx
<div className="card">
  {/* Badges - 14px, weight 400 */}
  <span className="text-xs font-normal">Webinár</span>
  <span className="text-xs font-normal">Marketing</span>

  {/* Title - H3 or H5 depending on card size */}
  <h3 className="text-xl font-bold">Kurzus címe</h3>

  {/* Description - Body Regular */}
  <p className="text-sm font-normal">
    Rövid leírás a kurzusról...
  </p>

  {/* Metadata - Body Small */}
  <p className="text-xs font-normal">
    Oktató: <span className="font-medium">Nagy Anna</span>
  </p>

  {/* Button - 16px, weight 500 */}
  <button className="text-sm font-medium">
    Megtekintés
  </button>
</div>
```

### Hero Section

```tsx
<section className="hero">
  {/* Badge - Body Small */}
  <span className="text-xs font-normal">Új</span>

  {/* Main heading - H1 */}
  <h1 className="text-4xl font-bold">
    Az új DMA Akadémia
  </h1>

  {/* Subheading - H2 Responsive */}
  <h2 className="text-2xl md:text-3xl font-bold">
    Tanulj szakértőktől
  </h2>

  {/* Description - Body Large */}
  <p className="text-base font-normal">
    Fedezd fel a szakmai fejlődés lehetőségeit...
  </p>

  {/* CTA Button */}
  <button className="text-sm font-medium">
    Fedezd fel a kurzusokat
  </button>
</section>
```

### Feature Section

```tsx
<div className="feature">
  {/* Icon with label - H5 */}
  <h5 className="text-sm font-bold">Funkció neve</h5>

  {/* Description - Body Regular */}
  <p className="text-sm font-normal">
    Leírás a funkcióról...
  </p>
</div>
```

---

## Migration Checklist

When updating components to Framer typography, follow this checklist:

### 1. Font Weights

- [ ] Replace `font-semibold` (600) with `font-medium` (500) or `font-bold` (700)
- [ ] Replace `font-light` (300) with `font-normal` (400)
- [ ] Use `font-black` (900) for strong inline emphasis only

### 2. Headings

- [ ] H1: `text-4xl font-bold` (48px)
- [ ] H2: `text-2xl md:text-3xl font-bold` (24px → 36px responsive)
- [ ] H3: `text-xl font-bold` (24px)
- [ ] H4: `text-lg font-bold` (20px)
- [ ] H5: `text-sm md:text-base font-bold` (14px → 16px responsive)
- [ ] H6: `text-xs font-bold` (14px)

### 3. Body Text

- [ ] Primary content: `text-base font-normal` (18px)
- [ ] Secondary content: `text-sm font-normal` (16px)
- [ ] Captions/metadata: `text-xs font-normal` (14px)
- [ ] Enhanced emphasis: `text-base font-medium` (18px, weight 500)

### 4. Components

- [ ] Buttons: `text-sm font-medium` (16px, weight 500)
- [ ] Badges: `text-xs font-normal` (14px, weight 400)
- [ ] Links: Match surrounding text size, add hover states

### 5. Letter Spacing

Letter spacing is automatically applied via Tailwind config. If using custom CSS:

```css
letter-spacing: -0.01em;
```

### 6. Responsive Breakpoints

- [ ] H2: Scale from 36px → 30px → 24px
- [ ] H5: Scale from 16px → 14px
- [ ] Body text: Keep stable at 18px

---

## Implementation Status

### ✅ Completed

**Core Typography System:**
- [x] Tailwind config updated with Framer font sizes
- [x] Tailwind config updated with font weights (400, 500, 700, 900)
- [x] Tailwind config updated with letter spacing (-0.01em)
- [x] Tailwind config updated with line height ratios
- [x] CSS variables updated in globals.css
- [x] OpenType features enabled in body element
- [x] Heading styles (H1-H6) created with responsive breakpoints
- [x] Body text utility classes created (.body-large, .body-medium, etc.)
- [x] Component typography classes created (.btn-typography, .badge-typography)
- [x] Updated DMA primary button with Framer typography

**Homepage Components:**
- [x] HeroCourseShowcase component (H2, H3, body text, buttons)
- [x] PremiumCourseCard component (H3, badges, body text, button)

**Navigation Components:**
- [x] FramerNavbarWrapper component (mobile menu buttons)

**Courses Pages:**
- [x] /courses page (H2, H3, body text, all buttons)
- [x] CourseCarouselSection component (H2, description, buttons)

**Course Detail Pages:**
- [x] ClientCourseDetailPage.tsx (FAQ headings)
- [x] Hero1ConversionFocused.tsx (instructor name, course type badge)
- [x] CourseCurriculumSection.tsx (module titles)
- [x] CourseFeaturesSection.tsx (feature titles)
- [x] RelatedCoursesSection.tsx (link button)
- [x] CompactInstructorSection.tsx (toggle buttons)

**Course Player Components:**
- [x] NewSidebar.tsx (module labels, module titles)
- [x] EnhancedLessonSidebar.tsx (module titles)
- [x] CourseCompletionModal.tsx (course title)
- [x] EnhancedProgressSystem.tsx (progress label)
- [x] LessonOverviewTab.tsx (section headings)
- [x] GamificationSystem.tsx (achievement headings, section titles)

**Dashboard Components:**
- [x] Dashboard page (company banner badge)
- [x] WelcomeHero.tsx (quick action titles, empty state, course cards)
- [x] StatCard.tsx (label text)
- [x] QuickActions.tsx (section heading)
- [x] GoalProgressWidget.tsx (goal titles)
- [x] StreakCalendar.tsx (heading, tooltip values)
- [x] RecentActivitySection.tsx (section heading)
- [x] CarouselCourseCard.tsx (badges)
- [x] ContinueCoursePreview.tsx (empty state, CTA, link)
- [x] LearningHoursChart.tsx (section heading)
- [x] RecommendedCourses.tsx (section heading, course titles)
- [x] DashboardChart.tsx (section heading)

**Auth Pages:**
- [x] Login page (verification success message)

**Homepage Components:**
- [x] ConsumerHeroSection.tsx (badges, buttons, value props, social proof)
- [x] PricingPreviewSection.tsx (badges, buttons)
- [x] CourseTypesSection.tsx (CTA links, bottom text)
- [x] HomepageFAQ.tsx (FAQ questions, contact CTA)
- [x] LargeTestimonial.tsx (testimonial name)

**Admin Components:**
- [x] admin/reports/page.tsx (ticket headings, user info, response names)
- [x] admin/analytics/page.tsx (section headers, chart titles)
- [x] admin/notifications/page.tsx (notification titles)
- [x] admin/preview/heroes/page.tsx (variant names, info panel)
- [x] admin/system-status/page.tsx (section headers)
- [x] admin/users/page.tsx (section headers, table headers)
- [x] admin/audit-log/page.tsx (console display, legend)
- [x] admin/dashboard/page.tsx (stat cards, quick actions, management links)
- [x] admin/roles/page.tsx (section headers, table headers)
- [x] PaymentManagement.tsx (payment amounts)

### 🔄 In Progress

- [x] Update remaining homepage components
- [x] Update course detail pages
- [x] Update course player components
- [x] Update remaining dashboard components
- [x] Update admin components
- [ ] Update form components (inputs, labels)
- [ ] Update modal/dialog components
- [ ] Update footer components

### 📋 Todo

- [ ] Systematic component file audit (180+ files)
- [ ] Visual regression testing
- [ ] Responsive breakpoint testing
- [ ] Accessibility audit (contrast ratios, font sizes)
- [ ] Browser compatibility testing
- [ ] Performance optimization (font loading)

---

## OpenType Features

Inter font is loaded with enhanced OpenType features for better rendering:

```css
body {
  font-feature-settings:
    'cv03' 1,  /* Simplified g */
    'cv04' 1,  /* Open digits */
    'cv09' 1,  /* Curved r */
    'cv11' 1,  /* Single-story a */
    'blwf' 1;  /* Below-base forms */
}
```

These features are automatically applied to all text.

---

## Resources

- **Font**: [Inter on Google Fonts](https://fonts.google.com/specimen/Inter)
- **Framer Design**: /framer directory (reference implementation)
- **Tailwind Config**: /tailwind.config.js
- **Global Styles**: /src/styles/globals.css

---

## Notes for Developers

1. **Consistency**: Always use Tailwind utility classes for typography when possible
2. **Semantic Classes**: Use `.body-large`, `.btn-typography` for cleaner, more maintainable code
3. **Responsive**: Remember H2 and H5 have responsive scaling built-in
4. **Weights**: Stick to 400, 500, 700, 900 only - avoid 300 and 600
5. **Letter Spacing**: Don't override the -0.01em default unless absolutely necessary
6. **Testing**: Test responsive breakpoints at 640px and 1024px
7. **Accessibility**: Ensure contrast ratios meet WCAG AA standards (4.5:1 for normal text, 3:1 for large text)

---

**Last Updated**: November 24, 2025
**Version**: 1.0.0
**Maintained by**: DMA Development Team
