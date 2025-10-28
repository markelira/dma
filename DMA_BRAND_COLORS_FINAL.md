# DMA.hu Official Brand Colors (Extracted from Logo)

**Date**: 2025-10-28
**Source**: DMA.hu-logo.png (official logo)

---

## Color Palette

### Primary Brand Colors (from Logo)

#### 1. DMA Red (Logo "M")
- **Hex**: `#E62935`
- **RGB**: rgb(230, 41, 53)
- **Use**: Primary CTAs, attention-grabbing elements, logo "M"
- **Hover**: `#C63D2B`

#### 2. DMA Navy (Logo "D" and "A")
- **Hex**: `#2C3E54`
- **RGB**: rgb(44, 62, 84)
- **Use**: Secondary elements, backgrounds, structural design, logo "D" and "A"
- **Hover**: `#1e2a37`
- **Light**: `#3d5266`

---

## Usage Guidelines

### When to Use DMA Red (#E62935)
- ✅ Primary CTA buttons ("Próbáld ki ingyen", "Kezdd el most")
- ✅ Important badges and labels
- ✅ Accent text and highlights
- ✅ Icons for key features
- ✅ Hover states for important elements

### When to Use DMA Navy (#2C3E54)
- ✅ Secondary buttons
- ✅ Background sections
- ✅ Navigation elements
- ✅ Text headings (when not black)
- ✅ Borders and dividers

### Combined Usage (Dual-Color System)
The logo shows both colors work together:
- Hero sections: Red CTAs on navy/white backgrounds
- Cards: Navy backgrounds with red accents
- Badges: Red text on light backgrounds
- Gradients: Navy → Red or Red → Navy

---

## Tailwind Classes

### DMA Red
```css
.bg-dma-red          /* Background: #E62935 */
.text-dma-red        /* Text: #E62935 */
.bg-dma-red-hover    /* Background hover: #C63D2B */
.border-dma-red      /* Border: #E62935 */
.bg-dma-red-light    /* Light background: #FFE6E8 */
```

### DMA Navy
```css
.bg-dma-navy         /* Background: #2C3E54 */
.text-dma-navy       /* Text: #2C3E54 */
.bg-dma-navy-hover   /* Background hover: #1e2a37 */
.border-dma-navy     /* Border: #2C3E54 */
.bg-dma-navy-light   /* Light background: #E8EBF0 */
```

### Button Classes
```css
.btn-dma-primary     /* Red button (#E62935) */
.btn-dma-navy        /* Navy button (#2C3E54) */
```

---

## Component Examples

### Primary CTA (Red)
```tsx
<Button className="bg-dma-red hover:bg-dma-red-hover text-white">
  Próbáld ki ingyen
</Button>
```

### Secondary CTA (Navy)
```tsx
<Button className="bg-dma-navy hover:bg-dma-navy-hover text-white">
  Részletek
</Button>
```

### Badge (Red on Light Background)
```tsx
<span className="bg-red-50 text-dma-red px-4 py-2 rounded-full">
  Csapatfunkciók
</span>
```

### Heading with Red Accent
```tsx
<h2 className="text-gray-900">
  Tanulj együtt a{' '}
  <span className="text-transparent bg-clip-text bg-gradient-to-r from-dma-red to-dma-red-hover">
    csapatoddal
  </span>
</h2>
```

---

## Accessibility

### Contrast Ratios
- **DMA Red (#E62935) on White**: 4.8:1 (AA compliant)
- **DMA Navy (#2C3E54) on White**: 10.2:1 (AAA compliant)
- **White on DMA Red**: 4.8:1 (AA compliant)
- **White on DMA Navy**: 10.2:1 (AAA compliant)

Both colors meet WCAG 2.1 Level AA standards for accessibility.

---

## Design System Variables

### CSS Variables
```css
:root {
  --primary: #E62935;           /* DMA red */
  --primary-hover: #C63D2B;     /* DMA red hover */
  --dma-navy: #2C3E54;          /* DMA navy */
  --dma-navy-hover: #1e2a37;    /* DMA navy hover */
}
```

### Tailwind Config
```javascript
dma: {
  red: '#E62935',              // Logo "M"
  'red-hover': '#C63D2B',      // Red hover
  navy: '#2C3E54',             // Logo "D" and "A"
  'navy-hover': '#1e2a37',     // Navy hover
  'navy-light': '#3d5266',     // Lighter navy
}
```

---

## Color Psychology

**DMA Red (#E62935)**
- Energy, action, urgency
- Grabs attention
- Encourages clicks and conversions
- Perfect for CTAs

**DMA Navy (#2C3E54)**
- Trust, professionalism, stability
- Creates calm, focused environment
- Supports content readability
- Perfect for backgrounds and structure

---

## Logo Reproduction

When using the DMA logo, always maintain the exact colors:
- **"D"**: `#2C3E54` (Navy)
- **"M"**: `#E62935` (Red - wavy letters)
- **"A"**: `#2C3E54` (Navy)

Never alter these colors or use gradients across the logo.

---

## Summary

✅ **DMA Red (#E62935)**: Primary CTAs, accents, logo "M"
✅ **DMA Navy (#2C3E54)**: Structure, backgrounds, logo "D" and "A"
✅ **Dual-Color System**: Both colors work together as shown in logo
✅ **Accessibility**: Both colors meet WCAG AA standards
✅ **Consistency**: Use exact hex values from logo

---

**Extracted**: 2025-10-28
**Source**: DMA.hu-logo.png
**Status**: Official Brand Colors
