import { NextRequest, NextResponse } from "next/server";
import { getProfile } from "@/lib/db/portfolio";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { stripe, getStripeProPriceId } from "@/lib/stripe";

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

  const body = (await req.json()) as { interval?: "month" | "year" };
  const interval = body.interval === "year" ? "year" : "month";
  const priceId = getStripeProPriceId(interval);

  if (!priceId) {
    return NextResponse.json(
      { error: "Stripe price IDs not configured." },
      { status: 503 },
    );
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

    // Store customer ID on profile
    await supabase
      .from("profiles")
      .upsert({ id: user.id, stripe_customer_id: customerId });
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    mode: "subscription",
    success_url: `${origin}/timeline?upgraded=1`,
    cancel_url: `${origin}/pricing?cancelled=1`,
    metadata: { supabase_user_id: user.id },
    subscription_data: {
      metadata: { supabase_user_id: user.id },
    },
    allow_promotion_codes: true,
  });

  return NextResponse.json({ url: session.url });
}
