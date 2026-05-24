/** Simple abstract “hub + two portfolios” mark — not a stock family icon. */
export function ChildrenEmptyIllustration() {
  return (
    <div
      className="relative mx-auto flex size-20 items-center justify-center sm:size-24"
      aria-hidden
    >
      <div className="absolute inset-1 rounded-full bg-umber-500/12 blur-xl" />
      <div
        className="absolute inset-3 rounded-full border border-dusk-600/40 sm:inset-4"
        style={{ animation: "auth-glow-pulse 5s ease-in-out infinite" }}
      />
      <svg
        viewBox="0 0 120 120"
        className="relative size-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="children-empty-parent" x1="60" y1="24" x2="60" y2="52" gradientUnits="userSpaceOnUse">
            <stop stopColor="#c9a66b" />
            <stop offset="1" stopColor="#8b6914" />
          </linearGradient>
          <linearGradient id="children-empty-child" x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#7dd3fc" stopOpacity="0.95" />
            <stop offset="1" stopColor="#0284c7" stopOpacity="0.85" />
          </linearGradient>
          <linearGradient id="children-empty-line" x1="60" y1="48" x2="60" y2="88" gradientUnits="userSpaceOnUse">
            <stop stopColor="#a0845c" stopOpacity="0.55" />
            <stop offset="1" stopColor="#38bdf8" stopOpacity="0.35" />
          </linearGradient>
        </defs>

        <circle
          cx="60"
          cy="60"
          r="46"
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="3 7"
          className="text-dusk-600/50"
        />

        <path
          d="M60 50 C52 62 44 68 36 76"
          stroke="url(#children-empty-line)"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M60 50 C68 62 76 68 84 76"
          stroke="url(#children-empty-line)"
          strokeWidth="2"
          strokeLinecap="round"
        />

        <circle cx="36" cy="78" r="12" fill="url(#children-empty-child)" opacity="0.92" />
        <circle cx="36" cy="78" r="12" stroke="#bae6fd" strokeOpacity="0.35" strokeWidth="1" />

        <circle cx="84" cy="78" r="12" fill="url(#children-empty-child)" opacity="0.92" />
        <circle cx="84" cy="78" r="12" stroke="#bae6fd" strokeOpacity="0.35" strokeWidth="1" />

        <circle cx="60" cy="34" r="15" fill="url(#children-empty-parent)" />
        <circle cx="60" cy="34" r="15" stroke="#e8d5b5" strokeOpacity="0.45" strokeWidth="1.25" />

        <circle cx="48" cy="28" r="1.5" fill="#f0ebe0" fillOpacity="0.7" />
        <circle cx="92" cy="42" r="1.25" fill="#f0ebe0" fillOpacity="0.45" />
        <circle cx="28" cy="52" r="1" fill="#f0ebe0" fillOpacity="0.35" />
      </svg>
    </div>
  );
}
