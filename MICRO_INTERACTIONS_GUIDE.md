# Micro-Interactions System for Isla.site

A comprehensive micro-interactions and animations library designed for Isla's creature-themed UI. Provides smooth, accessible, and performant animations throughout the application.

## Overview

The micro-interactions system consists of:

1. **`src/lib/micro-interactions.ts`** - TypeScript utilities for triggering and managing animations
2. **`src/styles/animations.module.css`** - CSS keyframes and animation classes
3. **`tests/unit/micro-interactions.test.ts`** - Comprehensive test suite

All animations respect the `prefers-reduced-motion` media query for accessibility and are GPU-accelerated using `transform` and `opacity` properties for 60fps+ performance.

## Features

### 1. Creature Blink Animation
Eyes blink naturally every 3-5 seconds with a smooth 300ms duration.

```typescript
import { triggerCreatureBlink } from '@/lib/micro-interactions';

const stopBlink = triggerCreatureBlink(element, 3000);
// Later, to stop blinking:
stopBlink();
```

### 2. Creature Bounce on Interaction
Creatures bounce playfully when users hover over them (0.6s animation).

```typescript
import { addBoundingBox } from '@/lib/micro-interactions';

element.addEventListener('mouseenter', () => {
  addBoundingBox(element, 'cheery');
});
```

### 3. Post Creation Celebration
When posts are submitted, Cheery creature celebrates with jumping animation and optional confetti.

```typescript
import { triggerCelebration, triggerConfettiEffect } from '@/lib/micro-interactions';

async function onPostCreated() {
  triggerCelebration(celebrationElement, 'cheery');
  triggerConfettiEffect(container, 15);
}
```

### 4. Notification Pop-in
New notifications appear with Zing creature, sliding in from right with bounce.

```typescript
import { animateNotification, triggerBadgePulse } from '@/lib/micro-interactions';

function showNotification(notification) {
  animateNotification(notification);
  triggerBadgePulse(badgeElement, true);
}
```

### 5. Approval Celebration
When parents approve children, creatures celebrate with dancing animation.

```typescript
import { triggerApprovalCelebration } from '@/lib/micro-interactions';

function onApprovalReceived(isParentView) {
  triggerApprovalCelebration(element, isParentView);
}
```

### 6. Error State Reaction
Wobbly creature appears confused with gentle shake animation.

```typescript
import { triggerErrorReaction } from '@/lib/micro-interactions';

function handleError(error) {
  triggerErrorReaction(errorElement);
  // Auto-removes after 800ms
}
```

### 7. Loading Skeleton Animation
Drift creature floats peacefully with breathing animation.

```typescript
import { handleLoadingState, triggerBreathingAnimation } from '@/lib/micro-interactions';

function showLoading() {
  handleLoadingState(container, true);
}

function hideLoading() {
  handleLoadingState(container, false);
}
```

### 8. Page Transition
Subtle fade in/out with creature waving goodbye/hello.

```typescript
import { triggerPageTransition, cleanPageTransition } from '@/lib/micro-interactions';

function onPageChange() {
  triggerPageTransition(pageElement, 'out');
  // After navigation...
  triggerPageTransition(newPageElement, 'in');
}
```

### 9. Button Hover Effects
Buttons grow slightly on hover (1.05x scale) with 100ms smooth transition.

```typescript
import { triggerButtonHover, removeButtonHover } from '@/lib/micro-interactions';

button.addEventListener('mouseenter', () => {
  triggerButtonHover(button);
});

button.addEventListener('mouseleave', () => {
  removeButtonHover(button);
});
```

### 10. Form Input Focus
Input border glows with primary color, creature pops into view next to field.

```typescript
import { triggerInputFocus, removeInputFocus } from '@/lib/micro-interactions';

input.addEventListener('focus', () => {
  triggerInputFocus(input, creatureElement);
});

input.addEventListener('blur', () => {
  removeInputFocus(input, creatureElement);
});
```

### 11. Empty State Encouragement
Cozy creature wakes up and waves when empty state is shown.

```typescript
import { triggerEmptyStateAnimation } from '@/lib/micro-interactions';

function showEmptyState() {
  triggerEmptyStateAnimation(element, true);
}

function hideEmptyState() {
  triggerEmptyStateAnimation(element, false);
}
```

### 12. Notification Badge Pulse
Unread notification badge pulses gently with 1.5s duration.

```typescript
import { triggerBadgePulse } from '@/lib/micro-interactions';

triggerBadgePulse(badgeElement, true);  // Start pulsing
triggerBadgePulse(badgeElement, false); // Stop pulsing
```

### 13. Approval Workflow Progress
Progress indicator animated with creatures showing different states.

```typescript
import { triggerProgressAnimation } from '@/lib/micro-interactions';

triggerProgressAnimation(element, 2, 3); // Step 2 of 3
```

### 14. Modal Open/Close
Modal slides in from bottom on mobile, fades in on desktop.

```typescript
import { triggerModalTransition } from '@/lib/micro-interactions';

const isMobile = window.innerWidth < 768;
triggerModalTransition(modal, true, isMobile);  // Open
triggerModalTransition(modal, false, isMobile); // Close
```

### 15. Swipe/Scroll Feedback
Touch feedback on mobile with scroll direction feedback.

```typescript
import { triggerScrollFeedback, triggerHapticFeedback } from '@/lib/micro-interactions';

function onSwipe(direction) {
  triggerScrollFeedback(element, direction); // 'up', 'down', 'left', 'right'
  triggerHapticFeedback('medium');           // Light, medium, or heavy
}
```

## Animation Duration Presets

```typescript
import { ANIMATION_DURATIONS, getAnimationDuration } from '@/lib/micro-interactions';

ANIMATION_DURATIONS.quick   // 200ms
ANIMATION_DURATIONS.normal  // 600ms
ANIMATION_DURATIONS.slow    // 2000ms

// Or use helper:
const duration = getAnimationDuration('quick');
```

## Accessibility

### Respecting Motion Preferences

All animations automatically respect the `prefers-reduced-motion` media query:

```typescript
import { respectMotionPreference } from '@/lib/micro-interactions';

if (!respectMotionPreference()) {
  // Safe to animate
  triggerCelebration(element, 'cheery');
}
```

The CSS automatically disables animations for users with reduced motion preference enabled.

### Keyboard Navigation

All animations work with keyboard navigation. Focus visible states include subtle glow effects:

```css
*:focus-visible {
  outline: 2px solid var(--color-primary, #a855f7);
  outline-offset: 2px;
}
```

## Performance Optimizations

### GPU Acceleration

All animations use only `transform` and `opacity` properties for GPU acceleration:

```typescript
// ✅ Good - GPU accelerated
transform: translateY(-20px);
opacity: 0.5;

// ❌ Bad - causes layout thrashing
margin-top: 20px;
width: 100px;
```

### Batch Operations

Use batch animations to prevent layout thrashing:

```typescript
import { batchAnimations } from '@/lib/micro-interactions';

batchAnimations([
  () => element1.classList.add('fade-in'),
  () => element2.classList.add('slide-left'),
  () => element3.classList.add('bounce-once')
]);
```

### Disable for Testing

```typescript
import { disableAnimations, enableAnimations } from '@/lib/micro-interactions';

// Before tests
disableAnimations();

// After tests
enableAnimations();
```

## Mobile Optimizations

Animations are automatically optimized for mobile:

- Reduced animation durations (1500ms instead of 2000ms)
- Modal slides up instead of fading (bottom sheet pattern)
- Simpler gesture animations
- Haptic feedback support

## Dark Mode Support

Animations automatically adapt to dark mode:

```css
@media (prefers-color-scheme: dark) {
  .input-focus-glow {
    box-shadow: 0 0 0 0 rgba(216, 180, 254, 0.6);
  }
}
```

## Audio Notifications

Optional accessible audio notifications:

```typescript
import { playNotificationSound } from '@/lib/micro-interactions';

// Types: 'success', 'error', 'notification'
await playNotificationSound('success');

// Users can disable via localStorage
localStorage.setItem('audio-notifications-enabled', 'false');
```

## Available CSS Classes

All animation classes can be used directly in HTML:

```html
<!-- Celebrations -->
<div class="celebration-active"></div>
<div class="approval-dance"></div>

<!-- Notifications -->
<div class="notification-slide-in"></div>
<div class="badge-pulse"></div>

<!-- Loading -->
<div class="loading-skeleton"></div>
<div class="breathing-animation"></div>

<!-- Interactions -->
<button class="button-hover-scale"></button>
<input class="input-focus-glow" />

<!-- Transitions -->
<div class="page-transition-in"></div>
<div class="modal-fade-in"></div>

<!-- Effects -->
<div class="fade-in"></div>
<div class="slide-in-left"></div>
<div class="gentle-float"></div>
```

## Animation Timing

Get element animation duration:

```typescript
import { getElementAnimationDuration, waitForAnimationComplete } from '@/lib/micro-interactions';

const duration = getElementAnimationDuration(element);

// Wait for animation to complete
await waitForAnimationComplete(element);
```

## Confetti Effect

Create particle-based confetti animations:

```typescript
import { triggerConfettiEffect } from '@/lib/micro-interactions';

triggerConfettiEffect(container, 20); // 20 particles
```

## Testing

Run the micro-interactions test suite:

```bash
npm run test -- tests/unit/micro-interactions.test.ts
```

Tests cover:
- Animation duration presets
- Motion preference detection
- Animation class application/removal
- Auto-remove after timeout
- Reduced motion fallbacks
- Haptic feedback
- Confetti particles
- Audio notifications

## Browser Support

- Chrome/Edge 88+
- Firefox 85+
- Safari 14+
- Mobile Safari 14+
- Android Chrome 88+

Note: Older browsers will fall back to no animations gracefully.

## CSS Variables

Customize animations with CSS variables:

```css
:root {
  --color-primary: #a855f7;
  --animation-duration: 600ms;
  --animation-easing: cubic-bezier(0.34, 1.56, 0.64, 1);
  --confetti-color: #a855f7;
}
```

## Best Practices

1. **Don't animate more than necessary** - Use animations to draw attention to important interactions
2. **Respect motion preferences** - Always check `respectMotionPreference()`
3. **Keep animations under 3 seconds** - Except for infinite loops (breathing, floating, etc.)
4. **Use GPU acceleration** - Only animate transform and opacity
5. **Batch DOM operations** - Use `batchAnimations()` to avoid thrashing
6. **Test on real devices** - Especially mobile devices for performance
7. **Provide alternatives** - Don't convey information only through animation
8. **Ensure accessibility** - Focus states should be clearly visible

## Common Patterns

### Loading State with Cleanup

```typescript
function loadData() {
  handleLoadingState(container, true);

  try {
    const data = await fetchData();
    handleLoadingState(container, false);
    render(data);
  } catch (error) {
    handleLoadingState(container, false);
    triggerErrorReaction(errorElement);
  }
}
```

### Event-Driven Animations

```typescript
element.addEventListener('mouseenter', () => {
  triggerButtonHover(element);
});

element.addEventListener('mouseleave', () => {
  removeButtonHover(element);
});
```

### Conditional Animations

```typescript
function animate(element) {
  if (respectMotionPreference()) {
    // Just show without animation
    element.style.opacity = '1';
  } else {
    triggerCelebration(element, 'cheery');
  }
}
```

## Troubleshooting

### Animation not triggering

1. Check if element has class applied: `element.classList.contains('celebration-active')`
2. Verify `prefers-reduced-motion` is not enabled
3. Check browser console for errors
4. Ensure CSS module is imported

### Animation jank on mobile

1. Reduce particle count in confetti: `triggerConfettiEffect(container, 5)`
2. Disable animations for older devices: `disableAnimations()`
3. Use `batchAnimations()` for multiple elements
4. Check performance with DevTools Performance tab

### Layout shift during animation

1. Ensure animations use only `transform` and `opacity`
2. Use `will-change: transform` for hints
3. Pre-allocate space for animated elements

## License

Part of Isla.site - All rights reserved.
