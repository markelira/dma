# Coursera.org Homepage 1:1 Replication Plan

**Date**: 2025-01-27  
**Objective**: Replicate Coursera.org homepage exactly as it appears  
**Status**: Planning Phase

---

## 📋 Executive Summary

This document outlines a comprehensive plan to replicate Coursera.org's homepage pixel-perfect, including all visual elements, interactions, animations, and responsive behaviors. The implementation will be done using Next.js 15, TypeScript, Tailwind CSS, and Framer Motion.

### Key Principles
1. **Pixel-Perfect Accuracy**: Match every visual element exactly
2. **Functional Parity**: Replicate all interactions and animations
3. **Responsive Fidelity**: Match behavior across all breakpoints
4. **Performance**: Maintain fast load times and smooth animations

---

## 🔍 Phase 1: Comprehensive Analysis

### 1.1 Visual Structure Analysis

Based on Coursera.org's current homepage, the structure is:

```
┌─────────────────────────────────────────┐
│  NAVIGATION BAR                          │
│  - Logo (left)                           │
│  - Search bar (center)                   │
│  - Explore, For Business, For Universities│
│  - Log In / Join for Free (right)        │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│  HERO SECTION                            │
│  - Large headline: "Learn without       │
│    limits"                               │
│  - Subheadline                           │
│  - "Join for Free" CTA button           │
│  - Background: Gradient or image         │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│  PROMOTIONAL BANNER                     │
│  - Coursera Plus offer                  │
│  - Discount percentage                 │
│  - "Get Coursera Plus" CTA             │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│  PARTNER LOGOS SECTION                  │
│  - "Learn from 300+ leading companies   │
│    and universities"                    │
│  - Logo carousel (scrollable)           │
│  - Universities: Stanford, Yale, etc.   │
│  - Companies: Google, IBM, etc.         │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│  COURSE CATEGORIES                      │
│  - Grid of category cards               │
│  - Icons + Category names               │
│  - Hover effects                        │
│  - Categories: Data Science, Business,  │
│    Computer Science, Health, etc.       │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│  TRENDING COURSES                       │
│  - Section title: "Trending courses"    │
│  - Horizontal scrollable carousel       │
│  - Course cards with:                   │
│    - Thumbnail image                    │
│    - Course title                       │
│    - Instructor name                    │
│    - Rating (stars + number)            │
│    - Enrollment count                   │
│    - "Free" or price badge              │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│  FEATURED COURSES (Multiple Sections)   │
│  - "Popular courses"                    │
│  - "New courses"                        │
│  - "Specializations"                    │
│  - Each with horizontal carousel        │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│  TESTIMONIALS / SOCIAL PROOF            │
│  - User quotes                          │
│  - User photos                          │
│  - Course completion stats              │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│  FOOTER                                  │
│  - Multiple columns:                    │
│    - Coursera (About, What We Offer)    │
│    - Community (Learners, Partners)     │
│    - More (Careers, Blog, Press)        │
│  - Social media links                   │
│  - Language selector                    │
│  - Copyright                            │
└─────────────────────────────────────────┘
```

### 1.2 Design System Analysis

#### Color Palette
- **Primary Blue**: `#0056D2` (Coursera blue)
- **Primary Blue Hover**: `#004494`
- **Text Primary**: `#1C1C1C` (Dark gray)
- **Text Secondary**: `#6A6F73` (Medium gray)
- **Background**: `#FFFFFF` (White)
- **Background Light**: `#F7F9FA` (Light gray)
- **Border**: `#E0E0E0` (Light border)
- **Success/Green**: `#0F7B0F`
- **Warning/Yellow**: `#F9AB00`
- **Error/Red**: `#D32F2F`

#### Typography
- **Font Family**: 
  - Primary: "Source Sans Pro" (Coursera's custom font)
  - Fallback: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
- **Font Sizes**:
  - Hero Headline: 48px-64px (responsive)
  - Section Titles: 32px-40px
  - Card Titles: 18px-20px
  - Body: 16px
  - Small: 14px
- **Font Weights**:
  - Regular: 400
  - Semibold: 600
  - Bold: 700

#### Spacing System
- Base unit: 8px
- Common spacing: 16px, 24px, 32px, 48px, 64px
- Section padding: 64px-96px vertical
- Container max-width: 1200px-1400px

#### Component Styles
- **Buttons**:
  - Primary: Blue background, white text, rounded corners
  - Secondary: White background, blue border, blue text
  - Border radius: 4px-8px
  - Padding: 12px 24px
- **Cards**:
  - White background
  - Border: 1px solid #E0E0E0
  - Border radius: 8px
  - Box shadow: subtle on hover
  - Padding: 16px-24px
- **Input Fields**:
  - Border: 1px solid #E0E0E0
  - Border radius: 4px
  - Padding: 12px 16px
  - Focus: Blue border

### 1.3 Interaction Patterns

#### Navigation
- Sticky header (stays at top on scroll)
- Search bar expands on focus
- Dropdown menus for "Explore", "For Business", etc.
- Mobile: Hamburger menu

#### Hero Section
- Smooth scroll on CTA click
- Background may have subtle animation

#### Course Carousels
- Horizontal scroll with arrow navigation
- Touch/swipe support on mobile
- Infinite scroll or pagination dots
- Hover effects on cards (lift, shadow)

#### Category Cards
- Hover: Scale up slightly, shadow increases
- Click: Navigate to category page

#### Course Cards
- Hover: Shadow increases, slight lift
- Click: Navigate to course detail
- Image overlay on hover (if applicable)

### 1.4 Responsive Breakpoints

- **Mobile**: < 768px
  - Single column layouts
  - Stacked navigation
  - Smaller text sizes
  - Touch-optimized carousels
- **Tablet**: 768px - 1024px
  - 2-column grids
  - Adjusted spacing
- **Desktop**: > 1024px
  - Full multi-column layouts
  - Maximum container width
  - Hover effects enabled

### 1.5 Animation Details

- **Page Load**: Fade-in animations for sections
- **Scroll**: Elements fade in as they enter viewport
- **Hover**: Smooth transitions (200-300ms)
- **Carousel**: Smooth slide transitions
- **Loading States**: Skeleton loaders for course cards

---

## 🏗️ Phase 2: Technical Architecture

### 2.1 Technology Stack

**Frontend Framework**
- Next.js 15 (App Router)
- React 18+
- TypeScript (strict mode)

**Styling**
- Tailwind CSS (for utility classes)
- CSS Modules (for component-specific styles)
- CSS Variables (for theming)

**Animations**
- Framer Motion (for scroll animations, transitions)
- CSS Transitions (for simple hover effects)

**UI Components**
- Shadcn/UI (base components)
- Custom components (Coursera-specific)

**Data Fetching**
- TanStack Query (React Query)
- Fetch API / Axios

**Image Optimization**
- Next.js Image component
- WebP format with fallbacks

### 2.2 Component Architecture

```
src/
├── app/
│   └── (marketing)/
│       └── page.tsx                    # Homepage
├── components/
│   ├── coursera/
│   │   ├── navigation/
│   │   │   ├── CourseraNavbar.tsx
│   │   │   ├── SearchBar.tsx
│   │   │   └── MobileMenu.tsx
│   │   ├── hero/
│   │   │   └── CourseraHero.tsx
│   │   ├── promotional/
│   │   │   └── PromotionalBanner.tsx
│   │   ├── partners/
│   │   │   └── PartnerLogos.tsx
│   │   ├── categories/
│   │   │   ├── CategoryGrid.tsx
│   │   │   └── CategoryCard.tsx
│   │   ├── courses/
│   │   │   ├── CourseCarousel.tsx
│   │   │   ├── CourseCard.tsx
│   │   │   └── CourseCardSkeleton.tsx
│   │   ├── testimonials/
│   │   │   └── TestimonialsSection.tsx
│   │   └── footer/
│   │       └── CourseraFooter.tsx
│   └── ui/                             # Base UI components
│       ├── button.tsx
│       ├── card.tsx
│       └── carousel.tsx
└── lib/
    ├── utils.ts
    └── constants.ts                     # Coursera-specific constants
```

### 2.3 Data Structure

```typescript
// Course data structure
interface Course {
  id: string;
  title: string;
  instructor: string;
  instructorImage?: string;
  thumbnail: string;
  rating: number;
  reviewCount: number;
  enrollmentCount: number;
  price: number | 'Free';
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: string;
  category: string;
}

// Category data structure
interface Category {
  id: string;
  name: string;
  icon: string; // SVG or icon name
  courseCount: number;
  color: string; // Category-specific color
}

// Partner data structure
interface Partner {
  id: string;
  name: string;
  logo: string;
  type: 'university' | 'company';
}
```

---

## 📐 Phase 3: Section-by-Section Implementation Plan

### Section 1: Navigation Bar

**File**: `src/components/coursera/navigation/CourseraNavbar.tsx`

#### Specifications
- **Height**: 64px (desktop), 56px (mobile)
- **Background**: White with subtle shadow
- **Sticky**: Yes, stays at top on scroll
- **Layout**:
  - Left: Logo + "Coursera" text
  - Center: Search bar (expandable)
  - Right: Navigation links + Auth buttons

#### Components Needed
1. **Logo Component**
   - Coursera logo SVG
   - Text "Coursera" next to logo
   - Link to homepage

2. **SearchBar Component**
   - Input field with placeholder "What do you want to learn?"
   - Search icon
   - Expandable on focus (desktop)
   - Full-width on mobile

3. **Navigation Links**
   - "Explore" (dropdown)
   - "For Business"
   - "For Universities"
   - Dropdown menus with sub-items

4. **Auth Buttons**
   - "Log In" (secondary button)
   - "Join for Free" (primary button)

#### Implementation Steps
1. Create base navbar structure
2. Add logo and branding
3. Implement search bar with expand functionality
4. Add navigation links with dropdowns
5. Add auth buttons
6. Implement mobile hamburger menu
7. Add sticky behavior
8. Add scroll shadow effect

---

### Section 2: Hero Section

**File**: `src/components/coursera/hero/CourseraHero.tsx`

#### Specifications
- **Height**: 500px-600px (desktop), 400px (mobile)
- **Background**: Gradient or hero image
- **Layout**: Centered content
- **Typography**: Large headline, medium subheadline

#### Content Structure
```tsx
<CourseraHero>
  <Headline>Learn without limits</Headline>
  <Subheadline>
    Start, switch, or advance your career with thousands of courses,
    Professional Certificates, and degrees from world-class universities
    and companies.
  </Subheadline>
  <CTAButton>Join for Free</CTAButton>
  <TrustIndicators>
    - 7,000+ courses
    - 300+ partners
    - 100M+ learners
  </TrustIndicators>
</CourseraHero>
```

#### Implementation Steps
1. Create hero container with background
2. Add headline with responsive typography
3. Add subheadline text
4. Add primary CTA button
5. Add trust indicators/stats
6. Add subtle background animation (if applicable)
7. Implement responsive breakpoints

---

### Section 3: Promotional Banner

**File**: `src/components/coursera/promotional/PromotionalBanner.tsx`

#### Specifications
- **Height**: 80px-100px
- **Background**: Blue gradient or solid color
- **Layout**: Centered content with CTA
- **Dismissible**: Optional close button

#### Content Structure
```tsx
<PromotionalBanner>
  <Message>
    Save up to 50% on Coursera Plus! 
    <Highlight>Limited time offer</Highlight>
  </Message>
  <CTAButton>Get Coursera Plus</CTAButton>
  <CloseButton>×</CloseButton>
</PromotionalBanner>
```

#### Implementation Steps
1. Create banner container
2. Add promotional message
3. Add CTA button
4. Add close/dismiss functionality
5. Add localStorage to remember dismissal
6. Style with Coursera blue

---

### Section 4: Partner Logos

**File**: `src/components/coursera/partners/PartnerLogos.tsx`

#### Specifications
- **Layout**: Horizontal scrollable carousel
- **Logos**: Grayscale, color on hover
- **Auto-scroll**: Optional, slow continuous scroll
- **Manual scroll**: Arrow buttons or drag

#### Content Structure
```tsx
<PartnerLogos>
  <SectionTitle>
    Learn from 300+ leading companies and universities
  </SectionTitle>
  <LogoCarousel>
    {partners.map(partner => (
      <PartnerLogo
        key={partner.id}
        logo={partner.logo}
        name={partner.name}
      />
    ))}
  </LogoCarousel>
</PartnerLogos>
```

#### Implementation Steps
1. Create carousel container
2. Add section title
3. Implement horizontal scroll
4. Add partner logos (SVG/images)
5. Add hover effects (grayscale → color)
6. Add navigation arrows
7. Implement auto-scroll (optional)
8. Add touch/swipe support

---

### Section 5: Course Categories

**File**: `src/components/coursera/categories/CategoryGrid.tsx`

#### Specifications
- **Layout**: Responsive grid (4-6 columns desktop, 2 mobile)
- **Card Size**: Square or rectangular cards
- **Hover**: Scale + shadow increase
- **Icons**: Category-specific icons/colors

#### Categories to Include
1. Data Science
2. Business
3. Computer Science
4. Information Technology
5. Language Learning
6. Health
7. Personal Development
8. Physical Science and Engineering
9. Social Sciences
10. Arts and Humanities
11. Math and Logic
12. And more...

#### Implementation Steps
1. Create grid container
2. Create CategoryCard component
3. Add category icons (SVG or icon library)
4. Add category names
5. Add hover effects
6. Add click navigation
7. Implement responsive grid
8. Add loading states

---

### Section 6: Course Carousels

**File**: `src/components/coursera/courses/CourseCarousel.tsx`

#### Specifications
- **Layout**: Horizontal scrollable
- **Card Width**: ~320px per card
- **Navigation**: Arrow buttons + scroll
- **Cards Visible**: 3-4 on desktop, 1-2 on mobile

#### Course Card Structure
```tsx
<CourseCard>
  <Thumbnail>
    <Image src={course.thumbnail} />
    <OverlayBadge>{course.price}</OverlayBadge>
  </Thumbnail>
  <Content>
    <Title>{course.title}</Title>
    <Instructor>{course.instructor}</Instructor>
    <Rating>
      <Stars rating={course.rating} />
      <ReviewCount>({course.reviewCount})</ReviewCount>
    </Rating>
    <EnrollmentCount>{course.enrollmentCount} already enrolled</EnrollmentCount>
  </Content>
</CourseCard>
```

#### Carousel Sections Needed
1. **Trending Courses**
2. **Popular Courses**
3. **New Courses**
4. **Specializations**
5. **Professional Certificates**

#### Implementation Steps
1. Create CourseCarousel component
2. Create CourseCard component
3. Add thumbnail with image
4. Add course metadata (title, instructor, rating)
5. Add price/free badge
6. Implement horizontal scroll
7. Add navigation arrows
8. Add touch/swipe support
9. Add skeleton loaders
10. Implement infinite scroll or pagination

---

### Section 7: Testimonials / Social Proof

**File**: `src/components/coursera/testimonials/TestimonialsSection.tsx`

#### Specifications
- **Layout**: Grid or carousel
- **Card Style**: Quote card with user info
- **Content**: User quote, photo, name, course

#### Implementation Steps
1. Create testimonials container
2. Create testimonial card component
3. Add user photos
4. Add quotes
5. Add user information
6. Add course references
7. Implement carousel or grid layout

---

### Section 8: Footer

**File**: `src/components/coursera/footer/CourseraFooter.tsx`

#### Specifications
- **Background**: Dark gray or white
- **Layout**: Multi-column grid
- **Sections**: Links, social media, language selector

#### Footer Structure
```
┌─────────────────────────────────────────┐
│  COURSERA          COMMUNITY    MORE   │
│  - About          - Learners    - Careers│
│  - What We Offer  - Partners    - Blog   │
│  - Careers        - Developers  - Press   │
│  - Catalog        - Beta Testers         │
│  - Certificates                         │
│  - For Enterprise                       │
│  - Become a Partner                     │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│  [Social Icons]  [Language Selector]    │
│  © 2025 Coursera Inc. All rights reserved│
└─────────────────────────────────────────┘
```

#### Implementation Steps
1. Create footer container
2. Create link columns
3. Add social media icons
4. Add language selector
5. Add copyright
6. Style with proper spacing

---

## 🎨 Phase 4: Design System Implementation

### 4.1 Color System

**File**: `tailwind.config.js` or `src/styles/coursera.css`

```javascript
// Tailwind config extension
theme: {
  extend: {
    colors: {
      coursera: {
        blue: '#0056D2',
        'blue-hover': '#004494',
        'blue-light': '#E3F2FD',
        text: {
          primary: '#1C1C1C',
          secondary: '#6A6F73',
        },
        bg: {
          light: '#F7F9FA',
        },
        border: '#E0E0E0',
      },
    },
  },
}
```

### 4.2 Typography System

**File**: `src/styles/coursera.css`

```css
/* Import Source Sans Pro (or use system font as fallback) */
@import url('https://fonts.googleapis.com/css2?family=Source+Sans+Pro:wght@400;600;700&display=swap');

:root {
  --font-coursera: 'Source Sans Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  
  /* Font sizes */
  --text-hero: clamp(2.5rem, 5vw, 4rem);
  --text-section-title: clamp(1.75rem, 3vw, 2.5rem);
  --text-card-title: 1.125rem;
  --text-body: 1rem;
  --text-small: 0.875rem;
}
```

### 4.3 Component Styles

Create base component styles matching Coursera's design:
- Button styles (primary, secondary)
- Card styles
- Input styles
- Carousel styles

---

## 🚀 Phase 5: Implementation Timeline

### Week 1: Foundation & Navigation
- **Day 1-2**: Setup, design system, navigation bar
- **Day 3**: Hero section
- **Day 4**: Promotional banner
- **Day 5**: Partner logos carousel

### Week 2: Core Content Sections
- **Day 1-2**: Category grid
- **Day 3-4**: Course carousels (all sections)
- **Day 5**: Course cards refinement

### Week 3: Polish & Footer
- **Day 1**: Testimonials section
- **Day 2**: Footer
- **Day 3**: Responsive design testing
- **Day 4**: Animation refinements
- **Day 5**: Final polish and testing

**Total Estimated Time: 15 days**

---

## ✅ Phase 6: Quality Checklist

### Visual Accuracy
- [ ] Colors match Coursera exactly (use color picker)
- [ ] Typography matches (font, sizes, weights)
- [ ] Spacing matches (measure with dev tools)
- [ ] Border radius matches
- [ ] Shadows match
- [ ] Icons match (use same icon library or SVGs)

### Functional Parity
- [ ] All interactions work (hover, click, scroll)
- [ ] Carousels scroll smoothly
- [ ] Navigation dropdowns work
- [ ] Search functionality works
- [ ] Mobile menu works
- [ ] All links navigate correctly

### Responsive Design
- [ ] Mobile layout matches (< 768px)
- [ ] Tablet layout matches (768px - 1024px)
- [ ] Desktop layout matches (> 1024px)
- [ ] Touch interactions work on mobile
- [ ] Text is readable on all sizes

### Performance
- [ ] Page load < 3 seconds
- [ ] Images optimized (WebP, lazy loading)
- [ ] Animations run at 60fps
- [ ] No layout shift (CLS < 0.1)
- [ ] Smooth scrolling

### Accessibility
- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Color contrast meets WCAG AA
- [ ] Focus indicators visible
- [ ] Alt text on images

---

## 📊 Phase 7: Testing Strategy

### Visual Testing
1. **Screenshot Comparison**: Take screenshots of Coursera homepage and compare pixel-by-pixel
2. **Browser DevTools**: Use overlay to measure spacing, colors, fonts
3. **Responsive Testing**: Test on multiple devices/browsers

### Functional Testing
1. **Manual Testing**: Test all interactions
2. **Cross-browser**: Chrome, Firefox, Safari, Edge
3. **Device Testing**: iPhone, Android, iPad, Desktop

### Performance Testing
1. **Lighthouse**: Run performance audit
2. **Network Tab**: Check load times
3. **Animation**: Verify 60fps animations

---

## 🔧 Phase 8: Tools & Resources

### Design Tools
- **Browser DevTools**: Inspect Coursera's CSS
- **Color Picker**: Extract exact colors
- **Font Identifier**: Identify fonts used
- **Screenshot Tool**: Capture reference images

### Development Tools
- **React DevTools**: Debug components
- **Tailwind DevTools**: Test utility classes
- **Lighthouse**: Performance auditing
- **Accessibility Checker**: WCAG compliance

### Reference Materials
- Screenshots of Coursera homepage (all breakpoints)
- Color palette extracted from site
- Font specifications
- Spacing measurements
- Component specifications

---

## 📝 Phase 9: Content Strategy

### Static Content (Initial)
- Use placeholder content matching Coursera's structure
- Course titles, instructor names, ratings
- Category names and icons
- Partner logos (use placeholder or similar)

### Dynamic Content (Future)
- Connect to Firestore for real course data
- Fetch categories from database
- Load partner information
- Implement search functionality

---

## 🎯 Success Criteria

### Visual Match
- ✅ 95%+ pixel-perfect match to Coursera homepage
- ✅ Colors, fonts, spacing all match
- ✅ Layout structure identical

### Functional Match
- ✅ All interactions work identically
- ✅ Carousels behave the same
- ✅ Navigation works the same

### Performance
- ✅ Load time < 3 seconds
- ✅ Smooth 60fps animations
- ✅ No janky scrolling

### Responsive
- ✅ Matches Coursera on all breakpoints
- ✅ Mobile experience identical
- ✅ Tablet experience identical

---

## 🚦 Next Steps

1. **Gather Reference Materials**
   - Take screenshots of Coursera homepage
   - Extract colors, fonts, spacing
   - Document all sections

2. **Setup Project Structure**
   - Create component folders
   - Setup design system
   - Configure Tailwind

3. **Start Implementation**
   - Begin with navigation
   - Move section by section
   - Test as you go

---

**Document Status**: Ready for Implementation  
**Last Updated**: 2025-01-27  
**Next Action**: Gather reference materials and begin implementation

