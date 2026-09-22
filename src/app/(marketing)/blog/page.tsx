import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { Reveal } from '@/components/common/Reveal';
import { Band } from '@/components/marketing/Band';
import { Button } from '@/components/ui/button';
import { img } from '@/lib/content/imagery';
import { JOURNAL_POSTS, readingMinutes } from '@/lib/content/journal';
import { BRAND } from '@/lib/config';

/**
 * The blog index.
 *
 * NAMED "BLOG", NOT "JOURNAL", EVERYWHERE — INCLUDING THE URL.
 *
 * The imagery catalogue has `journalCompass` and `journalCandle`, so the
 * design clearly anticipated a section called Journal, and Journal reads
 * better against this brand. It is still the wrong choice. `/blog` is the path
 * readers guess, the path other sites link to, and the word a search for
 * "komal kalra blog" contains. More to the point, calling the route /blog and
 * the section "Journal" would put two names for one thing on the site — which
 * is the exact fault the note on BRAND.name in config.ts records failing a
 * Google review. One name. This is it.
 *
 * The module behind it is still `content/journal.ts`, because that is an
 * internal filename nobody reads and renaming it buys nothing.
 */

export const metadata: Metadata = {
  title: 'Astrology Blog',
  description:
    'Plain explanations of the terms people are most often frightened by — Sade Sati, Mangal Dosha — and what to expect from a consultation. Written by the astrologers who take the sessions.',
  alternates: { canonical: '/blog' },
  openGraph: {
    title: `Astrology Blog | ${BRAND.name}`,
    description:
      'Plain explanations of the terms people are most often frightened by, written by the astrologers who take the sessions.',
    url: '/blog',
  },
};

function formatDate(iso: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export default function BlogIndexPage() {
  const banner = img('spiritualTexture');
  const [lead, ...rest] = JOURNAL_POSTS;

  /*
    Blog schema rather than a bare ItemList: it names the publisher and lets
    each entry carry its own author, which is the whole point of publishing
    this section at all. See the byline note in journal.ts.
  */
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: `Astrology Blog | ${BRAND.name}`,
    url: `${process.env.NEXT_PUBLIC_SITE_URL}/blog`,
    publisher: { '@type': 'Person', name: BRAND.fullName },
    blogPost: JOURNAL_POSTS.map((post) => ({
      '@type': 'BlogPosting',
      headline: post.title,
      description: post.description,
      datePublished: post.publishedAt,
      dateModified: post.updatedAt ?? post.publishedAt,
      author: { '@type': 'Person', name: post.author.name },
      url: `${process.env.NEXT_PUBLIC_SITE_URL}/blog/${post.slug}`,
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* ============================== 1. HERO ============================== */}
      <section className="band-terracotta relative overflow-hidden border-b border-[var(--color-hairline)] py-12 md:py-16">
        <Image
          src={banner.src}
          alt=""
          aria-hidden
          fill
          sizes="100vw"
          className="pointer-events-none absolute inset-0 z-0 object-cover opacity-30"
        />
        <div aria-hidden className="pointer-events-none absolute inset-0 z-0 bg-[var(--color-terracotta)]/70" />
        <div className="shell relative z-10 text-center">
          <Reveal>
            <div className="mx-auto max-w-3xl">
              <p className="label-caps text-[var(--color-saffron-lift)]">Writing</p>
              <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl text-white md:text-6xl">
                The Blog
              </h1>
              <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-[var(--color-cream)]">
                Plain explanations of the terms people are most often frightened by, and what
                to expect from a consultation. Written by the astrologers who take the sessions.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============================ 2. LEAD POST =========================== */}
      <section aria-labelledby="latest-heading" className="shell py-[var(--spacing-section-lg)]">
        <h2 id="latest-heading" className="sr-only">
          Latest articles
        </h2>

        {lead && (
          <Reveal>
            <Link
              href={`/blog/${lead.slug}`}
              className="group grid grid-cols-1 gap-8 border border-[var(--color-hairline)] bg-[var(--color-card-cream)] p-6 transition-colors duration-300 hover:bg-[var(--color-cream)] md:grid-cols-12 md:items-center md:gap-12 md:p-10"
            >
              <div className="relative aspect-[4/3] w-full border border-[var(--color-hairline)] md:col-span-5 md:aspect-[4/5]">
                <Image
                  src={img(lead.image).src}
                  alt={img(lead.image).alt}
                  fill
                  priority
                  sizes="(min-width: 768px) 40vw, 100vw"
                  className="object-cover grayscale-[20%] contrast-[1.1]"
                />
              </div>

              <div className="md:col-span-7">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                  <span className="label-caps text-[var(--color-saffron-deep)]">
                    {lead.tags[0]}
                  </span>
                  <span aria-hidden className="text-[var(--color-hairline)]">
                    &bull;
                  </span>
                  <span className="label-small text-[var(--color-body-warm)]">
                    {readingMinutes(lead)} min read
                  </span>
                </div>

                <h3 className="mt-4 font-[family-name:var(--font-display)] text-[length:var(--text-h2)] font-semibold leading-tight text-[var(--color-cocoa)] transition-colors group-hover:text-[var(--color-terracotta)]">
                  {lead.title}
                </h3>

                <p className="mt-5 max-w-[46ch] text-base leading-[1.7] text-[var(--color-body-warm)]">
                  {lead.standfirst}
                </p>

                <p className="mt-6 text-sm text-[var(--color-body-warm)]">
                  {lead.author.name} &middot; {formatDate(lead.publishedAt)}
                </p>

                <span className="mt-8 inline-flex items-center gap-2 font-medium text-[var(--color-saffron-deep)]">
                  Read the article
                  <ArrowRight
                    className="size-4 transition-transform duration-300 group-hover:translate-x-1"
                    aria-hidden
                  />
                </span>
              </div>
            </Link>
          </Reveal>
        )}

        {/* ============================ 3. THE REST =========================== */}
        {rest.length > 0 && (
          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
            {rest.map((post, i) => (
              <Reveal key={post.slug} delay={(i + 1) * 100}>
                <Link
                  href={`/blog/${post.slug}`}
                  className="group relative flex h-full flex-col border border-[var(--color-hairline)] bg-[var(--color-card-cream)] p-6 transition-colors duration-300 hover:bg-[var(--color-cream)] md:p-8"
                >
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                    <span className="label-caps text-[var(--color-saffron-deep)]">
                      {post.tags[0]}
                    </span>
                    <span aria-hidden className="text-[var(--color-hairline)]">
                      &bull;
                    </span>
                    <span className="label-small text-[var(--color-body-warm)]">
                      {readingMinutes(post)} min read
                    </span>
                  </div>

                  <h3 className="mt-4 font-[family-name:var(--font-display)] text-2xl font-semibold leading-tight text-[var(--color-cocoa)] transition-colors group-hover:text-[var(--color-terracotta)]">
                    {post.title}
                  </h3>

                  <p className="mt-4 flex-1 text-[15px] leading-[1.7] text-[var(--color-body-warm)]">
                    {post.standfirst}
                  </p>

                  <p className="mt-6 text-sm text-[var(--color-body-warm)]">
                    {post.author.name} &middot; {formatDate(post.publishedAt)}
                  </p>
                </Link>
              </Reveal>
            ))}
          </div>
        )}
      </section>

      {/* ============================== 4. CTA ============================== */}
      {/*
        Sand, because the section above it is the page's own cream. The closing
        band is deliberately quiet: someone on an index page has read nothing
        yet, and a terracotta call to action here would ask for a booking
        before anything has been given. npm run audit:bands checks the tone.
      */}
      <Band tone="sand" ruled>
        <div className="shell flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-[length:var(--text-h2)] text-[var(--color-cocoa)]">
              Have a question about your own chart?
            </h2>
            <p className="mt-3 max-w-xl text-base leading-relaxed text-[var(--color-body-warm)]">
              The free calculators answer the arithmetic. A consultation is for the part that
              depends on the rest of your chart.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Button asChild size="lg" variant="secondary">
              <Link href="/free-tools">Free tools</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="primary"
              className="shadow-[4px_4px_0_0_var(--color-saffron-deep)]"
            >
              <Link href="/services">See consultations</Link>
            </Button>
          </div>
        </div>
      </Band>
    </>
  );
}
