'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight } from 'lucide-react';
import { publicPrice } from '@/lib/money';
import { serviceImage } from '@/lib/content/imagery';
import type { Service } from '@/types/database';

/**
 * The "Our Expertise" list from vixorastudio.com's homepage.
 *
 * WHAT THE REFERENCE ACTUALLY DOES
 *
 * Their markup is a heading, a standfirst, ONE image, and then four bare
 * headings — Brand Identity / Vision & Strategy / Packaging / Advertise. Four
 * titles and a single image is the tell: the image is shared, and pointing at
 * a title swaps it. It reads as a list and behaves as a gallery, which is why
 * it holds attention far better than four cards would.
 *
 * Here the four titles are Komal's services and the image is that service's
 * photograph, so the interaction carries real information rather than being
 * decoration.
 *
 * ACCESSIBILITY — the part a hover-only version gets wrong
 *
 *  • Selection responds to FOCUS as well as hover. A keyboard user tabbing
 *    through the list sees the image track them; on a hover-only build the
 *    picture just never changes and the whole component is inert.
 *  • Every row is a real <Link>. The image is an enhancement, not the
 *    navigation — with JavaScript off this degrades to a plain list of links
 *    to each service, which is a perfectly good outcome.
 *  • The image is `aria-hidden` and the alt text is empty. It duplicates the
 *    row that controls it, and announcing it again on every arrow-key move is
 *    noise.
 *  • No `onMouseLeave` reset. Snapping back to the first item the moment the
 *    cursor drifts is jumpy; leaving the last choice on screen is calmer and
 *    matches the reference.
 */
export function ExpertiseList({ services }: { services: Service[] }) {
  const [active, setActive] = useState(0);

  if (services.length === 0) return null;

  const current = services[active] ?? services[0];
  const photo = serviceImage(current.slug);

  return (
    <div className="shell grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
      {/* --- The shared image ------------------------------------------- */}
      <div className="lg:col-span-5">
        <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[28px] border border-[var(--color-hairline)] bg-[var(--color-card-cream)] shadow-[0_24px_50px_-24px_rgba(45,20,5,0.45)]">
          {/*
            `key` forces React to mount a NEW <Image> per service instead of
            mutating the existing one's src. Without it the browser keeps the
            old frame on screen until the new file decodes, so a fast pass down
            the list shows a stale photograph under the wrong title. Mounting
            fresh lets each fade in from nothing, which is honest about loading.
          */}
          <Image
            key={current.id}
            src={photo.src}
            alt=""
            aria-hidden
            fill
            sizes="(min-width: 1024px) 40vw, 100vw"
            className="animate-[fade-in_400ms_var(--ease-out-quint)_both] object-cover"
          />
          <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
          <p className="absolute inset-x-6 bottom-6 z-10 text-sm text-white/90">
            {current.duration_minutes} min{publicPrice(current.price_paise) ? ` · ${publicPrice(current.price_paise)}` : ''}
          </p>
        </div>
      </div>

      {/* --- The list ---------------------------------------------------- */}
      <ul className="lg:col-span-7">
        {services.map((service, index) => {
          const selected = index === active;
          return (
            <li key={service.id}>
              <Link
                href={`/services/${service.slug}`}
                onMouseEnter={() => setActive(index)}
                onFocus={() => setActive(index)}
                aria-current={selected ? 'true' : undefined}
                className="group flex items-baseline gap-6 border-b border-[color-mix(in_srgb,var(--color-hairline)_60%,transparent)] py-7 transition-colors duration-300"
              >
                <span className="label-small tabular w-8 shrink-0 text-[var(--color-saffron-deep)]">
                  0{index + 1}
                </span>

                <span
                  className={[
                    'font-[family-name:var(--font-display)] text-[clamp(1.75rem,1.2rem+2.2vw,3.25rem)] font-semibold leading-tight',
                    'transition-[color,transform] duration-300 ease-out',
                    // Nudges right on selection — the reference's only movement
                    // on these rows, and it survives reduced-motion because it
                    // is a 4px shift rather than an animation.
                    selected
                      ? 'translate-x-2 text-[var(--color-cocoa)]'
                      : 'text-[color-mix(in_srgb,var(--color-cocoa)_45%,transparent)]',
                  ].join(' ')}
                >
                  {service.title}
                </span>

                <ArrowUpRight
                  aria-hidden
                  className={[
                    'ml-auto size-6 shrink-0 self-center transition-all duration-300 ease-out',
                    selected ? 'opacity-100' : 'opacity-0 -translate-x-2',
                    'text-[var(--color-saffron-deep)]',
                  ].join(' ')}
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
