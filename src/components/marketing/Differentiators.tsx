import { Languages, FileText, CalendarCheck, ShieldCheck } from 'lucide-react';
import { Reveal } from '@/components/common/Reveal';

const ITEMS = [
  {
    title: 'Available in 3 Languages',
    description: 'Consultations are conducted fluently in English, Hindi, or Punjabi based on your comfort.',
    Icon: Languages,
  },
  {
    title: 'Written Summary Included',
    description: 'You will receive a detailed written summary of the key insights and remedies after your session.',
    Icon: FileText,
  },
  {
    title: 'Free Rescheduling',
    description: 'Life happens. Reschedule or cancel for free up to 24 hours before your appointment.',
    Icon: CalendarCheck,
  },
  {
    title: 'Absolute Discretion',
    description: 'Your privacy is paramount. All consultations and birth details are strictly confidential.',
    Icon: ShieldCheck,
  },
];

export function Differentiators() {
  return (
    <section className="band-cream py-[var(--spacing-section-lg)]">
      <div className="shell">
        <Reveal>
          <div className="text-center mb-16">
            <h2 className="text-[length:var(--text-h2)] text-[var(--color-cocoa)]">
              A professional standard of practice
            </h2>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {ITEMS.map((item, i) => (
            <Reveal key={item.title} delay={i * 100}>
              <div className="h-full border border-[var(--color-hairline)] bg-[var(--color-card-cream)] p-8 relative before:absolute before:inset-[4px] before:border before:border-[var(--color-hairline)] before:pointer-events-none flex flex-col items-center text-center">
                <item.Icon className="size-8 text-[var(--color-saffron)] mb-6" strokeWidth={1.5} />
                <h3 className="font-medium text-lg text-[var(--color-cocoa)] mb-3">{item.title}</h3>
                <p className="text-sm text-[var(--color-body-warm)] leading-relaxed">{item.description}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
