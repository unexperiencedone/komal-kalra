import { MessageSquareQuote, Star } from 'lucide-react';
import { requireAdmin } from '@/lib/auth/session';
import { createAdminClient } from '@/lib/supabase/admin';
import { formatDate } from '@/lib/date';
import { moderateTestimonial } from '@/app/admin/actions';
import { PageHeader } from '@/components/dashboard/AppShell';
import { Badge } from '@/components/ui/badge';
import { EmptyState, InlineAlert } from '@/components/ui/states';
import { Button } from '@/components/ui/button';
import type { Testimonial } from '@/types/database';

export const metadata = { title: 'Testimonials', robots: { index: false } };

/**
 * Testimonial moderation.
 *
 * Nothing reaches the public site without an explicit approval here. Clients
 * can only submit a review for an appointment they actually completed — that is
 * enforced by the RLS INSERT policy, not by this UI — so the queue cannot be
 * filled with fabricated entries.
 */
export default async function AdminTestimonialsPage() {
  await requireAdmin();
  const db = createAdminClient();

  const { data } = await db
    .from('testimonials')
    .select('*')
    .order('approved', { ascending: true })
    .order('created_at', { ascending: false });

  const testimonials = data as Testimonial[] ?? [];
  const pending = testimonials.filter((t) => !t.approved);
  const published = testimonials.filter((t) => t.approved);

  return (
    <div className="mx-auto max-w-4xl px-5 py-8 lg:px-10 lg:py-12">
      <PageHeader
        title="Testimonials"
        description="Reviews from completed sessions. Nothing appears on the site until you approve it."
      />

      {testimonials.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={MessageSquareQuote}
            title="No reviews yet"
            description="Clients can leave a review after a completed session. The homepage shows nothing at all until there are approved reviews — it never displays placeholder testimonials."
          />
        </div>
      ) : (
        <div className="mt-8 space-y-10">
          {pending.length > 0 && (
            <section aria-labelledby="pending-heading">
              <h2 id="pending-heading" className="font-sans text-sm font-semibold uppercase tracking-[0.1em] text-[var(--color-body-warm)]">
                Awaiting approval ({pending.length})
              </h2>
              <ul className="mt-3 space-y-3">
                {pending.map((t) => <TestimonialCard key={t.id} testimonial={t} />)}
              </ul>
            </section>
          )}

          <section aria-labelledby="published-heading">
            <h2 id="published-heading" className="font-sans text-sm font-semibold uppercase tracking-[0.1em] text-[var(--color-body-warm)]">
              Published ({published.length})
            </h2>
            {published.length === 0 ? (
              <div className="mt-3">
                <InlineAlert tone="info">
                  Nothing is published yet, so the testimonials section is hidden on the homepage.
                </InlineAlert>
              </div>
            ) : (
              <ul className="mt-3 space-y-3">
                {published.map((t) => <TestimonialCard key={t.id} testimonial={t} />)}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function TestimonialCard({ testimonial: t }: { testimonial: Testimonial }) {
  return (
    <li className="border border-[var(--color-outline-variant)] bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <p className="font-sans text-[15px] font-semibold">{t.author_name}</p>
            {t.approved && <Badge tone="success">Published</Badge>}
            {t.featured && <Badge tone="accent">Featured</Badge>}
            {t.display_initials_only && <Badge tone="neutral">Initials only</Badge>}
            {t.source !== 'site' && (
              <Badge tone="neutral">{t.source === 'google' ? 'From Google' : 'From WhatsApp'}</Badge>
            )}
          </div>
          {/*
            A missing rating renders as words, not as five empty stars. Five
            greyed-out stars reads as "this client rated us zero", which is the
            opposite of what NULL means here — a WhatsApp message simply never
            had stars to give. It would also have announced "null out of 5" to a
            screen reader.
          */}
          {t.rating === null ? (
            <p className="mt-1.5 text-xs text-[var(--color-body-warm)]">No star rating — sent as a message</p>
          ) : (
            <div className="mt-1.5 flex items-center gap-0.5" role="img" aria-label={`${t.rating} out of 5`}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={`size-3.5 ${i < t.rating! ? 'fill-[var(--color-saffron)] text-[var(--color-saffron)]' : 'text-[var(--color-outline-variant)]'}`} aria-hidden />
              ))}
            </div>
          )}
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--color-body-warm)]">{t.review}</p>
          <p className="mt-2 text-xs text-[var(--color-body-warm)]">{formatDate(t.created_at)}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 border-t border-[var(--color-outline-variant)] pt-4">
        {!t.approved ? (
          <Action id={t.id} action="approve" label="Approve" />
        ) : (
          <>
            <Action id={t.id} action="unapprove" label="Unpublish" variant="ghost" />
            {t.featured
              ? <Action id={t.id} action="unfeature" label="Remove from featured" variant="ghost" />
              : <Action id={t.id} action="feature" label="Feature" variant="secondary" />}
          </>
        )}
        <Action id={t.id} action="delete" label="Delete" variant="ghost" destructive />
      </div>
    </li>
  );
}

function Action({ id, action, label, variant = 'primary', destructive }: {
  id: string; action: string; label: string;
  variant?: 'primary' | 'secondary' | 'ghost'; destructive?: boolean;
}) {
  return (
    <form action={moderateTestimonial}>
      <input type="hidden" name="testimonialId" value={id} />
      <input type="hidden" name="action" value={action} />
      <Button type="submit" size="sm" variant={variant} className={destructive ? 'text-[var(--color-error)]' : undefined}>
        {label}
      </Button>
    </form>
  );
}
