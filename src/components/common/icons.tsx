/**
 * Brand icons.
 *
 * lucide-react v1 removed brand glyphs (they carry trademark constraints that a
 * general icon set should not ship). Instagram is the one brand mark this site
 * needs, so it lives here as a single inline SVG rather than pulling in a whole
 * second icon package for one path.
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
