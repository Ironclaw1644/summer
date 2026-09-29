import { NextRequest, NextResponse } from "next/server";

import { sendSummerEmail } from "@/lib/summer/email";
import { hasSummerSupabaseAdminConfig, insertSummerRows } from "@/lib/summer/supabase";

export const runtime = "nodejs";

type InquiryRequest = {
  inquiryType?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  instagramHandle?: string;
  location?: string;
  goals?: string;
  message?: string;
  source?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
};

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: NextRequest) {
  const payload = (await request.json()) as InquiryRequest;
  const inquiryType = payload.inquiryType?.trim();
  const fullName = payload.fullName?.trim() || null;
  const email = payload.email?.trim().toLowerCase() || null;
  const message = payload.message?.trim() || null;
  const goals = [payload.goals?.trim(), payload.location?.trim() ? `Location / Time Zone: ${payload.location.trim()}` : null]
    .filter(Boolean)
    .join("\n\n");

  if (!inquiryType || !email || !message) {
    return NextResponse.json({ error: "Inquiry type, email, and message are required." }, { status: 400 });
  }

  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  if (!hasSummerSupabaseAdminConfig()) {
    return NextResponse.json({ error: "Inquiry intake is not configured yet." }, { status: 503 });
  }

  try {
    const rows = await insertSummerRows<{ id: string }>("inquiries", [
      {
        inquiry_type: inquiryType,
        full_name: fullName,
        email,
        phone: payload.phone?.trim() || null,
        instagram_handle: payload.instagramHandle?.trim() || null,
        message,
        goals: goals || null,
        source: payload.source?.trim() || "public_site",
        utm_source: payload.utmSource?.trim() || null,
        utm_medium: payload.utmMedium?.trim() || null,
        utm_campaign: payload.utmCampaign?.trim() || null,
      },
    ]);

    // Notify the studio of the new inquiry. Stubbed/suppressed in demo mode and
    // a no-op until an email provider is configured — never blocks the response.
    await sendSummerEmail({
      to: process.env.SUMMER_STUDIO_EMAIL || "hello@summerloffler-demo.com",
      replyTo: email,
      subject: `New ${inquiryType} inquiry from ${fullName || email}`,
      text: `${fullName || "Someone"} (${email}) submitted a ${inquiryType} inquiry:\n\n${message}`,
    }).catch(() => {
      /* email is best-effort; the inquiry is already persisted */
    });

    return NextResponse.json({ ok: true, inquiryId: rows?.[0]?.id || null });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to submit inquiry.",
      },
      { status: 500 },
    );
  }
}
