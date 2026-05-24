import { FREE_AI_USES_PER_MONTH, FREE_PORTFOLIO_LIMIT } from "@/lib/constants";
import type { Plan } from "@/types/database";

export const PLAN_LIMITS = {
  free: {
    eventsPerYear: 12,
    imagesPerEvent: 1,
    totalStorageMb: 500,
    aiUsesPerMonth: FREE_AI_USES_PER_MONTH,
    pdfExport: false,
    csvExport: false,
    analytics: false,
    albumUnlimited: false,
    eventAudioUpload: false,
    maxChildProfiles: FREE_PORTFOLIO_LIMIT,
    maxPortfolioProfiles: FREE_PORTFOLIO_LIMIT,
  },
  pro: {
    eventsPerYear: Infinity,
    imagesPerEvent: Infinity,
    totalStorageMb: 10 * 1024,
    aiUsesPerMonth: Infinity,
    pdfExport: true,
    csvExport: true,
    analytics: true,
    albumUnlimited: true,
    eventAudioUpload: true,
    maxChildProfiles: Infinity,
    maxPortfolioProfiles: Infinity,
  },
} as const;

export type PlanFeature = keyof (typeof PLAN_LIMITS)["pro"];

export function canAccess(plan: Plan, feature: PlanFeature): boolean {
  const limits = PLAN_LIMITS[plan];
  const value = limits[feature];
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value > 0;
  return false;
}

export function getLimit(
  plan: Plan,
  feature: "eventsPerYear" | "imagesPerEvent" | "aiUsesPerMonth" | "maxChildProfiles" | "maxPortfolioProfiles",
): number {
  if (feature === "maxPortfolioProfiles") {
    return PLAN_LIMITS[plan].maxPortfolioProfiles as number;
  }
  return PLAN_LIMITS[plan][feature] as number;
}
