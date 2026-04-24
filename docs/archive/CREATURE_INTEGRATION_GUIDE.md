# Creature Library Integration Guide

## Quick Start

### 1. Import the Library

```typescript
import { 
  getCreature, 
  creatures,
  getCreaturesByUseCase,
  type Creature,
  type CreatureState 
} from '@/lib/creatures';

import { 
  getAnimation, 
  getAnimationStyle,
  type AnimationType 
} from '@/lib/creature-animations';
```

### 2. Basic Usage

```typescript
// Get a creature
const glimmer = getCreature('glimmer');

// Display it
<CreatureDisplay 
  creatureId="glimmer"
  state="happy"
  animation="bounce"
  size="medium"
/>
```

### 3. Find Creatures by Use Case

```typescript
// Get creatures for a specific purpose
const greetingCreatures = getCreaturesByUseCase('welcome');
// Returns: [wave, glimmer]

const successCreatures = getCreaturesByUseCase('success');
// Returns: [cheery, boom, star]
```

---

## File Structure

```
src/
├── lib/
│   ├── creatures.ts              # Main creature definitions
│   └── creature-animations.ts    # Animation configs
└── components/
    ├── CreatureDisplay.tsx       # React component (example)
    └── CreatureDisplay.module.css # Styles (example)

root/
├── CREATURE_LIBRARY.md           # Full documentation
├── CREATURE_VISUAL_REFERENCE.md  # Visual guide & quick reference
└── CREATURE_INTEGRATION_GUIDE.md # This file
```

---

## Core Concepts

### Creatures
Each creature is an object with:
- **id**: Unique identifier (lowercase, no spaces)
- **name**: Display name
- **description**: What the creature is for
- **personality**: Character traits
- **colors**: Primary, secondary, accent hex codes
- **states**: Emotional states the creature can display
- **animations**: Animations the creature supports
- **use_cases**: Where in the app the creature appears

### States
Emotional or contextual states (e.g., 'happy', 'thinking', 'confused'). Each creature only supports specific states.

### Animations
Visual animations that can play on creatures (e.g., 'bounce', 'wave', 'shimmer'). Each creature only supports specific animations.

---

## Common Use Cases

### Dashboard Welcome

```typescript
// src/components/Dashboard.tsx
import CreatureDisplay from '@/components/CreatureDisplay';
import { getCreature } from '@/lib/creatures';

export function Dashboard() {
  return (
    <header className="dashboard-header">
      <CreatureDisplay 
        creatureId="glimmer"
        state="happy"
        animation="bounce"
        size="large"
      />
      <h1>Welcome to Isla!</h1>
    </header>
  );
}
```

### Error Page

```typescript
// src/pages/404.tsx
import CreatureDisplay from '@/components/CreatureDisplay';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="error-page">
      <CreatureDisplay 
        creatureId="wobbly"
        state="confused_but_helping"
        animation="head_tilt"
        size="large"
      />
      <h1>Oops! Page not found</h1>
      <p>Wobbly is confused, but can help you get back.</p>
      <Link href="/">Go Home</Link>
    </div>
  );
}
```

### Loading Indicator

```typescript
// src/components/LoadingSpinner.tsx
import CreatureDisplay from '@/components/CreatureDisplay';

export function LoadingSpinner() {
  return (
    <div className="loading-container">
      <CreatureDisplay 
        creatureId="drift"
        state="processing"
        animation="dreamy_float"
        size="medium"
      />
      <p>Loading...</p>
    </div>
  );
}
```

### Success Modal

```typescript
// src/components/SuccessModal.tsx
import { ReactNode } from 'react';
import CreatureDisplay from '@/components/CreatureDisplay';

interface SuccessModalProps {
  title: string;
  message: string;
  creature?: string;
  animation?: string;
  onClose: () => void;
}

export function SuccessModal({
  title,
  message,
  creature = 'cheery',
  animation = 'celebrate',
  onClose
}: SuccessModalProps) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <CreatureDisplay 
          creatureId={creature}
          state="celebrating"
          animation={animation}
          size="large"
        />
        <h2>{title}</h2>
        <p>{message}</p>
        <button onClick={onClose}>Continue</button>
      </div>
    </div>
  );
}
```

### Author Badges

```typescript
// src/components/AuthorBadge.tsx
import CreatureDisplay from '@/components/CreatureDisplay';
import { Creature, getCreature } from '@/lib/creatures';

interface AuthorBadgeProps {
  authorName: string;
  role: 'parent' | 'child';
}

export function AuthorBadge({ authorName, role }: AuthorBadgeProps) {
  const creature = role === 'parent' ? 'pixel' : 'sparkle';
  
  return (
    <div className="author-badge">
      <CreatureDisplay 
        creatureId={creature}
        state={role === 'parent' ? 'proud' : 'happy'}
        size="small"
      />
      <span>{authorName} ({role})</span>
    </div>
  );
}
```

### Notification Badge

```typescript
// src/components/NotificationBell.tsx
import CreatureDisplay from '@/components/CreatureDisplay';
import { useState } from 'react';

interface NotificationBellProps {
  count: number;
  onClick: () => void;
}

export function NotificationBell({ count, onClick }: NotificationBellProps) {
  return (
    <button className="notification-bell" onClick={onClick}>
      {count > 0 && (
        <div className="notification-indicator">
          <CreatureDisplay 
            creatureId="zing"
            state="alert"
            animation="jitter"
            size="small"
          />
          <span className="count">{count}</span>
        </div>
      )}
      <svg className="bell-icon" viewBox="0 0 24 24">
        {/* Bell SVG */}
      </svg>
    </button>
  );
}
```

### Empty State

```typescript
// src/components/EmptyState.tsx
import CreatureDisplay from '@/components/CreatureDisplay';
import { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  description: string;
  action?: ReactNode;
  creature?: string;
}

export function EmptyState({
  title,
  description,
  action,
  creature = 'cozy'
}: EmptyStateProps) {
  return (
    <div className="empty-state">
      <CreatureDisplay 
        creatureId={creature}
        state="encouraging"
        animation="gentle_bounce"
        size="large"
      />
      <h2>{title}</h2>
      <p>{description}</p>
      {action}
    </div>
  );
}
```

### Search/Processing

```typescript
// src/components/SearchResults.tsx
import CreatureDisplay from '@/components/CreatureDisplay';
import { useState } from 'react';

interface SearchResultsProps {
  query: string;
  isLoading: boolean;
  results: any[];
}

export function SearchResults({ query, isLoading, results }: SearchResultsProps) {
  return (
    <div className="search-results">
      {isLoading ? (
        <div className="searching">
          <CreatureDisplay 
            creatureId="brain"
            state="thinking"
            animation="shimmer"
            size="medium"
          />
          <p>Brain is searching for "{query}"...</p>
        </div>
      ) : results.length === 0 ? (
        <div className="no-results">
          <CreatureDisplay 
            creatureId="wobbly"
            state="confused"
            size="medium"
          />
          <p>No results found for "{query}"</p>
        </div>
      ) : (
        <div className="results-list">
          {/* Results */}
        </div>
      )}
    </div>
  );
}
```

### Moderation Notice

```typescript
// src/components/ModerationNotice.tsx
import CreatureDisplay from '@/components/CreatureDisplay';

interface ModerationNoticeProps {
  reason: string;
  appealLink?: string;
}

export function ModerationNotice({ reason, appealLink }: ModerationNoticeProps) {
  return (
    <div className="moderation-notice">
      <CreatureDisplay 
        creatureId="guardian"
        state="protecting"
        animation="protective_stance"
        size="large"
      />
      <h3>Content Removed</h3>
      <p>This content was removed for: {reason}</p>
      {appealLink && (
        <a href={appealLink}>Appeal this decision</a>
      )}
    </div>
  );
}
```

### Achievement/Award

```typescript
// src/components/AchievementUnlock.tsx
import CreatureDisplay from '@/components/CreatureDisplay';

interface AchievementUnlockProps {
  title: string;
  description: string;
  onDismiss: () => void;
}

export function AchievementUnlock({
  title,
  description,
  onDismiss
}: AchievementUnlockProps) {
  return (
    <div className="achievement-unlock">
      <CreatureDisplay 
        creatureId="star"
        state="glowing"
        animation="shimmer"
        size="large"
      />
      <h2>🎉 {title}</h2>
      <p>{description}</p>
      <button onClick={onDismiss}>Awesome!</button>
    </div>
  );
}
```

---

## Advanced Patterns

### Dynamic Creature Selection

```typescript
// Based on use case, select appropriate creature
import { getCreaturesByUseCase } from '@/lib/creatures';

function DynamicCreatureDisplay({ useCase }: { useCase: string }) {
  const creatures = getCreaturesByUseCase(useCase);
  const creature = creatures[Math.floor(Math.random() * creatures.length)];
  
  return (
    <CreatureDisplay 
      creatureId={creature.id}
      state="happy"
      size="medium"
    />
  );
}
```

### Creature Context Provider

```typescript
// src/context/CreatureContext.tsx
import React, { createContext, useContext } from 'react';
import { getAllCreatures, type Creature } from '@/lib/creatures';

interface CreatureContextType {
  creatures: Map<string, Creature>;
  getCreature: (id: string) => Creature | undefined;
}

const CreatureContext = createContext<CreatureContextType | null>(null);

export function CreatureProvider({ children }: { children: React.ReactNode }) {
  const creatures = new Map(
    getAllCreatures().map(c => [c.id, c])
  );

  return (
    <CreatureContext.Provider value={{ creatures, getCreature: id => creatures.get(id) }}>
      {children}
    </CreatureContext.Provider>
  );
}

export function useCreature(id: string) {
  const context = useContext(CreatureContext);
  if (!context) throw new Error('useCreature must be used within CreatureProvider');
  return context.getCreature(id);
}
```

### Animation Hook

```typescript
// src/hooks/useCreatureAnimation.ts
import { useEffect, useRef, useState } from 'react';

export function useCreatureAnimation(
  animation: string,
  duration: number
) {
  const [isPlaying, setIsPlaying] = useState(true);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!isPlaying) return;

    timeoutRef.current = setTimeout(() => {
      setIsPlaying(false);
    }, duration);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [duration, isPlaying]);

  return { isPlaying, setIsPlaying };
}
```

### Conditional Creature Display

```typescript
// Show different creatures based on state
function SmartCreatureDisplay({ 
  state: 'loading' | 'error' | 'empty' | 'success' 
}) {
  const creatureMap = {
    loading: { id: 'drift', state: 'processing', animation: 'dreamy_float' },
    error: { id: 'wobbly', state: 'confused', animation: 'shake' },
    empty: { id: 'cozy', state: 'encouraging', animation: 'gentle_bounce' },
    success: { id: 'boom', state: 'celebrating', animation: 'explosion' }
  };

  const config = creatureMap[state];

  return (
    <CreatureDisplay 
      creatureId={config.id}
      state={config.state}
      animation={config.animation}
      size="medium"
    />
  );
}
```

---

## Testing

### Unit Tests

```typescript
// src/__tests__/creatures.test.ts
import { getCreature, getAllCreatures, validateCreature } from '@/lib/creatures';

describe('Creatures Library', () => {
  test('should get creature by id', () => {
    const glimmer = getCreature('glimmer');
    expect(glimmer).toBeDefined();
    expect(glimmer?.name).toBe('Glimmer');
  });

  test('all creatures should pass validation', () => {
    const creatures = getAllCreatures();
    creatures.forEach(creature => {
      const errors = validateCreature(creature);
      expect(errors).toHaveLength(0);
    });
  });

  test('creature states should be valid', () => {
    const glimmer = getCreature('glimmer');
    expect(glimmer?.states).toContain('happy');
    expect(glimmer?.states).toContain('thinking');
  });
});
```

### Component Tests

```typescript
// src/__tests__/CreatureDisplay.test.tsx
import { render, screen } from '@testing-library/react';
import CreatureDisplay from '@/components/CreatureDisplay';

describe('CreatureDisplay Component', () => {
  test('should render creature with correct aria-label', () => {
    render(
      <CreatureDisplay creatureId="glimmer" state="happy" />
    );
    
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('aria-label');
  });

  test('should apply correct size class', () => {
    render(
      <CreatureDisplay creatureId="glimmer" size="large" />
    );
    
    // Assert size applied
  });
});
```

---

## Performance Tips

1. **Memoize Creature Objects**
   ```typescript
   const creature = useMemo(() => getCreature(id), [id]);
   ```

2. **Use React.memo for Creature Components**
   ```typescript
   export const MemoizedCreature = React.memo(CreatureDisplay);
   ```

3. **Lazy Load When Appropriate**
   ```typescript
   const CreatureDisplay = lazy(() => import('@/components/CreatureDisplay'));
   ```

4. **Respect Reduced Motion**
   ```css
   @media (prefers-reduced-motion: reduce) {
     .creature {
       animation: none !important;
     }
   }
   ```

5. **Debounce Animation Changes**
   ```typescript
   const debouncedAnimation = useDebounce(animation, 300);
   ```

---

## Accessibility Checklist

- ✅ All creatures have `alt_text` with descriptive labels
- ✅ Use `role="img"` for creature elements
- ✅ Provide sufficient color contrast
- ✅ Support `prefers-reduced-motion`
- ✅ Test with screen readers
- ✅ Ensure keyboard navigation works
- ✅ Don't rely on color alone to convey information

---

## Troubleshooting

### Creature not found

```typescript
// Check the ID
const creature = getCreature('glimer'); // ❌ Typo: 'glimer' not 'glimmer'
const creature = getCreature('glimmer'); // ✅ Correct
```

### Invalid state

```typescript
// Check creature.states array
const glimmer = getCreature('glimmer');
console.log(glimmer?.states); // ['happy', 'thinking', 'winking', ...]

// Use valid state
<CreatureDisplay state="happy" /> // ✅
<CreatureDisplay state="confused" /> // ❌ Not in glimmer.states
```

### Animation not working

```typescript
// Check creature.animation_support
const creature = getCreature('drift');
console.log(creature?.animation_support); // ['dreamy_float', 'gentle_bounce', ...]

// Verify animation is supported
<CreatureDisplay animation="shimmer" /> // ✅ Supported
<CreatureDisplay animation="dance" /> // ❌ Not supported by drift
```

---

## Browser Support

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- IE 11: ⚠️ Partial (polyfills needed)

---

## Future Enhancements

- [ ] SVG artwork for each creature
- [ ] Additional animations
- [ ] Customizable colors/theming
- [ ] Sound effects support
- [ ] Particle effects
- [ ] Storybook integration
- [ ] Interactive creature builder

---

## Resources

- [Creatures Library](./src/lib/creatures.ts)
- [Animations Library](./src/lib/creature-animations.ts)
- [Full Documentation](./CREATURE_LIBRARY.md)
- [Visual Reference](./CREATURE_VISUAL_REFERENCE.md)
- [Component Example](./src/components/CreatureDisplay.tsx)

---

## Contributing

When adding new creatures or features:

1. Update creature definitions with all required fields
2. Add animations to `creature.animation_support`
3. Add states to `creature.states`
4. Update documentation
5. Run validation: `validateCreature(creature)`
6. Test with component examples
7. Update visual reference guide

---

## Support

For questions or issues:
1. Check the [Full Documentation](./CREATURE_LIBRARY.md)
2. Review the [Visual Reference](./CREATURE_VISUAL_REFERENCE.md)
3. Check existing component examples
4. Review TypeScript types for available options

---

**Last Updated**: 2024
**Version**: 1.0
**Library Status**: Production Ready ✅
