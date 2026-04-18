import type { Plan } from "@/types/database";

export const PLAN_LIMITS = {
  free: {
    eventsPerYear: 12,
    imagesPerEvent: 3,
    totalStorageMb: 500,
    aiUsesPerMonth: 3,
    pdfExport: false,
    csvExport: false,
    analytics: false,
    albumUnlimited: false,
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

export function getLimit(plan: Plan, feature: "eventsPerYear" | "imagesPerEvent" | "aiUsesPerMonth"): number {
  return PLAN_LIMITS[plan][feature] as number;
}
