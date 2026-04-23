/**
 * Isla.site Creature Character Library
 * 
 * Comprehensive reference guide for all 15+ unique creatures used throughout the app.
 * Each creature has personality, visual style, use cases, and animation support.
 */

export type CreatureState = 
  | 'happy' 
  | 'thinking' 
  | 'surprised' 
  | 'sad' 
  | 'neutral' 
  | 'excited' 
  | 'celebrating' 
  | 'confused'
  | 'confused_but_helping'
  | 'proud'
  | 'protective'
  | 'announcing'
  | 'cheering'
  | 'dancing'
  | 'winking'
  | 'curious'
  | 'sleeping'
  | 'waking'
  | 'floating'
  | 'dreaming'
  | 'processing'
  | 'yawning'
  | 'stretching'
  | 'concentrating'
  | 'solving'
  | 'exploding'
  | 'triumphant'
  | 'waving'
  | 'smiling'
  | 'greeting'
  | 'alert'
  | 'protecting'
  | 'watching'
  | 'speaking'
  | 'listening'
  | 'responding'
  | 'shining'
  | 'glowing'
  | 'helping'
  | 'peaceful'
  | 'encouraging';

export type AnimationType = 
  | 'bounce'
  | 'float'
  | 'spin'
  | 'wave'
  | 'pulse'
  | 'shake'
  | 'slide_in'
  | 'fade_in'
  | 'grow'
  | 'wiggle'
  | 'jitter'
  | 'yawn'
  | 'stretch'
  | 'dance'
  | 'shimmer'
  | 'glow'
  | 'sparkle'
  | 'celebrate'
  | 'confetti'
  | 'blink'
  | 'nod'
  | 'head_tilt'
  | 'eye_follow'
  | 'mouth_open'
  | 'mouth_close'
  | 'dreamy_float'
  | 'gentle_bounce'
  | 'explosion'
  | 'zip_around'
  | 'protective_stance';

export interface SizeRecommendations {
  small: number;      // 32px or equivalent
  medium: number;     // 64px or equivalent
  large: number;      // 128px or equivalent
}

export interface Creature {
  id: string;
  name: string;
  description: string;
  personality: string;
  appearance: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  use_cases: string[];
  states: CreatureState[];
  animation_support: AnimationType[];
  size_recommendations: SizeRecommendations;
  alt_text: string;
  svg_path?: string;
}

export const creatures: Record<string, Creature> = {
  glimmer: {
    id: 'glimmer',
    name: 'Glimmer',
    description: 'Main assistant character with big round eyes and a quirky smile. Always ready to help!',
    personality: 'Friendly, helpful, encouraging, enthusiastic',
    appearance: 'Round body with oversized expressive eyes, cheerful smile, small rounded ears',
    primaryColor: '#A855F7',     // Purple
    secondaryColor: '#EC4899',   // Pink
    accentColor: '#F472B6',      // Light pink
    use_cases: [
      'Dashboard greeting',
      'Help tooltips',
      'Onboarding',
      'General assistance',
      'Feature explanations'
    ],
    states: [
      'happy',
      'thinking',
      'winking',
      'surprised',
      'excited'
    ],
    animation_support: [
      'bounce',
      'wave',
      'blink',
      'head_tilt',
      'nod'
    ],
    size_recommendations: {
      small: 40,
      medium: 80,
      large: 160
    },
    alt_text: 'Glimmer, the purple guide monster with big round eyes'
  },

  pixel: {
    id: 'pixel',
    name: 'Pixel',
    description: 'Adult-looking creature with confident posture and wise expression. The parent authority figure.',
    personality: 'Responsible, caring, wise, protective, authoritative',
    appearance: 'Tall, structured form with dignified posture, kind but confident expression, parental aura',
    primaryColor: '#3B82F6',     // Blue
    secondaryColor: '#FCD34D',   // Gold
    accentColor: '#FBBF24',      // Darker gold
    use_cases: [
      'Parent author badges on posts',
      'Parent-specific features',
      'Authority indicators',
      'Parental controls UI'
    ],
    states: [
      'neutral',
      'proud',
      'protective',
      'thinking',
      'smiling'
    ],
    animation_support: [
      'nod',
      'protective_stance',
      'pulse'
    ],
    size_recommendations: {
      small: 32,
      medium: 64,
      large: 128
    },
    alt_text: 'Pixel, the blue parent badge creature with confident posture'
  },

  sparkle: {
    id: 'sparkle',
    name: 'Sparkle',
    description: 'Young-looking creature with playful energy and bouncy demeanor. The child creativity symbol.',
    personality: 'Joyful, creative, learning, curious, playful',
    appearance: 'Smaller, rounder, bouncy appearance with big smile, sparkly details, dynamic posture',
    primaryColor: '#EC4899',     // Pink
    secondaryColor: '#06B6D4',   // Cyan (rainbow element)
    accentColor: '#A78BFA',      // Purple (rainbow element)
    use_cases: [
      'Child author badges on posts',
      'Child-specific features',
      'Creative prompts',
      'Learning indicators',
      'Achievement celebrations'
    ],
    states: [
      'happy',
      'excited',
      'curious',
      'celebrating',
      'dancing'
    ],
    animation_support: [
      'bounce',
      'dance',
      'sparkle',
      'wiggle',
      'celebrate'
    ],
    size_recommendations: {
      small: 32,
      medium: 64,
      large: 128
    },
    alt_text: 'Sparkle, the pink child badge creature with playful energy'
  },

  isla: {
    id: 'isla',
    name: 'Isla',
    description: 'Slightly majestic and mysterious official Isla character. The brand ambassador and authority.',
    personality: 'Important, trustworthy, wise, official, caring',
    appearance: 'Elegant form with slight glow, mysterious eyes, regal bearing, touches of magic',
    primaryColor: '#FCD34D',     // Gold
    secondaryColor: '#E5E7EB',   // Silver
    accentColor: '#F59E0B',      // Amber
    use_cases: [
      'Isla official updates',
      'Admin actions',
      'Important announcements',
      'Brand representation',
      'System-level communications'
    ],
    states: [
      'neutral',
      'announcing',
      'celebrating',
      'thinking',
      'proud'
    ],
    animation_support: [
      'shimmer',
      'glow',
      'pulse',
      'nod'
    ],
    size_recommendations: {
      small: 48,
      medium: 96,
      large: 192
    },
    alt_text: 'Isla, the golden official brand creature with elegant bearing'
  },

  cheery: {
    id: 'cheery',
    name: 'Cheery',
    description: 'Bouncy and celebratory creature with party-like appearance. The success champion.',
    personality: 'Enthusiastic, supportive, fun, celebratory, energetic',
    appearance: 'Round bouncy body with festive elements, bright expression, celebratory aura',
    primaryColor: '#FB923C',     // Orange
    secondaryColor: '#EC4899',   // Pink (rainbow)
    accentColor: '#FBBF24',      // Gold (confetti effect)
    use_cases: [
      'Post creation success',
      'Approvals',
      'Milestones reached',
      'Feature unlocks',
      'Birthday celebrations'
    ],
    states: [
      'cheering',
      'celebrating',
      'dancing',
      'excited',
      'happy'
    ],
    animation_support: [
      'bounce',
      'celebrate',
      'confetti',
      'dance',
      'sparkle',
      'shimmer'
    ],
    size_recommendations: {
      small: 40,
      medium: 80,
      large: 160
    },
    alt_text: 'Cheery, the orange celebration creature with festive energy'
  },

  wobbly: {
    id: 'wobbly',
    name: 'Wobbly',
    description: 'Endearing confused expression, never scary. A helpful friend when things go wrong.',
    personality: 'Helpful despite confusion, friendly, reassuring, problem-solving',
    appearance: 'Slightly wobbly stance, questioning expression, warm eyes, approachable',
    primaryColor: '#10B981',     // Green
    secondaryColor: '#6B7280',   // Gray
    accentColor: '#93C5FD',      // Light blue (friendly)
    use_cases: [
      'Error states',
      '404 pages',
      'Validation failures',
      'Empty states (secondary)',
      'Confused but helping moments'
    ],
    states: [
      'confused',
      'confused_but_helping',
      'thinking',
      'helping',
      'neutral'
    ],
    animation_support: [
      'shake',
      'head_tilt',
      'wiggle',
      'nod'
    ],
    size_recommendations: {
      small: 48,
      medium: 96,
      large: 192
    },
    alt_text: 'Wobbly, the green helper creature with a confused but friendly expression'
  },

  zing: {
    id: 'zing',
    name: 'Zing',
    description: 'Alert but friendly, zipping around with urgent energy. The notification specialist.',
    personality: 'Quick, attentive, active, energetic, urgent but friendly',
    appearance: 'Compact form, dynamic pose, alert expression, motion lines suggested',
    primaryColor: '#EAB308',     // Yellow
    secondaryColor: '#EF4444',   // Red
    accentColor: '#FBBF24',      // Gold
    use_cases: [
      'New notifications',
      'Urgent items',
      'Time-sensitive alerts',
      'Notification badges',
      'Attention-getting moments'
    ],
    states: [
      'surprised',
      'excited',
      'announcing',
      'alert',
      'happy'
    ],
    animation_support: [
      'zip_around',
      'pulse',
      'bounce',
      'jitter',
      'blink'
    ],
    size_recommendations: {
      small: 32,
      medium: 64,
      large: 128
    },
    alt_text: 'Zing, the yellow notification creature with alert energy'
  },

  drift: {
    id: 'drift',
    name: 'Drift',
    description: 'Dreamy floating appearance, calm and reassuring. The loading companion.',
    personality: 'Calm, patient, peaceful, comforting, meditative',
    appearance: 'Soft rounded form with cloud-like appearance, peaceful expression, floating quality',
    primaryColor: '#93C5FD',     // Light Blue
    secondaryColor: '#F3F4F6',   // Cloud white
    accentColor: '#60A5FA',      // Slightly darker blue
    use_cases: [
      'Loading states',
      'Processing indicators',
      'Data fetching',
      'Async operations',
      'Wait states'
    ],
    states: [
      'floating',
      'dreaming',
      'processing',
      'peaceful',
      'neutral'
    ],
    animation_support: [
      'dreamy_float',
      'gentle_bounce',
      'pulse',
      'shimmer'
    ],
    size_recommendations: {
      small: 40,
      medium: 80,
      large: 160
    },
    alt_text: 'Drift, the light blue loading creature with dreamy floating appearance'
  },

  cozy: {
    id: 'cozy',
    name: 'Cozy',
    description: 'Sleepy but encouraging, sitting comfortably. The empty state companion.',
    personality: 'Patient, encouraging, warm, inviting, comfort-focused',
    appearance: 'Comfortable sitting posture, warm aura, soft features, inviting expression',
    primaryColor: '#92400E',     // Warm brown
    secondaryColor: '#D2691E',   // Chocolate
    accentColor: '#A0826D',      // Soft brown
    use_cases: [
      'Empty states (no posts)',
      'Empty notifications',
      'Empty lists',
      'Encouraging action',
      'Welcoming moments'
    ],
    states: [
      'sleeping',
      'waking',
      'encouraging',
      'yawning',
      'stretching'
    ],
    animation_support: [
      'yawn',
      'stretch',
      'gentle_bounce',
      'nod'
    ],
    size_recommendations: {
      small: 48,
      medium: 96,
      large: 192
    },
    alt_text: 'Cozy, the warm brown empty state creature with encouraging presence'
  },

  brain: {
    id: 'brain',
    name: 'Brain',
    description: 'Thoughtful appearance with thinking pose. The intelligent problem-solver.',
    personality: 'Intelligent, focused, problem-solving, analytical, wise',
    appearance: 'Distinctive thinking pose, sparkles around head, concentrated expression, scholarly aura',
    primaryColor: '#A855F7',     // Purple
    secondaryColor: '#DDD6FE',   // Light purple
    accentColor: '#C084FC',      // Medium purple
    use_cases: [
      'Processing complex operations',
      'Search functionality',
      'Filtering operations',
      'Data analysis displays',
      'Thinking/deliberation states'
    ],
    states: [
      'thinking',
      'concentrating',
      'solving',
      'neutral',
      'happy'
    ],
    animation_support: [
      'head_tilt',
      'sparkle',
      'pulse',
      'nod',
      'shimmer'
    ],
    size_recommendations: {
      small: 40,
      medium: 80,
      large: 160
    },
    alt_text: 'Brain, the purple thinking creature in contemplative pose'
  },

  boom: {
    id: 'boom',
    name: 'Boom',
    description: 'Explosive celebration with fireworks-like energy. The achievement champion.',
    personality: 'Powerful, victorious, celebratory, energetic, triumphant',
    appearance: 'Dynamic explosive pose, fireworks effect, triumphant expression, powerful aura',
    primaryColor: '#DC2626',     // Red
    secondaryColor: '#FCD34D',   // Gold
    accentColor: '#F97316',      // Orange
    use_cases: [
      'Form submission success',
      'Important achievements',
      'Major milestones',
      'Unlock celebrations',
      'Victory moments'
    ],
    states: [
      'exploding',
      'celebrating',
      'triumphant',
      'excited',
      'happy'
    ],
    animation_support: [
      'explosion',
      'confetti',
      'celebrate',
      'grow',
      'shimmer',
      'sparkle'
    ],
    size_recommendations: {
      small: 48,
      medium: 96,
      large: 192
    },
    alt_text: 'Boom, the red explosive success creature with triumphant energy'
  },

  wave: {
    id: 'wave',
    name: 'Wave',
    description: 'Friendly waving appearance with warm greeting. The welcome specialist.',
    personality: 'Welcoming, warm, sociable, friendly, approachable',
    appearance: 'Friendly posture with raised hand waving, warm smile, inviting expression',
    primaryColor: '#06B6D4',     // Teal
    secondaryColor: '#E0F2FE',   // Light cyan
    accentColor: '#00D9FF',      // Bright cyan
    use_cases: [
      'Welcome messages',
      'Initial page load',
      'First-time visit greetings',
      'New user onboarding',
      'Warm introductions'
    ],
    states: [
      'waving',
      'smiling',
      'greeting',
      'happy',
      'excited'
    ],
    animation_support: [
      'wave',
      'nod',
      'bounce',
      'blink'
    ],
    size_recommendations: {
      small: 40,
      medium: 80,
      large: 160
    },
    alt_text: 'Wave, the teal greeting creature with friendly waving gesture'
  },

  guardian: {
    id: 'guardian',
    name: 'Guardian',
    description: 'Protective appearance with shield-like quality. The safety sentinel.',
    personality: 'Protective, strong, trustworthy, vigilant, responsible',
    appearance: 'Strong posture with protective aura, shield-like form, watchful expression, strong presence',
    primaryColor: '#1E40AF',     // Deep Blue
    secondaryColor: '#3B82F6',   // Medium Blue
    accentColor: '#60A5FA',      // Light Blue
    use_cases: [
      'Moderation actions',
      'Safety features',
      'Suspension notices',
      'Warning states',
      'Protective policies',
      'Content restrictions'
    ],
    states: [
      'alert',
      'protecting',
      'watching',
      'neutral',
      'proud'
    ],
    animation_support: [
      'protective_stance',
      'pulse',
      'nod',
      'shake'
    ],
    size_recommendations: {
      small: 48,
      medium: 96,
      large: 192
    },
    alt_text: 'Guardian, the deep blue protective creature with vigilant bearing'
  },

  echo: {
    id: 'echo',
    name: 'Echo',
    description: 'Communicative appearance with speech emphasis. The dialogue facilitator.',
    personality: 'Social, communicative, engaged, responsive, listener',
    appearance: 'Open communicative posture with communication waves, expressive features, engaged expression',
    primaryColor: '#D1D5DB',     // Silver
    secondaryColor: '#9CA3AF',   // Gray
    accentColor: '#6B7280',      // Dark gray
    use_cases: [
      'Comments section',
      'Replies and responses',
      'Feedback indicators',
      'Discussion prompts',
      'Communication features'
    ],
    states: [
      'speaking',
      'listening',
      'responding',
      'thinking',
      'happy'
    ],
    animation_support: [
      'mouth_open',
      'mouth_close',
      'nod',
      'pulse',
      'shimmer'
    ],
    size_recommendations: {
      small: 40,
      medium: 80,
      large: 160
    },
    alt_text: 'Echo, the silver communication creature with expressive dialogue pose'
  },

  star: {
    id: 'star',
    name: 'Star',
    description: 'Shiny and sparkly with award-like quality. The achievement beacon.',
    personality: 'Special, achievement-focused, rewarding, celebratory, inspiring',
    appearance: 'Shiny star-like form, glowing appearance, sparkles, award-like presentation',
    primaryColor: '#FCD34D',     // Gold
    secondaryColor: '#EC4899',   // Pink (rainbow)
    accentColor: '#F97316',      // Orange (rainbow)
    use_cases: [
      'Achievements and badges',
      'Milestones',
      'Special recognition',
      'Award celebrations',
      'Special features unlock'
    ],
    states: [
      'shining',
      'glowing',
      'celebrating',
      'happy',
      'excited'
    ],
    animation_support: [
      'shimmer',
      'glow',
      'sparkle',
      'pulse',
      'celebrate'
    ],
    size_recommendations: {
      small: 32,
      medium: 64,
      large: 128
    },
    alt_text: 'Star, the golden achievement creature with shiny sparkly appearance'
  }
};

/**
 * Get a creature by ID
 */
export function getCreature(id: string): Creature | undefined {
  return creatures[id.toLowerCase()];
}

/**
 * Get all creatures that match a specific use case
 */
export function getCreaturesByUseCase(useCase: string): Creature[] {
  return Object.values(creatures).filter(creature =>
    creature.use_cases.some(uc => 
      uc.toLowerCase().includes(useCase.toLowerCase())
    )
  );
}

/**
 * Get all creature names (for lists/selectors)
 */
export function getAllCreatureIds(): string[] {
  return Object.keys(creatures);
}

/**
 * Get all creatures with a specific state
 */
export function getCreaturesByState(state: CreatureState): Creature[] {
  return Object.values(creatures).filter(creature =>
    creature.states.includes(state)
  );
}

/**
 * Get a color variant for a creature
 */
export function getCreatureColor(
  id: string,
  intensity: 'light' | 'medium' | 'dark' = 'medium'
): string {
  const creature = getCreature(id);
  if (!creature) return '#000000';

  switch (intensity) {
    case 'light':
      return creature.secondaryColor;
    case 'dark':
      return creature.primaryColor;
    case 'medium':
    default:
      return creature.accentColor;
  }
}

/**
 * Get random creature
 */
export function getRandomCreature(): Creature {
  const ids = getAllCreatureIds();
  return creatures[ids[Math.floor(Math.random() * ids.length)]];
}

/**
 * Verify creature data integrity
 */
export function validateCreature(creature: Creature): string[] {
  const errors: string[] = [];

  if (!creature.id) errors.push('Creature must have an id');
  if (!creature.name) errors.push('Creature must have a name');
  if (!creature.personality) errors.push('Creature must have a personality');
  if (creature.states.length === 0) errors.push('Creature must have at least one state');
  if (creature.use_cases.length === 0) errors.push('Creature must have at least one use case');
  if (creature.animation_support.length === 0) errors.push('Creature must support at least one animation');

  return errors;
}

/**
 * Get all creatures (as array)
 */
export function getAllCreatures(): Creature[] {
  return Object.values(creatures);
}

/**
 * Get creature statistics
 */
export function getCreatureStats() {
  const allCreatures = getAllCreatures();
  return {
    total: allCreatures.length,
    names: allCreatures.map(c => c.name),
    primaryColors: allCreatures.map(c => c.primaryColor),
    supportedStates: Array.from(
      new Set(allCreatures.flatMap(c => c.states))
    ),
    supportedAnimations: Array.from(
      new Set(allCreatures.flatMap(c => c.animation_support))
    )
  };
}
