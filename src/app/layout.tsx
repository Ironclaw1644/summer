import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Geist, Geist_Mono } from "next/font/google";

import { config as faConfig } from "@fortawesome/fontawesome-svg-core";
import "@fortawesome/fontawesome-svg-core/styles.css";

import { DemoTourguide } from "@/components/DemoTourguide";
import { FooterMount } from "@/components/summer/FooterMount";
import { Header as SiteHeader } from "@/components/summer/Header";
import { PageShell } from "@/components/summer/PageShell";
import { getSummerPublicSnapshot } from "@/lib/summer/site-content";
import { IS_DEMO } from "@/lib/summer/supabase";

import "./globals.css";

// FA: we're already bringing in the CSS manually, so Next's server render
// shouldn't re-inject it on hydration.
faConfig.autoAddCss = false;

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const cormorantGaramond = Cormorant_Garamond({
  variable: "--font-cormorant-garamond",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

function getMetadataBase() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (!siteUrl) {
    return new URL("http://localhost:3000");
  }

  try {
    return new URL(siteUrl);
  } catch {
    try {
      return new URL(`https://${siteUrl}`);
    } catch {
      return new URL("http://localhost:3000");
    }
  }
}

export const metadata: Metadata = {
  metadataBase: getMetadataBase(),
  title: {
    default: "Summer Loffler",
    template: "%s | Summer Loffler",
  },
  description:
    "Private training, online coaching, and refined fitness work in Los Angeles — heavy lifting, glute-focused programming, and editorial direction by Summer Loffler.",
  // Demo builds must never be indexed — keep the showroom out of search results.
  robots: { index: !IS_DEMO, follow: !IS_DEMO },
  openGraph: {
    siteName: "Summer Loffler",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export const viewport: Viewport = {
  themeColor: "#f6f1ea",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const snapshot = await getSummerPublicSnapshot();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${cormorantGaramond.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-[color:var(--paper-100)] text-[color:var(--ink-900)]">
        <SiteHeader instagramUrl={snapshot.instagramUrl} />
        <PageShell>{children}</PageShell>
        <FooterMount
          instagramUrl={snapshot.instagramUrl}
          contactEmail={snapshot.contactEmail}
        />
        {IS_DEMO ? <DemoTourguide /> : null}
      </body>
    </html>
  );
}
