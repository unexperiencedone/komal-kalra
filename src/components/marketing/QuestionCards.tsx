import { Reveal } from '@/components/common/Reveal';
import Image from 'next/image';
import { img } from '@/lib/content/imagery';

export function QuestionCards({ questions }: { questions: Array<{ area: string; questions: string[] }> }) {
  const imageKeys = ['journalCompass', 'journalCandle', 'heroImage', 'komalKalra'] as const;

  return (
    <section className="py-[var(--spacing-section-lg)]">
      <div className="shell">
        <Reveal>
          <div className="text-center mb-16">
            <h2 className="text-[length:var(--text-h2)] text-[var(--color-cocoa)]">
              Is this for you?
            </h2>
            <p className="mt-4 text-base text-[var(--color-body-warm)] max-w-xl mx-auto">
              If these questions feel familiar, a consultation will give you the clarity you are looking for.
            </p>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {questions.map((q, i) => {
            const photo = img(imageKeys[i % imageKeys.length]);
            
            return (
              <Reveal key={q.area} delay={i * 100}>
                <div className="group relative overflow-hidden aspect-[4/5] md:aspect-square flex flex-col justify-end p-8 sm:p-10 border border-[var(--color-hairline)] before:absolute before:inset-[4px] before:border before:border-[var(--color-hairline)] before:z-20 before:pointer-events-none">
                  <Image
                    src={photo.src}
                    alt={photo.alt}
                    fill
                    sizes="(min-width: 768px) 45vw, 100vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105 z-0 grayscale-[30%]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-panchang-navy)] via-[var(--color-panchang-navy)]/60 to-transparent z-10 transition-opacity duration-500 group-hover:opacity-90" />
                  
                  <div className="relative z-20">
                    <h3 className="font-[family-name:var(--font-display)] text-2xl font-medium text-[var(--color-saffron)] mb-6">
                      {q.area}
                    </h3>
                    <ul className="space-y-4">
                      {q.questions.map((question) => (
                        <li key={question} className="text-lg leading-relaxed text-white font-medium">
                          {question}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
