import Link from "next/link";

type Props = {
  searchParams: Promise<{ reason?: string }> | { reason?: string };
};

export default async function AuthCodeErrorPage({ searchParams }: Props) {
  const params = await Promise.resolve(searchParams);
  const reason = params.reason;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-parchment">
      <div className="w-full max-w-md rounded-2xl border border-dusk-700/80 bg-dusk-900/60 p-8 text-center shadow-xl backdrop-blur-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-umber-400">
          HeroPortfolio.com
        </p>
        <h1 className="mt-3 text-xl font-semibold tracking-tight">
          Sign-in link didn&apos;t work
        </h1>
        <p className="mt-2 text-sm text-parchment-muted">
          The magic link may have expired or already been used. Request a new
          one from the login page.
        </p>
        {reason ? (
          <p className="mt-3 rounded-lg bg-dusk-850 px-3 py-2 font-mono text-[11px] text-red-300/90">
            {reason}
          </p>
        ) : null}
        <Link
          href="/login"
          className="mt-6 inline-flex rounded-full border border-umber-500/45 bg-umber-500/15 px-5 py-2.5 text-sm font-medium text-umber-300 transition hover:bg-umber-500/25"
        >
          Back to login
        </Link>
      </div>
    </div>
  );
}
