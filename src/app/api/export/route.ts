import { NextRequest, NextResponse } from "next/server";
import { getUserPlan, getUserTimeline, getProfile } from "@/lib/db/portfolio";
import { canAccess } from "@/lib/planGate";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { YearBlock } from "@/data/timeline";

export async function GET(req: NextRequest) {
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

  const format =
    (req.nextUrl.searchParams.get("format") as "json" | "csv" | "pdf") ??
    "json";

  const plan = await getUserPlan(supabase, user.id);

  if (format === "pdf" && !canAccess(plan, "pdfExport")) {
    return NextResponse.json(
      { error: "PDF export is a Pro feature. Upgrade to unlock it." },
      { status: 403 },
    );
  }

  if (format === "csv" && !canAccess(plan, "csvExport")) {
    return NextResponse.json(
      { error: "CSV export is a Pro feature. Upgrade to unlock it." },
      { status: 403 },
    );
  }

  const [timeline, profile] = await Promise.all([
    getUserTimeline(supabase, user.id),
    getProfile(supabase, user.id),
  ]);

  const name = profile?.display_name ?? "Student";

  if (format === "json") {
    return exportJson(timeline, name);
  }
  if (format === "csv") {
    return exportCsv(timeline, name);
  }
  if (format === "pdf") {
    try {
      return await exportPdf(timeline, name);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "PDF generation failed";
      console.error("PDF export error:", msg);
      return NextResponse.json({ error: msg }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "Unknown format" }, { status: 400 });
}

// ─── JSON ──────────────────────────────────────────────────────────────────

function exportJson(timeline: YearBlock[], name: string): NextResponse {
  const payload = {
    exportedAt: new Date().toISOString(),
    name,
    years: timeline.map((block) => ({
      year: block.year,
      tagline: block.tagline,
      events: block.achievements.map((a) => ({
        id: a.id,
        heading1: a.title,
        heading2: a.heading2,
        body: a.body ?? a.description,
        categories: a.categories,
        images: a.images ?? (a.imageSrc ? [a.imageSrc] : undefined),
        videoUrl: a.videoUrl,
        musicUrl: a.musicUrl,
        links: a.links,
      })),
    })),
  };

  return new NextResponse(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="heroportfolio-${slugify(name)}.json"`,
    },
  });
}

// ─── CSV ───────────────────────────────────────────────────────────────────

function exportCsv(timeline: YearBlock[], name: string): NextResponse {
  const rows: string[][] = [
    ["Year", "Title", "Subtitle", "Categories", "Description", "Video URL", "Links"],
  ];

  for (const block of timeline) {
    for (const a of block.achievements) {
      rows.push([
        String(block.year),
        a.title,
        a.heading2 ?? "",
        (a.categories ?? []).join("; "),
        (a.body ?? a.description).replace(/\n/g, " "),
        a.videoUrl ?? "",
        (a.links ?? []).map((l) => `${l.label}: ${l.href}`).join("; "),
      ]);
    }
  }

  const csv = rows
    .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","))
    .join("\r\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="heroportfolio-${slugify(name)}.csv"`,
    },
  });
}

// ─── PDF ───────────────────────────────────────────────────────────────────

function pdfSafeText(value: string | null | undefined, maxLen = 8000): string {
  const s = String(value ?? "").replace(/\0/g, "");
  if (s.length <= maxLen) return s;
  return `${s.slice(0, maxLen)}…`;
}

async function exportPdf(timeline: YearBlock[], name: string): Promise<NextResponse> {
  // Dynamically import @react-pdf/renderer to avoid including it in the main bundle.
  // Use named `renderToBuffer` — the package default export does NOT include it (v4.5.x).
  const { renderToBuffer, Document, Page, Text, View, StyleSheet } =
    await import("@react-pdf/renderer");

  const styles = StyleSheet.create({
    page: {
      fontFamily: "Helvetica",
      fontSize: 11,
      padding: 48,
      backgroundColor: "#0f0e17",
      color: "#f0ebe0",
    },
    cover: {
      flex: 1,
      justifyContent: "center",
    },
    coverName: {
      fontSize: 32,
      fontFamily: "Helvetica-Bold",
      marginBottom: 8,
      color: "#f0ebe0",
    },
    coverSub: {
      fontSize: 14,
      color: "#c9b99a",
      marginBottom: 4,
    },
    coverDate: {
      fontSize: 10,
      color: "#7a6e60",
      marginTop: 16,
    },
    yearHeader: {
      fontSize: 20,
      fontFamily: "Helvetica-Bold",
      marginBottom: 4,
      marginTop: 24,
      color: "#c9b99a",
      borderBottomWidth: 1,
      borderBottomColor: "#2a2930",
      paddingBottom: 6,
    },
    yearTagline: {
      fontSize: 10,
      color: "#7a6e60",
      marginBottom: 14,
      fontStyle: "italic",
    },
    eventCard: {
      marginBottom: 16,
      padding: 14,
      backgroundColor: "#1a1825",
      borderRadius: 8,
      borderLeftWidth: 3,
      borderLeftColor: "#a0845c",
    },
    eventTitle: {
      fontSize: 13,
      fontFamily: "Helvetica-Bold",
      color: "#f0ebe0",
      marginBottom: 2,
    },
    eventSubtitle: {
      fontSize: 10,
      color: "#c9b99a",
      marginBottom: 6,
    },
    eventBody: {
      fontSize: 10,
      color: "#b0a898",
      lineHeight: 1.6,
    },
    eventCategories: {
      fontSize: 9,
      color: "#7a6e60",
      marginTop: 6,
    },
    footer: {
      position: "absolute",
      bottom: 24,
      left: 48,
      right: 48,
      fontSize: 8,
      color: "#7a6e60",
      textAlign: "center",
    },
  });

  // Build React element tree
  const { createElement: e } = await import("react");

  const docElement = e(Document, {
    title: `${name}: Achievement Portfolio`,
    author: "HeroPortfolio.com",
  },
    // Cover page
    e(Page, { size: "A4", style: styles.page },
      e(View, { style: styles.cover },
        e(Text, { style: styles.coverName }, pdfSafeText(name, 200)),
        e(Text, { style: styles.coverSub }, "Achievement Portfolio"),
        e(Text, { style: styles.coverDate },
          pdfSafeText(
            `Exported ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })} · HeroPortfolio.com`,
            500,
          ),
        ),
      ),
      e(Text, { style: styles.footer }, "Generated by HeroPortfolio.com"),
    ),
    // Year pages
    ...timeline.map((block) =>
      e(Page, { key: block.year, size: "A4", style: styles.page },
        e(Text, { style: styles.yearHeader }, String(block.year)),
        e(Text, { style: styles.yearTagline }, pdfSafeText(block.tagline)),
        ...block.achievements.map((a) =>
          e(View, { key: a.id, style: styles.eventCard },
            e(Text, { style: styles.eventTitle }, pdfSafeText(a.title)),
            a.heading2
              ? e(Text, { style: styles.eventSubtitle }, pdfSafeText(a.heading2))
              : null,
            a.body ?? a.description
              ? e(Text, { style: styles.eventBody }, pdfSafeText(a.body ?? a.description))
              : null,
            a.categories?.length
              ? e(Text, { style: styles.eventCategories },
                  pdfSafeText(a.categories.map((c) => c.toUpperCase()).join("  ·  ")),
                )
              : null,
          )
        ),
        e(Text, { style: styles.footer }, pdfSafeText(`${name} · HeroPortfolio.com`, 500)),
      )
    ),
  );

  const pdfBuffer = await renderToBuffer(docElement);
  // Convert Node Buffer → Uint8Array so NextResponse accepts it
  const uint8 = new Uint8Array(pdfBuffer);

  return new NextResponse(uint8, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="heroportfolio-${slugify(name)}.pdf"`,
    },
  });
}

function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
