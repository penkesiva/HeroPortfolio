import Link from "next/link";

/**
 * Consistent back-navigation button used on all sub-pages (Album, Badges,
 * Analytics, Pricing). Update the styling here to change it everywhere.
 */
export function BackToTimeline({ label = "Timeline" }: { label?: string }) {
  return (
    <Link
      href="/timeline"
      className="inline-flex items-center gap-2 rounded-lg border border-dusk-700/60 bg-dusk-900/50 px-3.5 py-2 text-sm font-medium text-parchment-muted transition hover:border-dusk-600 hover:bg-dusk-800/60 hover:text-parchment"
    >
      <svg
        viewBox="0 0 16 16"
        fill="currentColor"
        className="size-4 shrink-0"
        aria-hidden
      >
        <path
          fillRule="evenodd"
          d="M7.78 12.53a.75.75 0 0 1-1.06 0L2.47 8.28a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 1.06L4.81 7.25h8.44a.75.75 0 0 1 0 1.5H4.81l2.97 2.97a.75.75 0 0 1 0 1.06Z"
          clipRule="evenodd"
        />
      </svg>
      {label}
    </Link>
  );
}
