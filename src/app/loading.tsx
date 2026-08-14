import { Skeleton } from '@/components/ui/states';

/**
 * Route-level loading state.
 *
 * Layout-matched skeletons rather than a spinner: they avoid layout shift and
 * measurably reduce perceived wait (docs/research.md §2.6).
 */
export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-16 lg:px-8" role="status" aria-label="Loading">
      <Skeleton className="h-10 w-2/3 max-w-md" />
      <Skeleton className="mt-4 h-4 w-full max-w-xl" />
      <Skeleton className="mt-2 h-4 w-4/5 max-w-lg" />
      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-56" />)}
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
