export default function Loading() {
  return (
    <div
      className="flex min-h-[60vh] items-center justify-center bg-[var(--color-cream)]"
      role="status"
      aria-label="Loading"
    >
      <div className="loading-cursor" aria-hidden>
        {Array.from({ length: 12 }, (_, index) => (
          <span
            key={index}
            className="loading-cursor-line"
            style={{
              transform: `translate(-50%, -50%) rotate(${index * 30}deg) translateY(-1.55rem)`,
              animationDelay: `${index * 90}ms`,
            }}
          />
        ))}
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
