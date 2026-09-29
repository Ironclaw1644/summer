import type { Metadata } from "next";

import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";

export const metadata: Metadata = {
  title: "Privacy",
  description: "Summer Loffler — privacy policy.",
  alternates: { canonical: "/legal/privacy" },
};

export default function PrivacyPage() {
  return (
    <main className="bg-[color:var(--paper-100)] text-[color:var(--ink-900)]">
      <Container
        size="sm"
        className="py-20 md:py-28"
        style={{ paddingTop: "calc(8rem + env(safe-area-inset-top))" }}
      >
        <div className="flex items-center gap-3">
          <span className="h-px w-8 bg-[color:var(--bronze-500)]" aria-hidden="true" />
          <Eyebrow variant="mono" tone="bronze">
            Legal
          </Eyebrow>
        </div>
        <h1 className="font-editorial mt-6 text-balance text-5xl leading-[0.95] tracking-[-0.035em] md:text-[4.5rem]">
          Privacy Policy
        </h1>
        <p className="mt-4 font-mono-editorial text-[11px] uppercase tracking-[0.28em] text-[color:var(--ink-400)]">
          Last updated · January 2026
        </p>

        <div className="prose-editorial mt-14">
          <p>
            We collect the minimum we need to serve you: your name, email, and any details you
            share on the inquiry form. Payment details are handled by Stripe — we never see your
            full card.
          </p>
          <h2>What we store</h2>
          <ul>
            <li>Inquiry details (name, email, message, optional phone/instagram/goals).</li>
            <li>Client account info if you sign up.</li>
            <li>Subscription and purchase records.</li>
            <li>Basic analytics (page views, referrer) to make the site better.</li>
          </ul>
          <h2>What we don&rsquo;t</h2>
          <ul>
            <li>Credit cards or bank details.</li>
            <li>Sell data to third parties.</li>
            <li>Track you across other sites.</li>
          </ul>
          <h2>Your rights</h2>
          <p>
            Write to <a href="mailto:hello@summerloffler-demo.com">hello@summerloffler-demo.com</a> to
            access, correct, or delete your data. We&rsquo;ll respond within 30 days.
          </p>
        </div>
      </Container>
    </main>
  );
}
