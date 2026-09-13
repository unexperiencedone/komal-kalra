/**
 * Brand icons.
 *
 * lucide-react v1 removed brand glyphs (they carry trademark constraints that a
 * general icon set should not ship). Instagram and YouTube are the only brand
 * marks this site needs, so they live here as inline SVGs rather than pulling
 * in a whole second icon package for two paths.
 */
export function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Drawn in the same outline weight as InstagramIcon so the pair sits evenly. */
export function YouTubeIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="1.5" y="4.5" width="21" height="15" rx="4.5" />
      <path d="M10 9v6l5-3z" fill="currentColor" stroke="none" />
    </svg>
  );
}
