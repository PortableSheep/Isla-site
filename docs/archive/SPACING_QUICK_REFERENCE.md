# 📐 Spacing System Quick Reference

## CSS Variables Available

### Spacing Grid (8px Base Unit)
```css
--spacing-xs: 8px       /* Tight spacing */
--spacing-sm: 16px      /* Standard padding */
--spacing-md: 24px      /* Comfortable spacing */
--spacing-lg: 32px      /* Large spacing */
--spacing-xl: 40px      /* Extra large */
--spacing-2xl: 48px     /* Double large */
--spacing-3xl: 56px     /* Triple large */
--spacing-4xl: 64px     /* Quad large */
```

### Hand-Drawn Borders
```css
--radius-sm: 8px 12px 10px 8px           /* Subtle */
--radius-md: 12px 16px 10px 14px         /* Medium */
--radius-lg: 16px 20px 12px 18px         /* Large */
```

### Shadows (Depth)
```css
--shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.08)       /* Subtle */
--shadow-md: 0 4px 12px rgba(0, 0, 0, 0.08)      /* Medium */
--shadow-lg: 0 12px 24px rgba(0, 0, 0, 0.15)     /* Large */
```

### Transitions
```css
--transition-fast: 0.15s ease      /* Quick */
--transition-normal: 0.3s ease     /* Standard */
--transition-slow: 0.5s ease-out   /* Smooth */
```

---

## Common Component Patterns

### Card Container
```css
.my-card {
  padding: var(--spacing-md);        /* 24px */
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  transition: all var(--transition-normal);
}

.my-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

@media (max-width: 768px) {
  .my-card {
    padding: var(--spacing-sm);      /* 16px */
  }
}
```

### Button
```css
.my-button {
  padding: var(--spacing-xs) var(--spacing-md);   /* 8px 24px */
  border-radius: var(--radius-md);
  min-height: 48px;
  min-width: 48px;
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-normal);
}

.my-button:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}
```

### Form Input
```css
input, textarea, select {
  padding: var(--spacing-xs) var(--spacing-sm);   /* 8px 16px */
  border-radius: var(--radius-sm);
  min-height: 48px;
  transition: all var(--transition-normal);
}

input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1), 
              0 0 0 4px var(--color-primary);
}
```

### Grid Layout
```css
.my-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--spacing-md);            /* 24px */
  margin-bottom: var(--spacing-lg);  /* 32px */
}

@media (max-width: 768px) {
  .my-grid {
    gap: var(--spacing-sm);          /* 16px */
    margin-bottom: var(--spacing-md); /* 24px */
  }
}
```

---

## Responsive Spacing Strategy

### Mobile First Approach
```
Mobile (≤640px):  Use reduced spacing
Tablet (641-1023px): Use balanced spacing  
Desktop (≥1024px): Use full spacing
```

### Typical Pattern
```css
.element {
  padding: var(--spacing-sm);        /* Mobile: 16px */
  gap: var(--spacing-xs);            /* Mobile: 8px */
}

@media (min-width: 768px) {
  .element {
    padding: var(--spacing-md);      /* Tablet: 24px */
    gap: var(--spacing-sm);          /* Tablet: 16px */
  }
}

@media (min-width: 1024px) {
  .element {
    padding: var(--spacing-md);      /* Desktop: 24px */
    gap: var(--spacing-md);          /* Desktop: 24px */
  }
}
```

---

## Dark Mode

**No spacing changes needed!** All spacing variables work identically in dark mode.

Only colors change:
```css
/* Light mode - same spacing */
.my-element {
  background: white;
  border-color: rgba(168, 85, 247, 0.2);
}

/* Dark mode - same spacing! */
@media (prefers-color-scheme: dark) {
  .my-element {
    background: #1F2937;
    border-color: rgba(168, 85, 247, 0.3);
  }
}
```

---

## Touch Target Minimums

All interactive elements must be ≥48px × 48px:

```css
button, a, input[type="checkbox"], input[type="radio"] {
  min-height: 48px;
  min-width: 48px;
}
```

---

## Spacing Cheat Sheet

### Padding Examples
- **Cards**: `var(--spacing-md)` = 24px (16px mobile)
- **Buttons**: `var(--spacing-xs)` vertical × `var(--spacing-md)` horizontal
- **Forms**: `var(--spacing-xs)` vertical × `var(--spacing-sm)` horizontal
- **Sections**: `var(--spacing-lg)` to `var(--spacing-2xl)` = 32-48px

### Gap Examples
- **Icon + text**: `var(--spacing-xs)` = 8px
- **Grid items**: `var(--spacing-md)` = 24px (16px mobile)
- **Section dividers**: `var(--spacing-2xl)` = 48px
- **Major sections**: `var(--spacing-2xl)` to `var(--spacing-4xl)` = 48-64px

### Margin Examples
- **Bottom of sections**: `var(--spacing-lg)` = 32px
- **Between columns**: `var(--spacing-md)` = 24px
- **Heading space below**: `var(--spacing-sm)` = 16px

---

## Do's & Don'ts

### ✅ DO
- Use `var(--spacing-*)` for all spacing
- Use `var(--radius-*)` for border-radius
- Use `var(--shadow-*)` for box-shadow
- Use `var(--transition-*)` for animations
- Maintain 48px minimum touch targets
- Test on mobile, tablet, and desktop

### ❌ DON'T
- Use magic numbers (e.g., `padding: 20px`)
- Use `border-radius: 8px` (use `var(--radius-sm)`)
- Use `box-shadow: 0 4px 6px` (use `var(--shadow-md)`)
- Use `transition: all 0.2s` (use `var(--transition-normal)`)
- Make touch targets smaller than 48px
- Ignore responsive breakpoints

---

## Accessibility Checklist

- [ ] All buttons ≥48px × 48px
- [ ] All form inputs ≥48px height
- [ ] Focus states have 3px outline
- [ ] Color contrast ≥4.5:1 (WCAG AA)
- [ ] Spacing is tested on mobile
- [ ] Touch targets have proper gap
- [ ] Hover states don't break layout
- [ ] Reduced motion respected

---

## Performance Notes

- CSS variables have **zero runtime cost**
- No additional HTTP requests
- Pure CSS - no JavaScript needed
- Same bundle size as hardcoded values
- Better for dark mode switching
- Easier to maintain and update

---

## Examples in Codebase

Look at these files for reference implementations:

- **`src/styles/hand-drawn.module.css`** - Component styles
- **`app/globals.css`** - Global spacing and button styles
- **`LAYOUT_SPACING_GUIDE.md`** - Comprehensive guide
- **`app/(protected)/settings/page.tsx`** - Real page using spacing

---

## Need Help?

1. **Check LAYOUT_SPACING_GUIDE.md** for detailed patterns
2. **Look at examples** in existing components
3. **Use browser DevTools** to inspect computed values
4. **Test on mobile** before committing
5. **Reference this Quick Card** for variable names

---

**Last Updated**: 2024  
**Compatibility**: All modern browsers  
**Dark Mode**: Fully supported
