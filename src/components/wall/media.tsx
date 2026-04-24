'use client';

// Match youtube.com/watch?v=ID, youtu.be/ID, youtube.com/shorts/ID, youtube.com/embed/ID
export const YT_REGEX =
  /https?:\/\/(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?[^\s]*v=|shorts\/|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})(?:[^\s]*)?/gi;

export const IMG_REGEX =
  /https?:\/\/[^\s<]+?\.(?:gif|png|jpe?g|webp)(?:\?[^\s<]*)?/gi;
export const TENOR_VIEW_REGEX =
  /https?:\/\/(?:www\.)?tenor\.com\/view\/[^\s<]*?-(\d+)/gi;
// Matches Giphy share URLs in three forms:
//   https://giphy.com/gifs/<slug>-<id>     ← typical: slug ends with "-<id>"
//   https://giphy.com/gifs/<id>             ← slugless short form
//   https://giphy.com/clips/<slug>-<id>    ← video clip variant
// The ID is always the trailing [A-Za-z0-9]{6,} segment.
export const GIPHY_VIEW_REGEX =
  /https?:\/\/(?:www\.|media\.)?giphy\.com\/(?:gifs|clips|embed)\/(?:[^\s<]*?-)?([A-Za-z0-9]{6,})(?=[^\w]|$)/gi;

export const URL_REGEX = /(https?:\/\/[^\s<]+)/g;

export type MediaEmbed =
  | { kind: 'image'; url: string }
  | { kind: 'youtube'; id: string }
  | { kind: 'tenor'; id: string }
  | { kind: 'giphy'; id: string };

export function extractMedia(
  text: string
): { embeds: MediaEmbed[]; consumed: Set<string> } {
  const embeds: MediaEmbed[] = [];
  const consumed = new Set<string>();
  const seen = new Set<string>();

  for (const m of text.matchAll(IMG_REGEX)) {
    const url = m[0];
    if (seen.has(url)) continue;
    seen.add(url);
    consumed.add(url);
    embeds.push({ kind: 'image', url });
  }
  for (const m of text.matchAll(YT_REGEX)) {
    const id = m[1];
    if (!id || seen.has('yt:' + id)) continue;
    seen.add('yt:' + id);
    consumed.add(m[0]);
    embeds.push({ kind: 'youtube', id });
  }
  for (const m of text.matchAll(TENOR_VIEW_REGEX)) {
    const id = m[1];
    if (!id || seen.has('tenor:' + id)) continue;
    seen.add('tenor:' + id);
    consumed.add(m[0]);
    embeds.push({ kind: 'tenor', id });
  }
  for (const m of text.matchAll(GIPHY_VIEW_REGEX)) {
    const id = m[1];
    if (!id || seen.has('giphy:' + id)) continue;
    seen.add('giphy:' + id);
    consumed.add(m[0]);
    embeds.push({ kind: 'giphy', id });
  }

  return { embeds, consumed };
}

export function Linkified({
  text,
  hideUrls,
}: {
  text: string;
  hideUrls?: Set<string>;
}) {
  const parts: (string | { href: string })[] = [];
  let last = 0;
  for (const m of text.matchAll(URL_REGEX)) {
    const start = m.index ?? 0;
    if (start > last) parts.push(text.slice(last, start));
    if (hideUrls?.has(m[0])) {
      // swallow the URL entirely — media embed replaces it
    } else {
      parts.push({ href: m[0] });
    }
    last = start + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return (
    <>
      {parts.map((p, i) =>
        typeof p === 'string' ? (
          <span key={i}>{p}</span>
        ) : (
          <a
            key={i}
            href={p.href}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="text-fuchsia-300 underline decoration-dotted underline-offset-2 hover:text-fuchsia-200"
          >
            {p.href}
          </a>
        )
      )}
    </>
  );
}

export function MediaEmbeds({ embeds }: { embeds: MediaEmbed[] }) {
  if (embeds.length === 0) return null;
  return (
    <div className="mt-3 flex flex-col gap-3">
      {embeds.slice(0, 4).map((e, i) => {
        if (e.kind === 'image') {
          return (
            <a
              key={i}
              href={e.url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="block overflow-hidden rounded-xl border border-white/10 bg-black/30"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={e.url}
                alt="Shared image"
                loading="lazy"
                className="max-h-[480px] w-full object-contain"
              />
            </a>
          );
        }
        if (e.kind === 'youtube') {
          return (
            <div
              key={i}
              className="relative w-full overflow-hidden rounded-xl border border-white/10"
              style={{ paddingBottom: '56.25%' }}
            >
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${e.id}`}
                title="YouTube video"
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
                className="absolute inset-0 h-full w-full"
              />
            </div>
          );
        }
        if (e.kind === 'tenor') {
          return (
            <div
              key={i}
              className="overflow-hidden rounded-xl border border-white/10 bg-black/30"
            >
              <iframe
                src={`https://tenor.com/embed/${e.id}`}
                title="Tenor GIF"
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
                className="h-[320px] w-full"
              />
            </div>
          );
        }
        // giphy
        return (
          <div
            key={i}
            className="overflow-hidden rounded-xl border border-white/10 bg-black/30"
          >
            <iframe
              src={`https://giphy.com/embed/${e.id}`}
              title="Giphy"
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
              className="h-[320px] w-full"
            />
          </div>
        );
      })}
    </div>
  );
}
