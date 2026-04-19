"use client";

import { useEffect, useState } from "react";
import { PortfolioShell } from "@/components/PortfolioShell";
import type { SiteIntro, YearBlock } from "@/data/timeline";
import { displayNameFromUser } from "@/lib/auth/displayName";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type Props = {
  profileUserId: string;
  serverTimeline: YearBlock[];
  genericIntro: SiteIntro;
  isPro?: boolean;
};

export function PublicPortfolioClient({
  profileUserId,
  serverTimeline,
  genericIntro,
  isPro = false,
}: Props) {
  const [intro, setIntro] = useState<SiteIntro>(genericIntro);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    if (!supabase) return;
    void supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user || user.id !== profileUserId) return;
      const name = displayNameFromUser(user);
      setIntro({
        ...genericIntro,
        name,
        heroLead: "I'm",
        role: "Student · Shared portfolio",
        bio: "You’re viewing your public link. Others see this same timeline. Personalize it from your private editor. Publish updates when you’re ready.",
        photoAlt: name,
      });
    });
  }, [profileUserId, genericIntro]);

  return (
    <PortfolioShell
      timeline={serverTimeline}
      siteIntro={intro}
      publicView
      plan={isPro ? "pro" : "free"}
    />
  );
}
