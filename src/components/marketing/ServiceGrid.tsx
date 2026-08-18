import { Reveal } from '@/components/common/Reveal';
import { ServiceCard } from './ServiceCard';
import type { Service } from '@/types/database';
import { CompactServiceRail } from './CompactServiceRail';

/**
 * The bento grid from the home design: a wide 8-column tile leading, then
 * three 4-column tiles, on a 12-column desktop grid.
 *
 * The pattern is expressed as a span lookup rather than hardcoded per card so
 * it survives Komal adding or removing a service from the admin panel — with
 * five services you get the designed layout exactly, with four or six it
 * degrades to an even grid instead of breaking.
 */
const SPANS = ['md:col-span-8', 'md:col-span-4', 'md:col-span-4', 'md:col-span-4', 'md:col-span-4'];

export function ServiceGrid({ services, compactDesktop = false }: { services: Service[]; compactDesktop?: boolean }) {
  if (services.length === 0) {
    return (
      <p className="border border-dashed border-[var(--color-hairline)] p-12 text-center text-sm text-[var(--color-body-warm)]">
        Services will appear here once they are added from the practitioner console.
      </p>
    );
  }

  const useDesignedLayout = services.length === 5;

  return (
    <>
      {compactDesktop && <CompactServiceRail services={services} />}
      <ul className={compactDesktop ? 'hidden' : 'grid grid-cols-1 gap-6 md:grid-cols-12'}>
      {services.map((service, i) => (
        <Reveal
          as="li"
          key={service.id}
          delay={i * 80}
          className={useDesignedLayout ? SPANS[i] : 'md:col-span-4'}
        >
          <ServiceCard
            service={service}
            index={i}
            total={services.length}
            tone={i % 2 === 0 ? 'linen' : 'high'}
          />
        </Reveal>
      ))}
      </ul>
    </>
  );
}
