import type { Metadata } from "next";
import Link from "next/link";
import { AuthForm } from "@/components/auth/AuthForm";
import { AuthLeftPanel } from "@/components/auth/AuthLeftPanel";
import { sanitizeAuthRedirect } from "@/lib/auth/redirect";

export const metadata: Metadata = {
  title: "Sign up · HeroPortfolio.com",
  description:
    "Create a HeroPortfolio.com account with Google or email and password.",
};

type Props = { searchParams: Promise<{ next?: string }> };

export default async function SignupPage({ searchParams }: Props) {
  const q = await searchParams;
  const next = sanitizeAuthRedirect(q.next, "/timeline");

  return (
    <div className="flex min-h-screen flex-col bg-dusk-950 lg:flex-row">
      <AuthLeftPanel mode="signup" />

      {/* Same shell as login; signup cues stay on the form card + AuthForm */}
      <main className="flex flex-1 flex-col items-center justify-center border-dusk-800/80 px-8 py-12 lg:border-l lg:bg-dusk-950 lg:px-16">
        <div className="signup-form-card w-full max-w-[440px] rounded-2xl border border-sky-600/45 bg-dusk-900/70 p-6 shadow-lg shadow-black/20 sm:p-8">
          <AuthForm mode="signup" redirectAfterAuth={next} />

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
