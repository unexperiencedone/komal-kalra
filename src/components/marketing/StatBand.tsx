'use client';
import { useEffect, useRef, useState } from 'react';
import { Users, Globe2, Award, Star } from 'lucide-react';

const STATS = [
  { value: 5000, suffix: '+', label: 'Consultations', Icon: Users },
  { value: 12, suffix: '+', label: 'Countries Served', Icon: Globe2 },
  { value: 15, suffix: ' Yrs', label: 'Experience', Icon: Award },
  { value: 99, suffix: '%', label: 'Client Satisfaction', Icon: Star },
];

export function StatBand() {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="band-sand py-[var(--spacing-section-md)]" ref={ref}>
      <div className="shell">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 md:gap-12">
          {STATS.map((stat, i) => (
            <div key={i} className="flex flex-col items-center text-center">
              <stat.Icon className="size-8 text-[var(--color-saffron)] mb-4" strokeWidth={1.5} />
              <div className="font-[family-name:var(--font-display)] text-4xl text-[var(--color-cocoa)] md:text-5xl font-semibold tabular-nums">
                {inView ? <Counter end={stat.value} duration={1200} /> : stat.value}
                {stat.suffix}
              </div>
              <p className="mt-2 text-sm font-medium text-[var(--color-body-warm)] tracking-wide uppercase">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Counter({ end, duration }: { end: number; duration: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      const reveal = window.setTimeout(() => setCount(end), 0);
      return () => window.clearTimeout(reveal);
    }

    let startTime: number | null = null;
    let frame: number;

    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      setCount(Math.floor(easeOutCubic(progress) * end));
      
      if (progress < 1) {
        frame = requestAnimationFrame(step);
      }
    };

    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [end, duration]);

  return <>{count}</>;
}
