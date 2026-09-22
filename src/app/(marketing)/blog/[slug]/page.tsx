import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { Reveal } from '@/components/common/Reveal';
import { Band } from '@/components/marketing/Band';
import { Button } from '@/components/ui/button';
import { FaqAccordion } from '@/components/marketing/FaqAccordion';
import { JournalBody } from '@/components/marketing/JournalBody';
import { img } from '@/lib/content/imagery';
import {
  JOURNAL_POSTS,
  getPostBySlug,
  readingMinutes,
  relatedPosts,
} from '@/lib/content/journal';
import { BRAND } from '@/lib/config';

/**
 * A blog article.
 *
 * FULLY STATIC. `generateStaticParams` enumerates the posts, which live in a
 * TypeScript module rather than the database, so every one of these prerenders
 * at build time with no client and no request-time work at all. Nothing in
 * this file may read cookies or headers — see the note in (marketing)/
 * layout.tsx about what that did to /services/[slug].
 *
 * THE STRUCTURED DATA IS THE POINT, NOT DECORATION
 *
 * Three graphs are published per article and each earns its place:
 *
 *   BlogPosting     carries the byline as a Person. Google's quality raters
 *                   look for a named author with real expertise behind
 *                   content like this, and an article with no attributable
 *                   human is exactly the shape of the content this practice
 *                   is trying to distinguish itself from.
 *   FAQPage         the five questions at the foot of each post are written
 *                   to stand alone in a search result, the same way
 *                   content/faq.ts is.
 *   BreadcrumbList  so the SERP shows the section rather than a bare URL.
 *
 * All three are declared from the same post object the page renders, so they
 * cannot drift from what a reader actually sees — which is the difference
 * between structured data and a misrepresentation.
 */

export function generateStaticParams() {
  return JOURNAL_POSTS.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await props.params;
  const post = getPostBySlug(slug);
  if (!post) return { title: 'Article not found' };

  const hero = img(post.image);

  return {
    title: post.seoTitle ?? post.title,
    description: post.description,
    alternates: { canonical: `/blog/${post.slug}` },
    authors: [{ name: post.author.name }],
    openGraph: {
      type: 'article',
      title: post.seoTitle ?? post.title,
      description: post.description,
      url: `/blog/${post.slug}`,
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt ?? post.publishedAt,
      authors: [post.author.name],
      images: [{ url: hero.src, alt: hero.alt }],
    },
  };
}

function formatDate(iso: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export default async function BlogPostPage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const hero = img(post.image);
  const portrait = img(post.author.portrait);
  const related = relatedPosts(post.slug);
  const base = process.env.NEXT_PUBLIC_SITE_URL;
  const url = `${base}/blog/${post.slug}`;

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: post.title,
      description: post.description,
      image: `${base}${hero.src}`,
      datePublished: post.publishedAt,
      dateModified: post.updatedAt ?? post.publishedAt,
      author: {
        '@type': 'Person',
        name: post.author.name,
        jobTitle: post.author.role,
        url: `${base}/about`,
      },
      publisher: { '@type': 'Person', name: BRAND.fullName, url: base },
      mainEntityOfPage: { '@type': 'WebPage', '@id': url },
      inLanguage: 'en-IN',
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: post.faq.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: { '@type': 'Answer', text: item.answer },
      })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Blog', item: `${base}/blog` },
        { '@type': 'ListItem', position: 2, name: post.title, item: url },
      ],
    },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <article>
        {/* ============================= 1. HEADER ============================ */}
        <header className="shell pt-10 pb-12 md:pt-16">
          <nav aria-label="Breadcrumb" className="mb-8">
            <Link
              href="/blog"
              className="label-caps text-[var(--color-saffron-deep)] transition-colors hover:text-[var(--color-terracotta)]"
            >
              &larr; All articles
            </Link>
          </nav>

          <Reveal>
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                {post.tags.map((tag) => (
                  <span key={tag} className="label-caps text-[var(--color-saffron-deep)]">
                    {tag}
                  </span>
                ))}
                <span aria-hidden className="text-[var(--color-hairline)]">
                  &bull;
                </span>
                <span className="label-small text-[var(--color-body-warm)]">
                  {readingMinutes(post)} min read
                </span>
              </div>

              <h1 className="mt-5 font-[family-name:var(--font-display)] text-[length:var(--text-h1)] font-semibold leading-[1.1] text-[var(--color-cocoa)]">
                {post.title}
              </h1>

              <p className="standfirst mt-6 !max-w-[52ch]">{post.standfirst}</p>

              {/*
                The byline carries a face and a role, not just a name. Every
                article on this site is written by someone who takes the
                consultations, and that is the single strongest reason to
                believe any of it — so it goes above the fold rather than in a
                footer nobody reaches.
              */}
              <div className="mt-10 flex items-center gap-4 border-t border-[var(--color-hairline)] pt-8">
                <Image
                  src={portrait.src}
                  alt={portrait.alt}
                  width={112}
                  height={112}
                  sizes="56px"
                  className="size-14 shrink-0 rounded-full border border-[var(--color-hairline)] object-cover"
                />
                <div>
                  <p className="font-[family-name:var(--font-display)] text-lg font-medium text-[var(--color-cocoa)]">
                    {post.author.name}
                  </p>
                  <p className="mt-0.5 text-sm text-[var(--color-body-warm)]">
                    {post.author.role} &middot;{' '}
                    <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
                    {post.updatedAt && (
                      <>
                        {' '}
                        &middot; Updated{' '}
                        <time dateTime={post.updatedAt}>{formatDate(post.updatedAt)}</time>
                      </>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </Reveal>
        </header>

        {/* ============================== 2. HERO ============================= */}
        <div className="shell">
          <div className="relative aspect-[16/9] w-full border border-[var(--color-hairline)] bg-[var(--color-card-cream)] before:pointer-events-none before:absolute before:inset-[4px] before:z-10 before:border before:border-[var(--color-hairline)]">
            <Image
              src={hero.src}
              alt={hero.alt}
              fill
              priority
              sizes="(min-width: 1280px) 1280px, 100vw"
              className="object-cover contrast-[1.1] grayscale-[20%]"
            />
          </div>
        </div>

        {/* ====================== 3. CONTENTS + BODY ========================= */}
        <div className="shell py-[var(--spacing-section-md)]">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
            {/*
              A contents list, sticky on desktop only.

              These articles run long on purpose — the whole argument is that
              the frightening version of each topic is the short one. A long
              read still has to be skimmable, and someone who arrived from a
              search for "sade sati remedies" should be able to reach that
              section without scrolling past four others.
            */}
            <aside className="lg:col-span-4 lg:order-last">
              <nav
                aria-label="On this page"
                className="lg:sticky lg:top-40 border border-[var(--color-hairline)] bg-[var(--color-card-cream)] p-6"
              >
                <p className="label-caps text-[var(--color-saffron-deep)]">On this page</p>
                <ol className="mt-4 space-y-3">
                  {post.sections.map((section, i) => (
                    <li key={section.id} className="flex gap-3">
                      <span className="label-small pt-1 text-[var(--color-saffron-deep)]">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <a
                        href={`#${section.id}`}
                        className="text-[15px] leading-snug text-[var(--color-body-warm)] transition-colors hover:text-[var(--color-terracotta)]"
                      >
                        {section.heading}
                      </a>
                    </li>
                  ))}
                </ol>
              </nav>
            </aside>

            <div className="lg:col-span-8">
              <JournalBody sections={post.sections} />
            </div>
          </div>
        </div>

        {/* ============================== 4. FAQ ============================= */}
        <Band tone="sand" ruled size="md">
          <div className="shell">
            <div className="grid grid-cols-1 gap-10 md:grid-cols-12">
              <Reveal className="md:col-span-4">
                <h2 className="text-[length:var(--text-h2)] text-[var(--color-cocoa)]">
                  Common questions
                </h2>
                <p className="mt-4 text-base leading-relaxed text-[var(--color-body-warm)]">
                  The questions this article gets asked most often, answered briefly.
                </p>
              </Reveal>
              <Reveal delay={100} className="md:col-span-8">
                <FaqAccordion items={post.faq} />
              </Reveal>
            </div>
          </div>
        </Band>

        {/* ========================== 5. AUTHOR BIO ========================== */}
        {/*
          Cream, because the FAQ band above is sand — npm run audit:bands
          checks that two same-tone bands never touch.
        */}
        <Band tone="cream" size="md">
          <div className="shell">
            <Reveal>
              <div className="flex flex-col gap-6 border border-[var(--color-hairline)] bg-[var(--color-card-cream)] p-6 sm:flex-row sm:items-start sm:gap-8 md:p-10">
                <Image
                  src={portrait.src}
                  alt={portrait.alt}
                  width={192}
                  height={192}
                  sizes="96px"
                  className="size-24 shrink-0 border border-[var(--color-hairline)] object-cover"
                />
                <div>
                  <p className="label-caps text-[var(--color-saffron-deep)]">Written by</p>
                  <p className="mt-2 font-[family-name:var(--font-display)] text-2xl font-medium text-[var(--color-cocoa)]">
                    {post.author.name}
                  </p>
                  <p className="mt-1 text-sm text-[var(--color-body-warm)]">{post.author.role}</p>
                  <p className="mt-4 max-w-[60ch] text-[15px] leading-[1.7] text-[var(--color-body-warm)]">
                    {post.author.name} takes consultations at this practice. Articles here are
                    written by the astrologer who reads the charts, not by a content team — and
                    nothing in them is written to sell a remedy.
                  </p>
                  <div className="mt-6 flex flex-wrap gap-4">
                    <Button asChild variant="secondary">
                      <Link href="/about">About the practice</Link>
                    </Button>
                    <Button asChild variant="link">
                      <Link href="/services">See consultations</Link>
                    </Button>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </Band>

        {/* ========================== 6. KEEP READING ========================= */}
        {related.length > 0 && (
          <Band tone="sand" ruled size="md">
            <div className="shell">
              <h2 className="text-[length:var(--text-h2)] text-[var(--color-cocoa)]">
                Keep reading
              </h2>
              <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
                {related.map((item, i) => (
                  <Reveal key={item.slug} delay={i * 100}>
                    <Link
                      href={`/blog/${item.slug}`}
                      className="group flex h-full flex-col border border-[var(--color-hairline)] bg-[var(--color-cream)] p-6 transition-colors duration-300 hover:bg-white md:p-8"
                    >
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                        <span className="label-caps text-[var(--color-saffron-deep)]">
                          {item.tags[0]}
                        </span>
                        <span aria-hidden className="text-[var(--color-hairline)]">
                          &bull;
                        </span>
                        <span className="label-small text-[var(--color-body-warm)]">
                          {readingMinutes(item)} min read
                        </span>
                      </div>
                      <h3 className="mt-4 font-[family-name:var(--font-display)] text-xl font-semibold leading-tight text-[var(--color-cocoa)] transition-colors group-hover:text-[var(--color-terracotta)]">
                        {item.title}
                      </h3>
                      <p className="mt-3 flex-1 text-[15px] leading-[1.7] text-[var(--color-body-warm)]">
                        {item.standfirst}
                      </p>
                      <span className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-[var(--color-saffron-deep)]">
                        Read
                        <ArrowRight
                          className="size-4 transition-transform duration-300 group-hover:translate-x-1"
                          aria-hidden
                        />
                      </span>
                    </Link>
                  </Reveal>
                ))}
              </div>
            </div>
          </Band>
        )}

        {/* ============================== 7. CTA ============================= */}
        <section className="band-navy border-t border-white/20 py-[var(--spacing-section-lg)]">
          <div className="shell flex flex-col items-start justify-between gap-10 md:flex-row md:items-center">
            <div>
              <h2 className="font-[family-name:var(--font-display)] text-4xl text-white">
                Want this read against your own chart?
              </h2>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-[var(--color-cream)]">
                A general article cannot tell you what your chart says. A consultation can.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <Button
                asChild
                size="lg"
                variant="primary"
                className="shadow-[4px_4px_0_0_var(--color-saffron-deep)]"
              >
                <Link href="/book">Book a consultation &rarr;</Link>
              </Button>
            </div>
          </div>
        </section>
      </article>
    </>
  );
}
