# Creature System - 5-Minute Quick Start

## Import (1 minute)

```typescript
import { getCreature } from '@/lib/creatures';
import CreatureDisplay from '@/components/CreatureDisplay';
```

## Display (2 minutes)

```tsx
// Basic
<CreatureDisplay creatureId="glimmer" />

// With state & animation
<CreatureDisplay 
  creatureId="glimmer"
  state="happy"
  animation="bounce"
  size="medium"
/>
```

## Find Creatures (1 minute)

```typescript
import { getCreaturesByUseCase, getAllCreatures } from '@/lib/creatures';

// By use case
getCreaturesByUseCase('welcome')      // [wave, glimmer]
getCreaturesByUseCase('success')      // [cheery, boom, star]
getCreaturesByUseCase('error')        // [wobbly]
getCreaturesByUseCase('loading')      // [drift]

// All creatures
getAllCreatures()                      // All 15
```

## Common Examples (1 minute)

### Dashboard
```tsx
<CreatureDisplay creatureId="glimmer" state="happy" animation="bounce" />
```

### Loading
```tsx
<CreatureDisplay creatureId="drift" state="processing" animation="dreamy_float" />
```

### Error
```tsx
<CreatureDisplay creatureId="wobbly" state="confused" animation="shake" />
```

### Success
```tsx
<CreatureDisplay creatureId="boom" state="celebrating" animation="celebration" />
```

### Empty State
```tsx
<CreatureDisplay creatureId="cozy" state="encouraging" animation="gentle_bounce" />
```

## All 15 Creatures

| Name | Use For |
|------|---------|
| 🟣 Glimmer | Help, guidance, onboarding |
| 🔵 Pixel | Parent badges, authority |
| ✨ Sparkle | Child badges, creativity |
| 👑 Isla | Official updates, admin |
| 🎉 Cheery | Success, milestones |
| 💚 Wobbly | Errors, 404s |
| ⚡ Zing | Notifications, alerts |
| ☁️ Drift | Loading, processing |
| 🤎 Cozy | Empty states |
| 🧠 Brain | Thinking, search |
| 💥 Boom | Major achievements |
| 🌊 Wave | Welcome, greeting |
| 🛡️ Guardian | Safety, moderation |
| 🔊 Echo | Comments, discussion |
| ⭐ Star | Achievements, badges |

## Valid Props

```typescript
interface CreatureDisplayProps {
  creatureId: string;      // Required (one of the 15)
  state?: CreatureState;   // Optional (creature-specific)
  animation?: AnimationType; // Optional (creature-specific)
  size?: 'small' | 'medium' | 'large'; // Default: 'medium'
  className?: string;      // Additional CSS class
  debug?: boolean;         // Show debug info
  onAnimationComplete?: () => void; // Callback
  style?: CSSProperties;   // Custom styles
}
```

## Validation

```typescript
// Check if creature exists
const creature = getCreature('glimmer');
if (!creature) console.error('Creature not found');

// Validate state
if (!creature.states.includes('happy')) {
  console.warn('Invalid state for this creature');
}

// Validate animation
if (!creature.animation_support.includes('bounce')) {
  console.warn('Animation not supported');
}
```

## Performance Tips

1. **Memoize**: `useMemo(() => getCreature(id), [id])`
2. **Memo Component**: `React.memo(CreatureDisplay)`
3. **Lazy Load**: `lazy(() => import('@/components/CreatureDisplay'))`
4. **Reduce Motion**: Component respects `prefers-reduced-motion`

## File Location Reference

```
Library:        src/lib/creatures.ts
Animations:     src/lib/creature-animations.ts
Component:      src/components/CreatureDisplay.tsx
Styles:         src/components/CreatureDisplay.module.css
```

## Documentation Reference

```
Quick Start:    CREATURE_QUICK_START.md (this file)
System README:  CREATURE_SYSTEM_README.md
Full Guide:     CREATURE_LIBRARY.md
Visual Guide:   CREATURE_VISUAL_REFERENCE.md
Integration:    CREATURE_INTEGRATION_GUIDE.md
```

## Most Common Use Cases

### 1. Dashboard Welcome
```tsx
<CreatureDisplay creatureId="wave" state="greeting" animation="wave" size="large" />
```

### 2. Loading
```tsx
<CreatureDisplay creatureId="drift" state="processing" animation="dreamy_float" />
```

### 3. Error
```tsx
<CreatureDisplay creatureId="wobbly" state="confused" size="large" />
```

### 4. Success
```tsx
<CreatureDisplay creatureId="boom" state="exploding" animation="explosion" size="large" />
```

### 5. Empty State
```tsx
<CreatureDisplay creatureId="cozy" state="encouraging" animation="gentle_bounce" size="large" />
```

## States by Creature

**Glimmer**: happy, thinking, winking, surprised, excited
**Pixel**: neutral, proud, protective, thinking, smiling
**Sparkle**: happy, excited, curious, celebrating, dancing
**Isla**: neutral, announcing, celebrating, thinking, proud
**Cheery**: cheering, celebrating, dancing, excited, happy
**Wobbly**: confused, confused_but_helping, thinking, helping, neutral
**Zing**: surprised, excited, announcing, alert, happy
**Drift**: floating, dreaming, processing, peaceful, neutral
**Cozy**: sleeping, waking, encouraging, yawning, stretching
**Brain**: thinking, concentrating, solving, neutral, happy
**Boom**: exploding, celebrating, triumphant, excited, happy
**Wave**: waving, smiling, greeting, happy, excited
**Guardian**: alert, protecting, watching, neutral, proud
**Echo**: speaking, listening, responding, thinking, happy
**Star**: shining, glowing, celebrating, happy, excited

## Animations by Creature

**Glimmer**: bounce, wave, blink, head_tilt, nod
**Pixel**: nod, protective_stance, pulse
**Sparkle**: bounce, dance, sparkle, wiggle, celebrate
**Isla**: shimmer, glow, pulse, nod
**Cheery**: bounce, celebrate, confetti, dance, sparkle, shimmer
**Wobbly**: shake, head_tilt, wiggle, nod
**Zing**: zip_around, pulse, bounce, jitter, blink
**Drift**: dreamy_float, gentle_bounce, pulse, shimmer
**Cozy**: yawn, stretch, gentle_bounce, nod
**Brain**: head_tilt, sparkle, pulse, nod, shimmer
**Boom**: explosion, confetti, celebrate, grow, shimmer, sparkle
**Wave**: wave, nod, bounce, blink
**Guardian**: protective_stance, pulse, nod, shake
**Echo**: mouth_open, mouth_close, nod, pulse, shimmer
**Star**: shimmer, glow, sparkle, pulse, celebrate

## Debug Mode

```tsx
// Show creature info overlay
<CreatureDisplay 
  creatureId="glimmer" 
  debug={true}
/>
```

## Accessibility

All creatures automatically include:
- ✅ `role="img"` 
- ✅ `aria-label` (from creature.alt_text)
- ✅ Reduced motion support
- ✅ Color contrast compliance

## Next Steps

1. **Try it**: Use in a component today
2. **Explore**: Check `CREATURE_LIBRARY.md` for all details
3. **Customize**: Build with all 15 creatures
4. **Extend**: Add new creatures using the same pattern

---

**Status**: Ready to use! 🚀
**Questions**: See full documentation files above
