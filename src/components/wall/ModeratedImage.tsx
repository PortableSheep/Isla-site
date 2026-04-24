'use client';

import { useState } from 'react';

export type FeedAttachment = {
  id: string;
  mime_type: string;
  width: number | null;
  height: number | null;
  signed_url: string | null;
};

/**
 * Render an uploaded wall attachment. The caller is responsible for only
 * passing attachments where the viewer is allowed to see the image; we still
 * no-op on missing signed_url so this component is safe to render blindly.
 *
 * For the author's own pending attachments we show the preview above a small
 * "waiting for review" pill, to match how pending text posts look.
 */
export function ModeratedImage({
  attachment,
  isAuthorPending,
}: {
  attachment: FeedAttachment;
  isAuthorPending: boolean;
}) {
  const [errored, setErrored] = useState(false);
  if (!attachment.signed_url || errored) return null;

  const style =
    attachment.width && attachment.height
      ? { aspectRatio: `${attachment.width} / ${attachment.height}` }
      : undefined;

  return (
    <div className="mt-3">
      <div className="overflow-hidden rounded-xl border border-white/10 bg-black/30">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={attachment.signed_url}
          alt="Uploaded image"
          loading="lazy"
          onError={() => setErrored(true)}
          className="block max-h-[480px] w-full object-contain"
          style={style}
        />
      </div>
      {isAuthorPending && (
        <p className="mt-1 text-[11px] italic text-amber-300/80">
          Only you can see this image until it&apos;s approved.
        </p>
      )}
    </div>
  );
}

export function ModeratedImageList({
  attachments,
  isAuthorPending,
}: {
  attachments: FeedAttachment[];
  isAuthorPending: boolean;
}) {
  if (!attachments || attachments.length === 0) return null;
  return (
    <>
      {attachments.map((a) => (
        <ModeratedImage key={a.id} attachment={a} isAuthorPending={isAuthorPending} />
      ))}
    </>
  );
}
