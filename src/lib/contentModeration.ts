/**
 * OpenAI Moderation API wrapper.
 *
 * Checks user-submitted text for harmful content (hate, harassment, sexual,
 * violence, self-harm). Free endpoint — no billing impact.
 *
 * Designed to fail open: if the API is unavailable or the request times out
 * the result is { flagged: false } so posts are never blocked due to infra issues.
 */

export type ModerationResult = {
  flagged: boolean;
  /** Reason tags to inject into spam_reasons, e.g. ['ai_flagged', 'ai_flagged:sexual'] */
  reasons: string[];
  error?: string;
};

const OPENAI_MODERATION_URL = 'https://api.openai.com/v1/moderations';
const TIMEOUT_MS = 3000;

export async function moderateContent(text: string): Promise<ModerationResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return { flagged: false, reasons: [], error: 'no_api_key' };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    console.log('[content-moderation] checking content, length=%d', text.length);
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
      console.warn('[content-moderation] API error status=%d', res.status);
      return { flagged: false, reasons: [], error: `api_status_${res.status}` };
    }

    const data = (await res.json()) as {
      results?: Array<{ flagged: boolean; categories: Record<string, boolean> }>;
    };

    const result = data.results?.[0];
    if (!result) {
      console.warn('[content-moderation] no result in response');
      return { flagged: false, reasons: [], error: 'no_result' };
    }

    if (!result.flagged) {
      console.log('[content-moderation] clean');
      return { flagged: false, reasons: [] };
    }

    const reasons: string[] = ['ai_flagged'];
    for (const [category, active] of Object.entries(result.categories)) {
      if (active) {
        // Normalise category names: "hate/threatening" → "ai_flagged:hate_threatening"
        const tag = 'ai_flagged:' + category.replace(/\//g, '_').replace(/[^a-z0-9_]/g, '');
        reasons.push(tag);
      }
    }

    console.log('[content-moderation] FLAGGED reasons=%s', reasons.join(', '));
    return { flagged: true, reasons };
  } catch (err) {
    const isTimeout = err instanceof Error && err.name === 'AbortError';
    console.warn('[content-moderation] %s', isTimeout ? 'timeout' : 'fetch_error');
    return {
      flagged: false,
      reasons: [],
      error: isTimeout ? 'timeout' : 'fetch_error',
    };
  } finally {
    clearTimeout(timer);
  }
}
