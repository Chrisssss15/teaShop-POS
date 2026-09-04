-- LET OP: historisch consolidatiescript. Niet zelfstandig uitvoeren op een
-- nieuwe productieomgeving: latere hardeningscripts en actuele live-RPC's zijn
-- hierin niet verwerkt. Zie supabase/README.md voor de veilige volgorde.

begin;

-- =============================================================================
-- TEASHOP POS — STAP 5 MVP SECURITY
-- FINAL CONSOLIDATED MIGRATION
-- =============================================================================
--
-- Live gecontroleerd:
-- - create_pos_order = SECURITY DEFINER, owner postgres, veilige search_path
-- - get_customer_order_status = SECURITY DEFINER
-- - is_admin = SECURITY DEFINER
-- - MultiSafepay webhook gebruikt SUPABASE_SERVICE_ROLE_KEY
--
-- Rollen:
-- admin | manager | staff | kitchen | display
--
-- BELANGRIJK:
-- Na deze migratie:
-- 1. staff product/topping beschikbaarheid via availability-RPC's
-- 2. display pickup-data via get_pickup_board()
-- =============================================================================


-- =============================================================================
-- FASE A — ONNODIGE BROWSERPRIVILEGES INTREKKEN
-- =============================================================================

do $$
declare
  t text;
  tbls text[] := array[
    'orders',
    'order_items',
    'payments',
    'cash_movements',
    'cash_sessions',
    'kitchen_labels',
    'audit_logs',
    'daily_closings',
    'daily_closing_vat',
    'products',
    'categories',
    'toppings',
    'product_toppings',
    'product_modifier_groups',
    'modifier_groups',
    'modifier_options',
    'shop_settings'
  ];
begin
  foreach t in array tbls loop
    if to_regclass('public.' || t) is not null then
      execute format(
        'revoke truncate, trigger, references on public.%I from anon, authenticated',
        t
      );

      execute format(
        'alter table public.%I enable row level security',
        t
      );
    end if;
  end loop;
end $$;


-- =============================================================================
-- FASE B — ROLE HELPERS
-- =============================================================================

create or replace function public.has_role(p_roles text[])
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
      and p.is_active = true
      and p.role = any(p_roles)
  );
$$;

comment on function public.has_role(text[]) is
  'Controleert of huidige gebruiker een actief profiel heeft met een van de opgegeven rollen.';


create or replace function public.is_staff()
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
      and p.is_active = true
      and p.role in (
        'admin',
        'manager',
        'staff',
        'kitchen',
        'display'
      )
  );
$$;


create or replace function public.is_customer_qr_order(
  p_order_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.orders o
    where o.id = p_order_id
      and o.order_type = 'customer'
      and o.channel = 'qr'
  );
$$;


revoke all
  on function public.has_role(text[])
  from public, anon;

revoke all
  on function public.is_staff()
  from public, anon;

revoke all
  on function public.is_customer_qr_order(uuid)
  from public;


grant execute
  on function public.has_role(text[])
  to authenticated;

grant execute
  on function public.is_staff()
  to authenticated;

grant execute
  on function public.is_customer_qr_order(uuid)
  to anon, authenticated;


-- =============================================================================
-- FASE C — OUDE POLICIES VERWIJDEREN
-- =============================================================================

do $$
declare
  pol record;
begin
  for pol in
    select
      policyname,
      tablename
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'orders',
        'order_items',
        'payments',
        'cash_movements',
        'cash_sessions',
        'kitchen_labels',
        'audit_logs',
        'daily_closings',
        'daily_closing_vat',
        'products',
        'categories',
        'toppings',
        'product_toppings',
        'product_modifier_groups',
        'modifier_groups',
        'modifier_options',
        'shop_settings'
      )
  loop
    execute format(
      'drop policy if exists %I on public.%I',
      pol.policyname,
      pol.tablename
    );
  end loop;
end $$;


drop trigger if exists
  orders_freeze_financials
  on public.orders;


-- =============================================================================
-- FASE D — ORDERS
-- =============================================================================

revoke all
  on public.orders
  from anon, authenticated;


-- Authenticated:
-- alleen lezen/updaten.
-- POS INSERT gebeurt uitsluitend via create_pos_order SECURITY DEFINER.
grant select, update
  on public.orders
  to authenticated;


-- Anonymous customer/QR-flow:
grant insert, delete
  on public.orders
  to anon;


-- ---------------------------------------------------------------------------
-- Staff read
-- Display is hier expres NIET toegestaan.
-- ---------------------------------------------------------------------------

create policy "orders: staff read"
  on public.orders
  for select
  to authenticated
  using (
    public.has_role(
      array[
        'admin',
        'manager',
        'staff',
        'kitchen'
      ]
    )
  );


-- ---------------------------------------------------------------------------
-- Anonymous customer QR insert
-- ---------------------------------------------------------------------------

create policy "orders: customer insert"
  on public.orders
  for insert
  to anon
  with check (
    order_type = 'customer'
    and channel = 'qr'
    and status = 'new'
    and payment_status in (
      'pending',
      'unpaid'
    )
    and paid_at is null
    and coalesce(total, 0) >= 0
  );


-- ---------------------------------------------------------------------------
-- Operationele orderupdates
-- ---------------------------------------------------------------------------

create policy "orders: staff update"
  on public.orders
  for update
  to authenticated
  using (
    public.has_role(
      array[
        'admin',
        'manager',
        'staff',
        'kitchen'
      ]
    )
  )
  with check (
    public.has_role(
      array[
        'admin',
        'manager',
        'staff',
        'kitchen'
      ]
    )
  );


-- ---------------------------------------------------------------------------
-- Customer rollback indien order_items aanmaken mislukt
-- ---------------------------------------------------------------------------

create policy "orders: customer rollback delete"
  on public.orders
  for delete
  to anon
  using (
    order_type = 'customer'
    and channel = 'qr'
    and payment_status in (
      'pending',
      'unpaid'
    )
    and created_at > now() - interval '15 minutes'
  );


-- =============================================================================
-- ORDER UPDATE FIELD PROTECTION
-- =============================================================================
--
-- Staff/kitchen mogen uitsluitend operationele statusvelden wijzigen.
-- Admin/manager en service_role blijven vrijgesteld.
-- =============================================================================

create or replace function public.orders_freeze_financials()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin

  -- Service role / server-side systeemcontext.
  if (select auth.uid()) is null then
    return new;
  end if;


  -- Admin en manager mogen bestaande beheerflows uitvoeren.
  if public.has_role(
    array[
      'admin',
      'manager'
    ]
  ) then
    return new;
  end if;


  -- Staff / kitchen mogen uitsluitend onderstaande velden wijzigen:
  --
  -- status
  -- updated_at
  -- completed_at
  -- cancelled_at
  -- cancel_reason
  -- cancelled_by
  --
  -- Elke andere kolomwijziging wordt geblokkeerd.

  if
    (
      to_jsonb(new)
      - array[
          'status',
          'updated_at',
          'completed_at',
          'cancelled_at',
          'cancel_reason',
          'cancelled_by'
        ]::text[]
    )
    is distinct from
    (
      to_jsonb(old)
      - array[
          'status',
          'updated_at',
          'completed_at',
          'cancelled_at',
          'cancel_reason',
          'cancelled_by'
        ]::text[]
    )
  then
    raise exception 'ORDER_FIELDS_LOCKED'
      using errcode = 'P0001';
  end if;


  return new;

end;
$$;


comment on function public.orders_freeze_financials() is
  'Staff/kitchen mogen alleen operationele orderstatus/cancelvelden wijzigen. Andere ordervelden zijn beschermd.';


create trigger orders_freeze_financials
  before update on public.orders
  for each row
  execute function public.orders_freeze_financials();


-- =============================================================================
-- ORDER ITEMS
-- =============================================================================

revoke all
  on public.order_items
  from anon, authenticated;


grant select
  on public.order_items
  to authenticated;

grant insert
  on public.order_items
  to anon;


create policy "order_items: staff read"
  on public.order_items
  for select
  to authenticated
  using (
    public.has_role(
      array[
        'admin',
        'manager',
        'staff',
        'kitchen'
      ]
    )
  );


create policy "order_items: customer insert"
  on public.order_items
  for insert
  to anon
  with check (
    public.is_customer_qr_order(
      order_items.order_id
    )
  );


-- =============================================================================
-- PAYMENTS
-- =============================================================================

revoke all
  on public.payments
  from anon, authenticated;


-- POS/staff payment INSERT gebeurt via create_pos_order.
grant select, update
  on public.payments
  to authenticated;


-- Customer MultiSafepay flow.
grant select, insert
  on public.payments
  to anon;


grant update (
  status,
  failed_at,
  failure_reason,
  payment_url,
  provider_order_id
)
  on public.payments
  to anon;


create policy "payments: staff read"
  on public.payments
  for select
  to authenticated
  using (
    public.has_role(
      array[
        'admin',
        'manager',
        'staff'
      ]
    )
  );


create policy "payments: customer read own provider"
  on public.payments
  for select
  to anon
  using (
    provider = 'multisafepay'
  );


create policy "payments: customer insert"
  on public.payments
  for insert
  to anon
  with check (
    provider = 'multisafepay'
    and status = 'pending'
    and payment_method = 'online_fake'
    and public.is_customer_qr_order(
      payments.order_id
    )
  );


create policy "payments: customer update pending"
  on public.payments
  for update
  to anon
  using (
    provider = 'multisafepay'
    and status = 'pending'
  )
  with check (
    provider = 'multisafepay'
    and status in (
      'pending',
      'failed'
    )
  );


create policy "payments: manager update"
  on public.payments
  for update
  to authenticated
  using (
    public.has_role(
      array[
        'admin',
        'manager'
      ]
    )
  )
  with check (
    public.has_role(
      array[
        'admin',
        'manager'
      ]
    )
  );


-- =============================================================================
-- KITCHEN LABELS
-- =============================================================================

revoke all
  on public.kitchen_labels
  from anon, authenticated;


grant select, update
  on public.kitchen_labels
  to authenticated;


grant select
  on public.kitchen_labels
  to anon;


create policy "kitchen_labels: staff read"
  on public.kitchen_labels
  for select
  to authenticated
  using (
    public.has_role(
      array[
        'admin',
        'manager',
        'staff',
        'kitchen'
      ]
    )
  );


-- kitchen_labels.order_id is in jouw live schema TEXT.
-- Daarom expliciete cast naar UUID.
create policy "kitchen_labels: customer read"
  on public.kitchen_labels
  for select
  to anon
  using (
    public.is_customer_qr_order(
      kitchen_labels.order_id::uuid
    )
  );


create policy "kitchen_labels: staff update"
  on public.kitchen_labels
  for update
  to authenticated
  using (
    public.has_role(
      array[
        'admin',
        'manager',
        'staff',
        'kitchen'
      ]
    )
  )
  with check (
    public.has_role(
      array[
        'admin',
        'manager',
        'staff',
        'kitchen'
      ]
    )
  );


-- =============================================================================
-- CASH SESSIONS
-- =============================================================================

revoke all
  on public.cash_sessions
  from anon, authenticated;


grant select, insert, update
  on public.cash_sessions
  to authenticated;


create policy "cash_sessions: manager read"
  on public.cash_sessions
  for select
  to authenticated
  using (
    public.has_role(
      array[
        'admin',
        'manager'
      ]
    )
  );


create policy "cash_sessions: manager insert"
  on public.cash_sessions
  for insert
  to authenticated
  with check (
    public.has_role(
      array[
        'admin',
        'manager'
      ]
    )
  );


create policy "cash_sessions: manager update"
  on public.cash_sessions
  for update
  to authenticated
  using (
    public.has_role(
      array[
        'admin',
        'manager'
      ]
    )
  )
  with check (
    public.has_role(
      array[
        'admin',
        'manager'
      ]
    )
  );


-- =============================================================================
-- CASH MOVEMENTS
-- =============================================================================

revoke all
  on public.cash_movements
  from anon, authenticated;


grant select, insert
  on public.cash_movements
  to authenticated;


create policy "cash_movements: manager read"
  on public.cash_movements
  for select
  to authenticated
  using (
    public.has_role(
      array[
        'admin',
        'manager'
      ]
    )
  );


create policy "cash_movements: manager insert"
  on public.cash_movements
  for insert
  to authenticated
  with check (
    public.has_role(
      array[
        'admin',
        'manager'
      ]
    )
    and movement_type in (
      'cash_in',
      'cash_out',
      'refund'
    )
  );


-- =============================================================================
-- AUDIT LOGS
-- =============================================================================

revoke all
  on public.audit_logs
  from anon, authenticated;


grant insert, select
  on public.audit_logs
  to authenticated;


create policy "audit_logs: admin read"
  on public.audit_logs
  for select
  to authenticated
  using (
    public.has_role(
      array['admin']
    )
  );


create policy "audit_logs: staff append"
  on public.audit_logs
  for insert
  to authenticated
  with check (
    public.has_role(
      array[
        'admin',
        'manager',
        'staff',
        'kitchen'
      ]
    )
  );


-- =============================================================================
-- DAILY CLOSINGS
-- =============================================================================

revoke all
  on public.daily_closings
  from anon, authenticated;


grant select, insert, update, delete
  on public.daily_closings
  to authenticated;


create policy "daily_closings: manager all"
  on public.daily_closings
  for all
  to authenticated
  using (
    public.has_role(
      array[
        'admin',
        'manager'
      ]
    )
  )
  with check (
    public.has_role(
      array[
        'admin',
        'manager'
      ]
    )
  );


-- Optional daily_closing_vat table.
do $$
begin

  if to_regclass('public.daily_closing_vat') is not null then

    execute '
      revoke all
      on public.daily_closing_vat
      from anon, authenticated
    ';

    execute '
      grant select, insert, update, delete
      on public.daily_closing_vat
      to authenticated
    ';

    execute '
      alter table public.daily_closing_vat
      enable row level security
    ';

    execute $policy$
      create policy "daily_closing_vat: manager all"
        on public.daily_closing_vat
        for all
        to authenticated
        using (
          public.has_role(
            array['admin','manager']
          )
        )
        with check (
          public.has_role(
            array['admin','manager']
          )
        )
    $policy$;

  end if;

end $$;


-- =============================================================================
-- PRODUCTS
-- =============================================================================

revoke all
  on public.products
  from anon, authenticated;


grant select
  on public.products
  to anon;


grant select, insert, update, delete
  on public.products
  to authenticated;


create policy "products: public read"
  on public.products
  for select
  to anon
  using (
    pos_only is not true
  );


create policy "products: staff read"
  on public.products
  for select
  to authenticated
  using (true);


create policy "products: manager insert"
  on public.products
  for insert
  to authenticated
  with check (
    public.has_role(
      array[
        'admin',
        'manager'
      ]
    )
  );


create policy "products: manager update"
  on public.products
  for update
  to authenticated
  using (
    public.has_role(
      array[
        'admin',
        'manager'
      ]
    )
  )
  with check (
    public.has_role(
      array[
        'admin',
        'manager'
      ]
    )
  );


create policy "products: manager delete"
  on public.products
  for delete
  to authenticated
  using (
    public.has_role(
      array[
        'admin',
        'manager'
      ]
    )
  );


-- =============================================================================
-- CATEGORIES
-- =============================================================================

revoke all
  on public.categories
  from anon, authenticated;


grant select
  on public.categories
  to anon;


grant select, insert, update, delete
  on public.categories
  to authenticated;


create policy "categories: public read"
  on public.categories
  for select
  to anon
  using (true);


create policy "categories: staff read"
  on public.categories
  for select
  to authenticated
  using (true);


create policy "categories: manager write"
  on public.categories
  for all
  to authenticated
  using (
    public.has_role(
      array[
        'admin',
        'manager'
      ]
    )
  )
  with check (
    public.has_role(
      array[
        'admin',
        'manager'
      ]
    )
  );


-- =============================================================================
-- TOPPINGS
-- =============================================================================

revoke all
  on public.toppings
  from anon, authenticated;


grant select
  on public.toppings
  to anon;


grant select, insert, update, delete
  on public.toppings
  to authenticated;


create policy "toppings: public read"
  on public.toppings
  for select
  to anon
  using (true);


create policy "toppings: staff read"
  on public.toppings
  for select
  to authenticated
  using (true);


create policy "toppings: manager write"
  on public.toppings
  for all
  to authenticated
  using (
    public.has_role(
      array[
        'admin',
        'manager'
      ]
    )
  )
  with check (
    public.has_role(
      array[
        'admin',
        'manager'
      ]
    )
  );


-- =============================================================================
-- PRODUCT TOPPINGS
-- =============================================================================

revoke all
  on public.product_toppings
  from anon, authenticated;


grant select
  on public.product_toppings
  to anon;


grant select, insert, update, delete
  on public.product_toppings
  to authenticated;


alter table public.product_toppings
  enable row level security;


create policy "product_toppings: public read"
  on public.product_toppings
  for select
  to anon
  using (true);


create policy "product_toppings: staff read"
  on public.product_toppings
  for select
  to authenticated
  using (true);


create policy "product_toppings: manager write"
  on public.product_toppings
  for all
  to authenticated
  using (
    public.has_role(
      array[
        'admin',
        'manager'
      ]
    )
  )
  with check (
    public.has_role(
      array[
        'admin',
        'manager'
      ]
    )
  );


-- =============================================================================
-- PRODUCT MODIFIER GROUPS
-- =============================================================================

do $$
begin

  if to_regclass('public.product_modifier_groups') is not null then

    execute '
      revoke all
      on public.product_modifier_groups
      from anon, authenticated
    ';

    execute '
      grant select
      on public.product_modifier_groups
      to anon, authenticated
    ';

    execute '
      grant insert, update, delete
      on public.product_modifier_groups
      to authenticated
    ';

    execute '
      alter table public.product_modifier_groups
      enable row level security
    ';


    execute $policy$
      create policy "pmg: public read"
        on public.product_modifier_groups
        for select
        to anon
        using (true)
    $policy$;


    execute $policy$
      create policy "pmg: staff read"
        on public.product_modifier_groups
        for select
        to authenticated
        using (true)
    $policy$;


    execute $policy$
      create policy "pmg: manager write"
        on public.product_modifier_groups
        for all
        to authenticated
        using (
          public.has_role(
            array['admin','manager']
          )
        )
        with check (
          public.has_role(
            array['admin','manager']
          )
        )
    $policy$;

  end if;

end $$;


-- =============================================================================
-- MODIFIER GROUPS
-- =============================================================================

revoke all
  on public.modifier_groups
  from anon, authenticated;


grant select
  on public.modifier_groups
  to anon, authenticated;


grant insert, update, delete
  on public.modifier_groups
  to authenticated;


create policy "modifier_groups: public read"
  on public.modifier_groups
  for select
  to anon
  using (true);


create policy "modifier_groups: staff read"
  on public.modifier_groups
  for select
  to authenticated
  using (true);


create policy "modifier_groups: manager write"
  on public.modifier_groups
  for all
  to authenticated
  using (
    public.has_role(
      array[
        'admin',
        'manager'
      ]
    )
  )
  with check (
    public.has_role(
      array[
        'admin',
        'manager'
      ]
    )
  );


-- =============================================================================
-- MODIFIER OPTIONS
-- =============================================================================

revoke all
  on public.modifier_options
  from anon, authenticated;


grant select
  on public.modifier_options
  to anon, authenticated;


grant insert, update, delete
  on public.modifier_options
  to authenticated;


create policy "modifier_options: public read"
  on public.modifier_options
  for select
  to anon
  using (true);


create policy "modifier_options: staff read"
  on public.modifier_options
  for select
  to authenticated
  using (true);


create policy "modifier_options: manager write"
  on public.modifier_options
  for all
  to authenticated
  using (
    public.has_role(
      array[
        'admin',
        'manager'
      ]
    )
  )
  with check (
    public.has_role(
      array[
        'admin',
        'manager'
      ]
    )
  );


-- =============================================================================
-- SHOP SETTINGS
-- =============================================================================

revoke all
  on public.shop_settings
  from anon, authenticated;


grant select
  on public.shop_settings
  to anon;


grant select, insert, update
  on public.shop_settings
  to authenticated;


create policy "shop_settings: public read row 1"
  on public.shop_settings
  for select
  to anon
  using (
    id = 1
  );


create policy "shop_settings: staff read"
  on public.shop_settings
  for select
  to authenticated
  using (true);


create policy "shop_settings: manager write"
  on public.shop_settings
  for all
  to authenticated
  using (
    public.has_role(
      array[
        'admin',
        'manager'
      ]
    )
  )
  with check (
    public.has_role(
      array[
        'admin',
        'manager'
      ]
    )
  );


-- =============================================================================
-- AVAILABILITY RPC — PRODUCT
-- =============================================================================

create or replace function public.set_product_availability(
  p_product_id uuid,
  p_is_sold_out boolean default null,
  p_is_active boolean default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin

  if not public.has_role(
    array[
      'admin',
      'manager',
      'staff'
    ]
  ) then
    raise exception 'UNAUTHORIZED'
      using errcode = 'P0001';
  end if;


  update public.products
  set
    is_sold_out = coalesce(
      p_is_sold_out,
      is_sold_out
    ),
    is_active = coalesce(
      p_is_active,
      is_active
    )
  where id = p_product_id;

end;
$$;


-- =============================================================================
-- AVAILABILITY RPC — TEA TYPE
-- =============================================================================

create or replace function public.set_tea_type_availability(
  p_tea_type text,
  p_is_sold_out boolean
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin

  if not public.has_role(
    array[
      'admin',
      'manager',
      'staff'
    ]
  ) then
    raise exception 'UNAUTHORIZED'
      using errcode = 'P0001';
  end if;


  update public.products
  set is_sold_out = p_is_sold_out
  where product_type = 'drink'
    and tea_type = p_tea_type;


  get diagnostics v_count = row_count;


  return v_count;

end;
$$;


-- =============================================================================
-- AVAILABILITY RPC — TOPPING
-- =============================================================================

create or replace function public.set_topping_availability(
  p_topping_id uuid,
  p_is_sold_out boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin

  if not public.has_role(
    array[
      'admin',
      'manager',
      'staff'
    ]
  ) then
    raise exception 'UNAUTHORIZED'
      using errcode = 'P0001';
  end if;


  update public.toppings
  set is_sold_out = p_is_sold_out
  where id = p_topping_id;

end;
$$;


revoke all
  on function public.set_product_availability(
    uuid,
    boolean,
    boolean
  )
  from public, anon;


revoke all
  on function public.set_tea_type_availability(
    text,
    boolean
  )
  from public, anon;


revoke all
  on function public.set_topping_availability(
    uuid,
    boolean
  )
  from public, anon;


grant execute
  on function public.set_product_availability(
    uuid,
    boolean,
    boolean
  )
  to authenticated;


grant execute
  on function public.set_tea_type_availability(
    text,
    boolean
  )
  to authenticated;


grant execute
  on function public.set_topping_availability(
    uuid,
    boolean
  )
  to authenticated;


-- =============================================================================
-- PICKUP BOARD RPC
-- =============================================================================

create or replace function public.get_pickup_board()
returns table (
  id uuid,
  order_number text,
  pickup_code text,
  status text,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin

  if not public.has_role(
    array[
      'admin',
      'manager',
      'staff',
      'kitchen',
      'display'
    ]
  ) then
    raise exception 'UNAUTHORIZED'
      using errcode = 'P0001';
  end if;


  return query

  select
    o.id,
    o.order_number::text,
    o.pickup_code::text,
    o.status::text,
    o.created_at
  from public.orders o
  where
    o.created_at >= (
      now() at time zone 'utc'
    )::date
    and o.status::text in (
      'new',
      'preparing',
      'ready'
    )
  order by o.created_at asc;

end;
$$;


revoke all
  on function public.get_pickup_board()
  from public, anon;


grant execute
  on function public.get_pickup_board()
  to authenticated;


-- =============================================================================
-- PICKUP BOARD VIEW
-- =============================================================================
--
-- Niet direct beschikbaar voor browserrollen.
-- De frontend moet get_pickup_board() gebruiken.
-- =============================================================================

create or replace view public.pickup_board as
select
  id,
  order_number,
  pickup_code,
  status,
  created_at
from public.orders
where status in (
  'new',
  'preparing',
  'ready'
);


revoke all
  on public.pickup_board
  from public, anon, authenticated;


-- =============================================================================
-- CREATE_POS_ORDER EXECUTE HARDENING
-- =============================================================================
--
-- Bestaande live functie is al gecontroleerd:
-- SECURITY DEFINER + postgres owner + veilige search_path.
-- Alleen authenticated mag hem gebruiken.
-- =============================================================================

revoke all
  on function public.create_pos_order
  from public, anon;


grant execute
  on function public.create_pos_order
  to authenticated;


-- =============================================================================
-- EINDE
-- =============================================================================

commit;
