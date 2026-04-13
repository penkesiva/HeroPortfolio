import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/AuthForm";
import { sanitizeAuthRedirect } from "@/lib/auth/redirect";

export const metadata: Metadata = {
  title: "Log in — HeroPortfolio.com",
  description:
    "Log in to HeroPortfolio.com with Google, email and password, or a magic link.",
};

type Props = { searchParams: Promise<{ next?: string }> };

export default async function LoginPage({ searchParams }: Props) {
  const q = await searchParams;
  const next = sanitizeAuthRedirect(q.next, "/timeline");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-16 text-parchment">
      <div className="w-full max-w-md">
        <AuthForm mode="login" redirectAfterAuth={next} />
      </div>
    </div>
  );
}
