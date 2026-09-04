-- =============================================================================
-- TeaShop security 009 — atomaire Edge Function rate limiting
--
-- Benodigd door create-customer-checkout-v2. Het ruwe IP-adres of request-id
-- wordt nooit opgeslagen; de Edge Function stuurt alleen een HMAC-SHA256-hash.
-- =============================================================================

begin;

create table if not exists public.edge_rate_limits (
  bucket_key text primary key,
  request_count integer not null default 0,
  window_started_at timestamptz not null default now()
);

alter table public.edge_rate_limits enable row level security;

-- Geen enkele browserrol en ook service_role mag rechtstreeks in de tabel.
-- service_role mag uitsluitend de gecontroleerde SECURITY DEFINER-functie
-- uitvoeren.
revoke all on table public.edge_rate_limits
  from public, anon, authenticated, service_role;

create or replace function public.consume_edge_rate_limit(
  p_scope text,
  p_key_hash text,
  p_limit integer,
  p_window_seconds integer
)
returns table (
  allowed boolean,
  remaining integer,
  retry_after_seconds integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_now timestamptz := clock_timestamp();
  v_window interval;
  v_bucket_key text;
  v_count integer;
  v_window_started_at timestamptz;
begin
  if p_scope is null
    or p_scope !~ '^[a-z0-9_]{1,64}$'
    or p_key_hash is null
    or p_key_hash !~ '^[a-f0-9]{64}$'
    or p_limit < 1
    or p_limit > 10000
    or p_window_seconds < 1
    or p_window_seconds > 86400
  then
    raise exception 'Ongeldige rate-limitparameters';
  end if;

  v_window := p_window_seconds * interval '1 second';
  v_bucket_key := p_scope || ':' || p_key_hash;

  insert into public.edge_rate_limits as limits (
    bucket_key,
    request_count,
    window_started_at
  )
  values (
    v_bucket_key,
    1,
    v_now
  )
  on conflict (bucket_key) do update
  set
    request_count = case
      when limits.window_started_at <= v_now - v_window then 1
      else limits.request_count + 1
    end,
    window_started_at = case
      when limits.window_started_at <= v_now - v_window then v_now
      else limits.window_started_at
    end
  returning request_count, window_started_at
  into v_count, v_window_started_at;

  allowed := v_count <= p_limit;
  remaining := greatest(p_limit - v_count, 0);
  retry_after_seconds := case
    when allowed then 0
    else greatest(
      1,
      ceil(
        extract(epoch from (v_window_started_at + v_window - v_now))
      )::integer
    )
  end;

  return next;
end
$$;

alter function public.consume_edge_rate_limit(text, text, integer, integer)
  owner to postgres;

revoke all
  on function public.consume_edge_rate_limit(text, text, integer, integer)
  from public, anon, authenticated, service_role;

grant execute
  on function public.consume_edge_rate_limit(text, text, integer, integer)
  to service_role;

create index if not exists edge_rate_limits_window_started_at_idx
  on public.edge_rate_limits (window_started_at);

commit;

-- VERIFICATIE: alle kolommen horen TRUE te zijn.
select
  c.relrowsecurity as rls_enabled,
  not has_table_privilege('anon', c.oid, 'SELECT,INSERT,UPDATE,DELETE')
    as anon_table_blocked,
  not has_table_privilege('authenticated', c.oid, 'SELECT,INSERT,UPDATE,DELETE')
    as authenticated_table_blocked,
  not has_table_privilege('service_role', c.oid, 'SELECT,INSERT,UPDATE,DELETE')
    as service_role_direct_table_blocked,
  not has_function_privilege(
    'anon',
    'public.consume_edge_rate_limit(text,text,integer,integer)',
    'EXECUTE'
  ) as anon_execute_blocked,
  not has_function_privilege(
    'authenticated',
    'public.consume_edge_rate_limit(text,text,integer,integer)',
    'EXECUTE'
  ) as authenticated_execute_blocked,
  has_function_privilege(
    'service_role',
    'public.consume_edge_rate_limit(text,text,integer,integer)',
    'EXECUTE'
  ) as service_role_can_execute
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname = 'edge_rate_limits';
