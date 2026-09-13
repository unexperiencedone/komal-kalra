'use client';

import { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

type InstagramPost = { id: string; kind: 'p' | 'reel'; label: string };

const POSTS: InstagramPost[] = [
  { id: 'DdOP87rk8Le', kind: 'p', label: 'Instagram post: Awaken Astrological podcast announcement' },
  { id: 'Dc5hYfaks7T', kind: 'reel', label: 'Instagram reel' },
  { id: 'DcDPlYOD2-7', kind: 'reel', label: 'Instagram reel' },
];

/**
 * A swipeable strip of Instagram embeds, one post per slide.
 *
 * WHY THE HEIGHTS ARE CALCULATED. Instagram's /embed page has no intrinsic
 * size, and without Instagram's embed.js (which we deliberately don't load)
 * nothing resizes the iframe to fit. Its layout is predictable though: a fixed
 * ~215px of header and footer chrome around media that is square for photo
 * posts and 4:5 for reels. The strip is a size container, so `cqw` is the
 * slide width and each frame tracks its content at any width. The extra few
 * pixels of slack are what keep the embed from growing its own scrollbar.
 */
export function InstagramPosts() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  const goTo = (i: number) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollTo({ left: i * track.clientWidth, behavior: 'smooth' });
  };

  const onScroll = () => {
    const track = trackRef.current;
    if (!track) return;
    setIndex(Math.round(track.scrollLeft / track.clientWidth));
  };

  const arrowClass =
    'flex size-8 items-center justify-center border border-[var(--color-hairline)] text-[var(--color-cocoa)] transition-colors hover:border-[var(--color-terracotta)] hover:text-[var(--color-terracotta)] disabled:pointer-events-none disabled:opacity-30';

  return (
    <div className="mx-auto w-full max-w-[360px]">
      <div
        ref={trackRef}
        onScroll={onScroll}
        className="@container flex snap-x snap-mandatory items-start overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {POSTS.map((post, i) => (
          <iframe
            key={post.id}
            src={`https://www.instagram.com/${post.kind}/${post.id}/embed`}
            title={post.label}
            loading={i === 0 ? 'eager' : 'lazy'}
            scrolling="no"
            className={cn(
              'w-full shrink-0 snap-center border-0',
              post.kind === 'reel' ? 'h-[calc(125cqw+228px)]' : 'h-[calc(100cqw+228px)]',
            )}
          />
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <button type="button" onClick={() => goTo(index - 1)} disabled={index === 0} aria-label="Previous post" className={arrowClass}>
          <ChevronLeft className="size-4" aria-hidden />
        </button>
        <div className="flex gap-2">
          {POSTS.map((post, i) => (
            <button
              key={post.id}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Show post ${i + 1} of ${POSTS.length}`}
              aria-current={i === index}
              className={cn(
                'size-2 rounded-full transition-colors',
                i === index ? 'bg-[var(--color-terracotta)]' : 'bg-[var(--color-hairline)]',
              )}
            />
          ))}
        </div>
        <button type="button" onClick={() => goTo(index + 1)} disabled={index === POSTS.length - 1} aria-label="Next post" className={arrowClass}>
          <ChevronRight className="size-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
