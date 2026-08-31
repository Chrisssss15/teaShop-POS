-- =============================================================================
-- STAP 2 — Atomaire staff/POS order-RPC:  public.create_pos_order
--
-- Run this ONCE in the Supabase SQL editor, NA auth_profiles.sql / auth_admin_users.sql.
-- Idempotent / veilig te herhalen: alleen `create or replace function` + revoke/grant.
--
-- WAT DIT DOET
--   Vervangt de losse client-side write-keten in submitOrder()
--   (orders + order_items + payments + cash_movements + kitchen_labels) door
--   EEN atomaire transactie. Bij ELKE fout: raise exception -> PostgreSQL rolt
--   de volledige function-transactie terug. Geen half-opgeslagen order meer,
--   geen handmatige DELETE-rollback meer nodig in de frontend.
--
-- SCOPE (bewust beperkt)
--   * Alleen staff/POS: p_payment_method IN ('cash','card').
--   * NIET: customer/QR, MultiSafepay, pay_at_counter, online_fake.
--   * Modifiers (modifier_option_ids) worden NIET ondersteund -> foutcode.
--
-- BUITEN DEZE FUNCTIE (blijft in de frontend, ongewijzigd)
--   Epson-bon, Zebra/print-bridge, printworker-lifecycle, realtime, render(),
--   cart reset, succes-UI. De printworker pikt de kitchen_labels
--   (print_status = 'pending') zoals altijd zelf op via realtime.
--
-- VEREIST — bestaat al, NIET opnieuw aanmaken
--   * public.orders.client_request_id uuid
--   * unieke partial index  orders_client_request_id_key
--       on public.orders (client_request_id) where client_request_id is not null
--   * unieke constraint     orders_order_number_key  on public.orders (order_number)
--
-- SECURITY
--   SECURITY DEFINER + SET search_path = '' + EXPLICIETE autorisatie in de body:
--   auth.uid() -> public.profiles, vereist is_active = true en
--   role in ('admin','manager','staff'). anon / kitchen / display / onbekende
--   of inactieve gebruikers worden geweigerd (UNAUTHORIZED).
--   De bestaande RLS-policies en directe table-grants worden NIET aangepast;
--   die blijven bestaan zodat we veilig kunnen migreren en testen.
--
-- CLIENT-INPUT WORDT NOOIT ALS BRON VAN WAARHEID GEBRUIKT VOOR
--   base/medium/large price, topping price, unit_price, original_unit_price,
--   line_total, subtotal, total, net/vat/gross_total, discount_type/value/amount,
--   vat_rate, payment_status, payment-bedrag, order_number, pickup_code.
--   Alles hierboven wordt server-side (her)berekend uit products / toppings /
--   categories. p_expected_total is UITSLUITEND een cross-check.
--
-- RETURN (jsonb) — bevat exact wat de bestaande POS-succes- + Epson-bon-flow
--   nodig heeft, ook bij idempotent replay (reused = true). Zie onderaan.
-- =============================================================================


create or replace function public.create_pos_order(
  p_client_request_id uuid,
  p_payment_method    text,
  p_expected_total    numeric,
  p_items             jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  -- caller / authorisatie
  v_uid            uuid := auth.uid();
  v_role           text;
  v_is_active      boolean;

  -- config / tijd
  v_now            timestamptz := now();
  v_cash_enabled   boolean;
  v_cash_session_id uuid;

  -- idempotency / eindmontage
  v_reused         boolean := false;
  v_ord            public.orders%rowtype;
  v_result_items   jsonb := '[]'::jsonb;
  v_cash_movement_id uuid;
  v_label_count    integer := 0;

  -- item-lus (input)
  v_item           jsonb;
  v_product_id     text;
  v_qty            integer;
  v_cup_size       text;
  v_ice_level      text;
  v_sugar_level    text;

  -- item-lus (product)
  v_prod           public.products%rowtype;
  v_sizes          text[];
  v_allowed_ice    text[];
  v_allowed_sugar  text[];

  -- toppings
  v_tid_text       text;
  v_topping_id     uuid;
  v_top            public.toppings%rowtype;
  v_link_ok        boolean;
  v_toppings_total numeric;
  v_toppings_snapshot jsonb;

  -- korting
  v_disc_type      text;
  v_disc_value     numeric;
  v_cat_type       text;
  v_cat_value      numeric;

  -- geld per regel (zelfde rondingsvolgorde als de frontend)
  v_size_price     numeric;
  v_discounted_size numeric;
  v_unit_raw       numeric;
  v_orig_unit      numeric;
  v_unit_price     numeric;
  v_disc_per_unit  numeric;
  v_disc_amount    numeric;
  v_gross          numeric;
  v_vat_rate       numeric;
  v_vat            numeric;
  v_net            numeric;

  -- accumulatoren
  v_lines          jsonb := '[]'::jsonb;
  v_line           jsonb;
  v_net_total      numeric := 0;
  v_vat_total      numeric := 0;
  v_gross_total    numeric := 0;
  v_amount_cents   integer := 0;

  -- writes
  v_order_id       uuid;
  v_order_item_id  text;
  v_order_number   text;
  v_pickup_code    text;
  v_payment_id     uuid;
  v_attempt        integer;
  v_pc_attempt     integer;
  v_constraint     text;
  v_i              integer;

  c_uuid_re    constant text   :=
    '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$';
  -- Exact gelijk aan de runtime ICE_LEVELS in de POS-frontend (src/main.ts).
  -- 'extra_ice' staat wel in de IceLevel-union maar NIET in de runtime-array,
  -- dus de POS-customizer kan het nooit produceren -> hier ook niet toestaan.
  c_ice_all    constant text[] := array['no_ice','less_ice','normal_ice','warm'];
  c_sugar_all  constant text[] := array['none','minimal','less','normal','sweet'];
begin
  -- ---------------------------------------------------------------------------
  -- 1. AUTORISATIE — nooit uit de request-body
  -- ---------------------------------------------------------------------------
  if v_uid is null then
    raise exception 'UNAUTHORIZED' using errcode = 'P0001';
  end if;

  select p.role, p.is_active
    into v_role, v_is_active
  from public.profiles p
  where p.id = v_uid;

  if not found
     or v_is_active is not true
     or v_role not in ('admin','manager','staff') then
    raise exception 'UNAUTHORIZED' using errcode = 'P0001';
  end if;

  -- ---------------------------------------------------------------------------
  -- 2. BASIS-INPUT
  -- ---------------------------------------------------------------------------
  if p_client_request_id is null then
    raise exception 'INVALID_REQUEST' using errcode = 'P0001';
  end if;

  if p_payment_method is null or p_payment_method not in ('cash','card') then
    raise exception 'INVALID_PAYMENT_METHOD' using errcode = 'P0001';
  end if;

  if p_items is null
     or jsonb_typeof(p_items) <> 'array'
     or jsonb_array_length(p_items) = 0 then
    raise exception 'EMPTY_ORDER' using errcode = 'P0001';
  end if;

  -- ---------------------------------------------------------------------------
  -- 3. IDEMPOTENCY — bestaat deze afrekenpoging al?
  -- ---------------------------------------------------------------------------
  select o.id into v_order_id
  from public.orders o
  where o.client_request_id = p_client_request_id;

  if found then
    v_reused := true;
  end if;

  -- ===========================================================================
  -- NIEUWE ORDER — alle validatie + writes overslaan bij een idempotent replay
  -- ===========================================================================
  if not v_reused then

    -- -------------------------------------------------------------------------
    -- 4. ITEMS VALIDEREN + PRIJS / KORTING / BTW SERVER-SIDE BEREKENEN
    -- -------------------------------------------------------------------------
    for v_item in select * from jsonb_array_elements(p_items)
    loop
      -- modifiers nog niet ondersteund
      if jsonb_typeof(v_item->'modifier_option_ids') = 'array'
         and jsonb_array_length(v_item->'modifier_option_ids') > 0 then
        raise exception 'MODIFIERS_NOT_SUPPORTED' using errcode = 'P0001';
      end if;

      v_product_id := nullif(v_item->>'product_id', '');
      if v_product_id is null or v_product_id !~ c_uuid_re then
        raise exception 'PRODUCT_NOT_FOUND' using errcode = 'P0001';
      end if;

      -- quantity: integer > 0. Geen bovengrens (bestaat ook niet in de huidige
      -- POS/cart-flow); kitchen-label-lus loopt gewoon 1..quantity.
      v_qty := floor(coalesce((v_item->>'quantity')::numeric, 0))::int;
      if v_qty is null or v_qty <= 0 then
        raise exception 'INVALID_QUANTITY' using errcode = 'P0001';
      end if;

      v_cup_size    := nullif(v_item->>'cup_size', '');
      v_ice_level   := nullif(v_item->>'ice_level', '');
      v_sugar_level := nullif(v_item->>'sugar_level', '');

      select * into v_prod from public.products where id = v_product_id::uuid;
      if not found then
        raise exception 'PRODUCT_NOT_FOUND' using errcode = 'P0001';
      end if;
      if v_prod.is_active is not true then
        raise exception 'PRODUCT_INACTIVE' using errcode = 'P0001', detail = v_prod.name;
      end if;
      if v_prod.is_sold_out is true then
        raise exception 'PRODUCT_SOLD_OUT' using errcode = 'P0001', detail = v_prod.name;
      end if;

      -- ---- maten: mirror getProductAvailableSizes / getSafeCupSizeForProduct ----
      v_sizes := array(
        select s
        from unnest(coalesce(v_prod.available_sizes, array[]::text[])) s
        where s in ('medium','large')
      );
      if array_length(v_sizes, 1) is null then
        v_sizes := array['medium'];
      end if;

      if v_prod.product_type = 'drink' then
        if v_cup_size is null then
          v_cup_size := case when 'medium' = any(v_sizes) then 'medium' else v_sizes[1] end;
        elsif not (v_cup_size = any(v_sizes)) then
          raise exception 'INVALID_SIZE' using errcode = 'P0001', detail = v_prod.name;
        end if;
      end if;
      -- product_type 'item': cup_size beinvloedt de prijs niet (zie maatprijs
      -- hieronder); de aangeleverde waarde blijft ongewijzigd, net als nu.

      -- ---- ijs / suiker: geen nieuwe waarden, respecteer productconfiguratie ----
      if v_ice_level is not null and not (v_ice_level = any(c_ice_all)) then
        raise exception 'INVALID_ICE_LEVEL' using errcode = 'P0001', detail = v_prod.name;
      end if;
      if v_sugar_level is not null and not (v_sugar_level = any(c_sugar_all)) then
        raise exception 'INVALID_SUGAR_LEVEL' using errcode = 'P0001', detail = v_prod.name;
      end if;

      if v_prod.product_type = 'drink'
         and coalesce(v_prod.allow_ice_customization, true) then
        v_allowed_ice := array(
          select lvl
          from unnest(
            case
              when v_cup_size = 'medium'
                   and coalesce(array_length(v_prod.medium_allowed_ice_levels, 1), 0) > 0
                then v_prod.medium_allowed_ice_levels
              when v_cup_size = 'large'
                   and coalesce(array_length(v_prod.large_allowed_ice_levels, 1), 0) > 0
                then v_prod.large_allowed_ice_levels
              else coalesce(v_prod.allowed_ice_levels, array[]::text[])
            end
          ) lvl
          where lvl = any(c_ice_all)
        );
        if array_length(v_allowed_ice, 1) is not null
           and v_ice_level is not null
           and not (v_ice_level = any(v_allowed_ice)) then
          raise exception 'INVALID_ICE_LEVEL' using errcode = 'P0001', detail = v_prod.name;
        end if;
      end if;

      if v_prod.product_type = 'drink'
         and coalesce(v_prod.allow_sugar_customization, true) then
        v_allowed_sugar := array(
          select lvl
          from unnest(coalesce(v_prod.allowed_sugar_levels, array[]::text[])) lvl
          where lvl = any(c_sugar_all)
        );
        if array_length(v_allowed_sugar, 1) is not null
           and v_sugar_level is not null
           and not (v_sugar_level = any(v_allowed_sugar)) then
          raise exception 'INVALID_SUGAR_LEVEL' using errcode = 'P0001', detail = v_prod.name;
        end if;
      end if;

      -- ---- toppings: prijs UITSLUITEND uit public.toppings ----
      v_toppings_total    := 0;
      v_toppings_snapshot := '[]'::jsonb;

      for v_tid_text in
        select value
        from jsonb_array_elements_text(
          case when jsonb_typeof(v_item->'topping_ids') = 'array'
               then v_item->'topping_ids' else '[]'::jsonb end
        )
      loop
        if v_tid_text is null or v_tid_text !~ c_uuid_re then
          raise exception 'TOPPING_NOT_ALLOWED' using errcode = 'P0001';
        end if;
        v_topping_id := v_tid_text::uuid;

        select * into v_top from public.toppings where id = v_topping_id;
        if not found then
          raise exception 'TOPPING_NOT_ALLOWED' using errcode = 'P0001';
        end if;
        if v_top.is_active is not true then
          raise exception 'TOPPING_INACTIVE' using errcode = 'P0001', detail = v_top.name;
        end if;
        if v_top.is_sold_out is true then
          raise exception 'TOPPING_SOLD_OUT' using errcode = 'P0001', detail = v_top.name;
        end if;

        select exists (
          select 1
          from public.product_toppings pt
          where pt.product_id = v_product_id::uuid
            and pt.topping_id = v_topping_id
        ) into v_link_ok;
        if not v_link_ok then
          raise exception 'TOPPING_NOT_ALLOWED' using errcode = 'P0001', detail = v_top.name;
        end if;

        v_toppings_total    := v_toppings_total + coalesce(v_top.price, 0);
        v_toppings_snapshot := v_toppings_snapshot || jsonb_build_object(
          'id', v_top.id, 'name', v_top.name, 'price', v_top.price
        );
      end loop;

      -- ---- maatprijs: mirror getProductSizePrice ----
      if v_prod.product_type = 'item' then
        v_size_price := greatest(0, coalesce(v_prod.base_price, 0));
      elsif v_cup_size = 'large' and v_prod.large_price is not null then
        v_size_price := greatest(0, v_prod.large_price);
      elsif v_cup_size = 'medium' and v_prod.medium_price is not null then
        v_size_price := greatest(0, v_prod.medium_price);
      else
        v_size_price := greatest(0, coalesce(v_prod.base_price, 0));
      end if;

      -- ---- welke korting wint: mirror getProductDiscount ----
      if coalesce(v_prod.discount_type, 'none') in ('percentage','fixed')
         and greatest(0, coalesce(v_prod.discount_value, 0)) > 0 then
        v_disc_type  := v_prod.discount_type;
        v_disc_value := greatest(0, coalesce(v_prod.discount_value, 0));
      else
        select c.discount_type, c.discount_value
          into v_cat_type, v_cat_value
        from public.categories c
        where c.name = v_prod.category
        limit 1;

        if found
           and coalesce(v_cat_type, 'none') in ('percentage','fixed')
           and greatest(0, coalesce(v_cat_value, 0)) > 0 then
          v_disc_type  := v_cat_type;
          v_disc_value := greatest(0, coalesce(v_cat_value, 0));
        else
          v_disc_type  := 'none';
          v_disc_value := 0;
        end if;
      end if;

      -- ---- korting toepassen op de maatprijs: mirror getDiscountedPriceForAmount ----
      if v_disc_type = 'percentage' then
        v_discounted_size := greatest(0, v_size_price - v_size_price * least(100, v_disc_value) / 100);
      elsif v_disc_type = 'fixed' then
        v_discounted_size := greatest(0, v_size_price - v_disc_value);
      else
        v_discounted_size := v_size_price;
      end if;

      -- ---- stuk- en regelbedragen (rondingspunten exact als de frontend) ----
      -- getCartItemUnitPrice: (discounted_size + toppings), RAW
      v_unit_raw      := v_discounted_size + v_toppings_total;
      -- getCartItemOriginalUnitPrice: round(size_price + toppings, 2)
      v_orig_unit     := round((v_size_price + v_toppings_total)::numeric, 2);
      -- unit_price kolom: round(unit_raw, 2)
      v_unit_price    := round(v_unit_raw::numeric, 2);
      -- getCartItemDiscountAmount: round(max(0, orig_unit - unit_price), 2), daarna * qty
      v_disc_per_unit := round(greatest(0, v_orig_unit - v_unit_price)::numeric, 2);
      v_disc_amount   := round((v_disc_per_unit * v_qty)::numeric, 2);
      -- getCartItemLineTotal -> grossAmount: round(unit_raw * qty, 2)
      v_gross         := round((v_unit_raw * v_qty)::numeric, 2);

      -- getProductVatRate: null / negatief -> 9, anders databasewaarde
      v_vat_rate := case
                      when v_prod.vat_rate is null or v_prod.vat_rate < 0 then 9
                      else v_prod.vat_rate
                    end;
      v_vat := case
                 when v_vat_rate > 0
                   then round((v_gross * v_vat_rate / (100 + v_vat_rate))::numeric, 2)
                 else 0
               end;
      v_net := round((v_gross - v_vat)::numeric, 2);

      v_net_total   := v_net_total + v_net;
      v_vat_total   := v_vat_total + v_vat;
      v_gross_total := v_gross_total + v_gross;

      v_lines := v_lines || jsonb_build_object(
        'product_id',              v_product_id,
        'product_name',            v_prod.name,
        'product_type',            v_prod.product_type,
        'quantity',                v_qty,
        'cup_size',                v_cup_size,
        'ice_level',               v_ice_level,
        'sugar_level',             v_sugar_level,
        'toppings',                v_toppings_snapshot,
        'original_unit_price',     v_orig_unit,
        'unit_price',              v_unit_price,
        'discount_type_snapshot',  v_disc_type,
        'discount_value_snapshot', round(v_disc_value::numeric, 2),
        'discount_amount',         v_disc_amount,
        'line_total',              v_gross,
        'vat_rate',                v_vat_rate,
        'net_amount',              v_net,
        'vat_amount',              v_vat,
        'gross_amount',            v_gross
      );
    end loop;

    -- getCartTaxTotals: som van reeds afgeronde itemwaarden, dan nog eens afronden
    v_net_total    := round(v_net_total::numeric, 2);
    v_vat_total    := round(v_vat_total::numeric, 2);
    v_gross_total  := round(v_gross_total::numeric, 2);
    v_amount_cents := greatest(0, round(v_gross_total * 100))::int;

    -- -------------------------------------------------------------------------
    -- 5. CROSS-CHECK tegen het client-totaal (nooit bron van waarheid)
    -- -------------------------------------------------------------------------
    if p_expected_total is not null
       and abs(p_expected_total - v_gross_total) > 0.01 then
      raise exception 'TOTAL_MISMATCH' using errcode = 'P0001';
    end if;

    -- -------------------------------------------------------------------------
    -- 6. KASREGISTRATIE — alleen cash; mirror submitOrder
    -- -------------------------------------------------------------------------
    select coalesce(s.cash_registration_enabled, true)
      into v_cash_enabled
    from public.shop_settings s
    where s.id = 1;
    if not found then
      v_cash_enabled := true;
    end if;

    if p_payment_method = 'cash' and v_cash_enabled then
      select cs.id
        into v_cash_session_id
      from public.cash_sessions cs
      where cs.status = 'open'
      order by cs.opened_at desc
      limit 1;

      if not found then
        raise exception 'CASH_SESSION_REQUIRED' using errcode = 'P0001';
      end if;
    end if;

    -- -------------------------------------------------------------------------
    -- 7. PICKUP CODE — P100..P999
    --    Scope-keuze: botst niet met een order van de laatste 12 uur die nog
    --    niet 'completed'/'cancelled' is. Dit dekt precies de orders die het
    --    pickup-scherm en de keuken nu tonen; historische codes mogen (net als
    --    nu) hergebruikt worden en er komt GEEN globale unique constraint.
    -- -------------------------------------------------------------------------
    for v_pc_attempt in 1..40 loop
      v_pickup_code := 'P' || (100 + floor(random() * 900))::int;

      perform 1
      from public.orders o
      where o.pickup_code = v_pickup_code
        and o.created_at > v_now - interval '12 hours'
        and o.status not in ('completed','cancelled');

      exit when not found;

      if v_pc_attempt = 40 then
        raise exception 'PICKUP_CODE_UNAVAILABLE' using errcode = 'P0001';
      end if;
    end loop;

    -- -------------------------------------------------------------------------
    -- 8. ORDER — order_number houdt het bestaande zichtbare formaat
    --    ORD-YYYYMMDD-HHMMSS (Europe/Amsterdam, net als new Date() in de client).
    --    Alleen bij een botsing op orders_order_number_key komt er "-N" achter.
    -- -------------------------------------------------------------------------
    <<order_insert>>
    for v_attempt in 1..8 loop
      v_order_number :=
        'ORD-'
        || to_char((v_now at time zone 'Europe/Amsterdam'), 'YYYYMMDD-HH24MISS')
        || case when v_attempt > 1 then '-' || v_attempt::text else '' end;

      begin
        insert into public.orders (
          client_request_id, order_number, status, order_type, channel,
          subtotal, total, net_total, vat_total, gross_total,
          payment_status, payment_method, paid_at, pickup_code
        ) values (
          p_client_request_id, v_order_number, 'new', 'staff', 'pos',
          v_gross_total, v_gross_total, v_net_total, v_vat_total, v_gross_total,
          'paid', p_payment_method, v_now, v_pickup_code
        )
        returning id into v_order_id;

        exit order_insert;

      exception when unique_violation then
        get stacked diagnostics v_constraint = constraint_name;

        if v_constraint = 'orders_client_request_id_key' then
          -- concurrente identieke afrekenpoging won de race -> die order teruggeven
          select o.id into v_order_id
          from public.orders o
          where o.client_request_id = p_client_request_id;

          if not found then
            raise;
          end if;
          v_reused := true;
          exit order_insert;

        elsif v_constraint = 'orders_order_number_key' then
          if v_attempt >= 8 then
            raise exception 'ORDER_NUMBER_UNAVAILABLE' using errcode = 'P0001';
          end if;
          -- anders: volgende poging met "-N"-suffix

        else
          raise;
        end if;
      end;
    end loop;

    if v_order_id is null then
      raise exception 'ORDER_NUMBER_UNAVAILABLE' using errcode = 'P0001';
    end if;
  end if;  -- not v_reused (validatie + order-insert)

  -- ===========================================================================
  -- ORDER ITEMS / KITCHEN LABELS / PAYMENT / CASH MOVEMENT — alleen nieuwe order
  -- ===========================================================================
  if not v_reused then

    -- -------------------------------------------------------------------------
    -- 9. ORDER ITEMS + KITCHEN LABELS
    --    mirror submitOrder-payload + createKitchenLabelsForOrder.
    --    order_items.product_id is uuid  -> ::uuid.
    --    kitchen_labels.order_id / order_item_id / product_id zijn TEXT-kolommen
    --    -> ::text.
    --
    --    AANTAL: order_items heeft zowel `quantity` (waar alle bestaande app-code
    --    op leest/schrijft) als de zichtbare kolom `qty` (NOT NULL DEFAULT 1).
    --    Beide moeten de aangeleverde quantity krijgen; anders bleef `qty` op 1
    --    staan terwijl prijs + kitchen_labels wel voor het echte aantal werden
    --    berekend (live-test bug: 1 regel qty=3 -> order_items.qty=1).
    -- -------------------------------------------------------------------------
    for v_line in select * from jsonb_array_elements(v_lines)
    loop
      insert into public.order_items (
        order_id, product_id, product_name, product_name_snapshot,
        original_unit_price, unit_price, discount_type_snapshot, discount_value_snapshot,
        discount_amount, quantity, qty, line_total, vat_rate, net_amount, vat_amount, gross_amount,
        cup_size, ice_level, sugar_level, toppings
      ) values (
        v_order_id,
        (v_line->>'product_id')::uuid,
        (v_line->>'product_name'),
        (v_line->>'product_name'),
        (v_line->>'original_unit_price')::numeric,
        (v_line->>'unit_price')::numeric,
        (v_line->>'discount_type_snapshot'),
        (v_line->>'discount_value_snapshot')::numeric,
        (v_line->>'discount_amount')::numeric,
        (v_line->>'quantity')::int,          -- quantity
        (v_line->>'quantity')::int,          -- qty (zelfde aangeleverde aantal)
        (v_line->>'line_total')::numeric,
        (v_line->>'vat_rate')::numeric,
        (v_line->>'net_amount')::numeric,
        (v_line->>'vat_amount')::numeric,
        (v_line->>'gross_amount')::numeric,
        (v_line->>'cup_size'),
        (v_line->>'ice_level'),
        (v_line->>'sugar_level'),
        coalesce(v_line->'toppings', '[]'::jsonb)
      )
      returning id::text into v_order_item_id;

      -- opbouw van de return-items in cart-volgorde, met het echte order_item id
      v_result_items := v_result_items || jsonb_build_object(
        'id',                      v_order_item_id,
        'product_id',              (v_line->>'product_id'),
        'product_name',            (v_line->>'product_name'),
        'product_name_snapshot',   (v_line->>'product_name'),
        'quantity',                (v_line->>'quantity')::int,
        'cup_size',                (v_line->>'cup_size'),
        'ice_level',               (v_line->>'ice_level'),
        'sugar_level',             (v_line->>'sugar_level'),
        'toppings',                coalesce(v_line->'toppings', '[]'::jsonb),
        'original_unit_price',     (v_line->>'original_unit_price')::numeric,
        'unit_price',              (v_line->>'unit_price')::numeric,
        'discount_type_snapshot',  (v_line->>'discount_type_snapshot'),
        'discount_value_snapshot', (v_line->>'discount_value_snapshot')::numeric,
        'discount_amount',         (v_line->>'discount_amount')::numeric,
        'line_total',              (v_line->>'line_total')::numeric,
        'vat_rate',                (v_line->>'vat_rate')::numeric,
        'net_amount',              (v_line->>'net_amount')::numeric,
        'vat_amount',              (v_line->>'vat_amount')::numeric,
        'gross_amount',            (v_line->>'gross_amount')::numeric
      );

      -- één kitchen_label per individueel drankje; losse items krijgen GEEN label.
      if (v_line->>'product_type') <> 'item' then
        for v_i in 1..(v_line->>'quantity')::int loop
          insert into public.kitchen_labels (
            order_id, order_item_id, product_id, order_number, product_name,
            status, label_index, cup_size, ice_level, sugar_level, toppings,
            print_status, print_attempts, printed_at, print_error
          ) values (
            v_order_id::text,
            v_order_item_id,
            (v_line->>'product_id'),
            v_order_number,
            (v_line->>'product_name'),
            'new',
            v_i,
            (v_line->>'cup_size'),
            (v_line->>'ice_level'),
            (v_line->>'sugar_level'),
            coalesce(v_line->'toppings', '[]'::jsonb),
            'pending',
            0,
            null,
            null
          );
        end loop;
      end if;
    end loop;

    -- -------------------------------------------------------------------------
    -- 10. PAYMENT — mirror submitOrder (provider 'pos', status 'paid', centen)
    -- -------------------------------------------------------------------------
    insert into public.payments (
      order_id, provider, provider_order_id, amount, currency, status,
      payment_method, payment_url, failure_reason, paid_at
    ) values (
      v_order_id, 'pos', 'POS-' || v_order_number, v_amount_cents, 'EUR', 'paid',
      p_payment_method, null, null, v_now
    )
    returning id into v_payment_id;

    -- -------------------------------------------------------------------------
    -- 11. CASH MOVEMENT — alleen cash + kasregistratie aan (mirror submitOrder)
    -- -------------------------------------------------------------------------
    if p_payment_method = 'cash' and v_cash_enabled and v_cash_session_id is not null then
      insert into public.cash_movements (
        cash_session_id, movement_type, amount, order_id, payment_id, reason, actor
      ) values (
        v_cash_session_id, 'sale', v_amount_cents, v_order_id, v_payment_id,
        'Contante verkoop ' || v_order_number, 'staff'
      );
    end if;
  end if;  -- not v_reused (writes)

  -- ===========================================================================
  -- 12. EINDMONTAGE — leest terug uit de DB, zodat de return exact hetzelfde is
  --     voor een nieuwe order en voor een idempotent replay (reused = true).
  -- ===========================================================================
  select * into v_ord from public.orders where id = v_order_id;

  -- Bij een replay bestaan v_lines/v_result_items niet -> uit de DB opbouwen.
  --
  -- Volgorde: order_items.id is uuid, dus 'order by id' zou willekeurig zijn en
  -- NIET overeenkomen met de cart-/nieuwe-order-volgorde. Er is geen sequence-
  -- of sorteerkolom in het schema (en we voegen er geen toe). We sorteren daarom
  -- op de systeemkolom ctid: dat is de fysieke rij-volgorde en die is voor rijen
  -- die binnen één transactie zijn ingevoegd en daarna niet gewijzigd gelijk aan
  -- de invoegvolgorde = de cart-volgorde. Een replay is een retry enkele seconden
  -- later; de rijen zijn dan onaangeroerd, dus ctid-volgorde == invoegvolgorde.
  -- (Alleen een VACUUM FULL / CLUSTER / rij-verplaatsing tussen de twee calls zou
  --  dit kunnen verstoren; dat is voor dit retry-scenario niet realistisch.)
  if v_reused then
    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'id',                      oi.id,
          'product_id',              oi.product_id,
          'product_name',            oi.product_name,
          'product_name_snapshot',   oi.product_name_snapshot,
          'quantity',                coalesce(oi.qty, oi.quantity),
          'cup_size',                oi.cup_size,
          'ice_level',               oi.ice_level,
          'sugar_level',             oi.sugar_level,
          'toppings',                oi.toppings,
          'original_unit_price',     oi.original_unit_price,
          'unit_price',              oi.unit_price,
          'discount_type_snapshot',  oi.discount_type_snapshot,
          'discount_value_snapshot', oi.discount_value_snapshot,
          'discount_amount',         oi.discount_amount,
          'line_total',              oi.line_total,
          'vat_rate',                oi.vat_rate,
          'net_amount',              oi.net_amount,
          'vat_amount',              oi.vat_amount,
          'gross_amount',            oi.gross_amount
        )
        order by oi.ctid
      ),
      '[]'::jsonb
    )
    into v_result_items
    from public.order_items oi
    where oi.order_id = v_order_id;
  end if;

  select p.id into v_payment_id
  from public.payments p
  where p.order_id = v_order_id
  order by p.paid_at desc nulls last
  limit 1;

  select cm.id into v_cash_movement_id
  from public.cash_movements cm
  where cm.order_id = v_order_id
  limit 1;

  select count(*)::int into v_label_count
  from public.kitchen_labels kl
  where kl.order_id = v_order_id::text;

  return jsonb_build_object(
    'reused',              v_reused,
    'order_id',            v_ord.id,
    'order_number',        v_ord.order_number,
    'pickup_code',         v_ord.pickup_code,
    'status',              v_ord.status,
    'order_type',          v_ord.order_type,
    'channel',             v_ord.channel,
    'payment_status',      v_ord.payment_status,
    'payment_method',      v_ord.payment_method,
    'paid_at',             v_ord.paid_at,
    'created_at',          v_ord.created_at,
    'subtotal',            v_ord.subtotal,
    'total',               v_ord.total,
    'net_total',           v_ord.net_total,
    'vat_total',           v_ord.vat_total,
    'gross_total',         v_ord.gross_total,
    'amount_cents',        greatest(0, round(coalesce(v_ord.gross_total, 0) * 100))::int,
    'payment_id',          v_payment_id,
    'cash_movement_id',    v_cash_movement_id,
    'kitchen_label_count', v_label_count,
    'items',               v_result_items
  );
end;
$$;


-- =============================================================================
-- Privileges — de INTERNE role-check is de echte bescherming; deze grants
-- zorgen alleen dat anonieme requests de functie niet eens kunnen aanroepen.
-- =============================================================================
revoke all     on function public.create_pos_order(uuid, text, numeric, jsonb) from public, anon;
grant  execute on function public.create_pos_order(uuid, text, numeric, jsonb) to authenticated;

comment on function public.create_pos_order(uuid, text, numeric, jsonb) is
  'Atomaire staff/POS order (cash + card): orders + order_items + payments + '
  '(cash_movements) + kitchen_labels in EEN transactie. SECURITY DEFINER met '
  'interne admin/manager/staff role-check. Idempotent via client_request_id '
  '(reused=true). Stap 2 architectuurverbetering. Customer/QR/MultiSafepay '
  'vallen hier buiten.';
