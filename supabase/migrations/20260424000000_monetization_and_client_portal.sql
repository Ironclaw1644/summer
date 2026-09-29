-- =============================================================================
-- Summer schema: monetization + client portal expansion
-- Adds: clients, subscription_tiers, subscriptions, classes, class_sessions,
--       class_enrollments, digital_products, purchases, testimonials,
--       client_messages, admin_tips, faq, stripe_events
-- All in summer schema, all idempotent.
-- =============================================================================

create schema if not exists summer;

-- Migration ledger ------------------------------------------------------------
create table if not exists summer._migrations (
  name text primary key,
  applied_at timestamptz not null default now()
);

-- Clients (non-admin user accounts) -------------------------------------------
create table if not exists summer.clients (
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
  inquiry_id uuid references summer.inquiries(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_summer_clients_status on summer.clients(lifecycle_status);
create index if not exists idx_summer_clients_auth_user_id on summer.clients(auth_user_id);

-- Subscription tiers ----------------------------------------------------------
create table if not exists summer.subscription_tiers (
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

create index if not exists idx_summer_subscription_tiers_sort on summer.subscription_tiers(sort_order);

-- Subscriptions ---------------------------------------------------------------
create table if not exists summer.subscriptions (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references summer.clients(id) on delete cascade,
  tier_id uuid references summer.subscription_tiers(id) on delete set null,
  stripe_subscription_id text unique,
  status text not null default 'incomplete',
  current_period_start timestamptz,
  current_period_end timestamptz,
  trial_ends_at timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_summer_subscriptions_client on summer.subscriptions(client_id);
create index if not exists idx_summer_subscriptions_status on summer.subscriptions(status);

-- Classes + sessions + enrollments -------------------------------------------
create table if not exists summer.classes (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  summary text,
  body text,
  cover_media_id uuid references summer.media_assets(id) on delete set null,
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

create index if not exists idx_summer_classes_sort on summer.classes(sort_order);
create index if not exists idx_summer_classes_access on summer.classes(access_level_min);

create table if not exists summer.class_sessions (
  id uuid primary key default gen_random_uuid(),
  class_id uuid references summer.classes(id) on delete cascade,
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

create index if not exists idx_summer_class_sessions_starts_at on summer.class_sessions(starts_at);

create table if not exists summer.class_enrollments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references summer.clients(id) on delete cascade,
  class_id uuid references summer.classes(id) on delete set null,
  session_id uuid references summer.class_sessions(id) on delete set null,
  status text not null default 'confirmed',
  created_at timestamptz not null default now()
);

create index if not exists idx_summer_class_enrollments_client on summer.class_enrollments(client_id);

-- Digital products + purchases -----------------------------------------------
create table if not exists summer.digital_products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  kind text not null default 'guide',
  title text not null,
  subtitle text,
  description text,
  price_cents int not null default 0,
  stripe_price_id text,
  cover_media_id uuid references summer.media_assets(id) on delete set null,
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

create index if not exists idx_summer_digital_products_sort on summer.digital_products(sort_order);
create index if not exists idx_summer_digital_products_kind on summer.digital_products(kind);

create table if not exists summer.purchases (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references summer.clients(id) on delete cascade,
  product_id uuid references summer.digital_products(id) on delete set null,
  amount_cents int not null,
  currency text not null default 'usd',
  stripe_payment_intent_id text unique,
  status text not null default 'pending',
  download_url text,
  download_expires_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_summer_purchases_client on summer.purchases(client_id);
create index if not exists idx_summer_purchases_status on summer.purchases(status);

-- Testimonials ----------------------------------------------------------------
create table if not exists summer.testimonials (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references summer.clients(id) on delete set null,
  name text,
  location text,
  quote text not null,
  rating int,
  before_media_id uuid references summer.media_assets(id) on delete set null,
  after_media_id uuid references summer.media_assets(id) on delete set null,
  is_featured boolean not null default false,
  is_visible boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_summer_testimonials_sort on summer.testimonials(sort_order);

-- Client ↔ coach messaging ---------------------------------------------------
create table if not exists summer.client_messages (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references summer.clients(id) on delete cascade,
  from_role text not null,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_summer_client_messages_client on summer.client_messages(client_id);

-- Admin in-page tips (how-to guidance cards) ----------------------------------
create table if not exists summer.admin_tips (
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

-- Public FAQ ------------------------------------------------------------------
create table if not exists summer.faq (
  id uuid primary key default gen_random_uuid(),
  topic text,
  question text not null,
  answer text not null,
  sort_order int not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Stripe webhook idempotency --------------------------------------------------
create table if not exists summer.stripe_events (
  id uuid primary key default gen_random_uuid(),
  stripe_event_id text unique not null,
  type text not null,
  payload jsonb not null default '{}'::jsonb,
  processed_at timestamptz not null default now()
);

-- Triggers --------------------------------------------------------------------
drop trigger if exists trg_summer_clients_updated_at on summer.clients;
create trigger trg_summer_clients_updated_at before update on summer.clients
for each row execute function summer.set_updated_at();

drop trigger if exists trg_summer_subscription_tiers_updated_at on summer.subscription_tiers;
create trigger trg_summer_subscription_tiers_updated_at before update on summer.subscription_tiers
for each row execute function summer.set_updated_at();

drop trigger if exists trg_summer_subscriptions_updated_at on summer.subscriptions;
create trigger trg_summer_subscriptions_updated_at before update on summer.subscriptions
for each row execute function summer.set_updated_at();

drop trigger if exists trg_summer_classes_updated_at on summer.classes;
create trigger trg_summer_classes_updated_at before update on summer.classes
for each row execute function summer.set_updated_at();

drop trigger if exists trg_summer_class_sessions_updated_at on summer.class_sessions;
create trigger trg_summer_class_sessions_updated_at before update on summer.class_sessions
for each row execute function summer.set_updated_at();

drop trigger if exists trg_summer_digital_products_updated_at on summer.digital_products;
create trigger trg_summer_digital_products_updated_at before update on summer.digital_products
for each row execute function summer.set_updated_at();

drop trigger if exists trg_summer_testimonials_updated_at on summer.testimonials;
create trigger trg_summer_testimonials_updated_at before update on summer.testimonials
for each row execute function summer.set_updated_at();

drop trigger if exists trg_summer_admin_tips_updated_at on summer.admin_tips;
create trigger trg_summer_admin_tips_updated_at before update on summer.admin_tips
for each row execute function summer.set_updated_at();

drop trigger if exists trg_summer_faq_updated_at on summer.faq;
create trigger trg_summer_faq_updated_at before update on summer.faq
for each row execute function summer.set_updated_at();

-- Grants ----------------------------------------------------------------------
grant usage on schema summer to authenticated, service_role;
grant select on summer.subscription_tiers to authenticated, anon;
grant select on summer.classes to authenticated, anon;
grant select on summer.class_sessions to authenticated, anon;
grant select on summer.digital_products to authenticated, anon;
grant select on summer.testimonials to authenticated, anon;
grant select on summer.faq to authenticated, anon;
grant select on summer.admin_tips to authenticated;
grant all privileges on all tables in schema summer to service_role;

-- Seeds: subscription tiers ---------------------------------------------------
insert into summer.subscription_tiers
  (slug, title, subtitle, description, price_cents, interval, features, access_level, badge, is_featured, is_visible, sort_order)
values
  (
    'essentials-monthly',
    'Essentials',
    'Start moving with Summer',
    'On-demand library access with new classes added monthly. A confident entry point for clients who want to train with Summer on their own schedule.',
    2900,
    'month',
    jsonb_build_array(
      'Full on-demand class library',
      '2 new classes added monthly',
      'Warm-ups, mobility, strength basics',
      'Private community access',
      'Cancel anytime'
    ),
    1,
    null,
    false,
    true,
    10
  ),
  (
    'signature-monthly',
    'Signature',
    'The full program',
    'Everything in Essentials plus weekly live classes and a rotating four-week strength program. Built for clients committed to consistent results.',
    7900,
    'month',
    jsonb_build_array(
      'Everything in Essentials',
      'Weekly live classes with Summer',
      'Monthly glute-focused program',
      'Seasonal nutrition guide drops',
      '10% off private sessions',
      'Priority class booking'
    ),
    2,
    'Most Popular',
    true,
    true,
    20
  ),
  (
    'inner-circle-monthly',
    'Inner Circle',
    'Close coaching without the in-person',
    'Everything in Signature plus direct messaging with Summer, a monthly 1:1 video check-in, and your programming tuned to you. The closest thing to private training without being in LA.',
    14900,
    'month',
    jsonb_build_array(
      'Everything in Signature',
      'Monthly 1:1 video check-in with Summer',
      'DM access for form and mindset',
      'Programming tuned to your week',
      'Custom macros + meal guidance',
      'Guest pass for a friend each quarter'
    ),
    3,
    'Limited Seats',
    false,
    true,
    30
  )
on conflict (slug) do nothing;

-- Seeds: digital products -----------------------------------------------------
insert into summer.digital_products
  (slug, kind, title, subtitle, description, price_cents, includes, is_featured, is_visible, sort_order)
values
  (
    'glute-sculpt-guide',
    'guide',
    'Glute Sculpt Guide',
    'The heavy-lifting foundation.',
    'Summer''s signature glute program in a printable PDF. Six weeks of progressive strength work built around the lifts she uses with her private clients.',
    4900,
    jsonb_build_array(
      '6-week progressive strength program',
      'Heavy lifting foundations + form cues',
      'Glute-focused accessory library',
      'Warm-up + deload protocol',
      'Printable tracking sheets'
    ),
    true,
    true,
    10
  ),
  (
    'nutrition-starter-plan',
    'guide',
    'Nutrition Starter Plan',
    'Eat for the body you''re building.',
    'A realistic nutrition framework with macro guidance, grocery lists, and meal structures that fit a busy LA schedule. Not a diet — a way of eating you can keep.',
    3900,
    jsonb_build_array(
      'Macro + calorie starting points',
      'Grocery list you can actually use',
      'Breakfast, lunch, dinner frameworks',
      'Dining-out cheat sheet',
      'Hydration + supplement notes'
    ),
    false,
    true,
    20
  ),
  (
    '7-day-reset-meal-plan',
    'meal_plan',
    '7-Day Reset Meal Plan',
    'A clean restart, done right.',
    'A one-week meal plan built to get you back on rhythm without feeling punished. Real food, precise portions, minimal prep, designed for women training hard.',
    2900,
    jsonb_build_array(
      '7 days of breakfast, lunch, dinner',
      'Aligned with heavy-lifting training days',
      'Prep-ahead shopping list',
      'Snack + travel swaps',
      'Reset over, now what — next-step guide'
    ),
    false,
    true,
    30
  )
on conflict (slug) do nothing;

-- Seeds: admin tips (in-admin how-to cards) ----------------------------------
insert into summer.admin_tips (page_key, title, body, cta_label, cta_href, icon, sort_order)
values
  (
    'dashboard',
    'Turn this site into income, fast',
    'Three things move the needle: add one class to the library, publish one digital guide, and send the subscription link to your warmest DMs. Everything else is polish. Start with Stripe — the site can''t take payments until your keys are in .env.local.',
    'Connect Stripe',
    '/admin/settings',
    'bolt',
    10
  ),
  (
    'clients',
    'The point is relationships, not spreadsheets',
    'New inquiries auto-land as clients in the "lead" status. Promote them as they book or subscribe. Use the notes field to track what they told you in their first DM — your future self will thank you.',
    'Open inquiries',
    '/admin/inquiries',
    'users',
    10
  ),
  (
    'classes',
    'Stack 3–6 classes before you launch',
    'Subscribers need a reason to stay past month one. A full foundation library (warm-up, mobility, strength, glute focus, finisher, cool-down) gives Essentials tier real value. Add one new class a week to keep churn low.',
    'Add a class',
    '/admin/classes',
    'film',
    10
  ),
  (
    'plans',
    'Guides sell while you sleep',
    'Unlike coaching, digital guides are pure margin. Price them in the $29–$79 range — approachable enough to impulse-buy off Instagram. Use the preview image to show a spread of real pages, not a cover.',
    'Add a product',
    '/admin/plans',
    'book',
    10
  ),
  (
    'subscriptions',
    'Live subscriptions are your MRR',
    'Watch status transitions: active → past_due → canceled. A weekly glance here tells you what''s real and what''s churning. Clients on past_due are worth one personal outreach before you assume they''re gone.',
    'View clients',
    '/admin/clients',
    'refresh',
    10
  ),
  (
    'inquiries',
    'Reply fast, close warm',
    'A 24-hour response more than doubles your close rate. Use the status pipeline: new → contacting → qualified → won. Leave a note after every touch so nothing slips.',
    null,
    null,
    'mail',
    10
  ),
  (
    'media',
    'Photography is leverage',
    'Approve only your best frames. The gallery is what makes someone trust the subscription button. Use the image studio to reframe + clean up anything that needs it.',
    'Open image studio',
    '/admin/image-studio',
    'camera',
    10
  ),
  (
    'offers',
    'Be specific about price',
    'Vague pricing kills conversion. Put a real starting number on each offer card ("from $149 / session", "from $29 / month"). If the number scares someone off, they weren''t going to book anyway.',
    null,
    null,
    'tag',
    10
  )
on conflict (page_key) do nothing;

-- Seeds: FAQ ------------------------------------------------------------------
insert into summer.faq (topic, question, answer, sort_order)
values
  ('General', 'Where in LA does Summer train clients in person?', 'Private training is based in Playa Del Rey with clients across Manhattan Beach, Venice, Santa Monica, Marina Del Rey, and El Segundo. On-site bookings elsewhere are considered case by case.', 10),
  ('General', 'What''s the difference between online coaching and the subscription?', 'Subscriptions give you access to the class library and group programming. Online coaching is 1:1 — Summer builds your program, reviews your form, and adjusts every week. The Inner Circle tier sits in between.', 20),
  ('Training', 'I have a glute-specific goal — what''s the right starting point?', 'Start with the Glute Sculpt Guide or the Signature tier. Both are built around Summer''s heavy-lifting foundation. If you''d like form review and weekly adjustments, step up to Inner Circle.', 30),
  ('Training', 'Do I need a gym with full equipment?', 'A commercial gym or equivalent home setup (barbell, plates, bench, cable tower) gets you every class and program. A minimal-equipment track is available in the library for travel weeks.', 40),
  ('Nutrition', 'Are the meal plans allergy- or restriction-friendly?', 'The 7-Day Reset is written around flexible ingredients so most common swaps are easy (dairy-free, gluten-free, pescatarian). Clients with serious restrictions should start with Inner Circle for tailored macros.', 50),
  ('Billing', 'Can I cancel a subscription anytime?', 'Yes. Subscriptions cancel at the end of the current billing period — you keep full access until then. Manage it from your client dashboard or email hello@summerloffler-demo.com.', 60),
  ('Billing', 'Do you offer refunds on digital guides?', 'Because guides are delivered instantly, we don''t offer refunds on one-time purchases. If something isn''t right, email us within 7 days and we''ll make it right.', 70),
  ('Brand', 'Is Summer available for editorial or brand campaigns?', 'Yes — selectively. Use the inquiry form and mark "Brand / Campaign Booking" so it routes correctly. Response within one business day.', 80)
on conflict do nothing;

-- New section_content rows ----------------------------------------------------
insert into summer.section_content (section_key, eyebrow, heading, subheading, body, meta, sort_order)
values
  (
    'classes_intro',
    'Online Classes',
    'Train with Summer, wherever you are.',
    'A library built around heavy lifting, glute work, and the finishing touches that make training feel like your own. New classes drop every week.',
    jsonb_build_object('supporting', 'Every class is shot in clean, full frame so you can see exactly what the lift should look like — no loud music, no filler.'),
    '{}'::jsonb,
    25
  ),
  (
    'plans_intro',
    'Guides & Meal Plans',
    'The guides Summer built for her own clients.',
    'Printable, specific, and priced to actually try. Start with a guide, bring it to a private session, or layer it under a subscription.',
    '{}'::jsonb,
    '{}'::jsonb,
    35
  ),
  (
    'testimonials_intro',
    'Client Words',
    'Results people actually felt.',
    'Short notes from clients who started with Summer. We keep these quiet and specific — the way she coaches.',
    '{}'::jsonb,
    '{}'::jsonb,
    55
  ),
  (
    'faq_intro',
    'Questions',
    'What you''ll probably ask.',
    'The most common questions we get about training, subscriptions, and how to start.',
    '{}'::jsonb,
    '{}'::jsonb,
    65
  )
on conflict (section_key) do nothing;

-- Mark migration applied ------------------------------------------------------
insert into summer._migrations (name) values ('20260424000000_monetization_and_client_portal')
on conflict (name) do nothing;
