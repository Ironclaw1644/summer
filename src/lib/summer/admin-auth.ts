import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";

import { SUMMER_ADMIN_ACCESS_COOKIE, SUMMER_ADMIN_REFRESH_COOKIE } from "@/lib/summer/admin-constants";
import {
  fetchSupabaseAuth,
  getSummerSupabaseConfig,
  hasSummerSupabaseAdminConfig,
  IS_DEMO,
  selectSummerSingle,
  upsertSummerRows,
} from "@/lib/summer/supabase";
import type { SummerAdminUser } from "@/lib/summer/types";

// In demo mode there are no real credentials — every admin request resolves to a
// single synthetic admin identity so visitors can explore the full back office.
const DEMO_ADMIN_EMAIL = process.env.DEMO_ADMIN_EMAIL || "demo@summerloffler-demo.com";

function demoAdminSession(): SummerAdminSession {
  const adminUser: SummerAdminUser = {
    id: "00000000-0000-0000-0000-000000000000",
    email: DEMO_ADMIN_EMAIL,
    role: "admin",
    created_at: new Date(0).toISOString(),
  };

  return {
    accessToken: "demo",
    refreshToken: "demo",
    user: { id: adminUser.id, email: adminUser.email },
    adminUser,
  };
}

type PasswordAuthResponse = {
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    email?: string;
  };
};

type SupabaseAuthUser = {
  id: string;
  email?: string;
};

export type SummerAdminSession = {
  accessToken: string;
  refreshToken?: string;
  user: SupabaseAuthUser;
  adminUser: SummerAdminUser;
};

async function getAdminUserByEmail(email: string) {
  return selectSummerSingle<SummerAdminUser>("admin_users", { email: `eq.${email}` });
}

async function maybeBootstrapAdmin(email: string) {
  const bootstrapEmail = process.env.SUMMER_BOOTSTRAP_ADMIN_EMAIL;

  if (!bootstrapEmail || bootstrapEmail.toLowerCase() !== email.toLowerCase()) {
    return null;
  }

  const rows = await upsertSummerRows<SummerAdminUser>(
    "admin_users",
    [{ email, role: "admin" }],
    "email",
  );

  return rows?.[0] || null;
}

export async function loginSummerAdmin(email: string, password: string) {
  if (!hasSummerSupabaseAdminConfig()) {
    throw new Error("Sign-in is temporarily unavailable. Please try again shortly.");
  }

  let session: PasswordAuthResponse;
  try {
    session = await fetchSupabaseAuth<PasswordAuthResponse>("/auth/v1/token?grant_type=password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
      keyKind: "anon",
    });
  } catch {
    throw new Error("Invalid email or password.");
  }

  const normalizedEmail = session.user.email?.toLowerCase();

  if (!normalizedEmail) {
    throw new Error("We couldn't read an email for this account. Contact the studio.");
  }

  let adminUser = await getAdminUserByEmail(normalizedEmail);

  if (!adminUser) {
    adminUser = await maybeBootstrapAdmin(normalizedEmail);
  }

  if (!adminUser) {
    throw new Error("This account isn't authorized for the admin area.");
  }

  const cookieStore = await cookies();
  cookieStore.set(SUMMER_ADMIN_ACCESS_COOKIE, session.access_token, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  cookieStore.set(SUMMER_ADMIN_REFRESH_COOKIE, session.refresh_token, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });

  return {
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
    user: session.user,
    adminUser,
  } satisfies SummerAdminSession;
}

export async function clearSummerAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SUMMER_ADMIN_ACCESS_COOKIE);
  cookieStore.delete(SUMMER_ADMIN_REFRESH_COOKIE);
}

export async function getSummerAdminSession(): Promise<SummerAdminSession | null> {
  if (IS_DEMO) {
    return demoAdminSession();
  }

  if (!hasSummerSupabaseAdminConfig()) {
    return null;
  }

  const cookieStore = await cookies();
  const accessToken = cookieStore.get(SUMMER_ADMIN_ACCESS_COOKIE)?.value;
  const refreshToken = cookieStore.get(SUMMER_ADMIN_REFRESH_COOKIE)?.value;

  if (!accessToken) {
    return null;
  }

  try {
    const { anonKey, url } = getSummerSupabaseConfig();

    if (!url || !anonKey) {
      return null;
    }

    const response = await fetch(new URL("/auth/v1/user", url), {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const user = (await response.json()) as SupabaseAuthUser;

    if (!user.email) {
      return null;
    }

    const adminUser = await getAdminUserByEmail(user.email.toLowerCase());

    if (!adminUser) {
      return null;
    }

    return {
      accessToken,
      refreshToken,
      user,
      adminUser,
    };
  } catch {
    return null;
  }
}

export async function requireSummerAdminSession() {
  const session = await getSummerAdminSession();

  if (!session) {
    redirect("/admin/login");
  }

  return session;
}

export async function requireSummerAdminApiSession() {
  const session = await getSummerAdminSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  return null;
}
