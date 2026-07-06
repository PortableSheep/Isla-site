export interface WallReactionOption {
  id: string;
  symbol: string;
  label: string;
}

export const WALL_REACTION_OPTIONS: WallReactionOption[] = [
  { id: '❤️', symbol: '❤️', label: 'Love' },
  { id: '👍', symbol: '👍', label: 'Like' },
  { id: '😂', symbol: '😂', label: 'Laugh' },
  { id: '😮', symbol: '😮', label: 'Wow' },
  { id: '😢', symbol: '😢', label: 'Care' },
  { id: '🎉', symbol: '🎉', label: 'Celebrate' },
  { id: '🔥', symbol: '🔥', label: 'Hype' },
  { id: '✨', symbol: '✨', label: 'Sparkles' },
  { id: '🦄', symbol: '🦄', label: 'Unicorn' },
  { id: '🌈', symbol: '🌈', label: 'Rainbow' },
  { id: '🚀', symbol: '🚀', label: 'Rocket' },
  { id: '🎈', symbol: '🎈', label: 'Balloon' },
  { id: '🍕', symbol: '🍕', label: 'Pizza' },
  { id: '🛸', symbol: '🛸', label: 'Spaceship' },
  { id: '🌟', symbol: '🌟', label: 'Star' },
];

export const WALL_REACTION_IDS = new Set(WALL_REACTION_OPTIONS.map((reaction) => reaction.id));
export const WALL_REACTION_BY_ID = new Map(
  WALL_REACTION_OPTIONS.map((reaction) => [reaction.id, reaction] as const)
);
