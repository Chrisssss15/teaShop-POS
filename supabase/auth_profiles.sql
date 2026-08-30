-- =============================================================================
-- FASE 1 AUTHENTICATION — staff profiles
-- Run this once in the Supabase SQL editor (project: TeaShop POS).
--
-- This ONLY adds a staff profile table + minimal RLS. It does not touch any
-- existing table, the order flow, payments, kitchen labels or cash sessions.
-- No admin account-management, no recursive admin RLS, no service-role usage.
-- =============================================================================

-- 1. Table --------------------------------------------------------------------
-- `role` is plain text guarded by a CHECK constraint (no PG enum).
-- 'display' = in-store TV pickup display (added later, see step 1b).
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text not null,
  role        text not null check (role in ('admin', 'manager', 'staff', 'kitchen', 'display')),
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

comment on table public.profiles is 'Staff profile + role for each auth user. FASE 1 auth.';

-- 1b. Add the 'display' role to an EXISTING profiles table -------------------
-- Run this once on databases that were created before 'display' existed.
-- Non-destructive: it only widens the CHECK constraint.
alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('admin', 'manager', 'staff', 'kitchen', 'display'));

-- 2. Table privileges -------------------------------------------------------
-- RLS still decides WHICH rows are visible (see step 3), but the role also
-- needs the base table-level SELECT privilege or Postgres rejects the query
-- with "permission denied for table profiles".
grant select on public.profiles to authenticated;

-- 3. Row Level Security ------------------------------------------------------
alter table public.profiles enable row level security;

-- A logged-in user may read ONLY their own profile row.
-- Profiles are never publicly readable and there is no public/anon policy.
drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = id);

-- NOTE: no INSERT / UPDATE / DELETE policies in FASE 1.
-- Create staff rows manually (step 4). Account management comes in FASE 2.

-- 4. Seed your staff accounts (manual) --------------------------------------
-- First create the auth users in: Authentication > Users > "Add user"
-- (set a password, confirm the email). Then copy each user's UUID and insert:
--
--   insert into public.profiles (id, full_name, role) values
--     ('00000000-0000-0000-0000-000000000000', 'Jan de Vries',  'admin'),
--     ('11111111-1111-1111-1111-111111111111', 'Kim Bakker',    'manager'),
--     ('22222222-2222-2222-2222-222222222222', 'Sam Visser',    'staff'),
--     ('33333333-3333-3333-3333-333333333333', 'Keuken Tablet', 'kitchen'),
--     ('44444444-4444-4444-4444-444444444444', 'Winkel TV',     'display');
--
-- To deactivate someone without deleting them:
--   update public.profiles set is_active = false where id = '...';
