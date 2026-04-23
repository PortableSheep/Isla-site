/**
 * Creature Animation Definitions
 * 
 * Defines all animations available for creatures throughout the app.
 * Each animation includes keyframes, timing, and configuration options.
 */

import type { AnimationType } from './creatures';

export interface AnimationKeyframe {
  offset: number;  // 0-1 (0% to 100%)
  transform?: string;
  opacity?: number;
  filter?: string;
}

export interface AnimationConfig {
  name: AnimationType;
  description: string;
  keyframes: AnimationKeyframe[];
  duration: number;      // milliseconds
  easing: string;        // CSS easing function
  iterationCount: 'infinite' | number;
  delay?: number;        // milliseconds
  playbackRate?: number; // 0.5 to 2
  supportedCreatures?: string[];  // empty = all creatures
}

/**
 * Animation library with complete definitions for all creature animations
 */
export const animations: Record<AnimationType, AnimationConfig> = {
  bounce: {
    name: 'bounce',
    description: 'Gentle up and down bouncing motion',
    keyframes: [
      { offset: 0, transform: 'translateY(0)' },
      { offset: 0.5, transform: 'translateY(-20px)' },
      { offset: 1, transform: 'translateY(0)' }
    ],
    duration: 600,
    easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    iterationCount: 'infinite'
  },

  float: {
    name: 'float',
    description: 'Gentle floating motion up and down',
    keyframes: [
      { offset: 0, transform: 'translateY(0)' },
      { offset: 0.5, transform: 'translateY(-10px)' },
      { offset: 1, transform: 'translateY(0)' }
    ],
    duration: 2000,
    easing: 'ease-in-out',
    iterationCount: 'infinite'
  },

  spin: {
    name: 'spin',
    description: 'Full 360-degree rotation',
    keyframes: [
      { offset: 0, transform: 'rotate(0deg)' },
      { offset: 1, transform: 'rotate(360deg)' }
    ],
    duration: 1000,
    easing: 'linear',
    iterationCount: 'infinite'
  },

  wave: {
    name: 'wave',
    description: 'Hand waving motion (up and down)',
    keyframes: [
      { offset: 0, transform: 'rotate(-10deg) translateX(0)' },
      { offset: 0.25, transform: 'rotate(15deg) translateX(5px)' },
      { offset: 0.5, transform: 'rotate(-10deg) translateX(0)' },
      { offset: 0.75, transform: 'rotate(15deg) translateX(5px)' },
      { offset: 1, transform: 'rotate(-10deg) translateX(0)' }
    ],
    duration: 1200,
    easing: 'ease-in-out',
    iterationCount: 'infinite'
  },

  pulse: {
    name: 'pulse',
    description: 'Gentle size pulsing (scale in and out)',
    keyframes: [
      { offset: 0, transform: 'scale(1)', opacity: 1 },
      { offset: 0.5, transform: 'scale(1.1)', opacity: 0.8 },
      { offset: 1, transform: 'scale(1)', opacity: 1 }
    ],
    duration: 1500,
    easing: 'ease-in-out',
    iterationCount: 'infinite'
  },

  shake: {
    name: 'shake',
    description: 'Horizontal shake motion (confused effect)',
    keyframes: [
      { offset: 0, transform: 'translateX(0)' },
      { offset: 0.1, transform: 'translateX(-5px)' },
      { offset: 0.2, transform: 'translateX(5px)' },
      { offset: 0.3, transform: 'translateX(-5px)' },
      { offset: 0.4, transform: 'translateX(5px)' },
      { offset: 0.5, transform: 'translateX(0)' },
      { offset: 1, transform: 'translateX(0)' }
    ],
    duration: 500,
    easing: 'ease-in-out',
    iterationCount: 2
  },

  slide_in: {
    name: 'slide_in',
    description: 'Slide in from left or right',
    keyframes: [
      { offset: 0, transform: 'translateX(-100px)', opacity: 0 },
      { offset: 1, transform: 'translateX(0)', opacity: 1 }
    ],
    duration: 400,
    easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    iterationCount: 1
  },

  fade_in: {
    name: 'fade_in',
    description: 'Fade in effect (opacity)',
    keyframes: [
      { offset: 0, opacity: 0 },
      { offset: 1, opacity: 1 }
    ],
    duration: 400,
    easing: 'ease-in',
    iterationCount: 1
  },

  grow: {
    name: 'grow',
    description: 'Scale up growing effect',
    keyframes: [
      { offset: 0, transform: 'scale(0.5)', opacity: 0 },
      { offset: 1, transform: 'scale(1)', opacity: 1 }
    ],
    duration: 500,
    easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    iterationCount: 1
  },

  wiggle: {
    name: 'wiggle',
    description: 'Side-to-side wiggling motion',
    keyframes: [
      { offset: 0, transform: 'rotate(0deg)' },
      { offset: 0.25, transform: 'rotate(-2deg)' },
      { offset: 0.5, transform: 'rotate(0deg)' },
      { offset: 0.75, transform: 'rotate(2deg)' },
      { offset: 1, transform: 'rotate(0deg)' }
    ],
    duration: 800,
    easing: 'ease-in-out',
    iterationCount: 'infinite'
  },

  jitter: {
    name: 'jitter',
    description: 'Rapid small random movements (alert effect)',
    keyframes: [
      { offset: 0, transform: 'translate(0, 0)' },
      { offset: 0.25, transform: 'translate(-2px, 2px)' },
      { offset: 0.5, transform: 'translate(2px, -2px)' },
      { offset: 0.75, transform: 'translate(-2px, -2px)' },
      { offset: 1, transform: 'translate(0, 0)' }
    ],
    duration: 200,
    easing: 'ease-in-out',
    iterationCount: 'infinite'
  },

  yawn: {
    name: 'yawn',
    description: 'Yawning motion (mouth open and close)',
    keyframes: [
      { offset: 0, transform: 'scaleY(1)' },
      { offset: 0.25, transform: 'scaleY(1)' },
      { offset: 0.5, transform: 'scaleY(1.3)' },
      { offset: 0.75, transform: 'scaleY(1)' },
      { offset: 1, transform: 'scaleY(1)' }
    ],
    duration: 1000,
    easing: 'ease-in-out',
    iterationCount: 1
  },

  stretch: {
    name: 'stretch',
    description: 'Stretching motion (vertical scale)',
    keyframes: [
      { offset: 0, transform: 'scaleY(1)' },
      { offset: 0.5, transform: 'scaleY(1.2)' },
      { offset: 1, transform: 'scaleY(1)' }
    ],
    duration: 1200,
    easing: 'ease-in-out',
    iterationCount: 1
  },

  dance: {
    name: 'dance',
    description: 'Happy dancing motion (rotation and bounce combo)',
    keyframes: [
      { offset: 0, transform: 'rotate(0deg) translateY(0)' },
      { offset: 0.25, transform: 'rotate(-5deg) translateY(-10px)' },
      { offset: 0.5, transform: 'rotate(0deg) translateY(0)' },
      { offset: 0.75, transform: 'rotate(5deg) translateY(-10px)' },
      { offset: 1, transform: 'rotate(0deg) translateY(0)' }
    ],
    duration: 800,
    easing: 'ease-in-out',
    iterationCount: 'infinite'
  },

  shimmer: {
    name: 'shimmer',
    description: 'Shimmering effect (brightness/filter change)',
    keyframes: [
      { offset: 0, filter: 'brightness(1) drop-shadow(0 0 0px rgba(255,255,255,0))' },
      { offset: 0.5, filter: 'brightness(1.2) drop-shadow(0 0 8px rgba(255,255,255,0.8))' },
      { offset: 1, filter: 'brightness(1) drop-shadow(0 0 0px rgba(255,255,255,0))' }
    ],
    duration: 1500,
    easing: 'ease-in-out',
    iterationCount: 'infinite'
  },

  glow: {
    name: 'glow',
    description: 'Glowing effect (box-shadow/filter based)',
    keyframes: [
      { offset: 0, filter: 'brightness(1)' },
      { offset: 0.5, filter: 'brightness(1.3) blur(1px)' },
      { offset: 1, filter: 'brightness(1)' }
    ],
    duration: 2000,
    easing: 'ease-in-out',
    iterationCount: 'infinite'
  },

  sparkle: {
    name: 'sparkle',
    description: 'Sparkling effect (opacity and scale pulses)',
    keyframes: [
      { offset: 0, opacity: 1, transform: 'scale(1)' },
      { offset: 0.5, opacity: 0.6, transform: 'scale(1.1)' },
      { offset: 1, opacity: 1, transform: 'scale(1)' }
    ],
    duration: 1000,
    easing: 'ease-in-out',
    iterationCount: 'infinite'
  },

  celebrate: {
    name: 'celebrate',
    description: 'Celebration motion (jump and spin combo)',
    keyframes: [
      { offset: 0, transform: 'translateY(0) rotate(0deg)' },
      { offset: 0.25, transform: 'translateY(-30px) rotate(10deg)' },
      { offset: 0.5, transform: 'translateY(0) rotate(0deg)' },
      { offset: 0.75, transform: 'translateY(-30px) rotate(-10deg)' },
      { offset: 1, transform: 'translateY(0) rotate(0deg)' }
    ],
    duration: 1000,
    easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    iterationCount: 'infinite'
  },

  confetti: {
    name: 'confetti',
    description: 'Confetti burst effect (scale and fade)',
    keyframes: [
      { offset: 0, transform: 'scale(1) translateY(0)', opacity: 1 },
      { offset: 1, transform: 'scale(0) translateY(50px)', opacity: 0 }
    ],
    duration: 800,
    easing: 'ease-out',
    iterationCount: 1
  },

  blink: {
    name: 'blink',
    description: 'Eye blinking effect',
    keyframes: [
      { offset: 0, opacity: 1 },
      { offset: 0.45, opacity: 1 },
      { offset: 0.5, opacity: 0 },
      { offset: 0.55, opacity: 1 },
      { offset: 1, opacity: 1 }
    ],
    duration: 3000,
    easing: 'ease-in-out',
    iterationCount: 'infinite'
  },

  nod: {
    name: 'nod',
    description: 'Head nodding motion (yes gesture)',
    keyframes: [
      { offset: 0, transform: 'rotateX(0deg)' },
      { offset: 0.33, transform: 'rotateX(-10deg)' },
      { offset: 0.66, transform: 'rotateX(10deg)' },
      { offset: 1, transform: 'rotateX(0deg)' }
    ],
    duration: 600,
    easing: 'ease-in-out',
    iterationCount: 2
  },

  head_tilt: {
    name: 'head_tilt',
    description: 'Head tilting motion (curious gesture)',
    keyframes: [
      { offset: 0, transform: 'rotate(0deg)' },
      { offset: 0.5, transform: 'rotate(-15deg)' },
      { offset: 1, transform: 'rotate(0deg)' }
    ],
    duration: 800,
    easing: 'ease-in-out',
    iterationCount: 2
  },

  eye_follow: {
    name: 'eye_follow',
    description: 'Eyes following cursor/movement',
    keyframes: [
      { offset: 0, transform: 'translateX(0)' },
      { offset: 0.5, transform: 'translateX(5px)' },
      { offset: 1, transform: 'translateX(0)' }
    ],
    duration: 2000,
    easing: 'ease-in-out',
    iterationCount: 'infinite'
  },

  mouth_open: {
    name: 'mouth_open',
    description: 'Mouth opening animation',
    keyframes: [
      { offset: 0, transform: 'scaleY(0)' },
      { offset: 1, transform: 'scaleY(1)' }
    ],
    duration: 300,
    easing: 'ease-out',
    iterationCount: 1
  },

  mouth_close: {
    name: 'mouth_close',
    description: 'Mouth closing animation',
    keyframes: [
      { offset: 0, transform: 'scaleY(1)' },
      { offset: 1, transform: 'scaleY(0)' }
    ],
    duration: 300,
    easing: 'ease-in',
    iterationCount: 1
  },

  dreamy_float: {
    name: 'dreamy_float',
    description: 'Slow peaceful floating motion',
    keyframes: [
      { offset: 0, transform: 'translateY(0) translateX(0)' },
      { offset: 0.25, transform: 'translateY(-15px) translateX(5px)' },
      { offset: 0.5, transform: 'translateY(0) translateX(0)' },
      { offset: 0.75, transform: 'translateY(-15px) translateX(-5px)' },
      { offset: 1, transform: 'translateY(0) translateX(0)' }
    ],
    duration: 3000,
    easing: 'ease-in-out',
    iterationCount: 'infinite'
  },

  gentle_bounce: {
    name: 'gentle_bounce',
    description: 'Very gentle bouncing (minimal amplitude)',
    keyframes: [
      { offset: 0, transform: 'translateY(0)' },
      { offset: 0.5, transform: 'translateY(-8px)' },
      { offset: 1, transform: 'translateY(0)' }
    ],
    duration: 1200,
    easing: 'ease-in-out',
    iterationCount: 'infinite'
  },

  explosion: {
    name: 'explosion',
    description: 'Explosive burst effect (scale and opacity)',
    keyframes: [
      { offset: 0, transform: 'scale(0)', opacity: 0 },
      { offset: 0.5, transform: 'scale(1.2)', opacity: 1 },
      { offset: 1, transform: 'scale(1)', opacity: 1 }
    ],
    duration: 600,
    easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    iterationCount: 1
  },

  zip_around: {
    name: 'zip_around',
    description: 'Quick zipping circular motion',
    keyframes: [
      { offset: 0, transform: 'translate(0, 0) rotate(0deg)' },
      { offset: 0.25, transform: 'translate(20px, -20px) rotate(90deg)' },
      { offset: 0.5, transform: 'translate(0, 0) rotate(180deg)' },
      { offset: 0.75, transform: 'translate(-20px, -20px) rotate(270deg)' },
      { offset: 1, transform: 'translate(0, 0) rotate(360deg)' }
    ],
    duration: 800,
    easing: 'ease-in-out',
    iterationCount: 'infinite'
  },

  protective_stance: {
    name: 'protective_stance',
    description: 'Standing at attention protective pose',
    keyframes: [
      { offset: 0, transform: 'scale(1)' },
      { offset: 0.5, transform: 'scale(1.05)' },
      { offset: 1, transform: 'scale(1)' }
    ],
    duration: 2000,
    easing: 'ease-in-out',
    iterationCount: 'infinite'
  }
};

/**
 * Get animation configuration by name
 */
export function getAnimation(name: AnimationType): AnimationConfig | undefined {
  return animations[name];
}

/**
 * Get all available animations
 */
export function getAllAnimations(): AnimationConfig[] {
  return Object.values(animations);
}

/**
 * Get animation CSS string for use in stylesheets
 */
export function getAnimationCSS(name: AnimationType): string {
  const anim = getAnimation(name);
  if (!anim) return '';

  const keyframesStr = anim.keyframes
    .map(kf => {
      const offset = `${(kf.offset * 100).toFixed(0)}%`;
      const props = [];
      if (kf.transform) props.push(`transform: ${kf.transform}`);
      if (kf.opacity !== undefined) props.push(`opacity: ${kf.opacity}`);
      if (kf.filter) props.push(`filter: ${kf.filter}`);
      return `  ${offset} { ${props.join('; ')}; }`;
    })
    .join('\n');

  return `@keyframes ${name} {\n${keyframesStr}\n}`;
}

/**
 * Get animation style properties for inline styles
 */
export function getAnimationStyle(name: AnimationType) {
  const anim = getAnimation(name);
  if (!anim) return {};

  return {
    animation: `${name} ${anim.duration}ms ${anim.easing} ${anim.delay || 0}ms ${
      typeof anim.iterationCount === 'number' 
        ? anim.iterationCount 
        : anim.iterationCount
    }`,
    animationPlayState: 'running'
  };
}

/**
 * Get animation timing info
 */
export function getAnimationTiming(name: AnimationType) {
  const anim = getAnimation(name);
  if (!anim) return null;

  return {
    duration: anim.duration,
    delay: anim.delay || 0,
    easing: anim.easing,
    iterationCount: anim.iterationCount,
    totalDuration: anim.duration + (anim.delay || 0)
  };
}

/**
 * List all animation names
 */
export function getAllAnimationNames(): AnimationType[] {
  return Object.keys(animations) as AnimationType[];
}
