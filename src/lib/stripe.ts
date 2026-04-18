import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error(
        "Missing STRIPE_SECRET_KEY environment variable. Add it to your .env.local file.",
      );
    }
    _stripe = new Stripe(key, { apiVersion: "2026-03-25.dahlia" });
  }
  return _stripe;
}

/** Convenience alias — same as getStripe() */
export const stripe = {
  get customers() { return getStripe().customers; },
  get checkout() { return getStripe().checkout; },
  get billingPortal() { return getStripe().billingPortal; },
  get webhooks() { return getStripe().webhooks; },
  get subscriptions() { return getStripe().subscriptions; },
};

export function getStripeProPriceId(interval: "month" | "year"): string {
  if (interval === "year") {
    return process.env.STRIPE_PRO_ANNUAL_PRICE_ID ?? "";
  }
  return process.env.STRIPE_PRO_MONTHLY_PRICE_ID ?? "";
}
