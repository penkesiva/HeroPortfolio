import type { Metadata } from "next";
import { PortfolioShell } from "@/components/PortfolioShell";
import { mergeTimelineWithPublicContent } from "@/lib/loadYearEvents";
import { siteIntro, timeline } from "@/data/timeline";

export const metadata: Metadata = {
  title: "Portfolio",
  description:
    "Year-by-year achievements and timeline. Sign in at HeroPortfolio.com for future account features.",
};

export default function Home() {
  const mergedTimeline = mergeTimelineWithPublicContent(timeline);
  return (
    <PortfolioShell timeline={mergedTimeline} siteIntro={siteIntro} />
  );
}
