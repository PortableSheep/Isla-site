/**
 * URL safety check for wall posts and comments.
 *
 * Extracts all HTTP(S) URLs from content and checks each against a domain
 * allowlist of known-safe embeds. Any URL whose domain is not recognised is
 * flagged so a human moderator can review it before it goes live.
 *
 * This applies even to trusted (auto-approved) authors — the wall moderator
 * cannot know what an external link resolves to.
 */

export type UrlSafetyResult = {
  hasUnsafeUrls: boolean;
  /** 'flagged_url' tag when any unknown URL is present */
  reasons: string[];
};

const URL_RE = /https?:\/\/[^\s<>"']+/gi;

/**
 * Safe domains: YouTube, Giphy, Tenor, FaceTime, and the project's own
 * Supabase storage. Subdomains of listed domains are automatically allowed
 * (e.g. media.giphy.com for the giphy.com entry).
 */
const ALLOWED_DOMAINS: readonly string[] = [
  'youtube.com',
  'youtu.be',
  'giphy.com',
  'tenor.com',
  'facetime.apple.com',
];

function extractSupabaseDomain(): string | null {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  try {
    return new URL(raw).hostname;
  } catch {
    return null;
  }
}

function isAllowedUrl(href: string, extraDomain: string | null): boolean {
  let hostname: string;
  try {
    hostname = new URL(href).hostname.toLowerCase();
  } catch {
    return false;
  }

  const domains = extraDomain
    ? ([...ALLOWED_DOMAINS, extraDomain] as readonly string[])
    : ALLOWED_DOMAINS;

  return domains.some((d) => hostname === d || hostname.endsWith('.' + d));
}

export function checkUrls(text: string): UrlSafetyResult {
  const matches = text.match(URL_RE);
  if (!matches || matches.length === 0) {
    return { hasUnsafeUrls: false, reasons: [] };
  }

  const supabaseDomain = extractSupabaseDomain();
  const hasUnsafe = matches.some((url) => !isAllowedUrl(url, supabaseDomain));

  return {
    hasUnsafeUrls: hasUnsafe,
    reasons: hasUnsafe ? ['flagged_url'] : [],
  };
}
