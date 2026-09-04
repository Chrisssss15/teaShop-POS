-- =============================================================================
-- TeaShop security 011 — MultiSafepay webhook-idempotentie
--
-- VOLGORDE
--   1. Voer dit bestand uit in de Supabase SQL Editor.
--   2. Deploy daarna de bijgewerkte multisafepay-webhook Edge Function.
--
-- Dit script verwijdert of wijzigt geen bestaande labels. Als er al dubbele
-- labels bestaan stopt het bewust met een fout, zodat er niets stil wordt
-- weggegooid.
-- =============================================================================

begin;

do $$
declare
  duplicate_groups integer;
begin
  select count(*)
  into duplicate_groups
  from (
    select
      order_id,
      order_item_id,
      label_index
    from public.kitchen_labels
    where order_item_id is not null
    group by
      order_id,
      order_item_id,
      label_index
    having count(*) > 1
  ) duplicates;

  if duplicate_groups > 0 then
    raise exception
      'Er bestaan % dubbele kitchen-labelgroepen. Los deze eerst handmatig op; er is niets verwijderd.',
      duplicate_groups;
  end if;
end
$$;

-- Iedere fysieke beker van een order-item mag precies één label hebben.
-- PostgreSQL staat meerdere NULL-waarden toe; historische labels zonder
-- order_item_id worden hierdoor niet onbedoeld samengevoegd.
create unique index if not exists kitchen_labels_order_item_label_index_uidx
  on public.kitchen_labels (
    order_id,
    order_item_id,
    label_index
  );

comment on index public.kitchen_labels_order_item_label_index_uidx is
  'Voorkomt dubbele kitchen labels bij herhaalde of gelijktijdige betaalwebhooks.';

commit;

-- VERIFICATIE: beide kolommen horen TRUE te zijn.
select
  to_regclass(
    'public.kitchen_labels_order_item_label_index_uidx'
  ) is not null as unique_label_index_exists,
  not exists (
    select 1
    from public.kitchen_labels
    where order_item_id is not null
    group by
      order_id,
      order_item_id,
      label_index
    having count(*) > 1
  ) as no_duplicate_label_groups;
