/**
 * Lightweight, deterministic spam heuristics for public wall posts/comments.
 *
 * IMPORTANT: this module never auto-rejects. It only computes a score and a
 * list of reason tags so that the admin moderation queue can sort / flag
 * obvious garbage. A human always makes the final call.
 */

export type SpamResult = {
  score: number;
  reasons: string[];
};

const URL_RE = /https?:\/\/|www\./gi;
const REPEAT_CHAR_RE = /(.)\1{6,}/;
const BLOCKLIST: readonly string[] = [
  // crude, intentionally minimal; admin can expand later
  'viagra',
  'crypto giveaway',
  'free money',
  'click here',
  'bit.ly',
  'onlyfans',
];

/**
 * Score a piece of user-submitted text.
 *
 * Rules:
 *  - 3+ URLs              -> +5 too_many_urls
 *  - caps ratio > 0.7     -> +3 excessive_caps  (only for len >= 10)
 *  - 7+ consecutive chars -> +2 char_repeat
 *  - blocklist match      -> +10 blocked_word
 *  - length < 3 chars     -> +5 too_short
 */
export function scoreSpam(text: string): SpamResult {
  const reasons: string[] = [];
  let score = 0;

  const trimmed = text.trim();
  const len = trimmed.length;

  if (len < 3) {
    score += 5;
    reasons.push('too_short');
  }

  const urlMatches = trimmed.match(URL_RE);
  if (urlMatches && urlMatches.length >= 3) {
    score += 5;
    reasons.push('too_many_urls');
  }

  if (len >= 10) {
    const letters = trimmed.replace(/[^A-Za-z]/g, '');
    if (letters.length >= 10) {
      const upper = letters.replace(/[^A-Z]/g, '').length;
      if (upper / letters.length > 0.7) {
        score += 3;
        reasons.push('excessive_caps');
      }
    }
  }

  if (REPEAT_CHAR_RE.test(trimmed)) {
    score += 2;
    reasons.push('char_repeat');
  }

  const lower = trimmed.toLowerCase();
  for (const word of BLOCKLIST) {
    if (lower.includes(word)) {
      score += 10;
      reasons.push('blocked_word');
      break;
    }
  }

  return { score, reasons };
}
