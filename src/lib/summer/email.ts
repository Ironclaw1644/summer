import "server-only";

import { IS_DEMO } from "@/lib/summer/supabase";

export type SummerEmail = {
  to: string;
  subject: string;
  text: string;
  replyTo?: string;
};

export type SummerEmailResult =
  | { ok: true; stubbed?: boolean }
  | { ok: false; reason: string };

/**
 * Single outbound-email chokepoint for the site.
 *
 * In DEMO_MODE every send is suppressed so the nightly-reset showroom never
 * emails real people while visitors "go wild". Outside demo mode this is a
 * deliberate no-op until an email provider (e.g. Resend) is wired in — it never
 * throws, so callers can fire-and-forget without guarding each call site.
 */
export async function sendSummerEmail(email: SummerEmail): Promise<SummerEmailResult> {
  if (IS_DEMO) {
    console.info(`[demo] outbound email suppressed → ${email.subject} (${email.to})`);
    return { ok: true, stubbed: true };
  }

  // No transactional email provider is configured for this project yet. When one
  // is added, send here. Until then this is intentionally a silent no-op.
  return { ok: false, reason: "email_provider_not_configured" };
}
