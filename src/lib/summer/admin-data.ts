import "server-only";

import { unstable_noStore as noStore } from "next/cache";

import { IS_DEMO, selectSummerRows, selectSummerSingle } from "@/lib/summer/supabase";
import { DEMO_CONTACT_EMAIL, DEMO_INSTAGRAM_URL } from "@/lib/summer/demo-contact";
import type {
  SummerGalleryItem,
  SummerHeroItem,
  SummerImageJob,
  SummerImageOutput,
  SummerInquiry,
  SummerInquiryNote,
  SummerMediaAsset,
  SummerOfferRecord,
  SummerSectionContent,
  SummerSiteSettings,
} from "@/lib/summer/types";

export async function getSummerAdminDashboardData() {
  noStore();

  const [inquiries, mediaAssets, offers, imageJobs, imageOutputs] = await Promise.all([
    selectSummerRows<SummerInquiry>("inquiries", { order: "created_at.desc" }),
    selectSummerRows<SummerMediaAsset>("media_assets", { order: "created_at.desc" }),
    selectSummerRows<SummerOfferRecord>("offers", { order: "sort_order.asc" }),
    selectSummerRows<SummerImageJob>("image_jobs", { order: "created_at.desc" }),
    selectSummerRows<SummerImageOutput>("image_outputs", { order: "created_at.desc" }),
  ]);

  return {
    totals: {
      inquiries: inquiries.length,
      newInquiries: inquiries.filter((item) => item.status === "new").length,
      approvedMedia: mediaAssets.filter((item) => item.is_approved).length,
      visibleOffers: offers.filter((item) => item.is_visible).length,
      recentImageJobs: imageJobs.length,
    },
    latestInquiries: inquiries.slice(0, 6),
    latestApprovedMedia: mediaAssets.filter((item) => item.is_approved).slice(0, 6),
    latestImageOutputs: imageOutputs.slice(0, 6),
  };
}

export async function getSummerAdminCollections() {
  noStore();

  const [siteSettings, sections, offers, mediaAssets, heroItems, galleryItems, inquiries, imageJobs, imageOutputs] = await Promise.all([
    selectSummerSingle<SummerSiteSettings>("site_settings", { order: "updated_at.desc" }),
    selectSummerRows<SummerSectionContent>("section_content", { order: "sort_order.asc" }),
    selectSummerRows<SummerOfferRecord>("offers", { order: "sort_order.asc" }),
    selectSummerRows<SummerMediaAsset>("media_assets", { order: "sort_order.asc" }),
    selectSummerRows<SummerHeroItem>("hero_items", { order: "sort_order.asc" }),
    selectSummerRows<SummerGalleryItem>("gallery_items", { order: "sort_order.asc" }),
    selectSummerRows<SummerInquiry>("inquiries", { order: "created_at.desc", limit: 100 }),
    selectSummerRows<SummerImageJob>("image_jobs", { order: "created_at.desc", limit: 50 }),
    selectSummerRows<SummerImageOutput>("image_outputs", { order: "created_at.desc", limit: 50 }),
  ]);

  return {
    // Demo mode: the demo schema seeds site_settings by copying the live
    // `summer` row, so it still holds the real studio email and Instagram URL.
    // The demo back office is publicly browsable, so mask them here too.
    siteSettings:
      IS_DEMO && siteSettings
        ? { ...siteSettings, contact_email: DEMO_CONTACT_EMAIL, instagram_url: DEMO_INSTAGRAM_URL }
        : siteSettings,
    sections,
    offers,
    mediaAssets,
    heroItems,
    galleryItems,
    inquiries,
    imageJobs,
    imageOutputs,
  };
}

export async function getSummerInquiryDetail(inquiryId: string) {
  noStore();

  const [inquiry, notes] = await Promise.all([
    selectSummerSingle<SummerInquiry>("inquiries", { id: `eq.${inquiryId}` }),
    selectSummerRows<SummerInquiryNote>("inquiry_notes", { inquiry_id: `eq.${inquiryId}`, order: "created_at.asc" }),
  ]);

  return {
    inquiry,
    notes,
  };
}
