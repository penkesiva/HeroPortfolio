/** Small beamed eighth — `currentColor` picks up theme (`text-umber-*` / CSS vars). */
export function MusicNoteGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fill="currentColor"
        d="M9 18V5l12-2v13.5c0 .83-.67 1.5-1.5 1.5S18 17.83 18 17s.67-1.5 1.5-1.5c.17 0 .33.03.5.08V7.74L10 9.42V18c0 .83-.67 1.5-1.5 1.5S7 18.83 7 18s.67-1.5 1.5-1.5 1.5.67 1.5 1.5 1.5Z"
      />
    </svg>
  );
}
