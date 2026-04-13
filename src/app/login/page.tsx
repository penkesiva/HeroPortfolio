import type { Metadata } from "next";
import { MagicLinkAuthForm } from "@/components/auth/MagicLinkAuthForm";

export const metadata: Metadata = {
  title: "Log in — HeroPortfolio.com",
  description: "Log in to HeroPortfolio.com with a secure email magic link.",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-16 text-parchment">
      <div className="w-full max-w-md">
        <MagicLinkAuthForm mode="login" />
      </div>
    </div>
  );
}
