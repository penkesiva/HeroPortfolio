import { NextRequest, NextResponse } from "next/server";
import { getChildProfiles, getProfile } from "@/lib/db/portfolio";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { stripe, getStripeProPriceId, getStripeParentProPriceId } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as { interval?: "month" | "year"; tier?: "pro" | "parent_pro" };
  const interval = body.interval === "year" ? "year" : "month";
  const isParentPro = body.tier === "parent_pro";

  const priceId = isParentPro
    ? getStripeParentProPriceId(interval)
    : getStripeProPriceId(interval);

  if (!priceId) {
    return NextResponse.json(
      { error: "Stripe price IDs not configured." },
      { status: 503 },
    );
  }

  // For Parent Pro, quantity = current number of children (min 1 so Stripe doesn't reject)
  let quantity = 1;
  if (isParentPro) {
    const children = await getChildProfiles(supabase, user.id);
    quantity = Math.max(children.length, 1);
  }

  const profile = await getProfile(supabase, user.id);
  const origin = req.headers.get("origin") ?? process.env.NEXT_PUBLIC_APP_URL ?? "";

  // Retrieve or create Stripe customer
  let customerId = profile?.stripe_customer_id ?? undefined;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email ?? undefined,
      metadata: { supabase_user_id: user.id },
    });
    customerId = customer.id;
    await supabase
      .from("profiles")
      .upsert({ id: user.id, stripe_customer_id: customerId });
  }

  const successPath = isParentPro ? "/portfolios?upgraded=1" : "/timeline?upgraded=1";

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity }],
    mode: "subscription",
    success_url: `${origin}${successPath}`,
    cancel_url: `${origin}/pricing?cancelled=1`,
    metadata: { supabase_user_id: user.id },
    subscription_data: {
      metadata: { supabase_user_id: user.id },
    },
    allow_promotion_codes: true,
  });

  return NextResponse.json({ url: session.url });
}
