-- =============================================================================
-- FASE 2 AUTHENTICATION — staff account management (admin only)
--
-- Run this ONCE in the Supabase SQL editor, AFTER auth_profiles.sql.
-- It does NOT touch any existing table besides adding policies/grants to
-- public.profiles, and it keeps the FASE 1 "Users can read own profile" policy.
-- Idempotent / safe to re-run.
--
-- What it adds:
--   1. public.is_admin()  — SECURITY DEFINER helper (no recursive RLS)
--   2. RLS: admins can read all profiles + update profiles
--      (with a guard so an admin cannot demote / deactivate THEMSELVES)
--   3. UPDATE grant on the 3 editable columns for `authenticated`
--   4. SELECT + INSERT grants on public.profiles for `service_role`
--
-- New auth users + profile rows are created by the `admin-users` Edge Function
-- with the service-role key (bypasses RLS) — so there is still NO insert/delete
-- policy here.
-- =============================================================================


-- 0. Service-role table privileges -----------------------------------------
-- The admin-users Edge Function uses the service-role key to verify the caller
-- profile, list profiles and create the matching profile row for new staff.
-- RLS is bypassed by service_role, but PostgreSQL table privileges are still
-- required. Only grant the operations this Edge Function actually needs.
grant select, insert on public.profiles to service_role;


-- 1. is_admin() helper -------------------------------------------------------
-- SECURITY DEFINER: runs as the function owner, so its SELECT on public.profiles
-- does NOT re-trigger the profiles RLS policies -> no infinite recursion.
-- Fixed empty search_path: every object is fully schema-qualified below.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'admin'
      and p.is_active = true
  );
$$;

comment on function public.is_admin() is
  'True when the current auth user has an active admin profile. FASE 2.';

revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;


-- 2. RLS policies on public.profiles ---------------------------------------
-- (RLS itself was already enabled in auth_profiles.sql.)
-- The FASE 1 policy "Users can read own profile" stays untouched.

-- 2a. Admins may read every profile row.
drop policy if exists "Admins can read all profiles" on public.profiles;
create policy "Admins can read all profiles"
  on public.profiles
  for select
  to authenticated
  using ( public.is_admin() );

-- 2b. Admins may update profiles (full_name / role / is_active).
--     WITH CHECK stops an admin from removing their OWN admin role or
--     deactivating their OWN account (defense-in-depth; the UI blocks it too).
drop policy if exists "Admins can update profiles" on public.profiles;
create policy "Admins can update profiles"
  on public.profiles
  for update
  to authenticated
  using ( public.is_admin() )
  with check (
    public.is_admin()
    and (
      id <> (select auth.uid())
      or (role = 'admin' and is_active = true)
    )
  );


-- 3. Column-level UPDATE grant --------------------------------------------
-- RLS still decides WHICH rows are writable (only admins, per 2b); this grant
-- only unlocks the 3 editable columns at the table-privilege level.
grant update (full_name, role, is_active) on public.profiles to authenticated;


-- =============================================================================
-- Still NOT created in FASE 2 (by design): INSERT / DELETE policies,
-- "last admin" protection beyond self, password reset, invitations.
-- =============================================================================
