import type { Metadata } from "next";
import { MagicLinkAuthForm } from "@/components/auth/MagicLinkAuthForm";

export const metadata: Metadata = {
  title: "Sign up — HeroPortfolio.com",
  description:
    "Create a HeroPortfolio.com account. We verify your email with a magic link.",
};

export default function SignupPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-16 text-parchment">
      <div className="w-full max-w-md">
        <MagicLinkAuthForm mode="signup" />
      </div>
    </div>
  );
}
