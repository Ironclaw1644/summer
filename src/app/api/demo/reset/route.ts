import { NextRequest, NextResponse } from "next/server";

import {
  insertSummerRows,
  IS_DEMO,
  SCHEMA,
  selectSummerRows,
  summerRestRequest,
} from "@/lib/summer/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Tables the reset wipes + reseeds, ordered children-first so the delete pass is
// clean even if the demo clone ever carries foreign keys. These are the "live"
// CRM/activity tables a visitor mutates while exploring the admin — content
// tables (offers, classes, tiers, media, faq) are seeded once by demo-schema.sql.
const CLEAR_ORDER = [
  "inquiry_notes",
  "client_messages",
  "class_enrollments",
  "purchases",
  "subscriptions",
  "testimonials",
  "inquiries",
  "clients",
] as const;

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  // If no secret is configured, allow (demo-only endpoint, already gated on DEMO_MODE).
  if (!secret) return true;

  const auth = request.headers.get("authorization");
  if (auth === `Bearer ${secret}`) return true;

  const key = request.nextUrl.searchParams.get("key");
  return key === secret;
}

async function deleteAll(table: string) {
  // PostgREST refuses an unfiltered DELETE; `id=not.is.null` matches every row.
  await summerRestRequest({
    table,
    method: "DELETE",
    query: { id: "not.is.null" },
    schema: SCHEMA,
    keyKind: "service",
  });
}

async function runReset() {
  for (const table of CLEAR_ORDER) {
    // Best-effort: a table the app doesn't use in this project shouldn't fail the run.
    await deleteAll(table).catch(() => undefined);
  }

  // ── Clients (leads that converted) ─────────────────────────────────────────
  const clients =
    (await insertSummerRows<{ id: string; email: string }>("clients", [
      {
        email: "maya.torres@example.com",
        full_name: "Maya Torres",
        phone: "+1 (310) 555-0142",
        instagram_handle: "@maya.lifts",
        lifecycle_status: "client",
        notes: "Signed for Signature after two private sessions. Glute-focused goals.",
      },
      {
        email: "jordan.blake@example.com",
        full_name: "Jordan Blake",
        phone: "+1 (424) 555-0197",
        instagram_handle: "@jordanbuilds",
        lifecycle_status: "client",
        notes: "Inner Circle. Travels often — needs the minimal-equipment track.",
      },
      {
        email: "priya.nair@example.com",
        full_name: "Priya Nair",
        instagram_handle: "@priya.strong",
        lifecycle_status: "lead",
        notes: "Downloaded the Glute Sculpt Guide. Warm — follow up about coaching.",
      },
    ])) || [];

  // ── Inquiries (fresh inbound leads) ────────────────────────────────────────
  await insertSummerRows("inquiries", [
    {
      inquiry_type: "Private Training",
      full_name: "Alexis Cole",
      email: "alexis.cole@example.com",
      phone: "+1 (310) 555-0110",
      message: "Looking for 2x/week private sessions in Playa Del Rey. Heavy lower-body focus.",
      goals: "Build strength + glutes\n\nLocation / Time Zone: Playa Del Rey, PT",
      source: "public_site",
      status: "new",
    },
    {
      inquiry_type: "Online Coaching",
      full_name: "Devon Park",
      email: "devon.park@example.com",
      instagram_handle: "@devonp",
      message: "Remote lifter, intermediate. Want weekly programming + form checks.",
      goals: "Progressive overload, stay consistent while traveling",
      source: "public_site",
      status: "contacting",
    },
    {
      inquiry_type: "Brand / Campaign Booking",
      full_name: "Rowan Fitwear",
      email: "casting@rowanfitwear.example.com",
      message: "Spring campaign, 1-day shoot in LA. Strong on-camera athletic presence needed.",
      goals: "Editorial + campaign stills",
      source: "public_site",
      status: "qualified",
    },
    {
      inquiry_type: "Online Coaching",
      full_name: "Sam Rivera",
      email: "sam.rivera@example.com",
      message: "New to lifting, want a structured start with nutrition guidance.",
      goals: "Learn the lifts, build a routine",
      source: "public_site",
      status: "new",
    },
  ]);

  // ── Subscriptions (need real tier ids) ─────────────────────────────────────
  const tiers = await selectSummerRows<{ id: string; slug: string }>("subscription_tiers", {
    select: "id,slug",
  }).catch(() => [] as { id: string; slug: string }[]);
  const tierBySlug = (slug: string) => tiers.find((t) => t.slug === slug)?.id ?? null;
  const now = Date.now();
  const iso = (offsetDays: number) => new Date(now + offsetDays * 86_400_000).toISOString();

  if (clients.length) {
    await insertSummerRows("subscriptions", [
      {
        client_id: clients[0].id,
        tier_id: tierBySlug("signature-monthly"),
        status: "active",
        current_period_start: iso(-8),
        current_period_end: iso(22),
        cancel_at_period_end: false,
      },
      {
        client_id: clients[1]?.id ?? clients[0].id,
        tier_id: tierBySlug("inner-circle-monthly"),
        status: "active",
        current_period_start: iso(-3),
        current_period_end: iso(27),
        cancel_at_period_end: false,
      },
    ]).catch(() => undefined);

    // ── Purchases (need a product id; amount_cents is NOT NULL) ──────────────
    const products = await selectSummerRows<{ id: string; slug: string; price_cents: number }>(
      "digital_products",
      { select: "id,slug,price_cents" },
    ).catch(() => [] as { id: string; slug: string; price_cents: number }[]);
    const guide = products.find((p) => p.slug === "glute-sculpt-guide") ?? products[0];

    if (guide) {
      await insertSummerRows("purchases", [
        {
          client_id: clients[2]?.id ?? clients[0].id,
          product_id: guide.id,
          amount_cents: guide.price_cents ?? 4900,
          currency: "usd",
          status: "completed",
        },
      ]).catch(() => undefined);
    }
  }

  // ── Testimonials (client words on the public site) ─────────────────────────
  await insertSummerRows("testimonials", [
    {
      name: "Maya T.",
      location: "Manhattan Beach, CA",
      quote:
        "Summer's programming finally made heavy lifting click for me. Strongest and most confident I've ever felt.",
      rating: 5,
      is_visible: true,
      is_featured: true,
      sort_order: 10,
    },
    {
      name: "Jordan B.",
      location: "Los Angeles, CA",
      quote:
        "The weekly check-ins keep me honest even when I'm traveling. It's the closest thing to having her in the gym with me.",
      rating: 5,
      is_visible: true,
      is_featured: false,
      sort_order: 20,
    },
    {
      name: "Priya N.",
      location: "Santa Monica, CA",
      quote:
        "Clear, specific, and never generic. The glute guide alone was worth it — the coaching took it further.",
      rating: 5,
      is_visible: true,
      is_featured: false,
      sort_order: 30,
    },
  ]).catch(() => undefined);

  return {
    ok: true,
    schema: SCHEMA,
    reset_at: new Date().toISOString(),
    seeded: {
      clients: clients.length,
      inquiries: 4,
      subscriptions: clients.length ? 2 : 0,
      testimonials: 3,
    },
  };
}

async function handle(request: NextRequest) {
  // The endpoint does not exist outside demo builds.
  if (!IS_DEMO) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const result = await runReset();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Reset failed." },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  return handle(request);
}

export async function POST(request: NextRequest) {
  return handle(request);
}
