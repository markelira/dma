# DMA.hu Homepage Redesign - Comprehensive Developer Plan

**Date**: 2025-01-27  
**Objective**: Create a world-class homepage with "wow effect" inspired by Framer Wallet Template  
**Target**: EdTech platform homepage that rivals Coursera.org in design excellence

---

## 📋 Executive Summary

### Project Goals
1. **Visual Impact**: Create a homepage that immediately captivates visitors with modern, premium design
2. **Brand Alignment**: Integrate DMA.hu brand identity (Red #E62935, Navy #2C3E54, Titillium Web font)
3. **User Experience**: Guide visitors through value proposition → features → social proof → conversion
4. **Performance**: Achieve <2s load time, 60fps animations, mobile-first responsive design
5. **Conversion**: Optimize for trial signups and course discovery

### Design Inspiration
- **Primary Reference**: [Framer Wallet Template](https://wallettemplate.framer.website/)
- **Key Elements**: Floating cards, bento grid layouts, smooth animations, dark/light section alternation
- **Adaptation**: Transform Bitcoin wallet theme → EdTech learning platform theme

---

## 🔍 Phase 1: Research & Context Analysis

### 1.1 DMA.hu Brand Research

#### Brand Identity (From Codebase Analysis)
- **Primary Colors**: 
  - DMA Red: `#E62935` (CTAs, accents, logo "M")
  - DMA Navy: `#2C3E54` (Structure, backgrounds, logo "D" and "A")
- **Typography**: Titillium Web (weights: 300, 400, 600, 700, 900)
- **Language**: Hungarian (all UI text)
- **Brand Voice**: Professional, modern, team-focused, accessible

#### Business Model
- **Type**: B2C Subscription Platform
- **Key Differentiator**: Unlimited team members per subscription
- **Pricing**: 
  - Monthly: ~15,000 HUF/month
  - 6-Month: ~10% discount
  - 12-Month: ~12% discount
- **Trial**: 7-day free trial
- **Value Prop**: "Learn with your team, unlimited members, one price"

#### Course Offerings
**Course Types:**
1. **ACADEMIA**: Traditional structured courses with sidebar navigation
2. **WEBINAR**: Single-session live/recorded webinars (Netflix-style player)
3. **MASTERCLASS**: Premium courses with imported lessons from other courses
4. **PODCAST**: Audio/video podcast episodes

**Categories** (12+ categories):
- Üzleti és Menedzsment (Business & Management)
- Marketing és Értékesítés (Marketing & Sales)
- Programozás és Fejlesztés (Programming & Development)
- Design és Kreativitás (Design & Creativity)
- Személyes Fejlődés (Personal Development)
- Pénzügyek és Befektetés (Finance & Investment)
- Egészség és Wellness (Health & Wellness)
- Nyelvek (Languages)
- Jog és Compliance (Law & Compliance)
- Data Science és AI
- HR és Toborzás (HR & Recruitment)
- Fotózás és Videózás (Photography & Videography)

#### Target Audience
- **Primary**: Individual professionals seeking skill development
- **Secondary**: Small teams (2-10 members) wanting collaborative learning
- **Tertiary**: Freelancers and entrepreneurs
- **Demographics**: Hungarian-speaking, 25-45 years old, tech-savvy

### 1.2 Framer Wallet Template Analysis

#### Visual Structure
```
┌─────────────────────────────────────┐
│  HERO SECTION                       │
│  - Cream background (#FFFAF5)       │
│  - Phone/device mockup              │
│  - Floating transaction cards       │
│  - Gradient overlays                │
│  - Primary CTA button               │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│  FEATURES SECTION                    │
│  - Dark background (#0F0F0F)        │
│  - Bento grid layout                 │
│  - Feature cards with icons          │
│  - Quote card                        │
│  - Asymmetric grid pattern           │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│  SECURITY SECTION                    │
│  - Split gradient background         │
│  - Feature list with icons           │
│  - Interactive card (signing)        │
│  - Trust indicators                  │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│  INTEGRATIONS SECTION               │
│  - Light background                  │
│  - Floating app cards (3D tilt)     │
│  - Logo grid                         │
│  - Hover effects                     │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│  FOOTER                              │
│  - Dark background                   │
│  - Newsletter signup                 │
│  - Social links                      │
│  - Final CTA                         │
└─────────────────────────────────────┘
```

#### Key Design Patterns
1. **Floating Cards**: 3D transforms, subtle shadows, parallax effects
2. **Bento Grid**: Asymmetric card layouts, varied sizes
3. **Color Alternation**: Light → Dark → Light → Dark sections
4. **Typography Hierarchy**: Large display text (4xl-6xl), clear CTAs
5. **Micro-interactions**: Hover effects, scroll animations, tilt on cards
6. **Gradient Overlays**: Subtle mesh gradients, smoky effects

### 1.3 Content Mapping Strategy

| Framer Section | DMA Adaptation | Content Focus |
|----------------|----------------|---------------|
| **Hero** | Platform Preview | "Tanulj csapattal, haladj gyorsabban" + Video preview |
| **Features** | Course Types Showcase | ACADEMIA, WEBINAR, MASTERCLASS, PODCAST cards |
| **Security** | Team Benefits | Unlimited members, collaboration features |
| **Integrations** | Course Categories | Floating category cards with icons |
| **Footer** | Social Proof + CTA | Testimonials, newsletter, final CTA |

---

## 🎨 Phase 2: Design System Integration

### 2.1 Color Palette Mapping

**Framer → DMA Brand Colors**

```css
/* Framer Colors → DMA Adaptation */
--framer-cream: #FFFAF5 → Keep (warm, inviting)
--framer-dark: #0F0F0F → DMA Navy #2C3E54 (softer, brand-aligned)
--framer-red: #E73136 → DMA Red #E62935 (exact brand color)
--framer-sand: #F2EFEB → Keep (neutral backgrounds)
```

**DMA Brand Colors (Primary)**
```css
:root {
  /* Primary Brand */
  --dma-red: #E62935;
  --dma-red-hover: #C63D2B;
  --dma-navy: #2C3E54;
  --dma-navy-hover: #1e2a37;
  --dma-navy-light: #3d5266;
  
  /* Backgrounds */
  --dma-cream: #FFFAF5; /* Warm, inviting */
  --dma-dark: #25282B;
  --dma-dark-alt: #363B3F;
  
  /* Accents */
  --dma-gold: #DD9933;
  --dma-gray-link: #AAAAAA;
}
```

### 2.2 Typography System

**Font Stack:**
```css
font-family: 'Titillium Web', -apple-system, BlinkMacSystemFont, sans-serif;
```

**Type Scale:**
- **Display (Hero)**: `clamp(2.5rem, 6vw, 4.5rem)` - Bold (700)
- **H1**: `3rem` (48px) - Semibold (600)
- **H2**: `2rem` (32px) - Semibold (600)
- **H3**: `1.5rem` (24px) - Medium (500)
- **Body**: `1rem` (16px) - Regular (400)
- **Small**: `0.875rem` (14px) - Regular (400)

**Line Heights:**
- Display: 1.1 (tight)
- Headings: 1.2-1.3
- Body: 1.6-1.8

### 2.3 Component Library

**Reusable Components to Create:**
1. `FloatingCard.tsx` - 3D tilt effect card
2. `BentoCard.tsx` - Asymmetric grid card
3. `FeatureCard.tsx` - Icon + text feature card
4. `CategoryCard.tsx` - Course category with icon
5. `CourseTypeCard.tsx` - ACADEMIA/WEBINAR/etc. showcase
6. `AnimatedSection.tsx` - Scroll-triggered animations wrapper
7. `GradientOverlay.tsx` - Mesh gradient backgrounds

---

## 🏗️ Phase 3: Section-by-Section Implementation Plan

### Section 1: Hero Section

**File**: `src/components/home/HeroSection.tsx`

#### Design Specifications
- **Background**: Cream (#FFFAF5) with subtle gradient mesh
- **Layout**: Two-column (text left, visual right)
- **Visual Element**: Platform preview mockup (dashboard/course player)
- **Floating Elements**: Course cards, category badges
- **CTA**: Primary button "Próbáld ki ingyen 7 napig" (DMA Red)

#### Content Structure
```tsx
<HeroSection>
  <LeftColumn>
    <Badge>Korlátlan csapattagok</Badge>
    <Headline>
      Tanulj csapattal,
      <br />
      haladj gyorsabban
    </Headline>
    <Subheadline>
      Korlátlan videó hozzáférés, korlátlan csapattagokkal.
      Egy előfizetés, minden kollégád ingyen.
    </Subheadline>
    <CTAButtons>
      <PrimaryCTA>Próbáld ki ingyen 7 napig</PrimaryCTA>
      <SecondaryCTA>Árak megtekintése</SecondaryCTA>
    </CTAButtons>
    <SocialProof>
      <Stat>10,000+</Stat> felhasználó
      <Stat>500+</Stat> kurzus
      <Stat>4.8/5</Stat> értékelés
    </SocialProof>
  </LeftColumn>
  <RightColumn>
    <PlatformPreview>
      <MockupDevice>
        <CoursePlayer />
        <FloatingCourseCards />
        <CategoryBadges />
      </MockupDevice>
      <GradientOverlay />
    </PlatformPreview>
  </RightColumn>
</HeroSection>
```

#### Animation Details
- **Floating Cards**: Subtle vertical float (6s ease-in-out infinite)
- **Platform Preview**: Fade-in + scale (0.95 → 1.0)
- **Headline**: Staggered word reveal (fade-up)
- **CTA Buttons**: Hover scale (1.0 → 1.05) + shadow increase

#### Implementation Steps
1. Create `HeroSection.tsx` component
2. Add Framer Motion animations
3. Create `PlatformPreview.tsx` sub-component
4. Create `FloatingCourseCard.tsx` component
5. Integrate with existing navigation
6. Add responsive breakpoints (mobile: stack columns)

---

### Section 2: Course Types Showcase (Features)

**File**: `src/components/home/CourseTypesSection.tsx`

#### Design Specifications
- **Background**: Dark (#2C3E54 - DMA Navy)
- **Layout**: Bento grid (asymmetric)
- **Cards**: 4 main cards (ACADEMIA, WEBINAR, MASTERCLASS, PODCAST)
- **Style**: Each card has unique size, icon, gradient accent

#### Content Structure
```tsx
<CourseTypesSection>
  <SectionHeader>
    <Eyebrow>Kurzus típusok</Eyebrow>
    <Title>Válassz a formátumodnak megfelelőt</Title>
    <Description>
      Strukturált kurzusoktól a podcast epizódokig,
      minden tanulási stílushoz van tartalom.
    </Description>
  </SectionHeader>
  <BentoGrid>
    <CourseTypeCard type="ACADEMIA" size="large">
      <Icon>📚</Icon>
      <Title>Akadémiai kurzusok</Title>
      <Description>Strukturált leckék, kvízek, tanúsítványok</Description>
      <Features>
        - Oldalsáv navigáció
        - Modulok és leckék
        - Interaktív kvízek
      </Features>
    </CourseTypeCard>
    <CourseTypeCard type="WEBINAR" size="medium">
      <Icon>🎥</Icon>
      <Title>Webináriumok</Title>
      <Description>Élő vagy felvett egyedi munkamenetek</Description>
    </CourseTypeCard>
    <CourseTypeCard type="MASTERCLASS" size="medium">
      <Icon>⭐</Icon>
      <Title>Masterclass</Title>
      <Description>Prémium tartalom több kurzusból</Description>
    </CourseTypeCard>
    <CourseTypeCard type="PODCAST" size="small">
      <Icon>🎧</Icon>
      <Title>Podcast epizódok</Title>
      <Description>Audio és videó podcastok</Description>
    </CourseTypeCard>
  </BentoGrid>
</CourseTypesSection>
```

#### Bento Grid Layout (Desktop)
```
┌─────────────────┬─────────────┐
│   ACADEMIA      │  WEBINAR    │
│   (Large)       │  (Medium)   │
│                 ├─────────────┤
│                 │ MASTERCLASS │
│                 │  (Medium)   │
├─────────────────┴─────────────┤
│      PODCAST (Small)          │
└───────────────────────────────┘
```

#### Implementation Steps
1. Create `CourseTypesSection.tsx`
2. Create `BentoGrid.tsx` layout component
3. Create `CourseTypeCard.tsx` with type-specific styling
4. Add hover effects (scale, shadow, gradient shift)
5. Implement scroll-triggered animations

---

### Section 3: Team Benefits (Security Adaptation)

**File**: `src/components/home/TeamBenefitsSection.tsx`

#### Design Specifications
- **Background**: Split gradient (Cream → Navy)
- **Layout**: Two-column with feature list + interactive card
- **Visual**: Team collaboration illustration/mockup

#### Content Structure
```tsx
<TeamBenefitsSection>
  <LeftColumn>
    <Eyebrow>Csapatfunkciók</Eyebrow>
    <Title>
      Tanulj együtt a csapatoddal,
      <br />
      korlátlan tagokkal
    </Title>
    <FeatureList>
      <Feature icon="👥">
        <Title>Korlátlan csapattagok</Title>
        <Description>
          Egy előfizetés, akárhány kollégád. 
          Nincs extra költség.
        </Description>
      </Feature>
      <Feature icon="📊">
        <Title>Közös haladás követése</Title>
        <Description>
          Láthatod, ki melyik kurzust csinálja,
          és hol tart a csapat.
        </Description>
      </Feature>
      <Feature icon="💬">
        <Title>Csapat kommunikáció</Title>
        <Description>
          Beszéljétek meg a tanultakat,
          oszd meg az észrevételeket.
        </Description>
      </Feature>
      <Feature icon="🔒">
        <Title>Biztonságos együttműködés</Title>
        <Description>
          Minden adat védett, GDPR-kompatibilis.
        </Description>
      </Feature>
    </FeatureList>
  </LeftColumn>
  <RightColumn>
    <InteractiveCard>
      <TeamDashboardMockup>
        <TeamMembersList />
        <ProgressChart />
        <ActivityFeed />
      </TeamDashboardMockup>
      <SavingsBadge>
        <Amount>150,000 Ft/hó</Amount>
        <Label>Megtakarítás más platformokhoz képest</Label>
      </SavingsBadge>
    </InteractiveCard>
  </RightColumn>
</TeamBenefitsSection>
```

#### Implementation Steps
1. Create `TeamBenefitsSection.tsx`
2. Create `FeatureList.tsx` component
3. Create `InteractiveCard.tsx` with hover effects
4. Add `TeamDashboardMockup.tsx` visual
5. Implement savings calculator badge

---

### Section 4: Course Categories (Integrations Adaptation)

**File**: `src/components/home/CategoriesSection.tsx`

#### Design Specifications
- **Background**: Light (Cream #FFFAF5)
- **Layout**: Floating cards grid with 3D tilt effect
- **Cards**: Category cards with icons, hover animations

#### Content Structure
```tsx
<CategoriesSection>
  <SectionHeader>
    <Title>Fedezd fel a kurzus kategóriákat</Title>
    <Description>
      12+ kategória, 500+ kurzus. 
      Minden témában megtalálod, amit keresel.
    </Description>
  </SectionHeader>
  <CategoriesGrid>
    {categories.map(category => (
      <CategoryCard
        key={category.id}
        icon={category.icon}
        title={category.name}
        description={category.description}
        courseCount={category.courseCount}
        tilt3D // Enable 3D tilt on hover
      />
    ))}
  </CategoriesGrid>
  <CTA>
    <Button>Összes kategória megtekintése</Button>
  </CTA>
</CategoriesSection>
```

#### Categories to Display (Top 8)
1. 💼 Üzleti és Menedzsment
2. 📈 Marketing és Értékesítés
3. 💻 Programozás és Fejlesztés
4. 🎨 Design és Kreativitás
5. 🌱 Személyes Fejlődés
6. 💰 Pénzügyek és Befektetés
7. 🤖 Data Science és AI
8. 👥 HR és Toborzás

#### 3D Tilt Effect
```tsx
// Use react-tilt or custom implementation
<CategoryCard
  onMouseMove={(e) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = (y - centerY) / 10;
    const rotateY = (centerX - x) / 10;
    
    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  }}
/>
```

#### Implementation Steps
1. Create `CategoriesSection.tsx`
2. Fetch categories from Firestore
3. Create `CategoryCard.tsx` with 3D tilt
4. Implement grid layout (responsive: 2/3/4 columns)
5. Add hover animations (scale, shadow, tilt)

---

### Section 5: Social Proof & Testimonials

**File**: `src/components/home/TestimonialsSection.tsx`

#### Design Specifications
- **Background**: Dark (#2C3E54)
- **Layout**: Carousel/slider with testimonials
- **Style**: Quote cards with avatars, ratings

#### Content Structure
```tsx
<TestimonialsSection>
  <SectionHeader>
    <Title>Mit mondanak rólunk</Title>
    <Description>
      10,000+ elégedett felhasználó,
      4.8/5 átlagos értékelés
    </Description>
  </SectionHeader>
  <TestimonialsCarousel>
    <TestimonialCard>
      <Avatar src="..." />
      <Quote>
        "A csapatfunkciók miatt választottuk a DMA.hu-t.
        Most már minden kollégánk hozzáfér a kurzusokhoz,
        anélkül hogy extra költséget kellene fizetnünk."
      </Quote>
      <Author>
        <Name>Kovács Péter</Name>
        <Role>Marketing vezető</Role>
        <Company>TechStart Kft.</Company>
      </Author>
      <Rating>⭐⭐⭐⭐⭐</Rating>
    </TestimonialCard>
    {/* More testimonials */}
  </TestimonialsCarousel>
  <Stats>
    <Stat>
      <Number>10,000+</Number>
      <Label>Felhasználó</Label>
    </Stat>
    <Stat>
      <Number>500+</Number>
      <Label>Kurzus</Label>
    </Stat>
    <Stat>
      <Number>4.8/5</Number>
      <Label>Értékelés</Label>
    </Stat>
    <Stat>
      <Number>95%</Number>
      <Label>Ajánlási arány</Label>
    </Stat>
  </Stats>
</TestimonialsSection>
```

#### Implementation Steps
1. Create `TestimonialsSection.tsx`
2. Create `TestimonialCard.tsx`
3. Implement carousel (use Swiper or custom)
4. Add stats component
5. Fetch testimonials from Firestore (or use static data initially)

---

### Section 6: Final CTA & Footer

**File**: `src/components/home/FooterSection.tsx`

#### Design Specifications
- **Background**: Dark (#2C3E54)
- **Layout**: Newsletter signup + links + social

#### Content Structure
```tsx
<FooterSection>
  <CTASection>
    <Title>Kezdd el a tanulást ma</Title>
    <Description>
      7 napos ingyenes próba, korlátlan csapattagokkal.
      Nincs bankkártya szükséges.
    </Description>
    <CTAButton>Próbáld ki ingyen</CTAButton>
  </CTASection>
  
  <Newsletter>
    <Title>Iratkozz fel hírlevelünkre</Title>
    <Description>
      Kapj értesítéseket az új kurzusokról,
      exkluzív ajánlatokról és tanulási tippekről.
    </Description>
    <EmailForm>
      <Input type="email" placeholder="email@example.com" />
      <Button>Feliratkozás</Button>
    </EmailForm>
  </Newsletter>
  
  <Links>
    <Column>
      <Title>Platform</Title>
      <Link href="/courses">Kurzusok</Link>
      <Link href="/pricing">Árazás</Link>
      <Link href="/blog">Blog</Link>
    </Column>
    <Column>
      <Title>Támogatás</Title>
      <Link href="/help">Segítség</Link>
      <Link href="/contact">Kapcsolat</Link>
      <Link href="/faq">GYIK</Link>
    </Column>
    <Column>
      <Title>Jogi</Title>
      <Link href="/privacy">Adatvédelem</Link>
      <Link href="/terms">Felhasználási feltételek</Link>
    </Column>
  </Links>
  
  <Social>
    <SocialIcon platform="facebook" />
    <SocialIcon platform="linkedin" />
    <SocialIcon platform="youtube" />
    <SocialIcon platform="instagram" />
  </Social>
  
  <Copyright>
    © 2025 DMA.hu. Minden jog fenntartva.
  </Copyright>
</FooterSection>
```

#### Implementation Steps
1. Create `FooterSection.tsx`
2. Create `NewsletterForm.tsx` component
3. Integrate with email service (SendGrid)
4. Add social media links
5. Create footer links structure

---

## 🛠️ Phase 4: Technical Implementation

### 4.1 Component Architecture

```
src/components/home/
├── HeroSection.tsx
├── CourseTypesSection.tsx
├── TeamBenefitsSection.tsx
├── CategoriesSection.tsx
├── TestimonialsSection.tsx
├── FooterSection.tsx
├── components/
│   ├── FloatingCard.tsx
│   ├── BentoCard.tsx
│   ├── FeatureCard.tsx
│   ├── CategoryCard.tsx
│   ├── CourseTypeCard.tsx
│   ├── TestimonialCard.tsx
│   ├── PlatformPreview.tsx
│   ├── TeamDashboardMockup.tsx
│   └── AnimatedSection.tsx
└── index.ts
```

### 4.2 Animation Strategy

**Framer Motion Setup:**
```tsx
import { motion } from 'framer-motion';

// Scroll-triggered animations
const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-100px" },
  transition: { duration: 0.6 }
};

// Stagger children
const staggerContainer = {
  initial: {},
  whileInView: {
    transition: {
      staggerChildren: 0.1
    }
  }
};
```

**Animation Library:**
- **Framer Motion**: Primary animation library
- **react-tilt**: 3D tilt effects on cards
- **Intersection Observer**: Scroll-triggered animations
- **GSAP** (optional): Complex timeline animations

### 4.3 Performance Optimization

**Image Optimization:**
- Use Next.js `Image` component
- Lazy load images below fold
- WebP format with fallbacks
- Responsive image sizes

**Code Splitting:**
```tsx
// Lazy load heavy sections
const CategoriesSection = dynamic(
  () => import('@/components/home/CategoriesSection'),
  { ssr: true }
);
```

**Bundle Size:**
- Tree-shake unused Framer Motion features
- Code split by route
- Optimize font loading (Titillium Web)

**Performance Targets:**
- **LCP**: < 2.5s
- **FID**: < 100ms
- **CLS**: < 0.1
- **FPS**: 60fps animations

### 4.4 Responsive Design

**Breakpoints:**
```css
/* Mobile First */
sm: 640px   /* Mobile landscape */
md: 768px   /* Tablet */
lg: 1024px  /* Desktop */
xl: 1280px  /* Large desktop */
2xl: 1536px /* Extra large */
```

**Mobile Adaptations:**
- Hero: Stack columns, smaller text
- Bento Grid: Single column
- Categories: 2 columns → 1 column
- Testimonials: Single card view
- Footer: Stack columns

### 4.5 Accessibility

**WCAG 2.1 AA Compliance:**
- Color contrast ratios (DMA Red: 4.8:1, DMA Navy: 10.2:1)
- Keyboard navigation
- Screen reader labels
- Focus indicators
- Alt text for images
- ARIA labels for interactive elements

---

## 📝 Phase 5: Content Strategy

### 5.1 Hero Section Content

**Headline Options:**
1. "Tanulj csapattal, haladj gyorsabban" (Current)
2. "A legjobb online tanulási platform csapatoknak"
3. "Korlátlan kurzusok, korlátlan csapattagokkal"

**Subheadline:**
"Korlátlan videó hozzáférés, korlátlan csapattagokkal. Egy előfizetés, minden kollégád ingyen."

**CTA Text:**
- Primary: "Próbáld ki ingyen 7 napig"
- Secondary: "Árak megtekintése"

### 5.2 Course Types Content

**ACADEMIA:**
- Title: "Akadémiai kurzusok"
- Description: "Strukturált leckék, kvízek, tanúsítványok"
- Features: Oldalsáv navigáció, Modulok és leckék, Interaktív kvízek

**WEBINAR:**
- Title: "Webináriumok"
- Description: "Élő vagy felvett egyedi munkamenetek"
- Features: Netflix-stílusú lejátszó, Egyetlen videó fókusz

**MASTERCLASS:**
- Title: "Masterclass"
- Description: "Prémium tartalom több kurzusból"
- Features: Egyedi oldalsáv, Importált leckék, Prémium tartalom

**PODCAST:**
- Title: "Podcast epizódok"
- Description: "Audio és videó podcastok"
- Features: Audio-first élmény, Egyszerű navigáció

### 5.3 Team Benefits Content

**Key Messages:**
1. "Korlátlan csapattagok" - Egy előfizetés, akárhány kollégád
2. "Közös haladás követése" - Láthatod, ki melyik kurzust csinálja
3. "Csapat kommunikáció" - Beszéljétek meg a tanultakat
4. "Biztonságos együttműködés" - GDPR-kompatibilis

**Savings Message:**
"Más platformokon 10 fő után 150,000 Ft/hó vs. DMA.hu 15,000 Ft/hó"

### 5.4 Testimonials Content

**Sample Testimonials (to be replaced with real):**
1. Team collaboration focus
2. Cost savings emphasis
3. Course quality
4. Platform ease of use

---

## 🚀 Phase 6: Implementation Timeline

### Week 1: Foundation & Hero
- **Day 1-2**: Setup, component structure, Hero section
- **Day 3**: Platform preview mockup, floating cards
- **Day 4**: Animations, responsive design
- **Day 5**: Testing, refinements

### Week 2: Core Sections
- **Day 1-2**: Course Types Section (Bento grid)
- **Day 3**: Team Benefits Section
- **Day 4**: Categories Section (3D tilt)
- **Day 5**: Testimonials Section

### Week 3: Polish & Launch
- **Day 1**: Footer, newsletter integration
- **Day 2**: Performance optimization
- **Day 3**: Accessibility audit
- **Day 4**: Cross-browser testing
- **Day 5**: Final refinements, launch

**Total Estimated Time: 15 days**

---

## ✅ Phase 7: Quality Checklist

### Design Quality
- [ ] Pixel-perfect implementation
- [ ] Brand colors correctly applied
- [ ] Typography hierarchy clear
- [ ] Spacing consistent (8px grid)
- [ ] Animations smooth (60fps)
- [ ] Responsive on all devices

### Technical Quality
- [ ] TypeScript types defined
- [ ] No console errors
- [ ] Performance targets met
- [ ] SEO meta tags added
- [ ] Analytics tracking
- [ ] Error boundaries implemented

### Content Quality
- [ ] All text in Hungarian
- [ ] No placeholder content
- [ ] CTAs clear and actionable
- [ ] Social proof credible
- [ ] Links functional

### Accessibility
- [ ] WCAG 2.1 AA compliant
- [ ] Keyboard navigation works
- [ ] Screen reader tested
- [ ] Color contrast verified
- [ ] Focus indicators visible

---

## 📚 Phase 8: Resources & References

### Design References
- [Framer Wallet Template](https://wallettemplate.framer.website/)
- [Coursera.org Homepage](https://www.coursera.org/)
- [Framer Motion Docs](https://www.framer.com/motion/)

### Technical Documentation
- [Next.js 15 Docs](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

### Brand Assets
- Logo: `DMA.hu-logo.png`
- Colors: `DMA_BRAND_COLORS_FINAL.md`
- Typography: Titillium Web (Google Fonts)

---

## 🎯 Success Metrics

### User Engagement
- **Bounce Rate**: < 40%
- **Time on Page**: > 2 minutes
- **Scroll Depth**: > 70% reach footer
- **CTA Click Rate**: > 5%

### Conversion Metrics
- **Trial Signups**: Track from hero CTA
- **Pricing Page Visits**: Track from secondary CTA
- **Newsletter Signups**: Track from footer
- **Course Page Visits**: Track from category cards

### Performance Metrics
- **Page Load**: < 2s
- **LCP**: < 2.5s
- **FID**: < 100ms
- **CLS**: < 0.1

---

## 🔄 Phase 9: Iteration Plan

### Post-Launch Monitoring
1. **Analytics Review**: Weekly review of user behavior
2. **A/B Testing**: Test different headlines, CTAs
3. **User Feedback**: Collect via surveys, support tickets
4. **Performance Monitoring**: Track Core Web Vitals

### Future Enhancements
1. **Video Background**: Add subtle video background to hero
2. **Interactive Demo**: Embedded course player preview
3. **Live Stats**: Real-time user count, course completions
4. **Personalization**: Show relevant categories based on location/device

---

## 📋 Final Notes

### Key Principles
1. **Mobile First**: Design for mobile, enhance for desktop
2. **Performance First**: Every decision considers performance impact
3. **Accessibility First**: Inclusive design for all users
4. **Brand Consistency**: Every element reflects DMA.hu identity
5. **User Focus**: Every section serves a clear purpose

### Developer Guidelines
- Use TypeScript strictly
- Follow existing code patterns
- Write reusable components
- Document complex logic
- Test on real devices
- Get design approval before major changes

---

**Document Status**: Ready for Implementation  
**Last Updated**: 2025-01-27  
**Next Review**: After Week 1 completion

