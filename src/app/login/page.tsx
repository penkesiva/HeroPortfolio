import type { Metadata } from "next";
import Link from "next/link";
import { AuthForm } from "@/components/auth/AuthForm";
import { AuthLeftPanel } from "@/components/auth/AuthLeftPanel";
import { sanitizeAuthRedirect } from "@/lib/auth/redirect";

export const metadata: Metadata = {
  title: "Log in · HeroPortfolio.com",
  description:
    "Log in to HeroPortfolio.com with Google or email and password.",
};

type Props = { searchParams: Promise<{ next?: string }> };

export default async function LoginPage({ searchParams }: Props) {
  const q = await searchParams;
  const next = sanitizeAuthRedirect(q.next, "/portfolios");

  return (
    <div className="flex min-h-screen flex-col bg-dusk-950 lg:flex-row">
      <AuthLeftPanel mode="login" />

      {/* Form panel — warm umber frame, panel on the left on large screens */}
      <main className="flex flex-1 flex-col items-center justify-center border-dusk-800/80 px-8 py-12 lg:border-l lg:bg-dusk-950 lg:px-16">
        <div className="w-full max-w-[400px] rounded-2xl border border-dusk-700/50 bg-dusk-900/30 p-6 shadow-lg shadow-black/20 sm:p-8">
          <AuthForm mode="login" redirectAfterAuth={next} />

          <p className="mt-8 text-xs text-parchment-muted/50">
            <Link href="/" className="transition hover:text-parchment-muted">
              ← Back to home
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
