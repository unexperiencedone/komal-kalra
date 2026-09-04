'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Play } from 'lucide-react';
import type { ChannelVideo } from '@/lib/content/youtube';
import { cn } from '@/lib/utils';

/**
 * The channel's most recent videos, read from YouTube's public RSS feed.
 *
 * REPLACES AN ELFSIGHT WIDGET. That widget put a "Free Instagram Feed Widget"
 * badge on the page and, less visibly, capped itself at 200 views per month on
 * the free tier — so it stops rendering partway through a busy month. The feed
 * behind this component needs no key, no account, no quota and no token.
 *
 * SAME CLICK-TO-LOAD BEHAVIOUR AS THE BEEJ MANTRAS, for the same reasons: no
 * YouTube player JavaScript and no third-party cookies until someone actually
 * asks for a video.
 *
 * The one difference is that these DO show thumbnails, because here they carry
 * information — a title alone is a poor way to choose between videos, whereas
 * for the mantras the Sanskrit text was the content. They are routed through
 * next/image rather than pointed straight at i.ytimg.com, so the visitor's
 * browser requests our domain and the server fetches from Google once. That
 * keeps the privacy property the click-to-load pattern exists to protect.
 *
 * Renders NOTHING when the list is empty. A YouTube outage or a changed feed
 * format costs this section and nothing else — there is no placeholder video
 * and no "coming soon".
 */
export function LatestVideos({ videos }: { videos: ChannelVideo[] }) {
  const [active, setActive] = useState<string | null>(null);

  if (videos.length === 0) return null;

  return (
    <ul className="w-full space-y-3">
      {videos.map((video) => {
        const isActive = active === video.id;

        return (
          <li key={video.id}>
            {isActive ? (
              <div className="relative w-full overflow-hidden" style={{ paddingBottom: '56.25%' }}>
                <iframe
                  className="absolute inset-0 size-full"
                  src={`https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&rel=0&modestbranding=1`}
                  title={video.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  loading="lazy"
                />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setActive(video.id)}
                className="group flex w-full items-center gap-3 text-left"
              >
                <span className="relative aspect-video w-28 shrink-0 overflow-hidden bg-[var(--color-cream)]">
                  <Image
                    src={video.thumbnail}
                    alt=""
                    fill
                    sizes="112px"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <span
                    aria-hidden
                    className="absolute inset-0 flex items-center justify-center bg-black/25 transition-colors group-hover:bg-black/10"
                  >
                    <span className="flex size-7 items-center justify-center rounded-full bg-white/90">
                      <Play className="size-3 fill-[var(--color-cocoa)] text-[var(--color-cocoa)]" />
                    </span>
                  </span>
                </span>

                {/*
                  Two lines, clamped. Her titles run long and carry emoji and
                  pipes — letting them wrap freely makes three cards of wildly
                  different heights in a row that is supposed to line up.
                */}
                <span
                  className={cn(
                    'line-clamp-2 flex-1 text-left text-sm leading-snug text-[var(--color-body-warm)]',
                    'transition-colors group-hover:text-[var(--color-cocoa)]',
                  )}
                >
                  {video.title}
                </span>
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
