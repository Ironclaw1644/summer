import type { MetadataRoute } from "next";

function siteBase() {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000";
  try {
    return new URL(raw).origin;
  } catch {
    try {
      return new URL(`https://${raw}`).origin;
    } catch {
      return "http://localhost:3000";
    }
  }
}

export default function robots(): MetadataRoute.Robots {
  // Demo builds are noindex end-to-end — disallow everything.
  if (process.env.DEMO_MODE === "1") {
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/classes", "/plans", "/about", "/legal"],
        disallow: ["/admin", "/review", "/api", "/client"],
      },
    ],
    sitemap: `${siteBase()}/sitemap.xml`,
  };
}
