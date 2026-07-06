/**
 * OpenAI Moderation API wrapper.
 *
 * Checks user-submitted text for harmful content and returns reason tags
 * used by wall moderation.
 *
 * Designed to fail open: if the API is unavailable or the request times out
 * the result is { flagged: false } so posts are never blocked due to infra issues.
 */

import {
  type AiModerationThresholds,
  normalizeAiCategory,
  thresholdsFromSettings,
} from '@/lib/moderationThresholds';

export type ModerationResult = {
  flagged: boolean;
  /** Reason tags to inject into spam_reasons, e.g. ['ai_flagged', 'ai_flagged:sexual'] */
  reasons: string[];
  error?: string;
};

type ModerateContentOptions = {
  thresholds?: AiModerationThresholds;
};

const OPENAI_MODERATION_URL = 'https://api.openai.com/v1/moderations';
const TIMEOUT_MS = 3000;

const FALLBACK_THRESHOLDS = thresholdsFromSettings(
  Object.create(null) as Record<string, string | undefined>
);

type ModerationApiResponse = {
  results?: Array<{
    flagged?: boolean;
    categories?: Record<string, boolean>;
    category_scores?: Record<string, number>;
  }>;
};

export async function moderateContent(
  text: string,
  options?: ModerateContentOptions
): Promise<ModerationResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return { flagged: false, reasons: [], error: 'no_api_key' };
  }

  const thresholds = options?.thresholds ?? FALLBACK_THRESHOLDS;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(OPENAI_MODERATION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ input: text }),
      signal: controller.signal,
    });

    if (!res.ok) {
      return { flagged: false, reasons: [], error: `api_status_${res.status}` };
    }

    const data = (await res.json()) as ModerationApiResponse;
    const result = data.results?.[0];
    if (!result) {
      return { flagged: false, reasons: [], error: 'no_result' };
    }

    const categoriesByThreshold: string[] = [];
    if (result.category_scores) {
      for (const [category, score] of Object.entries(result.category_scores)) {
        if (!Number.isFinite(score)) continue;
        const normalized = normalizeAiCategory(category);
        const threshold =
          thresholds.categoryThresholds[normalized] ?? thresholds.defaultThreshold;
        if (score >= threshold) {
          categoriesByThreshold.push(category);
        }
      }
    }

    const categories =
      categoriesByThreshold.length > 0
        ? categoriesByThreshold
        : Object.entries(result.categories ?? {})
            .filter(([, active]) => active)
            .map(([category]) => category);

    if (categories.length === 0 && !result.flagged) {
      return { flagged: false, reasons: [] };
    }

    const reasons: string[] = ['ai_flagged'];
    for (const category of categories) {
      reasons.push(`ai_flagged:${normalizeAiCategory(category)}`);
    }

    return { flagged: true, reasons };
  } catch (err) {
    const isTimeout = err instanceof Error && err.name === 'AbortError';
    return {
      flagged: false,
      reasons: [],
      error: isTimeout ? 'timeout' : 'fetch_error',
    };
  } finally {
    clearTimeout(timer);
  }
}
