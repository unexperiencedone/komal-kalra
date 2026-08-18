import { cn } from '@/lib/utils';

export function PressMarquee({ className }: { className?: string }) {
  const logos = ['VOGUE', 'ELLE', 'GQ', 'FORBES', 'HINDUSTAN TIMES', 'THE HINDU'];

  return (
    <section className={cn("overflow-hidden border-t border-[var(--color-hairline)] bg-[var(--color-card-cream)] py-10", className)}>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes custom-marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .animate-custom-marquee {
          animation: custom-marquee 20s linear infinite;
        }
      `}} />
      <div className="flex w-[200%] animate-custom-marquee hover:[animation-play-state:paused] focus-within:[animation-play-state:paused]">
        {[0, 1].map((set) => (
          <ul
            key={set}
            className="flex w-1/2 items-center justify-around"
            aria-hidden={set === 1 ? 'true' : undefined}
          >
            {logos.map((logo, i) => (
              <li key={i}>
                <span className="font-[family-name:var(--font-display)] text-2xl tracking-widest text-[var(--color-body-warm)] opacity-50 font-bold uppercase">
                  {logo}
                </span>
              </li>
            ))}
          </ul>
        ))}
      </div>
    </section>
  );
}
