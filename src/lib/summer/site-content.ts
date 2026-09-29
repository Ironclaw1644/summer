import "server-only";

import {
  aboutImages,
  aboutPoints,
  galleryItems as defaultGalleryItems,
  heroSlides as defaultHeroSlides,
  offers as defaultOffers,
  trainingCards,
} from "@/components/summer/site-data";
import { DEMO_CONTACT_EMAIL, DEMO_INSTAGRAM_URL } from "@/lib/summer/demo-contact";
import {
  hasSummerSupabaseAdminConfig,
  IS_DEMO,
  selectSummerRows,
  selectSummerSingle,
} from "@/lib/summer/supabase";
import type {
  SummerClass,
  SummerDigitalProduct,
  SummerFaqItem,
  SummerGalleryItem,
  SummerHeroItem,
  SummerMediaAsset,
  SummerOfferRecord,
  SummerSectionContent,
  SummerSiteSettings,
  SummerSubscriptionTier,
  SummerTestimonial,
} from "@/lib/summer/types";

export type SummerPublicSection = {
  eyebrow: string;
  heading: string;
  subheading: string;
  body: Record<string, unknown>;
  meta: Record<string, unknown>;
  isVisible: boolean;
};

export type SummerPublicSnapshot = {
  siteTitle: string;
  heroHeading: string;
  heroSubheading: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
  trainingCtaText: string;
  bookingCtaText: string;
  contactEmail: string | null;
  instagramUrl: string | null;
  heroSlides: typeof defaultHeroSlides;
  about: {
    section: SummerPublicSection;
    images: typeof aboutImages;
    points: string[];
  };
  offersIntro: SummerPublicSection;
  offers: Array<{
    id?: string;
    title: string;
    subtitle?: string | null;
    description: string;
    detail: string;
    cta: string;
    href?: string | null;
    badge?: string | null;
    featured?: boolean;
    visible?: boolean;
    bullets?: string[];
  }>;
  trainWithMe: {
    section: SummerPublicSection;
    leadCard: string;
    pillars: string[];
    cards: typeof trainingCards;
  };
  signature: SummerPublicSection;
  classesIntro: SummerPublicSection;
  plansIntro: SummerPublicSection;
  testimonialsIntro: SummerPublicSection;
  faqIntro: SummerPublicSection;
  galleryIntro: SummerPublicSection;
  galleryItems: typeof defaultGalleryItems;
  contact: SummerPublicSection;
  tiers: SummerSubscriptionTier[];
  digitalProducts: SummerDigitalProduct[];
  testimonials: (SummerTestimonial & { beforeUrl?: string | null; afterUrl?: string | null })[];
  faqItems: SummerFaqItem[];
  classes: (SummerClass & { coverUrl?: string | null })[];
};

const DEFAULT_TIERS: SummerSubscriptionTier[] = [
  {
    id: "tier-essentials",
    slug: "essentials-monthly",
    title: "Essentials",
    subtitle: "Start moving with Summer",
    description:
      "On-demand library access with new classes added monthly. A confident entry point for clients who want to train with Summer on their own schedule.",
    price_cents: 2900,
    interval: "month",
    stripe_price_id: null,
    features: [
      "Full on-demand class library",
      "2 new classes added monthly",
      "Warm-ups, mobility, strength basics",
      "Private community access",
      "Cancel anytime",
    ],
    access_level: 1,
    badge: null,
    is_featured: false,
    is_visible: true,
    sort_order: 10,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "tier-signature",
    slug: "signature-monthly",
    title: "Signature",
    subtitle: "The full program",
    description:
      "Everything in Essentials plus weekly live classes and a rotating four-week strength program. Built for clients committed to consistent results.",
    price_cents: 7900,
    interval: "month",
    stripe_price_id: null,
    features: [
      "Everything in Essentials",
      "Weekly live classes with Summer",
      "Monthly glute-focused program",
      "Seasonal nutrition guide drops",
      "10% off private sessions",
      "Priority class booking",
    ],
    access_level: 2,
    badge: "Most Popular",
    is_featured: true,
    is_visible: true,
    sort_order: 20,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "tier-inner-circle",
    slug: "inner-circle-monthly",
    title: "Inner Circle",
    subtitle: "Close coaching without the in-person",
    description:
      "Everything in Signature plus direct messaging with Summer, a monthly 1:1 video check-in, and your programming tuned to you. The closest thing to private training without being in LA.",
    price_cents: 14900,
    interval: "month",
    stripe_price_id: null,
    features: [
      "Everything in Signature",
      "Monthly 1:1 video check-in with Summer",
      "DM access for form and mindset",
      "Programming tuned to your week",
      "Custom macros + meal guidance",
      "Guest pass for a friend each quarter",
    ],
    access_level: 3,
    badge: "Limited Seats",
    is_featured: false,
    is_visible: true,
    sort_order: 30,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const DEFAULT_PRODUCTS: SummerDigitalProduct[] = [
  {
    id: "product-glute",
    slug: "glute-sculpt-guide",
    kind: "guide",
    title: "Glute Sculpt Guide",
    subtitle: "The heavy-lifting foundation.",
    description:
      "Summer's signature glute program in a printable PDF. Six weeks of progressive strength work built around the lifts she uses with her private clients.",
    price_cents: 4900,
    stripe_price_id: null,
    cover_media_id: null,
    file_url: null,
    page_count: 52,
    preview_url: null,
    includes: [
      "6-week progressive strength program",
      "Heavy lifting foundations + form cues",
      "Glute-focused accessory library",
      "Warm-up + deload protocol",
      "Printable tracking sheets",
    ],
    is_featured: true,
    is_visible: true,
    sort_order: 10,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "product-nutrition",
    slug: "nutrition-starter-plan",
    kind: "guide",
    title: "Nutrition Starter Plan",
    subtitle: "Eat for the body you're building.",
    description:
      "A realistic nutrition framework with macro guidance, grocery lists, and meal structures that fit a busy LA schedule. Not a diet — a way of eating you can keep.",
    price_cents: 3900,
    stripe_price_id: null,
    cover_media_id: null,
    file_url: null,
    page_count: 38,
    preview_url: null,
    includes: [
      "Macro + calorie starting points",
      "Grocery list you can actually use",
      "Breakfast, lunch, dinner frameworks",
      "Dining-out cheat sheet",
      "Hydration + supplement notes",
    ],
    is_featured: false,
    is_visible: true,
    sort_order: 20,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "product-reset",
    slug: "7-day-reset-meal-plan",
    kind: "meal_plan",
    title: "7-Day Reset Meal Plan",
    subtitle: "A clean restart, done right.",
    description:
      "A one-week meal plan built to get you back on rhythm without feeling punished. Real food, precise portions, minimal prep, designed for women training hard.",
    price_cents: 2900,
    stripe_price_id: null,
    cover_media_id: null,
    file_url: null,
    page_count: 22,
    preview_url: null,
    includes: [
      "7 days of breakfast, lunch, dinner",
      "Aligned with heavy-lifting training days",
      "Prep-ahead shopping list",
      "Snack + travel swaps",
      "Reset over, now what — next-step guide",
    ],
    is_featured: false,
    is_visible: true,
    sort_order: 30,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const DEFAULT_TESTIMONIALS: (SummerTestimonial & { beforeUrl?: string | null; afterUrl?: string | null })[] = [
  {
    id: "t-1",
    client_id: null,
    name: "J. Winters",
    location: "Manhattan Beach",
    quote:
      "Three months in and I finally trust my own strength. Summer made me slow the lifts down until they felt right — then the progress actually stuck.",
    rating: 5,
    before_media_id: null,
    after_media_id: null,
    is_featured: true,
    is_visible: true,
    sort_order: 10,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    beforeUrl: null,
    afterUrl: "/images/summer/refined/summer-partner-train-portrait.png",
  },
  {
    id: "t-2",
    client_id: null,
    name: "Amelia R.",
    location: "Playa Del Rey",
    quote:
      "The glute guide is exactly what I needed — specific lifts, honest progressions, no fluff. I use it every single week.",
    rating: 5,
    before_media_id: null,
    after_media_id: null,
    is_featured: false,
    is_visible: true,
    sort_order: 20,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    beforeUrl: null,
    afterUrl: null,
  },
  {
    id: "t-3",
    client_id: null,
    name: "Marina H.",
    location: "Venice",
    quote:
      "I came in skeptical about online coaching. Summer reviews my lifts like she's in the room with me. It's the first program I've actually kept.",
    rating: 5,
    before_media_id: null,
    after_media_id: null,
    is_featured: false,
    is_visible: true,
    sort_order: 30,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    beforeUrl: null,
    afterUrl: null,
  },
];

const DEFAULT_FAQ: SummerFaqItem[] = [
  {
    id: "faq-1",
    topic: "General",
    question: "Where in LA does Summer train clients in person?",
    answer:
      "Private training is based in Playa Del Rey with clients across Manhattan Beach, Venice, Santa Monica, Marina Del Rey, and El Segundo. On-site bookings elsewhere are considered case by case.",
    sort_order: 10,
    is_visible: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "faq-2",
    topic: "General",
    question: "What's the difference between online coaching and the subscription?",
    answer:
      "Subscriptions give you access to the class library and group programming. Online coaching is 1:1 — Summer builds your program, reviews your form, and adjusts every week. The Inner Circle tier sits in between.",
    sort_order: 20,
    is_visible: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "faq-3",
    topic: "Training",
    question: "Do I need a gym with full equipment?",
    answer:
      "A commercial gym or equivalent home setup (barbell, plates, bench, cable tower) gets you every class and program. A minimal-equipment track is available in the library for travel weeks.",
    sort_order: 30,
    is_visible: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "faq-4",
    topic: "Billing",
    question: "Can I cancel a subscription anytime?",
    answer:
      "Yes. Subscriptions cancel at the end of the current billing period — you keep full access until then. Manage it from your client dashboard or email hello@summerloffler-demo.com.",
    sort_order: 40,
    is_visible: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "faq-5",
    topic: "Brand",
    question: "Is Summer available for editorial or brand campaigns?",
    answer:
      "Yes — selectively. Use the inquiry form and mark 'Brand / Campaign Booking' so it routes correctly. Response within one business day.",
    sort_order: 50,
    is_visible: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const DEFAULT_CLASSES: (SummerClass & { coverUrl?: string | null })[] = [
  {
    id: "class-1",
    slug: "heavy-lift-foundation",
    title: "Heavy Lift Foundation",
    summary: "The cues Summer starts every lifter with — bracing, foot pressure, bar path.",
    body: null,
    cover_media_id: null,
    video_url: null,
    duration_minutes: 42,
    difficulty: "Foundational",
    category: "Strength",
    access_level_min: 1,
    is_featured: true,
    is_visible: true,
    sort_order: 10,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    coverUrl: "/images/summer/refined/summer-hero-action-desktop.png",
  },
  {
    id: "class-2",
    slug: "glute-focus-block",
    title: "Glute Focus Block",
    summary: "Hip-dominant lifts and accessory work with the precision Summer uses in private sessions.",
    body: null,
    cover_media_id: null,
    video_url: null,
    duration_minutes: 48,
    difficulty: "Intermediate",
    category: "Glutes",
    access_level_min: 1,
    is_featured: true,
    is_visible: true,
    sort_order: 20,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    coverUrl: "/images/summer/refined/summer-splits-venice-feature.png",
  },
  {
    id: "class-3",
    slug: "mobility-reset",
    title: "Mobility Reset",
    summary: "A 30-minute session you can run between hard lifts — hips, spine, shoulders.",
    body: null,
    cover_media_id: null,
    video_url: null,
    duration_minutes: 28,
    difficulty: "All levels",
    category: "Mobility",
    access_level_min: 1,
    is_featured: false,
    is_visible: true,
    sort_order: 30,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    coverUrl: "/images/summer/refined/summer-mat-portrait-about.png",
  },
  {
    id: "class-4",
    slug: "venice-outdoor-strength",
    title: "Venice Outdoor Strength",
    summary: "Rings, bars, bodyweight work shot on the boardwalk — bring the beach into your program.",
    body: null,
    cover_media_id: null,
    video_url: null,
    duration_minutes: 36,
    difficulty: "Intermediate",
    category: "Calisthenics",
    access_level_min: 2,
    is_featured: true,
    is_visible: true,
    sort_order: 40,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    coverUrl: "/images/summer/refined/summer-rings-venice-card.png",
  },
  {
    id: "class-5",
    slug: "partner-training-primer",
    title: "Partner Training Primer",
    summary: "A class you can run with a training partner — built on synced tempo and honest accountability.",
    body: null,
    cover_media_id: null,
    video_url: null,
    duration_minutes: 38,
    difficulty: "All levels",
    category: "Community",
    access_level_min: 2,
    is_featured: false,
    is_visible: true,
    sort_order: 50,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    coverUrl: "/images/summer/refined/summer-partner-train-portrait.png",
  },
  {
    id: "class-6",
    slug: "inner-circle-check-in",
    title: "Inner Circle Check-In",
    summary: "A monthly live call for Inner Circle members — form review, goal recalibration, Q&A.",
    body: null,
    cover_media_id: null,
    video_url: null,
    duration_minutes: 60,
    difficulty: "All levels",
    category: "Live",
    access_level_min: 3,
    is_featured: true,
    is_visible: true,
    sort_order: 60,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    coverUrl: null,
  },
];

const DEFAULT_SECTIONS: Record<string, SummerPublicSection> = {
  about: {
    eyebrow: "About Summer Loffler",
    heading: "Grounded by hardship. Guided by discipline.",
    subheading:
      "Private training and coaching in Los Angeles, shaped by Atlanta roots, lived experience, and a clear respect for what real strength requires.",
    body: {
      paragraphs: [
        "Summer Loffler grew up in Atlanta before moving to Los Angeles, carrying with her a deep respect for resilience, discipline, and self-possession.",
        "Loss and hardship changed the way she saw herself and the world around her. Fitness became a form of grounding — not an escape, but a way to rebuild strength from the inside out.",
        "That experience shaped the way she coaches today. Her work blends private training, online coaching, strength training, glute-focused programming, and nutrition guidance with close attention to the person in front of her.",
        "Her mission is simple: help people become stronger physically and mentally, and carry that strength into every part of their lives.",
      ],
      points: aboutPoints,
    },
    meta: {},
    isVisible: true,
  },
  offers_intro: {
    eyebrow: "Ways to Work Together",
    heading: "Ways to Work Together",
    subheading:
      "Each service is built around focused attention, clear structure, and real results — whether you're training in person, working remotely, or booking for a campaign.",
    body: {},
    meta: {},
    isVisible: true,
  },
  train_with_me: {
    eyebrow: "Private Training / Online Coaching",
    heading: "A small coaching practice. In the room, or in your phone.",
    subheading:
      "A handful of private clients in LA. A smaller online roster. Same eye on every lift, same answer to every check-in.",
    body: {
      pillars: [
        "Squat, hinge, press — coached rep by rep, with the cue you need that day.",
        "Posterior-chain work programmed to move the lift, not pad the hour.",
        "Nutrition that survives a real week — protein, training-day calories, honest check-ins.",
      ],
      lead_card:
        "Most programs are loud. The ones that work are patient — heavy lifts, watched closely, repeated until the form is yours.",
    },
    meta: {},
    isVisible: true,
  },
  signature: {
    eyebrow: "Mindset",
    heading: "The body is capable. The mind decides.",
    subheading: "Real change starts in the mind. The body follows.",
    body: {},
    meta: {},
    isVisible: true,
  },
  classes_intro: {
    eyebrow: "Online Classes",
    heading: "Train with Summer, wherever you are.",
    subheading:
      "A library built around heavy lifting, glute-focused work, and finishers shot in clean, full frame. New classes every week.",
    body: {
      supporting:
        "Every class is shot clean and in full frame so you can see exactly what the lift should look like — no loud music, no filler.",
    },
    meta: {},
    isVisible: true,
  },
  plans_intro: {
    eyebrow: "Guides & Meal Plans",
    heading: "The guides Summer built for her own clients.",
    subheading:
      "Printable, specific, and priced to actually try. Start with a guide, bring it to a private session, or layer it under a subscription.",
    body: {},
    meta: {},
    isVisible: true,
  },
  testimonials_intro: {
    eyebrow: "Client Words",
    heading: "Results people actually felt.",
    subheading:
      "Short notes from clients who started with Summer. We keep these quiet and specific — the way she coaches.",
    body: {},
    meta: {},
    isVisible: true,
  },
  faq_intro: {
    eyebrow: "Questions",
    heading: "What you'll probably ask.",
    subheading: "The most common questions we get about training, subscriptions, and how to start.",
    body: {},
    meta: {},
    isVisible: true,
  },
  gallery_intro: {
    eyebrow: "Gallery / Portfolio",
    heading: "The work, in a few frames.",
    subheading: "Mostly mid-set. A few are still.",
    body: {},
    meta: {},
    isVisible: true,
  },
  contact_cta: {
    eyebrow: "Contact / Inquiry",
    heading: "Start the conversation.",
    subheading:
      "Share a few details about what you're looking for, and Summer will follow up with the best next step for private training, coaching, or bookings in Los Angeles, including Playa Del Rey, Manhattan Beach, and surrounding areas.",
    body: {
      availability_note:
        "Private training remains intentionally limited. Coaching and select brand bookings are reviewed with the same care.",
      location_signature: "Los Angeles / Playa Del Rey / Manhattan Beach",
    },
    meta: {},
    isVisible: true,
  },
};

function getDefaultSnapshot(): SummerPublicSnapshot {
  return {
    siteTitle: "Summer Loffler",
    heroHeading: "Private training with strength, discipline, and presence.",
    heroSubheading:
      "A refined approach to coaching for clients who want serious guidance, polished presentation, and lasting results on and off camera.",
    primaryCtaLabel: "Apply for Private Training",
    primaryCtaHref: "#contact",
    secondaryCtaLabel: "View Portfolio",
    secondaryCtaHref: "#portfolio",
    trainingCtaText: "Apply for Private Training",
    bookingCtaText: "Discuss a booking",
    contactEmail: null,
    instagramUrl: null,
    heroSlides: defaultHeroSlides,
    about: {
      section: DEFAULT_SECTIONS.about,
      images: aboutImages,
      points: aboutPoints,
    },
    offersIntro: DEFAULT_SECTIONS.offers_intro,
    offers: defaultOffers.map((offer) => ({
      title: offer.title,
      subtitle: null,
      description: offer.description,
      detail: offer.detail,
      cta: offer.cta,
      href: "#contact",
      badge: offer.featured ? "Most Exclusive" : null,
      featured: offer.featured,
      visible: true,
      bullets: [],
    })),
    trainWithMe: {
      section: DEFAULT_SECTIONS.train_with_me,
      leadCard: String(DEFAULT_SECTIONS.train_with_me.body.lead_card || ""),
      pillars: (DEFAULT_SECTIONS.train_with_me.body.pillars as string[]) || [],
      cards: trainingCards,
    },
    signature: DEFAULT_SECTIONS.signature,
    classesIntro: DEFAULT_SECTIONS.classes_intro,
    plansIntro: DEFAULT_SECTIONS.plans_intro,
    testimonialsIntro: DEFAULT_SECTIONS.testimonials_intro,
    faqIntro: DEFAULT_SECTIONS.faq_intro,
    galleryIntro: DEFAULT_SECTIONS.gallery_intro,
    galleryItems: defaultGalleryItems,
    contact: DEFAULT_SECTIONS.contact_cta,
    tiers: DEFAULT_TIERS,
    digitalProducts: DEFAULT_PRODUCTS,
    testimonials: DEFAULT_TESTIMONIALS,
    faqItems: DEFAULT_FAQ,
    classes: DEFAULT_CLASSES,
  };
}

function normalizeSection(row: SummerSectionContent | null, fallback: SummerPublicSection) {
  if (!row) {
    return fallback;
  }

  return {
    eyebrow: row.eyebrow || fallback.eyebrow,
    heading: row.heading || fallback.heading,
    subheading: row.subheading || fallback.subheading,
    body: row.body || fallback.body,
    meta: row.meta || fallback.meta,
    isVisible: row.is_visible,
  };
}

function assetUrl(asset: SummerMediaAsset | undefined) {
  return asset?.public_url || asset?.file_path || "";
}

function assetObjectPosition(asset: SummerMediaAsset | undefined, fallback: string) {
  const objectPosition = asset?.metadata?.objectPosition;
  return typeof objectPosition === "string" ? `object-[${objectPosition.replace(/ /g, "_")}]` : fallback;
}

function mapHeroSlides(heroItems: SummerHeroItem[], assets: SummerMediaAsset[]) {
  const byId = new Map(assets.map((asset) => [asset.id, asset]));

  const mapped = heroItems
    .filter((item) => item.is_visible)
    .sort((left, right) => left.sort_order - right.sort_order)
    .map((item, index) => {
      const desktopAsset = item.desktop_media_asset_id ? byId.get(item.desktop_media_asset_id) : undefined;
      const mobileAsset = item.mobile_media_asset_id ? byId.get(item.mobile_media_asset_id) : undefined;

      if (!desktopAsset || !mobileAsset) {
        return null;
      }

      return {
        id: item.id,
        desktopSrc: assetUrl(desktopAsset),
        mobileSrc: assetUrl(mobileAsset),
        desktopAlt: desktopAsset.alt_text || defaultHeroSlides[index]?.desktopAlt || "Hero image",
        mobileAlt: mobileAsset.alt_text || defaultHeroSlides[index]?.mobileAlt || "Hero image",
        desktopPosition: assetObjectPosition(desktopAsset, defaultHeroSlides[index]?.desktopPosition || "object-center"),
        mobilePosition: assetObjectPosition(mobileAsset, defaultHeroSlides[index]?.mobilePosition || "object-center"),
      };
    })
    .filter((item): item is (typeof defaultHeroSlides)[number] => item !== null);

  return mapped.length ? mapped : defaultHeroSlides;
}

function mapGalleryItems(rows: SummerGalleryItem[], assets: SummerMediaAsset[]) {
  const byId = new Map(assets.map((asset) => [asset.id, asset]));
  const layoutMap: Record<string, { aspectClass: string; spanClass: string }> = {
    portrait: { aspectClass: "aspect-[4/5]", spanClass: "xl:col-span-4" },
    wide: { aspectClass: "aspect-[16/10]", spanClass: "xl:col-span-8" },
    feature: { aspectClass: "aspect-[16/10]", spanClass: "xl:col-span-7" },
  };

  const mapped = rows
    .filter((item) => item.is_visible)
    .sort((left, right) => left.sort_order - right.sort_order)
    .map((item, index) => {
      const asset = item.media_asset_id ? byId.get(item.media_asset_id) : undefined;

      if (!asset) {
        return null;
      }

      const layout = layoutMap[item.layout_size || "wide"] || layoutMap.wide;

      return {
        title: item.title || defaultGalleryItems[index]?.title || asset.title || "Gallery item",
        category: item.category || defaultGalleryItems[index]?.category || asset.category || "Gallery",
        imageSrc: assetUrl(asset),
        imageAlt: asset.alt_text || defaultGalleryItems[index]?.imageAlt || item.title || "Gallery image",
        aspectClass: layout.aspectClass,
        spanClass: layout.spanClass,
        imagePosition: assetObjectPosition(asset, defaultGalleryItems[index]?.imagePosition || "object-center"),
      };
    })
    .filter((item): item is (typeof defaultGalleryItems)[number] => item !== null);

  return mapped.length ? mapped : defaultGalleryItems;
}

function mapTestimonials(
  rows: SummerTestimonial[],
  assets: SummerMediaAsset[],
): (SummerTestimonial & { beforeUrl?: string | null; afterUrl?: string | null })[] {
  const byId = new Map(assets.map((a) => [a.id, a]));
  return rows.map((row) => ({
    ...row,
    beforeUrl: row.before_media_id ? assetUrl(byId.get(row.before_media_id)) : null,
    afterUrl: row.after_media_id ? assetUrl(byId.get(row.after_media_id)) : null,
  }));
}

function mapClasses(
  rows: SummerClass[],
  assets: SummerMediaAsset[],
): (SummerClass & { coverUrl?: string | null })[] {
  const byId = new Map(assets.map((a) => [a.id, a]));
  return rows.map((row) => ({
    ...row,
    coverUrl: row.cover_media_id ? assetUrl(byId.get(row.cover_media_id)) || null : null,
  }));
}

// Hide the duplicate Online Classes offer row (the original `online-coaching` row
// was repurposed to carry the Online Classes title + description) and the extra
// Guides & Meal Plans row, so the home Offers section stays at the canonical three.
const HIDDEN_OFFER_SLUGS = new Set(["online-classes", "guides-and-plans"]);

function mapOffers(rows: SummerOfferRecord[]) {
  const mapped = rows
    .filter((offer) => offer.is_visible && !HIDDEN_OFFER_SLUGS.has(offer.slug))
    .sort((left, right) => left.sort_order - right.sort_order)
    .map((offer) => ({
      id: offer.id,
      title: offer.title,
      subtitle: offer.subtitle,
      description: offer.description || "",
      detail: offer.bullets?.join(" ") || offer.subtitle || "",
      cta: offer.cta_label || "Learn more",
      href: offer.cta_href || "#contact",
      badge: offer.badge,
      featured: offer.is_featured,
      visible: offer.is_visible,
      bullets: Array.isArray(offer.bullets) ? offer.bullets : [],
    }));

  return mapped.length ? mapped : getDefaultSnapshot().offers;
}

export async function getSummerPublicSnapshot() {
  const defaults = getDefaultSnapshot();

  if (!hasSummerSupabaseAdminConfig()) {
    return defaults;
  }

  try {
    const [
      settings,
      sections,
      offers,
      mediaAssets,
      heroItems,
      galleryRows,
      tiersRows,
      productRows,
      testimonialRows,
      faqRows,
      classRows,
    ] = await Promise.all([
      selectSummerSingle<SummerSiteSettings>("site_settings", { order: "updated_at.desc" }),
      selectSummerRows<SummerSectionContent>("section_content", { order: "sort_order.asc" }),
      selectSummerRows<SummerOfferRecord>("offers", { order: "sort_order.asc" }),
      selectSummerRows<SummerMediaAsset>("media_assets", { is_visible: "eq.true", order: "sort_order.asc" }),
      selectSummerRows<SummerHeroItem>("hero_items", { order: "sort_order.asc" }),
      selectSummerRows<SummerGalleryItem>("gallery_items", { order: "sort_order.asc" }),
      selectSummerRows<SummerSubscriptionTier>("subscription_tiers", { is_visible: "eq.true", order: "sort_order.asc" }).catch(() => []),
      selectSummerRows<SummerDigitalProduct>("digital_products", { is_visible: "eq.true", order: "sort_order.asc" }).catch(() => []),
      selectSummerRows<SummerTestimonial>("testimonials", { is_visible: "eq.true", order: "sort_order.asc" }).catch(() => []),
      selectSummerRows<SummerFaqItem>("faq", { is_visible: "eq.true", order: "sort_order.asc" }).catch(() => []),
      selectSummerRows<SummerClass>("classes", { is_visible: "eq.true", order: "sort_order.asc" }).catch(() => []),
    ]);

    const sectionMap = new Map(sections.map((section) => [section.section_key, section]));

    return {
      siteTitle: settings?.site_title || defaults.siteTitle,
      heroHeading: settings?.hero_heading || defaults.heroHeading,
      heroSubheading: settings?.hero_subheading || defaults.heroSubheading,
      primaryCtaLabel: settings?.primary_cta_label || defaults.primaryCtaLabel,
      primaryCtaHref: settings?.primary_cta_href || defaults.primaryCtaHref,
      secondaryCtaLabel: settings?.secondary_cta_label || defaults.secondaryCtaLabel,
      secondaryCtaHref: settings?.secondary_cta_href || defaults.secondaryCtaHref,
      trainingCtaText: settings?.training_cta_text || defaults.trainingCtaText,
      bookingCtaText: settings?.booking_cta_text || defaults.bookingCtaText,
      // Demo mode: the demo schema is seeded by copying rows out of the live
      // `summer` schema, so site_settings still carries the real studio email
      // and the real Instagram profile. Never let those reach the public
      // portfolio demo — pin them to placeholders regardless of what the row says.
      contactEmail: IS_DEMO ? DEMO_CONTACT_EMAIL : settings?.contact_email || defaults.contactEmail,
      instagramUrl: IS_DEMO ? DEMO_INSTAGRAM_URL : settings?.instagram_url || defaults.instagramUrl,
      heroSlides: mapHeroSlides(heroItems, mediaAssets),
      about: {
        section: normalizeSection(sectionMap.get("about") || null, defaults.about.section),
        images: defaults.about.images,
        points: (sectionMap.get("about")?.body?.points as string[]) || defaults.about.points,
      },
      offersIntro: normalizeSection(sectionMap.get("offers_intro") || null, defaults.offersIntro),
      offers: mapOffers(offers),
      trainWithMe: {
        section: normalizeSection(sectionMap.get("train_with_me") || null, defaults.trainWithMe.section),
        leadCard:
          (sectionMap.get("train_with_me")?.body?.lead_card as string) || defaults.trainWithMe.leadCard,
        pillars:
          (sectionMap.get("train_with_me")?.body?.pillars as string[]) || defaults.trainWithMe.pillars,
        cards: defaults.trainWithMe.cards,
      },
      signature: normalizeSection(sectionMap.get("signature") || null, defaults.signature),
      classesIntro: normalizeSection(sectionMap.get("classes_intro") || null, defaults.classesIntro),
      plansIntro: normalizeSection(sectionMap.get("plans_intro") || null, defaults.plansIntro),
      testimonialsIntro: normalizeSection(sectionMap.get("testimonials_intro") || null, defaults.testimonialsIntro),
      faqIntro: normalizeSection(sectionMap.get("faq_intro") || null, defaults.faqIntro),
      galleryIntro: normalizeSection(sectionMap.get("gallery_intro") || null, defaults.galleryIntro),
      galleryItems: mapGalleryItems(galleryRows, mediaAssets),
      contact: normalizeSection(sectionMap.get("contact_cta") || null, defaults.contact),
      tiers: tiersRows.length ? tiersRows : defaults.tiers,
      digitalProducts: productRows.length ? productRows : defaults.digitalProducts,
      testimonials: testimonialRows.length
        ? mapTestimonials(testimonialRows, mediaAssets)
        : defaults.testimonials,
      faqItems: faqRows.length ? faqRows : defaults.faqItems,
      classes: classRows.length ? mapClasses(classRows, mediaAssets) : defaults.classes,
    } satisfies SummerPublicSnapshot;
  } catch {
    return defaults;
  }
}
