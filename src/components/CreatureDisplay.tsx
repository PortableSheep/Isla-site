/**
 * Example: CreatureDisplay Component
 * 
 * This is a reference implementation showing how to use the creature library
 * in a React component. Adapt this to your project's needs.
 */

import React, { useMemo } from 'react';
import { getCreature, type CreatureState, type AnimationType } from '@/lib/creatures';
import { getAnimationStyle } from '@/lib/creature-animations';
import styles from './CreatureDisplay.module.css';

interface CreatureDisplayProps {
  /** Creature ID (e.g., 'glimmer', 'pixel') */
  creatureId: string;
  
  /** Emotional state (must be valid for the creature) */
  state?: CreatureState;
  
  /** Animation to play */
  animation?: AnimationType;
  
  /** Size preset */
  size?: 'small' | 'medium' | 'large';
  
  /** Custom CSS class */
  className?: string;
  
  /** Whether to show debug info */
  debug?: boolean;
  
  /** Callback when animation completes */
  onAnimationComplete?: () => void;
  
  /** Custom inline styles */
  style?: React.CSSProperties;
}

/**
 * CreatureDisplay Component
 * 
 * Displays a creature with optional animation and state
 * 
 * @example
 * ```tsx
 * <CreatureDisplay 
 *   creatureId="glimmer"
 *   state="happy"
 *   animation="bounce"
 *   size="medium"
 * />
 * ```
 */
export const CreatureDisplay: React.FC<CreatureDisplayProps> = ({
  creatureId,
  state = 'neutral',
  animation,
  size = 'medium',
  className = '',
  debug = false,
  onAnimationComplete,
  style: customStyle
}) => {
  const creature = useMemo(() => getCreature(creatureId), [creatureId]);

  // Validation
  if (!creature) {
    if (debug) {
      return (
        <div className={`${styles.error} ${className}`}>
          Creature not found: {creatureId}
        </div>
      );
    }
    return null;
  }

  if (!creature.states.includes(state)) {
    console.warn(
      `State '${state}' not valid for creature '${creature.name}'. Using 'neutral' instead.`
    );
  }

  // Get size value
  const sizeMap = {
    small: creature.size_recommendations.small,
    medium: creature.size_recommendations.medium,
    large: creature.size_recommendations.large
  };
  const pixelSize = sizeMap[size];

  // Get animation style
  const animationStyle = animation ? getAnimationStyle(animation) : {};

  // Combine styles
  const containerStyle: React.CSSProperties = {
    width: `${pixelSize}px`,
    height: `${pixelSize}px`,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    // Apply animation styles
    ...animationStyle,
    // Apply custom styles
    ...customStyle
  };

  const handleAnimationEnd = () => {
    onAnimationComplete?.();
  };

  return (
    <div
      className={`${styles.creature} ${styles[`creature_${creature.id}`]} ${styles[`state_${state}`]} ${className}`}
      style={containerStyle}
      role="img"
      aria-label={creature.alt_text}
      data-creature={creature.id}
      data-state={state}
      data-animation={animation || 'none'}
      onAnimationEnd={handleAnimationEnd}
    >
      {/* Render the SVG creature from /public/creatures/ */}
      {(() => {
        const variantMap: Record<string, 'happy' | 'surprised' | 'thinking'> = {
          happy: 'happy',
          smiling: 'happy',
          celebrating: 'happy',
          waving: 'happy',
          greeting: 'happy',
          surprised: 'surprised',
          thinking: 'thinking',
        };
        const variant = variantMap[state];
        const src = `/creatures/${creature.id}${variant ? `-${variant}` : ''}.svg`;
        const fallback = `/creatures/${creature.id}.svg`;
        return (
          <img
            src={src}
            alt={creature.alt_text}
            width={pixelSize}
            height={pixelSize}
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            onError={(e) => {
              const img = e.currentTarget;
              if (img.src.endsWith(src) && src !== fallback) {
                img.src = fallback;
              }
            }}
          />
        );
      })()}

      {/* Debug info */}
      {debug && (
        <div className={styles.debugInfo}>
          <small>
            {creature.id} • {state} • {animation}
          </small>
        </div>
      )}
    </div>
  );
};

/**
 * CreaturePreview Component
 * 
 * Shows all states and animations for a creature (useful for development)
 */
export const CreaturePreview: React.FC<{ creatureId: string }> = ({ creatureId }) => {
  const creature = useMemo(() => getCreature(creatureId), [creatureId]);

  if (!creature) {
    return <div>Creature not found: {creatureId}</div>;
  }

  return (
    <div className={styles.preview}>
      <h2>{creature.name}</h2>
      <p>{creature.description}</p>

      <div className={styles.previewSection}>
        <h3>States</h3>
        <div className={styles.stateGrid}>
          {creature.states.map(state => (
            <div key={state} className={styles.stateItem}>
              <CreatureDisplay
                creatureId={creatureId}
                state={state}
                size="medium"
              />
              <p>{state}</p>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.previewSection}>
        <h3>Animations</h3>
        <div className={styles.animationGrid}>
          {creature.animation_support.map(anim => (
            <div key={anim} className={styles.animationItem}>
              <CreatureDisplay
                creatureId={creatureId}
                state="happy"
                animation={anim}
                size="medium"
              />
              <p>{anim}</p>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.infoSection}>
        <h3>Info</h3>
        <ul>
          <li><strong>Personality:</strong> {creature.personality}</li>
          <li><strong>Primary Color:</strong> {creature.primaryColor}</li>
          <li><strong>Use Cases:</strong> {creature.use_cases.join(', ')}</li>
        </ul>
      </div>
    </div>
  );
};

/**
 * SimpleCreature Component
 * 
 * Minimal version without animations (for performance)
 */
export const SimpleCreature: React.FC<{
  creatureId: string;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}> = ({ creatureId, size = 'medium', className = '' }) => {
  return (
    <CreatureDisplay
      creatureId={creatureId}
      state="neutral"
      size={size}
      className={className}
    />
  );
};

export default CreatureDisplay;
