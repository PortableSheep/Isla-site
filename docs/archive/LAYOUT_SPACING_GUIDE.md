# 📐 Layout & Spacing Guide - Hand-Drawn Creature Aesthetic

> A comprehensive guide for consistent, playful spacing that enhances the hand-drawn creature-themed UI while maintaining a kid-friendly, accessible design.

---

## 📋 Quick Reference

### 8px Grid System

All spacing follows an 8px base unit for perfect alignment and consistency:

| Unit | Value | Usage |
|------|-------|-------|
| **xs** | 8px | Tight spacing between elements |
| **sm** | 16px | Standard padding, small gaps |
| **md** | 24px | Medium spacing, comfortable gaps |
| **lg** | 32px | Large spacing, section dividers |
| **xl** | 40px | Extra large spacing |
| **2xl** | 48px | Major section spacing |
| **3xl** | 56px | Page-level spacing |
| **4xl** | 64px | Header/footer spacing |

---

## 🎯 Spacing Principles

### 1. **Visual Hierarchy Through Spacing**

Use larger spacing to separate major sections, smaller spacing for related elements:

```
┌─────────────────────────────────────┐
│  Header (48px padding)              │  ← 2xl (48px)
├─────────────────────────────────────┤
│                                     │
│  Content Section 1                  │  ← 32px gap (lg)
│  ├─ Item A (16px margin)            │
│  ├─ Item B (16px margin)            │  ← 16px (sm) between items
│  └─ Item C (16px margin)            │
│                                     │
│  Content Section 2                  │
│                                     │
└─────────────────────────────────────┘
```

### 2. **Whitespace as Design Element**

Never fill empty space - let creatures breathe:

- **Around creatures**: 24px minimum whitespace
- **Between cards**: 24px gap (grows to 32px on larger screens)
- **Section margins**: 32-48px top/bottom

### 3. **Creature-Aware Spacing**

Creatures need breathing room:

- **Solo creatures**: 48px clearance on sides
- **Creature in corner**: 16px to edge, 24px from content
- **Creature annotations**: 8px gap between creature and text

---

## 🎨 Container Styling Standards

### Card Containers

```css
.creature-card {
  /* Padding: 24px (md) standard */
  padding: 24px;
  
  /* Hand-drawn borders with irregular radius */
  border-radius: 16px 20px 12px 18px;
  border: 2px solid;
  
  /* Subtle shadow for depth */
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  
  /* Smooth hover transition */
  transition: all 0.3s ease;
}

.creature-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
}
```

**Responsive Adjustments:**
- Mobile (375px): 16px padding, no hover lift
- Tablet (768px): 20px padding
- Desktop (1440px): 24px padding

### Button Spacing

```css
.creature-button {
  /* Touch target minimum: 48px */
  min-height: 48px;
  min-width: 48px;
  
  /* Padding with gap */
  padding: 12px 24px;
  gap: 8px;
  
  /* Hand-drawn corners */
  border-radius: 12px 16px 10px 14px;
}
```

---

## 📱 Responsive Layout Standards

### Mobile (375px viewport)

```css
/* Stack vertically */
.grid { grid-template-columns: 1fr; }

/* Reduce padding */
.card { padding: 16px; }
.button { padding: 10px 20px; }

/* Smaller creatures */
.creature { font-size: 48px; }

/* Generous vertical spacing */
.section { margin-bottom: 32px; }
```

**Touch targets**: All interactive elements ≥ 48px × 48px

### Tablet (768px viewport)

```css
/* 2-column layouts */
.grid { grid-template-columns: repeat(2, 1fr); }

/* Standard padding */
.card { padding: 20px; }

/* Comfortable gaps */
.gap { gap: 20px; }
```

### Desktop (1440px viewport)

```css
/* Full multi-column */
.grid { grid-template-columns: repeat(3, 1fr); gap: 24px; }

/* Maximum padding */
.card { padding: 24px; }

/* Extra whitespace */
.section { margin-bottom: 48px; }
```

---

## 🎯 Specific Component Spacing

### Header Section

```
┌────────────────────────────────────────┐
│ ↕ 24px (creature safe zone)            │
│  [🦄] → 16px → "Welcome"               │  ← Heading in flex row
│  ↓ 8px                                 │
│  "Subtitle text"                       │
│ ↕ 24px                                 │
└────────────────────────────────────────┘
```

**CSS:**
```css
.header-section {
  padding: 24px;
  display: flex;
  gap: 16px;
  align-items: flex-start;
  margin-bottom: 32px;
}

.header-text h1 {
  margin: 0 0 8px 0;
}

.header-text p {
  margin: 0;
}
```

### Card Grid

```
┌─────────┐ 24px ┌─────────┐ 24px ┌─────────┐
│ Card 1  │ gap  │ Card 2  │ gap  │ Card 3  │
└─────────┘      └─────────┘      └─────────┘
    ↕
   24px
    ↓
┌─────────┐ 24px ┌─────────┐
│ Card 4  │ gap  │ Card 5  │
└─────────┘      └─────────┘
```

**CSS:**
```css
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
}

@media (max-width: 768px) {
  .card-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}
```

### Section Dividers

Use creatures or spacing, never harsh lines:

```
┌──────────────────────────────────────┐
│ Section 1 Content                    │
│ ↕ 48px (breathe)                     │
│  [🌟] Divider creature               │
│ ↕ 48px                               │
│ Section 2 Content                    │
└──────────────────────────────────────┘
```

---

## 🎨 Hand-Drawn Effects with Spacing

### Irregular Borders

```css
/* Playful asymmetric radius */
border-radius: 16px 20px 12px 18px;

/* By element type: */
.card { border-radius: 16px 20px 12px 18px; }
.button { border-radius: 12px 16px 10px 14px; }
.input { border-radius: 8px 12px 10px 8px; }
```

### Decorative Elements

Creatures placed in corners with specific spacing:

```css
.creature-corner {
  position: absolute;
  width: 48px;
  height: 48px;
  
  /* Positioned outside container slightly */
  top: -12px;
  right: -12px;
  
  /* Radial gradient for softness */
  background: radial-gradient(circle, var(--color) 0%, transparent 70%);
  border-radius: 50%;
}

@media (max-width: 640px) {
  .creature-corner {
    width: 36px;
    height: 36px;
    top: -8px;
    right: -8px;
  }
}
```

---

## 🌙 Dark Mode Spacing Adjustments

Spacing remains identical in dark mode. Only colors change:

```css
/* Light mode */
.card {
  background: white;
  border-color: rgba(124, 58, 237, 0.2);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

/* Dark mode - same spacing, different colors */
@media (prefers-color-scheme: dark) {
  .card {
    background: #1F2937;
    border-color: rgba(168, 85, 247, 0.3);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }
}
```

---

## 📊 Spacing Checklist

### For Every New Component

- [ ] Base padding/margin follows 8px grid (8/16/24/32/40/48px)
- [ ] Creatures have ≥24px clearance around them
- [ ] Gaps between elements: 8px (tight), 16px (comfortable), 24px (generous)
- [ ] Section separators: 32px-48px vertical gap
- [ ] Mobile: Reduce gaps by 25% (16px→12px, 24px→16px)
- [ ] Touch targets: Minimum 48px × 48px
- [ ] Hover states don't reduce interactive area
- [ ] Dark mode uses same spacing (colors only change)

### For Every Card/Container

- [ ] Padding: 16px (mobile), 20px (tablet), 24px (desktop)
- [ ] Border radius: Irregular corners (e.g., 16px 20px 12px 18px)
- [ ] Border: 2px solid with creature theme color
- [ ] Box shadow: Subtle (0 4px 12px rgba(0,0,0,0.08))
- [ ] Hover lift: translateY(-4px) max
- [ ] Internal gaps: 16px between items within container

### For Every Grid

- [ ] Gap size: 24px desktop, 16px tablet, 8-16px mobile
- [ ] Column widths: Maintain readable line length (280-320px min)
- [ ] Responsive breakpoints: 375px, 768px, 1440px
- [ ] Content centered with max-width (1200px typical)
- [ ] Side padding: 16px mobile, 24px desktop

---

## 💡 Common Patterns

### Centered Content with Sidebar Creatures

```
┌─────────────────────────────────────┐
│  [🦄]  ← 48px →  ┌──────────────┐  │
│  Creature         │ Content      │  │
│                   │ (max 600px)  │  │
│                   └──────────────┘  │
│                   ← 48px gap →      │
└─────────────────────────────────────┘
```

### Card with Creature Accent

```
┌─────────────────────┐
│ [🌟] top-right corner
│ 
│ Main Content
│ (with 24px padding)
│
│ [Action Button]
└─────────────────────┘
```

### Section with Divider Creature

```
═══ Section 1 ═══

[Gap: 48px]

      [🌈]

[Gap: 48px]

═══ Section 2 ═══
```

---

## 🎯 Performance Notes

- **Box shadows**: Use subtle values (0 4px 12px) for performance
- **Transforms**: Prefer `translateY` and `scale` for smooth 60fps
- **Animations**: Keep transitions to 0.3s or less
- **Creatures**: Emoji-based (no extra HTTP requests)
- **Mobile**: Disable hover animations, use `@media (hover: hover)`

---

## 🔧 CSS Custom Properties

Available for use in any component:

```css
/* Spacing */
--spacing-xs: 8px;
--spacing-sm: 16px;
--spacing-md: 24px;
--spacing-lg: 32px;
--spacing-xl: 40px;
--spacing-2xl: 48px;

/* Border Radius (hand-drawn feel) */
--radius-sm: 8px 12px 10px 8px;
--radius-md: 12px 16px 10px 14px;
--radius-lg: 16px 20px 12px 18px;

/* Shadow (depth) */
--shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.08);
--shadow-md: 0 4px 12px rgba(0, 0, 0, 0.08);
--shadow-lg: 0 12px 24px rgba(0, 0, 0, 0.15);
--shadow-hover: 0 12px 24px rgba(0, 0, 0, 0.15);

/* Transitions */
--transition-fast: 0.15s ease;
--transition-normal: 0.3s ease;
--transition-slow: 0.5s ease-out;
```

---

## 📚 Related Documentation

- [REDESIGN_BEFORE_AFTER.md](REDESIGN_BEFORE_AFTER.md) - Visual changes overview
- [COLOR_SYSTEM_INDEX.md](COLOR_SYSTEM_INDEX.md) - Color palette
- [CREATURE_VISUAL_REFERENCE.md](CREATURE_VISUAL_REFERENCE.md) - Creature emojis
- [MICRO_INTERACTIONS_GUIDE.md](MICRO_INTERACTIONS_GUIDE.md) - Animation patterns

---

**Status**: ✅ Complete reference guide for layout & spacing  
**Last Updated**: 2024  
**Compatibility**: Next.js 16+, React 19+, All browsers
