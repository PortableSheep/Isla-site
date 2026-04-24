# Creature Theme Implementation - Code Examples & Patterns

## Quick Reference Guide

### 1. Importing CreatureDisplay
```tsx
import { CreatureDisplay } from '@/components/CreatureDisplay';
```

### 2. Basic Creature Usage
```tsx
<CreatureDisplay
  creatureId="glimmer"
  state="happy"
  animation="bounce"
  size="medium"
/>
```

### 3. Hand-Drawn Styling
```tsx
import styles from '@/styles/hand-drawn.module.css';

// Apply to container
<div
  className={`${styles.handDrawnBorder} bg-white dark:bg-gray-900 p-8`}
  style={{ borderColor: '#A855F7' } as React.CSSProperties}
>
  {/* Content */}
</div>
```

### 4. Creature Decorations in Corners
```tsx
{/* Corner decorations */}
<div
  className={`${styles.creatureCornerTL} hidden sm:block`}
  style={{ '--creature-color': '#EC4899' } as React.CSSProperties}
/>
<div
  className={`${styles.creatureCornerBR}`}
  style={{ '--creature-color': '#FBBF24' } as React.CSSProperties}
/>
```

### 5. Empty State Pattern
```tsx
<div className={`${styles.emptyStateContainer}`}>
  <div className={styles.emptyStateCreature}>
    <CreatureDisplay
      creatureId="cozy"
      state="encouraging"
      size="large"
    />
  </div>
  <h3>No items yet</h3>
  <p>Start by creating something new!</p>
</div>
```

### 6. Error Message with Creature
```tsx
<div className={`${styles.errorMessageContainer}`}>
  <span className={styles.errorIcon}>😕</span>
  <span className={styles.errorText}>
    Something went wrong. Please try again.
  </span>
</div>
```

### 7. Button with Creature Accent
```tsx
<button
  className={`${styles.creatureButton} bg-gradient-to-r from-purple-600 to-pink-600 text-white`}
>
  <span>✨</span>
  <span>Create Post</span>
</button>
```

### 8. Loading State with Drift
```tsx
<div className="flex items-center justify-center min-h-screen">
  <div className="text-center">
    <CreatureDisplay
      creatureId="drift"
      state="processing"
      animation="dreamy_float"
      size="medium"
    />
    <p className="text-gray-600 dark:text-gray-400 mt-4">
      Loading...
    </p>
  </div>
</div>
```

### 9. Success Celebration
```tsx
{saved && (
  <div
    className={`${styles.celebrationAnimation} p-4 bg-green-50 dark:bg-green-950/30 rounded-lg`}
  >
    <CreatureDisplay
      creatureId="cheery"
      state="celebrating"
      animation="celebrate"
      size="small"
    />
    <p>Settings saved successfully!</p>
  </div>
)}
```

### 10. Gradient Background Pattern
```tsx
<div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-white dark:from-gray-950 dark:via-purple-950 dark:to-gray-900">
  {/* Content */}
</div>
```

## Creature Selection Guide

### For Welcome/Greeting
- **Wave**: Friendly waving, warm greeting
- **Glimmer**: Helpful guide, dashboard greeting
- **Cheery**: Celebratory welcome

### For Alerts/Notifications
- **Zing**: Urgent notifications, alerts with pulse
- **Guardian**: Important admin notices

### For Loading
- **Drift**: Processing, loading states with float animation
- **Brain**: Thinking, deliberation states

### For Empty States
- **Cozy**: Encouraging, welcoming empty states
- **Brain**: Thinking, search results empty

### For Success
- **Cheery**: Success, celebration, achievements
- **Star**: Achievements, special recognition

### For Errors
- **Wobbly**: Helpful confusion, errors (when error component used)
- **Guardian**: Warning, serious issues

### For Guidance
- **Glimmer**: General help, dashboard greeting
- **Echo**: Communication, discussion
- **Brain**: Complex processes

## Animation Options

| Animation | Use Case | Duration |
|-----------|----------|----------|
| `bounce` | Happy greeting, positive actions | 0.6s |
| `wave` | Welcome, greeting creatures | 0.8s |
| `pulse` | Alerts, important items | 1.5s |
| `float` | Dreamy, loading states | 2s+ |
| `shake` | Error, confusion (gentle) | 0.4s |
| `spin` | Processing, loading | 1s+ |
| `celebrate` | Success, achievements | 0.6s |
| `dance` | Happy, playful states | 1.2s |
| `shimmer` | Special, magical moments | 1s+ |
| `glow` | Important, highlighted items | 1.5s+ |

## State Options

### Positive States
- `happy` - Cheerful, pleased
- `excited` - Enthusiastic, energetic
- `celebrating` - Success, achievement
- `proud` - Accomplishment
- `cheering` - Victory, success

### Neutral States
- `neutral` - Default, calm
- `thinking` - Considering, processing
- `listening` - Attending, responsive
- `peaceful` - Calm, welcoming
- `encouraging` - Supportive, helpful

### Alert States
- `alert` - Important, urgent
- `surprised` - Unexpected
- `confused` - Error, problem
- `worried` - Concern
- `protecting` - Safety, guardian

### Loading States
- `floating` - Drift creature, processing
- `dreaming` - Drift creature, thoughtful
- `processing` - Busy, working
- `concentrating` - Focused, thinking

## Size Recommendations

```tsx
// Small - 32-48px (badges, corners, small helpers)
<CreatureDisplay creatureId="glimmer" size="small" />

// Medium - 64-80px (headers, main display)
<CreatureDisplay creatureId="glimmer" size="medium" />

// Large - 128-160px (empty states, featured)
<CreatureDisplay creatureId="glimmer" size="large" />
```

## Color Integration

### Using Creature Colors
```tsx
// Access creature color via creatures.ts
import { getCreature, getCreatureColor } from '@/lib/creatures';

const creature = getCreature('glimmer');
const primaryColor = creature.primaryColor; // '#A855F7'
const accentColor = getCreatureColor('glimmer', 'medium'); // '#F472B6'

// Apply as border or accent
<div style={{ borderColor: primaryColor }} />
```

### Gradient Combinations
```tsx
// Purple/Pink (Glimmer theme)
bg-gradient-to-r from-purple-600 to-pink-600

// Orange/Pink (Cheery/Wave theme)
bg-gradient-to-r from-orange-600 to-pink-600

// Blue/Indigo (Guardian theme)
bg-gradient-to-r from-blue-600 to-indigo-600

// Yellow/Orange (Zing theme)
bg-gradient-to-r from-yellow-600 to-orange-600

// Cyan/Teal (Wave theme)
bg-gradient-to-r from-cyan-600 to-teal-600
```

## Dark Mode Pattern

```tsx
<div className="
  min-h-screen 
  bg-gradient-to-br 
  from-purple-50 via-pink-50 to-white 
  dark:from-gray-950 dark:via-purple-950 dark:to-gray-900
">
  <div className="
    bg-white 
    dark:bg-gray-900 
    text-gray-900 
    dark:text-white
  ">
    Content with automatic dark mode
  </div>
</div>
```

## Mobile Responsiveness

```tsx
{/* Hide on mobile, show on tablet+ */}
<div className="hidden sm:block">
  <CreatureDisplay creatureId="glimmer" size="medium" />
</div>

{/* Responsive sizing */}
<div className="text-2xl sm:text-4xl lg:text-5xl">
  Responsive heading
</div>

{/* Stack on mobile, grid on tablet+ */}
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Items */}
</div>
```

## Common Patterns

### Page Header with Creature
```tsx
<div className="mb-12 flex items-start gap-6">
  <div className="hidden sm:block">
    <CreatureDisplay
      creatureId="glimmer"
      state="happy"
      animation="wave"
      size="medium"
    />
  </div>
  <div className="flex-1">
    <h1 className="text-4xl font-bold 
      bg-gradient-to-r from-purple-600 to-pink-600 
      bg-clip-text text-transparent mb-2">
      Welcome!
    </h1>
    <p className="text-gray-600 dark:text-gray-400">
      Description here
    </p>
  </div>
</div>
```

### Card with Creature Corners
```tsx
<div
  className={`${styles.creatureCard} 
    bg-white dark:bg-gray-900 
    border-2 border-purple-300 p-6 relative`}
>
  <div className={`${styles.decorationTL}`}>👨</div>
  <div className={`${styles.decorationBR}`}>👧</div>
  
  <h3 className="text-xl font-bold mb-2">Card Title</h3>
  <p className="text-gray-600 dark:text-gray-400">Content here</p>
</div>
```

### Action Button with Creature
```tsx
<button
  className={`${styles.creatureButton} 
    bg-gradient-to-r from-purple-600 to-pink-600 
    text-white font-semibold 
    hover:shadow-lg transition-all`}
>
  <span>✨</span>
  <span>Create New</span>
</button>
```

## TypeScript Types

```tsx
import type { CreatureState, AnimationType } from '@/lib/creatures';

// Valid creature states
type CreatureState = 
  | 'happy' | 'thinking' | 'surprised' | 'sad' | 'neutral'
  | 'excited' | 'celebrating' | 'confused' | 'confused_but_helping'
  | 'proud' | 'protective' | 'announcing' | 'cheering' | 'dancing'
  | 'winking' | 'curious' | 'sleeping' | 'waking' | 'floating'
  | 'dreaming' | 'processing' | 'yawning' | 'stretching'
  | 'concentrating' | 'solving' | 'exploding' | 'triumphant'
  | 'waving' | 'smiling' | 'greeting' | 'alert' | 'protecting'
  | 'watching' | 'speaking' | 'listening' | 'responding'
  | 'shining' | 'glowing' | 'helping' | 'peaceful' | 'encouraging';

// Valid animations
type AnimationType = 
  | 'bounce' | 'float' | 'spin' | 'wave' | 'pulse' | 'shake'
  | 'slide_in' | 'fade_in' | 'grow' | 'wiggle' | 'jitter'
  | 'yawn' | 'stretch' | 'dance' | 'shimmer' | 'glow'
  | 'sparkle' | 'celebrate' | 'confetti' | 'blink' | 'nod'
  | 'head_tilt' | 'eye_follow' | 'mouth_open' | 'mouth_close'
  | 'dreamy_float' | 'gentle_bounce' | 'explosion' | 'zip_around'
  | 'protective_stance';
```

## Testing Checklist

- [ ] Creature displays without errors
- [ ] Animation plays smoothly
- [ ] Size adjusts correctly
- [ ] State shows properly
- [ ] Dark mode works
- [ ] Mobile responsive
- [ ] Touch targets 48px+
- [ ] Alt text present
- [ ] Color contrast WCAG AA
- [ ] Animations perform well

---

This guide provides patterns and examples for using the creature theme system throughout Isla.site. For more details, see CREATURE_THEME_REDESIGN.md and REDESIGN_BEFORE_AFTER.md.
