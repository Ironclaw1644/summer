import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  SUMMER_ADMIN_ACCESS_COOKIE,
  SUMMER_CLIENT_ACCESS_COOKIE,
} from "@/lib/summer/admin-constants";

// Kept inline (not imported from the server-only supabase module) because
// middleware runs on the edge runtime. DEMO_MODE is inlined at build time.
const IS_DEMO = process.env.DEMO_MODE === "1";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Demo builds bypass every auth gate — the whole point of the showroom is to
  // let visitors walk straight into the admin without credentials.
  if (IS_DEMO) {
    return NextResponse.next();
  }

  const isAdminPath = pathname.startsWith("/admin") && !pathname.startsWith("/admin/login");
  const isReviewPage = pathname === "/review" || pathname.startsWith("/review/");
  const isReviewApi = pathname.startsWith("/api/review");
  const isClientPath =
    pathname.startsWith("/client") &&
    !pathname.startsWith("/client/login") &&
    !pathname.startsWith("/client/signup");

  if (isAdminPath || isReviewApi) {
    const token = request.cookies.get(SUMMER_ADMIN_ACCESS_COOKIE)?.value;
    if (!token) {
      if (isReviewApi) {
        return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
      }
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  if (isReviewPage) {
    const token = request.cookies.get(SUMMER_ADMIN_ACCESS_COOKIE)?.value;
    if (!token) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  if (isClientPath) {
    const token = request.cookies.get(SUMMER_CLIENT_ACCESS_COOKIE)?.value;
    if (!token) {
      const loginUrl = new URL("/client/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/review",
    "/review/:path*",
    "/api/review/:path*",
    "/client/:path*",
  ],
};
