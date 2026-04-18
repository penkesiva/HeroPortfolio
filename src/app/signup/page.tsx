import type { Metadata } from "next";
import Link from "next/link";
import { AuthForm } from "@/components/auth/AuthForm";
import { AuthLeftPanel } from "@/components/auth/AuthLeftPanel";
import { sanitizeAuthRedirect } from "@/lib/auth/redirect";

export const metadata: Metadata = {
  title: "Sign up — HeroPortfolio.com",
  description:
    "Create a HeroPortfolio.com account with Google, email and password, or a magic link.",
};

type Props = { searchParams: Promise<{ next?: string }> };

export default async function SignupPage({ searchParams }: Props) {
  const q = await searchParams;
  const next = sanitizeAuthRedirect(q.next, "/timeline");

  return (
    <div className="flex min-h-screen">
      <AuthLeftPanel mode="signup" />

      {/* Right — form panel */}
      <main className="flex flex-1 flex-col items-center justify-center px-8 py-12 lg:px-16">
        <div className="w-full max-w-[400px]">
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
