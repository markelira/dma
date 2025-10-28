# DMA.hu Branding System - Complete

**Date**: 2025-10-28
**Status**: ✅ COMPLETE

---

## Color Palette

### Primary Brand Color
- **DMA Blue**: `#16222F` (Navy blue - main brand color)
- **DMA Blue Hover**: `#1e2a37` (Lighter navy for hover states)
- **DMA Blue Light**: `#E6F1FF` (Light blue for backgrounds)

### Secondary Colors
- **DMA Red** (Accent): `#E62935` (For CTAs and accents)
- **DMA Gold**: `#DD9933` (For highlights and premium features)
- **Dark Backgrounds**: `#25282B`, `#363B3F`

### Grays
- **Link Gray**: `#AAAAAA`
- **Dark Gray**: `#333333`

---

## Typography

### Font Family
- **Primary**: `Titillium Web` (all weights: 300, 400, 600, 700, 900)
- **Fallback**: `-apple-system`, `BlinkMacSystemFont`, `sans-serif`

### Font Sizes (DMA.hu Standard)
- **Body**: 14px, line-height 1.8, letter-spacing 0.6px
- **H1**: 23px, line-height 1.4, letter-spacing 0.6px
- **H2**: 20px
- **H3**: 18px

---

## Button Styles

### Primary Button (`.btn-dma-primary`)
```css
background-color: #16222F;
color: #FFFFFF;
text-transform: uppercase;
font-size: 18px;
font-weight: 600;
border: 2px solid #FFFFFF;
border-radius: 0.5rem;
padding: 9px 40px;
box-shadow: 0px 4px 20px 0px rgba(22, 34, 47, 0.3);
letter-spacing: 1px;
```

**Hover State**:
```css
background-color: #1e2a37;
transform: translateY(-2px);
box-shadow: 0px 6px 24px 0px rgba(22, 34, 47, 0.4);
```

---

## Tailwind Utility Classes

### Custom DMA Classes
- `.bg-dma-blue` - Background: #16222F
- `.text-dma-blue` - Text: #16222F
- `.bg-dma-blue-hover` - Background: #1e2a37
- `.border-dma-blue` - Border: #16222F
- `.bg-dma-blue-light` - Background: #E6F1FF
- `.bg-dma-dark` - Background: #25282B
- `.bg-dma-dark-alt` - Background: #363B3F
- `.text-dma-gold` - Text: #DD9933
- `.bg-dma-gold` - Background: #DD9933

---

## Component Color Usage

### Homepage Components
**ConsumerHeroSection**:
- Primary CTA: `bg-blue-navy` or `bg-dma-blue`
- Secondary CTA: `border-blue-navy text-blue-navy`
- Accent colors: Use `blue-` scale (blue-50, blue-100, etc.)

**TeamBenefitsSection**:
- Headers: `text-blue-navy`
- Icons: Gradient backgrounds (teal, blue, purple, orange, green, red)
- Cards: `hover:border-blue-200`

**PricingPreviewSection**:
- Primary accent: `text-blue-navy`
- CTA buttons: `bg-blue-navy hover:bg-blue-navy-light`
- Popular badge: `bg-blue-500`

---

## Design System Variables

### Tailwind Config
```javascript
primary: {
  DEFAULT: '#16222F', // DMA blue
  hover: '#1e2a37',
  foreground: '#FFFFFF',
},
blue: {
  DEFAULT: '#16222F',
  light: '#1e2a37',
  navy: '#16222F',
  'navy-light': '#1e2a37',
},
```

---

## Implementation Status

✅ **Tailwind Config Updated**: Primary colors set to DMA blue
✅ **Globals.css Updated**: Titillium Web font imported, DMA utility classes added
✅ **Button Styles**: `.btn-dma-primary` created with DMA blue
✅ **Custom Classes**: All DMA-specific utility classes implemented

---

## Usage Guidelines

1. **Primary Actions**: Always use DMA blue (#16222F)
2. **Accents**: Use DMA red (#E62935) sparingly for important CTAs
3. **Premium Features**: Use DMA gold (#DD9933)
4. **Typography**: Titillium Web for all text
5. **Buttons**: Use `.btn-dma-primary` class or Tailwind `bg-blue-navy`

---

## Next Steps

Components still need color updates to use blue:
- [ ] ConsumerHeroSection.tsx - Replace red references with blue
- [ ] TeamBenefitsSection.tsx - Replace red references with blue
- [ ] PricingPreviewSection.tsx - Replace red references with blue
- [ ] All other components using primary/accent colors

---

**Generated**: 2025-10-28
**Design System**: DMA.hu Brand Guidelines
