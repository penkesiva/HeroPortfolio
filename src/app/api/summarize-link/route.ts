import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";
import OpenAI from "openai";
import { checkAndIncrementAiUsage, getUserPlan } from "@/lib/db/portfolio";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function getOpenAI(): OpenAI {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not set.");
  }
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export async function POST(req: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "AI summarization is not configured on this server." },
      { status: 503 },
    );
  }

  // Auth check
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Parse body
  let url: string;
  try {
    const body = (await req.json()) as { url?: unknown };
    if (typeof body.url !== "string" || !body.url.startsWith("http")) {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }
    url = body.url;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // Plan + usage check
  const plan = await getUserPlan(supabase, user.id);
  const { allowed, remaining } = await checkAndIncrementAiUsage(
    supabase,
    user.id,
    plan,
  );

  if (!allowed) {
    return NextResponse.json(
      {
        error:
          plan === "free"
            ? "You've used your 2 free AI summaries this month. Upgrade to Pro for unlimited access."
            : "AI usage limit reached.",
        upgradeRequired: plan === "free",
      },
      { status: 429 },
    );
  }

  // Fetch and parse the URL
  let rawText = "";
  let pageTitle = "";
  let metaDescription = "";

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; HeroPortfolio/1.0; +https://heroportfolio.com)",
      },
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Could not fetch that URL (${response.status}).` },
        { status: 422 },
      );
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    pageTitle = $("title").first().text().trim();
    metaDescription =
      $('meta[name="description"]').attr("content")?.trim() ??
      $('meta[property="og:description"]').attr("content")?.trim() ??
      "";

    // Extract readable body text — prefer article/main, fallback to body
    const body =
      $("article").text() ||
      $("main").text() ||
      $('[role="main"]').text() ||
      $("body").text();

    rawText = body
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 4000); // keep within token budget
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to fetch page: ${msg}` },
      { status: 422 },
    );
  }

  // Call OpenAI
  try {
    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You help students (ages 8-18) log their achievements on HeroPortfolio. " +
            "Given an article or webpage, extract the achievement and write 3 fields: " +
            "heading1 (a short, exciting title for the achievement, max 10 words), " +
            "heading2 (a subtitle with context like role or event, max 12 words), " +
            "body (2-3 sentences describing what happened, written in first person, suitable for a child's portfolio). " +
            "Return ONLY valid JSON: {\"heading1\": \"\", \"heading2\": \"\", \"body\": \"\"}",
        },
        {
          role: "user",
          content: [
            `Page title: ${pageTitle}`,
            `Meta description: ${metaDescription}`,
            `Page content: ${rawText}`,
          ].join("\n\n"),
        },
      ],
      max_tokens: 300,
      temperature: 0.5,
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw) as {
      heading1?: string;
      heading2?: string;
      body?: string;
    };

    return NextResponse.json({
      heading1: parsed.heading1 ?? pageTitle,
      heading2: parsed.heading2 ?? "",
      body: parsed.body ?? metaDescription,
      aiUsesRemaining: remaining,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "AI error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
