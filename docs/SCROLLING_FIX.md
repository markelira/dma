# Course Player Scrolling Fix

**Date:** November 12, 2025, 12:15 PM
**Issue:** Course player page content not scrolling on production

---

## Problem

The course player page was not scrollable - users could only see the video player and the first visible tab content. The rest of the page content (lesson details, learning outcomes, navigation buttons) were hidden and inaccessible.

## Root Cause

The issue was caused by incorrect CSS flex layout constraints:

1. **Parent container** had `min-h-screen` instead of `h-screen`
   - This allowed unlimited growth instead of constraining to viewport height
   - Without height constraint, flex children would grow infinitely rather than scroll

2. **Flex container** lacked `min-h-0` utility
   - By default, flex items have `min-height: auto`
   - This prevents proper shrinking and breaks scroll behavior
   - The `min-h-0` override is needed for scrollable flex layouts

## The Fix

**File:** `/src/components/course-player/PlayerLayout.tsx`

### Changes Made (lines 209-220)

**Before:**
```tsx
return (
  <div className="min-h-screen bg-gray-50 flex flex-col">
    <PlayerHeader {...props} />

    <div className="flex-1 flex">
      {/* Content */}
    </div>
  </div>
)
```

**After:**
```tsx
return (
  <div className="h-screen bg-gray-50 flex flex-col">
    <PlayerHeader {...props} />

    <div className="flex-1 flex min-h-0">
      {/* Content */}
    </div>
  </div>
)
```

### Key Changes

1. `min-h-screen` → `h-screen`
   - Constrains outer container to exactly viewport height (100vh)
   - Forces flex children to work within this constraint

2. Added `min-h-0` to flex container
   - Overrides default `min-height: auto` on flex items
   - Allows proper shrinking and enables scroll behavior
   - Critical for nested flex layouts with scrolling

## How It Works

```
┌─────────────────────────────────────┐
│ h-screen (100vh - fixed height)     │
├─────────────────────────────────────┤
│ PlayerHeader (fixed height)         │
├─────────────────────────────────────┤
│ flex-1 flex min-h-0                 │ ← Can shrink properly
│ ┌─────────────────────────────────┐ │
│ │ Sidebar   │ Main    │ Companion │ │
│ │ (scroll)  │(scroll) │  (scroll) │ │
│ │           │         │           │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

- Outer container: Fixed at viewport height
- Header: Takes its natural height
- Content area: `flex-1` fills remaining space with `min-h-0` allowing scroll
- Each column: Has `overflow-y-auto` for independent scrolling

## Why This Is a Common Pitfall

Flexbox has default behaviors that can be counterintuitive for scrolling:

1. **Flex items don't shrink below content size by default**
   - `min-height: auto` means "at least as tall as my content"
   - This breaks scrolling in nested flex layouts

2. **`min-h-screen` vs `h-screen` confusion**
   - `min-h-screen`: "at least viewport height, but can grow"
   - `h-screen`: "exactly viewport height, constrained"
   - For scrolling, you need the constraint

## Testing

After deployment, verify:
- ✅ Page scrolls smoothly on desktop
- ✅ All lesson content is accessible
- ✅ Sidebar and companion panel scroll independently
- ✅ Mobile layout works correctly
- ✅ No layout shift or overflow issues

## Deployment

**Deployed:** 2025-11-12 12:15 PM
**URL:** https://dmaapp-477d4.web.app

## References

- [CSS Tricks: Flexbox and the min-content problem](https://css-tricks.com/flexbox-truncated-text/)
- [MDN: flex-shrink and min-height](https://developer.mozilla.org/en-US/docs/Web/CSS/flex-shrink)
- [Understanding min-height in Flexbox](https://stackoverflow.com/questions/36230944/prevent-flex-items-from-overflowing-a-container)

---

**Related Files:**
- `/src/components/course-player/PlayerLayout.tsx` (lines 209-220)
- `/src/components/course-player/CourseNavigationSidebar.tsx` (has overflow-y-auto)
- `/src/components/course-player/LearningCompanionPanel.tsx` (has overflow-y-auto)
