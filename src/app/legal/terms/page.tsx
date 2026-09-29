import type { Metadata } from "next";

import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";

export const metadata: Metadata = {
  title: "Terms",
  description: "Summer Loffler — terms of service.",
  alternates: { canonical: "/legal/terms" },
};

export default function TermsPage() {
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
          Terms of Service
        </h1>
        <p className="mt-4 font-mono-editorial text-[11px] uppercase tracking-[0.28em] text-[color:var(--ink-400)]">
          Last updated · January 2026
        </p>

        <div className="prose-editorial mt-14">
          <p>
            Welcome to Summer Loffler. These terms govern your use of this site, subscriptions,
            and one-time digital products. By using the site or making a purchase, you agree to
            these terms.
          </p>
          <h2>Subscriptions</h2>
          <p>
            Subscriptions renew automatically each billing period until canceled. You can cancel
            anytime from your client dashboard or by emailing{" "}
            <a href="mailto:hello@summerloffler-demo.com">hello@summerloffler-demo.com</a>. Access remains
            active until the end of the current billing period.
          </p>
          <h2>Digital products</h2>
          <p>
            Digital products (guides, meal plans) are delivered immediately on checkout. Because
            of their nature, one-time purchases are non-refundable except where required by law.
            If something went wrong, write to us within 7 days and we will make it right.
          </p>
          <h2>Health &amp; safety</h2>
          <p>
            Training programs are educational. They are not a substitute for medical advice.
            Consult a qualified professional before starting any exercise or nutrition program,
            especially if you have injuries or medical conditions.
          </p>
          <h2>Intellectual property</h2>
          <p>
            All content is owned by Summer Loffler or licensed from the respective owners. Do
            not redistribute, resell, or share purchased materials.
          </p>
          <h2>Contact</h2>
          <p>
            Questions: <a href="mailto:hello@summerloffler-demo.com">hello@summerloffler-demo.com</a>.
          </p>
        </div>
      </Container>
    </main>
  );
}
