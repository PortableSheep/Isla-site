export type AiThresholdField = {
  key: string;
  label: string;
  defaultValue: number;
  category: string | null;
};

export const AI_THRESHOLD_FIELDS: readonly AiThresholdField[] = [
  { key: 'ai_threshold_default', label: 'Default threshold', defaultValue: 0.55, category: null },
  { key: 'ai_threshold_harassment', label: 'Harassment', defaultValue: 0.5, category: 'harassment' },
  {
    key: 'ai_threshold_harassment_threatening',
    label: 'Harassment / threatening',
    defaultValue: 0.45,
    category: 'harassment_threatening',
  },
  { key: 'ai_threshold_hate', label: 'Hate', defaultValue: 0.45, category: 'hate' },
  {
    key: 'ai_threshold_hate_threatening',
    label: 'Hate / threatening',
    defaultValue: 0.35,
    category: 'hate_threatening',
  },
  { key: 'ai_threshold_violence', label: 'Violence', defaultValue: 0.55, category: 'violence' },
  {
    key: 'ai_threshold_violence_graphic',
    label: 'Violence / graphic',
    defaultValue: 0.35,
    category: 'violence_graphic',
  },
  { key: 'ai_threshold_sexual', label: 'Sexual', defaultValue: 0.45, category: 'sexual' },
  {
    key: 'ai_threshold_sexual_minors',
    label: 'Sexual / minors',
    defaultValue: 0.01,
    category: 'sexual_minors',
  },
  { key: 'ai_threshold_self_harm', label: 'Self-harm', defaultValue: 0.35, category: 'self_harm' },
  {
    key: 'ai_threshold_self_harm_intent',
    label: 'Self-harm / intent',
    defaultValue: 0.25,
    category: 'self_harm_intent',
  },
  {
    key: 'ai_threshold_self_harm_instructions',
    label: 'Self-harm / instructions',
    defaultValue: 0.2,
    category: 'self_harm_instructions',
  },
  { key: 'ai_threshold_illicit', label: 'Illicit', defaultValue: 0.55, category: 'illicit' },
  {
    key: 'ai_threshold_illicit_violent',
    label: 'Illicit / violent',
    defaultValue: 0.35,
    category: 'illicit_violent',
  },
];

export const AI_THRESHOLD_SETTING_KEYS = AI_THRESHOLD_FIELDS.map((field) => field.key);

export type AiModerationThresholds = {
  defaultThreshold: number;
  categoryThresholds: Record<string, number>;
};

export function normalizeAiCategory(category: string): string {
  return category.replace(/\//g, '_').replace(/[^a-z0-9_]/gi, '').toLowerCase();
}

function clampThreshold(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

function parseThreshold(raw: string | undefined, fallback: number): number {
  if (typeof raw !== 'string' || !raw.trim()) return fallback;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return fallback;
  return clampThreshold(parsed);
}

export function thresholdsFromSettings(
  settings: Record<string, string | undefined>
): AiModerationThresholds {
  const defaultField = AI_THRESHOLD_FIELDS[0];
  const defaultThreshold = parseThreshold(
    settings[defaultField.key],
    defaultField.defaultValue
  );

  const categoryThresholds: Record<string, number> = {};
  for (const field of AI_THRESHOLD_FIELDS) {
    if (!field.category) continue;
    categoryThresholds[field.category] = parseThreshold(
      settings[field.key],
      field.defaultValue
    );
  }

  return { defaultThreshold, categoryThresholds };
}

export function thresholdsFromRows(
  rows: Array<{ key: string; value: string }> | null | undefined
): AiModerationThresholds {
  const settings: Record<string, string | undefined> = {};
  for (const row of rows ?? []) {
    settings[row.key] = row.value;
  }
  return thresholdsFromSettings(settings);
}
