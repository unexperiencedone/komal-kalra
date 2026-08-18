import { CheckCircle2 } from 'lucide-react';
import { Reveal } from '@/components/common/Reveal';

export function IncludesList({ highlights }: { highlights: string[] }) {
  if (!highlights.length) return null;
  
  return (
    <ul className="mt-8 space-y-4">
      {highlights.map((h, i) => (
        <Reveal as="li" key={h} delay={i * 40} className="flex items-start gap-3 text-[var(--color-body-warm)]">
          <CheckCircle2 className="size-5 shrink-0 text-[var(--color-saffron)] mt-0.5" aria-hidden />
          <span className="text-base font-medium">{h}</span>
        </Reveal>
      ))}
    </ul>
  );
}
