# Micro-Interactions Quick Reference

## Import

```typescript
import {
  // Duration presets
  ANIMATION_DURATIONS,
  getAnimationDuration,

  // Preferences
  respectMotionPreference,
  getAnimationClass,

  // Main triggers
  triggerCelebration,
  animateNotification,
  addBoundingBox,
  handleLoadingState,
  triggerErrorReaction,
  triggerApprovalCelebration,
  triggerButtonHover,
  removeButtonHover,
  triggerInputFocus,
  removeInputFocus,
  triggerEmptyStateAnimation,
  triggerBadgePulse,
  triggerPageTransition,
  cleanPageTransition,
  triggerModalTransition,
  triggerScrollFeedback,
  triggerHapticFeedback,
  triggerProgressAnimation,
  triggerCreatureBlink,
  triggerConfettiEffect,
  triggerCreatureNotification,
  triggerBreathingAnimation,

  // Utilities
  playNotificationSound,
  disableAnimations,
  enableAnimations,
  getElementAnimationDuration,
  waitForAnimationComplete,
  batchAnimations
} from '@/lib/micro-interactions';
```

## Common Patterns

### Celebration (Post Created, Approval)
```typescript
triggerCelebration(element, 'cheery');
triggerConfettiEffect(container, 15);
```

### Notification
```typescript
animateNotification(notification);
triggerBadgePulse(badge, true);
```

### Button Interaction
```typescript
onMouseEnter={() => triggerButtonHover(button)}
onMouseLeave={() => removeButtonHover(button)}
```

### Input Focus
```typescript
onFocus={() => triggerInputFocus(input, creature)}
onBlur={() => removeInputFocus(input, creature)}
```

### Error State
```typescript
triggerErrorReaction(errorElement);
// Auto-removes after 800ms
```

### Loading State
```typescript
handleLoadingState(container, true);  // Show loading
handleLoadingState(container, false); // Hide loading
```

### Empty State
```typescript
triggerEmptyStateAnimation(element, true);  // Show
triggerEmptyStateAnimation(element, false); // Hide
```

### Page Transition
```typescript
triggerPageTransition(page, 'out'); // Exit
triggerPageTransition(page, 'in');  // Enter
```

### Modal
```typescript
const isMobile = window.innerWidth < 768;
triggerModalTransition(modal, true, isMobile);  // Open
triggerModalTransition(modal, false, isMobile); // Close
```

### Progress
```typescript
triggerProgressAnimation(element, 2, 3); // Step 2/3
```

### Scroll/Swipe
```typescript
triggerScrollFeedback(element, 'up'); // up/down/left/right
triggerHapticFeedback('medium');      // light/medium/heavy
```

### Creature Blink
```typescript
const stop = triggerCreatureBlink(element, 3000);
stop(); // Later, stop blinking
```

## Animations by Duration

| Duration | Animations |
|----------|-----------|
| 200ms | `quick` duration, button hover |
| 300ms | Input focus glow, input focus creature |
| 400ms | Notification appear, modal animations, scroll feedback |
| 500ms | Notification slide-in |
| 600ms | Bounce, button hover scale, normal duration |
| 800ms | Error shake, creature blink |
| 1000ms | Empty state wake, breathing, pulse |
| 1500ms | Badge pulse |
| 2000ms | Approval dance, loading breathing, slow duration |
| 3000ms | Page transition, approval dance (parent), float |

## CSS Classes to Use Directly

```html
<!-- Celebrations -->
<div class="celebration-active"></div>
<div class="approval-dance"></div>

<!-- Loading -->
<div class="loading-skeleton"></div>
<div class="breathing-animation"></div>

<!-- Interactions -->
<button class="button-hover-scale"></button>
<input class="input-focus-glow" />

<!-- Transitions -->
<div class="page-transition-in"></div>
<div class="modal-slide-up"></div>

<!-- Effects -->
<div class="fade-in"></div>
<div class="slide-in-left"></div>
<div class="gentle-float"></div>
<div class="pulse-emphasis"></div>
```

## Accessibility

```typescript
// Check for reduced motion preference
if (respectMotionPreference()) {
  // Just show without animation
  element.style.opacity = '1';
} else {
  // Safe to animate
  triggerCelebration(element, 'cheery');
}

// Get appropriate class
const cls = getAnimationClass('celebration-active', 'celebration-reduced');
element.classList.add(cls);
```

## Performance

```typescript
// Batch multiple animations
batchAnimations([
  () => element1.classList.add('fade-in'),
  () => element2.classList.add('slide-left'),
  () => element3.classList.add('bounce-once')
]);

// Wait for animation completion
await waitForAnimationComplete(element);

// Disable all animations (for testing)
disableAnimations();
enableAnimations();
```

## Audio Notifications

```typescript
// Types: 'success', 'error', 'notification'
await playNotificationSound('success');

// Users can disable: localStorage.setItem('audio-notifications-enabled', 'false')
```

## Ref Pattern (React)

```typescript
function Component() {
  const ref = useRef<HTMLDivElement>(null);

  const handleClick = () => {
    if (ref.current) {
      triggerCelebration(ref.current, 'cheery');
    }
  };

  return <div ref={ref} onClick={handleClick} />;
}
```

## Event Listeners Pattern

```typescript
element.addEventListener('mouseenter', () => {
  triggerButtonHover(element);
});

element.addEventListener('mouseleave', () => {
  removeButtonHover(element);
});

input.addEventListener('focus', () => {
  triggerInputFocus(input, creature);
});

input.addEventListener('blur', () => {
  removeInputFocus(input, creature);
});
```

## Timeout Cleanup

Most animations auto-remove, but some need cleanup:

```typescript
// Already auto-removes (2s)
triggerCelebration(element, 'cheery');

// Already auto-removes (800ms)
triggerErrorReaction(element);

// Already auto-removes (3s)
triggerApprovalCelebration(element);

// Manually handle
triggerButtonHover(button);
// ... later
removeButtonHover(button);

// For intervals
const stop = triggerCreatureBlink(element, 3000);
// ... later
stop();
```

## Mobile Considerations

```typescript
const isMobile = window.innerWidth < 768;

// Use different animations for mobile
if (isMobile) {
  triggerModalTransition(modal, true, true);   // Slide up
} else {
  triggerModalTransition(modal, true, false);  // Fade in
}

// Reduce particle count on mobile
const particleCount = isMobile ? 10 : 20;
triggerConfettiEffect(container, particleCount);

// Add haptic feedback on mobile
if (isMobile) {
  triggerHapticFeedback('medium');
}
```

## Testing

```typescript
import { vi } from 'vitest';

// Mock reduced motion
window.matchMedia = vi.fn().mockReturnValue({
  matches: true  // prefers-reduced-motion enabled
});

expect(respectMotionPreference()).toBe(true);

// Disable animations in tests
disableAnimations();
// ... run tests
enableAnimations();

// Wait for animation
await waitForAnimationComplete(element);

// Check animation was triggered
expect(element.classList.contains('celebration-active')).toBe(true);
```

## Animation Classes Available

### Celebration & Parties
- `celebration-active` - Celebration jump
- `celebration-reduced` - No animation fallback
- `approval-dance` - Approval dance
- `approval-dance-parent` - Parent approval celebration
- `approval-reduced` - No animation fallback
- `confetti-particle` - Confetti particles

### Notifications
- `notification-slide-in` - Slide from right
- `notification-appear` - Pop in effect
- `notification-reduced` - No animation
- `badge-pulse` - Badge pulse effect
- `badge-pulse-reduced` - No animation

### Loading & Breathing
- `loading-skeleton` - Breathing animation
- `loading-skeleton-shimmer` - Shimmer effect
- `loading-reduced` - No animation
- `breathing-animation` - Breathing effect

### Interactive
- `button-hover-scale` - Scale on hover
- `input-focus-glow` - Glow effect
- `input-focus-reduced` - No animation
- `creature-pop` - Pop in effect
- `creature-pop-reduced` - No animation

### States
- `error-shake` - Shake animation
- `error-shake-reduced` - No animation
- `empty-state-wake` - Wake animation
- `empty-state-wave` - Wave animation
- `empty-state-reduced` - No animation

### Page & Modal
- `page-transition-in` - Fade in
- `page-transition-out` - Fade out
- `page-wave-goodbye` - Wave animation
- `modal-fade-in` - Fade in
- `modal-fade-out` - Fade out
- `modal-slide-up` - Slide up
- `modal-slide-down` - Slide down
- `modal-open-reduced` - No animation
- `modal-close-reduced` - No animation

### Scroll & Feedback
- `scroll-feedback-up` - Up feedback
- `scroll-feedback-down` - Down feedback
- `scroll-feedback-left` - Left feedback
- `scroll-feedback-right` - Right feedback
- `scroll-feedback-reduced` - No animation

### Progress
- `progress-step` - Progress animation
- `progress-reduced` - No animation

### Creature
- `creature-blink` - Eye blink
- `creature-blink-reduced` - No animation

### Transitions
- `fade-in` - Fade in
- `fade-out` - Fade out
- `slide-in-left` - Slide from left
- `slide-in-right` - Slide from right

### Effects
- `gentle-float` - Floating motion
- `pulse-emphasis` - Pulse effect
- `subtle-shake` - Gentle shake
- `glow-effect` - Glow pulse

## CSS Variables

```css
:root {
  --color-primary: #a855f7;
  --confetti-color: #a855f7;
  --animation-duration: 600ms;
  --animation-easing: cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Animation not showing | Check `respectMotionPreference()` or class applied |
| Janky animation | Use `batchAnimations()` or check only `transform`/`opacity` |
| Animation too fast/slow | Adjust duration preset or use custom CSS |
| Mobile performance issues | Reduce `particleCount` or disable on old devices |
| Focus visible not showing | Check browser support for `:focus-visible` |

---

**For full documentation:** See `MICRO_INTERACTIONS_GUIDE.md`  
**For examples:** See `MICRO_INTERACTIONS_EXAMPLES.md`  
**For implementation details:** See `MICRO_INTERACTIONS_IMPLEMENTATION.md`
