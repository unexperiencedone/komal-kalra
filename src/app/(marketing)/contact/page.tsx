import type { Metadata } from 'next';
import { Phone, Clock } from 'lucide-react';
import { getActiveServices } from '@/lib/booking/availability';
import { ContactForm } from '@/components/marketing/ContactForm';
import { InstagramIcon } from '@/components/common/icons';
import { Reveal } from '@/components/common/Reveal';
import { BRAND } from '@/lib/config';

export const metadata: Metadata = {
  title: 'Contact',
  description:
    'Get in touch with Astrologer Komal Kalra. Call, message on Instagram, or send an enquiry — every message is read personally.',
  alternates: { canonical: '/contact' },
};

export default async function ContactPage() {
  const services = await getActiveServices();

  return (
    <section className="band-low py-16 sm:py-20">
      <div className="shell">
        <div className="grid gap-14 lg:grid-cols-[0.8fr_1.2fr]">
          <Reveal>
            <h1 className="text-[length:var(--text-h1)]">Get in touch</h1>
            <p className="mt-5 text-[16px] leading-relaxed text-[var(--color-on-surface-variant)]">
              Ask a question, or describe what is going on and we will tell you which
              consultation fits. If none of them do, we will say that too.
            </p>

            <ul className="mt-10 space-y-3">
              {BRAND.phones.map((phone, i) => (
                <li key={phone}>
                  <a
                    href={`tel:${BRAND.phonesE164[i]}`}
                    className="flex items-center gap-3  border border-[color-mix(in srgb, var(--color-muted-gold) 20%, transparent)] bg-white px-4 py-3.5 text-[15px] font-medium transition-colors hover:border-[var(--color-muted-gold)]"
                  >
                    <Phone className="size-4 text-[var(--color-gold-deep)]" aria-hidden />
                    {phone}
                  </a>
                </li>
              ))}
              <li>
                <a
                  href={BRAND.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3  border border-[color-mix(in srgb, var(--color-muted-gold) 20%, transparent)] bg-white px-4 py-3.5 text-[15px] font-medium transition-colors hover:border-[var(--color-muted-gold)]"
                >
                  <InstagramIcon className="size-4 text-[var(--color-gold-deep)]" />
                  {BRAND.instagramHandle}
                </a>
              </li>
            </ul>

            <p className="mt-6 flex items-start gap-2 text-sm leading-relaxed text-[var(--color-on-surface-variant)]">
              <Clock className="mt-0.5 size-3.5 shrink-0" aria-hidden />
              Enquiries are usually answered within one working day. For anything urgent,
              calling is faster than the form.
            </p>
          </Reveal>

          <Reveal delay={80}>
            <div className="border border-[color-mix(in srgb, var(--color-muted-gold) 20%, transparent)] border-t-4 border-t-[var(--color-muted-gold)] bg-white p-6  sm:p-8">
              <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold">Send a message</h2>
              <p className="mt-1.5 text-sm text-[var(--color-on-surface-variant)]">
                A sentence or two is plenty to start with.
              </p>
              <div className="mt-6">
                <ContactForm services={services} />
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
