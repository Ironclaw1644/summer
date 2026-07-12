import "server-only";

import { SUMMER_SCHEMA } from "@/lib/summer/types";

// ── Demo mode ───────────────────────────────────────────────────────────────
// When DEMO_MODE=1 the app runs as a self-contained showroom demo: admin auth
// is bypassed (synthetic admin), reads/writes target the isolated demo schema,
// outbound email is stubbed, and the tour guide overlay mounts.
export const IS_DEMO = process.env.DEMO_MODE === "1";

// The Postgres schema every Supabase REST call targets. Centralized here so the
// demo build can swap the entire data layer with a single env var. Falls back to
// the real production schema ("summer").
export const SCHEMA = process.env.SUPABASE_SCHEMA || SUMMER_SCHEMA;

type KeyKind = "anon" | "service";

type QueryValue = string | number | boolean | null | undefined;

export type SummerSupabaseConfig = {
  url: string | null;
  anonKey: string | null;
  serviceRoleKey: string | null;
};

function getFirstEnv(...keys: string[]) {
  for (const key of keys) {
    const value = process.env[key];
    if (value) {
      return value;
    }
  }

  return null;
}

export function getSummerSupabaseConfig(): SummerSupabaseConfig {
  return {
    url: getFirstEnv("SUMMER_SUPABASE_URL", "SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL"),
    anonKey: getFirstEnv("SUMMER_SUPABASE_ANON_KEY", "SUPABASE_ANON_KEY", "NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    serviceRoleKey: getFirstEnv("SUMMER_SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_SERVICE_ROLE_KEY"),
  };
}

export function hasSummerSupabasePublicConfig() {
  const config = getSummerSupabaseConfig();
  return Boolean(config.url && config.anonKey);
}

export function hasSummerSupabaseAdminConfig() {
  const config = getSummerSupabaseConfig();
  return Boolean(config.url && config.anonKey && config.serviceRoleKey);
}

function getSupabaseKey(kind: KeyKind) {
  const config = getSummerSupabaseConfig();
  return kind === "service" ? config.serviceRoleKey : config.anonKey;
}

function buildRestUrl(table: string, query?: Record<string, QueryValue>) {
  const { url } = getSummerSupabaseConfig();

  if (!url) {
    throw new Error("Missing Supabase URL configuration.");
  }

  const endpoint = new URL(`/rest/v1/${table}`, url);

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null) {
        continue;
      }

      endpoint.searchParams.set(key, String(value));
    }
  }

  return endpoint;
}

async function parseSupabaseResponse<T>(response: Response): Promise<T | null> {
  if (response.status === 204) {
    return null;
  }

  const text = await response.text();

  if (!text) {
    return null;
  }

  return JSON.parse(text) as T;
}

export async function summerRestRequest<T>(options: {
  table: string;
  query?: Record<string, QueryValue>;
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  keyKind?: KeyKind;
  schema?: string;
  prefer?: string[];
  cache?: RequestCache;
}) {
  const method = options.method || "GET";
  const schema = options.schema || SCHEMA;
  const keyKind = options.keyKind || "service";
  const key = getSupabaseKey(keyKind);
  const { url } = getSummerSupabaseConfig();

  if (!url || !key) {
    throw new Error(`Missing Supabase ${keyKind} configuration.`);
  }

  const headers = new Headers({
    apikey: key,
    Authorization: `Bearer ${key}`,
    Accept: "application/json",
  });

  if (method === "GET") {
    headers.set("Accept-Profile", schema);
  } else {
    headers.set("Content-Profile", schema);
    headers.set("Content-Type", "application/json");
  }

  if (options.prefer?.length) {
    headers.set("Prefer", options.prefer.join(","));
  }

  const response = await fetch(buildRestUrl(options.table, options.query), {
    method,
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    cache: options.cache || "no-store",
  });

  if (!response.ok) {
    throw new Error(`Supabase REST ${method} ${options.table} failed with ${response.status}: ${await response.text()}`);
  }

  return parseSupabaseResponse<T>(response);
}

export async function selectSummerRows<T>(table: string, query?: Record<string, QueryValue>, keyKind: KeyKind = "service") {
  const data = await summerRestRequest<T[]>({
    table,
    query: {
      select: "*",
      ...query,
    },
    keyKind,
    cache: "no-store",
  });

  return data || [];
}

export async function insertSummerRows<T>(table: string, rows: Record<string, unknown>[], keyKind: KeyKind = "service") {
  // PostgREST bulk insert requires every object to carry the same keys
  // ("All object keys must match", PGRST102). Normalize to the union of keys
  // across all rows, filling any gaps with null so partial seed rows don't 400.
  const normalized = normalizeRowKeys(rows);
  return summerRestRequest<T[]>({
    table,
    method: "POST",
    body: normalized,
    keyKind,
    prefer: ["return=representation"],
  });
}

function normalizeRowKeys(rows: Record<string, unknown>[]): Record<string, unknown>[] {
  if (rows.length <= 1) return rows;
  const allKeys = new Set<string>();
  for (const r of rows) for (const k of Object.keys(r)) allKeys.add(k);
  return rows.map((r) => {
    const out: Record<string, unknown> = {};
    for (const k of allKeys) out[k] = k in r ? r[k] : null;
    return out;
  });
}

export async function upsertSummerRows<T>(table: string, rows: Record<string, unknown>[], onConflict?: string, keyKind: KeyKind = "service") {
  const prefer = ["return=representation", "resolution=merge-duplicates"];
  if (onConflict) {
    return summerRestRequest<T[]>({
      table,
      method: "POST",
      body: rows,
      keyKind,
      query: { on_conflict: onConflict },
      prefer,
    });
  }

  return summerRestRequest<T[]>({
    table,
    method: "POST",
    body: rows,
    keyKind,
    prefer,
  });
}

export async function updateSummerRows<T>(table: string, filters: Record<string, QueryValue>, patch: Record<string, unknown>, keyKind: KeyKind = "service") {
  return summerRestRequest<T[]>({
    table,
    method: "PATCH",
    query: {
      select: "*",
      ...filters,
    },
    body: patch,
    keyKind,
    prefer: ["return=representation"],
  });
}

export async function deleteSummerRows<T>(table: string, filters: Record<string, QueryValue>, keyKind: KeyKind = "service") {
  return summerRestRequest<T[]>({
    table,
    method: "DELETE",
    query: {
      select: "*",
      ...filters,
    },
    keyKind,
    prefer: ["return=representation"],
  });
}

export async function selectSummerSingle<T>(table: string, query?: Record<string, QueryValue>, keyKind: KeyKind = "service") {
  const rows = await selectSummerRows<T>(table, { ...query, limit: 1 }, keyKind);
  return rows[0] || null;
}

export async function fetchSupabaseAuth<T>(path: string, options: RequestInit & { keyKind?: KeyKind }) {
  const { url } = getSummerSupabaseConfig();
  const key = getSupabaseKey(options.keyKind || "anon");

  if (!url || !key) {
    throw new Error("Missing Supabase auth configuration.");
  }

  const response = await fetch(new URL(path, url), {
    ...options,
    headers: {
      apikey: key,
      ...(options.headers || {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Supabase auth request failed with ${response.status}: ${await response.text()}`);
  }

  return (await response.json()) as T;
}
