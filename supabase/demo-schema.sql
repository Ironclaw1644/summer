-- =============================================================================
-- Summer — DEMO schema (demo_summer)
-- =============================================================================
-- Self-contained clone of the production `summer` schema used only when the app
-- runs with DEMO_MODE=1 and SUPABASE_SCHEMA=demo_summer.
--
-- Differences from production `summer`:
--   • Internal foreign keys are DROPPED (columns are plain uuid/text). The demo
--     is "go wild" and gets truncated nightly — referential integrity would only
--     produce visitor-facing errors. The app never uses PostgREST resource
--     embedding, so no joins depend on these FKs.
--   • Permissive RLS + broad grants so anon/authenticated can read (and the
--     nightly reset, run with the service role, can freely truncate + reseed).
--
-- >>> IMPORTANT: EXPOSE THIS SCHEMA IN POSTGREST <<<
--   Supabase Dashboard → Project Settings → API → "Exposed schemas": add
--   `demo_summer` alongside `public`, `graphql_public`, `summer`. Locally it is
--   already added to supabase/config.toml [api].schemas. Without this, REST calls
--   with `Accept-Profile: demo_summer` return 406/404.
--
-- Idempotent: safe to re-run. Run AFTER the production `summer` migrations so the
-- content copy at the bottom has something to clone.
-- =============================================================================

create extension if not exists pgcrypto;

create schema if not exists demo_summer;

create or replace function demo_summer.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ── Tables (columns mirror summer.*; foreign keys intentionally omitted) ──────

create table if not exists demo_summer.admin_users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  role text not null default 'admin',
  created_at timestamptz not null default now()
);

create table if not exists demo_summer.site_settings (
  id uuid primary key default gen_random_uuid(),
  site_title text,
  hero_heading text,
  hero_subheading text,
  primary_cta_label text,
  primary_cta_href text,
  secondary_cta_label text,
  secondary_cta_href text,
  contact_email text,
  instagram_url text,
  training_cta_text text,
  booking_cta_text text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists demo_summer.section_content (
  id uuid primary key default gen_random_uuid(),
  section_key text unique not null,
  eyebrow text,
  heading text,
  subheading text,
  body jsonb not null default '{}'::jsonb,
  meta jsonb not null default '{}'::jsonb,
  is_visible boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists demo_summer.offers (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  subtitle text,
  description text,
  bullets jsonb not null default '[]'::jsonb,
  cta_label text,
  cta_href text,
  badge text,
  is_featured boolean not null default false,
  is_visible boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists demo_summer.media_assets (
  id uuid primary key default gen_random_uuid(),
  title text,
  slug text unique,
  category text,
  section_key text,
  file_path text not null,
  public_url text,
  mime_type text,
  width int,
  height int,
  aspect_ratio text,
  source_type text,
  alt_text text,
  tags jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  is_approved boolean not null default false,
  is_visible boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists demo_summer.gallery_items (
  id uuid primary key default gen_random_uuid(),
  media_asset_id uuid,
  title text,
  category text,
  layout_size text,
  is_visible boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists demo_summer.inquiries (
  id uuid primary key default gen_random_uuid(),
  inquiry_type text not null,
  full_name text,
  email text,
  phone text,
  instagram_handle text,
  message text,
  goals text,
  source text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  status text not null default 'new',
  notes_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists demo_summer.inquiry_notes (
  id uuid primary key default gen_random_uuid(),
  inquiry_id uuid,
  body text not null,
  author_email text,
  created_at timestamptz not null default now()
);

create table if not exists demo_summer.image_jobs (
  id uuid primary key default gen_random_uuid(),
  job_type text not null,
  status text not null default 'queued',
  source_asset_id uuid,
  input_payload jsonb not null default '{}'::jsonb,
  output_payload jsonb not null default '{}'::jsonb,
  prompt_text text,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists demo_summer.image_outputs (
  id uuid primary key default gen_random_uuid(),
  job_id uuid,
  media_asset_id uuid,
  output_path text,
  public_url text,
  title text,
  aspect_ratio text,
  output_type text,
  metadata jsonb not null default '{}'::jsonb,
  is_approved boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists demo_summer.hero_items (
  id uuid primary key default gen_random_uuid(),
  title text,
  desktop_media_asset_id uuid,
  mobile_media_asset_id uuid,
  is_visible boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists demo_summer.portfolio_items (
  id uuid primary key default gen_random_uuid(),
  media_asset_id uuid,
  title text,
  category text,
  is_visible boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists demo_summer.clients (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid,
  email text unique not null,
  full_name text,
  phone text,
  instagram_handle text,
  avatar_url text,
  stripe_customer_id text unique,
  timezone text,
  lifecycle_status text not null default 'lead',
  onboarding_payload jsonb not null default '{}'::jsonb,
  notes text,
  inquiry_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists demo_summer.subscription_tiers (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  subtitle text,
  description text,
  price_cents int not null default 0,
  interval text not null default 'month',
  stripe_price_id text,
  features jsonb not null default '[]'::jsonb,
  access_level int not null default 0,
  badge text,
  is_featured boolean not null default false,
  is_visible boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists demo_summer.subscriptions (
  id uuid primary key default gen_random_uuid(),
  client_id uuid,
  tier_id uuid,
  stripe_subscription_id text unique,
  status text not null default 'incomplete',
  current_period_start timestamptz,
  current_period_end timestamptz,
  trial_ends_at timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists demo_summer.classes (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  summary text,
  body text,
  cover_media_id uuid,
  video_url text,
  duration_minutes int,
  difficulty text,
  category text,
  access_level_min int not null default 0,
  is_featured boolean not null default false,
  is_visible boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists demo_summer.class_sessions (
  id uuid primary key default gen_random_uuid(),
  class_id uuid,
  title text,
  starts_at timestamptz not null,
  duration_minutes int,
  zoom_url text,
  capacity int,
  is_visible boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists demo_summer.class_enrollments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid,
  class_id uuid,
  session_id uuid,
  status text not null default 'confirmed',
  created_at timestamptz not null default now()
);

create table if not exists demo_summer.digital_products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  kind text not null default 'guide',
  title text not null,
  subtitle text,
  description text,
  price_cents int not null default 0,
  stripe_price_id text,
  cover_media_id uuid,
  file_url text,
  page_count int,
  preview_url text,
  includes jsonb not null default '[]'::jsonb,
  is_featured boolean not null default false,
  is_visible boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists demo_summer.purchases (
  id uuid primary key default gen_random_uuid(),
  client_id uuid,
  product_id uuid,
  amount_cents int not null,
  currency text not null default 'usd',
  stripe_payment_intent_id text unique,
  status text not null default 'pending',
  download_url text,
  download_expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists demo_summer.testimonials (
  id uuid primary key default gen_random_uuid(),
  client_id uuid,
  name text,
  location text,
  quote text not null,
  rating int,
  before_media_id uuid,
  after_media_id uuid,
  is_featured boolean not null default false,
  is_visible boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists demo_summer.client_messages (
  id uuid primary key default gen_random_uuid(),
  client_id uuid,
  from_role text not null,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists demo_summer.admin_tips (
  id uuid primary key default gen_random_uuid(),
  page_key text unique not null,
  title text not null,
  body text not null,
  cta_label text,
  cta_href text,
  icon text,
  is_visible boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists demo_summer.faq (
  id uuid primary key default gen_random_uuid(),
  topic text,
  question text not null,
  answer text not null,
  sort_order int not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists demo_summer.stripe_events (
  id uuid primary key default gen_random_uuid(),
  stripe_event_id text unique not null,
  type text not null,
  payload jsonb not null default '{}'::jsonb,
  processed_at timestamptz not null default now()
);

-- ── updated_at triggers ──────────────────────────────────────────────────────
do $$
declare
  t text;
  tables text[] := array[
    'site_settings','section_content','offers','media_assets','gallery_items',
    'inquiries','image_jobs','hero_items','portfolio_items','clients',
    'subscription_tiers','subscriptions','classes','class_sessions',
    'digital_products','testimonials','admin_tips','faq'
  ];
begin
  foreach t in array tables loop
    execute format('drop trigger if exists trg_%1$s_updated_at on demo_summer.%1$s;', t);
    execute format(
      'create trigger trg_%1$s_updated_at before update on demo_summer.%1$s
         for each row execute function demo_summer.set_updated_at();', t);
  end loop;
end $$;

-- ── Permissive RLS (demo posture: read for everyone; service role bypasses) ──
do $$
declare
  t text;
begin
  for t in
    select table_name from information_schema.tables where table_schema = 'demo_summer'
  loop
    execute format('alter table demo_summer.%I enable row level security;', t);
    execute format('drop policy if exists demo_all_read on demo_summer.%I;', t);
    execute format(
      'create policy demo_all_read on demo_summer.%I for select to anon, authenticated using (true);', t);
    execute format('drop policy if exists demo_all_write on demo_summer.%I;', t);
    execute format(
      'create policy demo_all_write on demo_summer.%I for all to anon, authenticated using (true) with check (true);', t);
  end loop;
end $$;

-- ── Grants + default privileges ──────────────────────────────────────────────
grant usage on schema demo_summer to anon, authenticated, service_role;
grant all privileges on all tables in schema demo_summer to anon, authenticated, service_role;
grant all privileges on all sequences in schema demo_summer to anon, authenticated, service_role;
alter default privileges in schema demo_summer grant all on tables to anon, authenticated, service_role;
alter default privileges in schema demo_summer grant all on sequences to anon, authenticated, service_role;

-- ── Seed: synthetic demo admin (matches src/lib/summer/admin-auth.ts) ────────
insert into demo_summer.admin_users (id, email, role)
values ('00000000-0000-0000-0000-000000000000', 'demo@summerloffler.com', 'admin')
on conflict (email) do nothing;

-- ── Seed: clone editable CONTENT from production `summer` (if present) ────────
-- Column order mirrors summer.* exactly so `select *` maps 1:1. CRM/activity
-- tables (inquiries, clients, subscriptions, purchases, testimonials) are left
-- for the nightly reset endpoint to seed with fresh demo data.
do $$
begin
  if to_regclass('summer.site_settings') is not null then
    insert into demo_summer.site_settings     select * from summer.site_settings     on conflict do nothing;
    insert into demo_summer.media_assets       select * from summer.media_assets       on conflict do nothing;
    insert into demo_summer.section_content    select * from summer.section_content    on conflict do nothing;
    insert into demo_summer.offers             select * from summer.offers             on conflict do nothing;
    insert into demo_summer.hero_items         select * from summer.hero_items         on conflict do nothing;
    insert into demo_summer.gallery_items      select * from summer.gallery_items      on conflict do nothing;
    insert into demo_summer.portfolio_items    select * from summer.portfolio_items    on conflict do nothing;
    insert into demo_summer.subscription_tiers select * from summer.subscription_tiers on conflict do nothing;
    insert into demo_summer.digital_products   select * from summer.digital_products   on conflict do nothing;
    insert into demo_summer.classes            select * from summer.classes            on conflict do nothing;
    insert into demo_summer.class_sessions     select * from summer.class_sessions     on conflict do nothing;
    insert into demo_summer.admin_tips         select * from summer.admin_tips         on conflict do nothing;
    insert into demo_summer.faq                select * from summer.faq                on conflict do nothing;
  end if;
end $$;
