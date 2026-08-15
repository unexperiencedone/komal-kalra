/**
 * Legal page shell.
 *
 * Prose styling lives here rather than in each page so the three documents are
 * typographically identical — inconsistent legal pages read as careless, which
 * is the opposite of what they are for.
 */
export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="band-sand py-16 sm:py-20">
      <div className="mx-auto max-w-3xl px-5 lg:px-8">
        <div
          className="
            [&_h2]:mt-10 [&_h2]:font-[family-name:var(--font-display)] [&_h2]:text-xl [&_h2]:font-semibold
            [&_p]:mt-4 [&_p]:text-[15px] [&_p]:leading-relaxed [&_p]:text-[var(--color-bark)]
            [&_ul]:mt-4 [&_ul]:space-y-2 [&_ul]:pl-5
            [&_li]:list-disc [&_li]:text-[15px] [&_li]:leading-relaxed [&_li]:text-[var(--color-bark)]
            [&_strong]:font-semibold [&_strong]:text-[var(--color-ink)]
          "
        >
          {children}
        </div>
      </div>
    </div>
  );
}
