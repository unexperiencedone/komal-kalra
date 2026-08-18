import { Reveal } from '@/components/common/Reveal';

export function QuestionCards({ questions }: { questions: Array<{ area: string; questions: string[] }> }) {
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
            return (
              <Reveal key={q.area} delay={i * 100}>
                <div className="relative flex min-h-64 flex-col justify-center border border-[var(--color-hairline)] bg-[var(--color-card-cream)] p-8 sm:p-10 before:pointer-events-none before:absolute before:inset-[4px] before:border before:border-[var(--color-hairline)]">
                  <div>
                    <h3 className="mb-6 font-[family-name:var(--font-display)] text-2xl font-medium text-[var(--color-saffron-deep)]">
                      {q.area}
                    </h3>
                    <ul className="space-y-4 text-[var(--color-body-warm)]">
                      {q.questions.map((question) => (
                        <li key={question} className="text-lg font-medium leading-relaxed">
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
