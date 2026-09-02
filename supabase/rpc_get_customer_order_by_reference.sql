-- =============================================================================
-- public.get_customer_order_by_reference
--
-- Run this ONCE in the Supabase SQL editor. Idempotent / veilig te herhalen:
-- alleen `create or replace function` + revoke/grant.
--
-- WAT DIT DOET
--   Customer/QR order-recovery nadat de klant het tabblad volledig heeft
--   gesloten. De browser onthoudt dan in localStorage alleen nog het leesbare
--   order_number + de pickup_code (geen interne UUID). Deze RPC zet die twee
--   waarden — die exact moeten matchen — om naar de minimale statusdata die de
--   frontend nodig heeft om de bestaande status-flow te herstarten.
--
--   De ACTUELE status/labels komen daarna nog steeds via de bestaande
--   get_customer_order_status(p_order_id uuid) RPC; deze functie levert alleen
--   het startpunt (de order-id) plus een snapshot van status/payment_status.
--
-- WAAROM EEN RPC EN GEEN DIRECTE SELECT
--   De anonieme browser-rol heeft (terecht) GEEN SELECT-recht op public.orders.
--   Een SECURITY DEFINER functie met vaste search_path draait met de rechten
--   van de owner, geeft uitsluitend deze 5 niet-gevoelige velden terug, en
--   alleen voor een rij waar order_number én pickup_code allebei exact kloppen
--   (pickup_code = het geheim dat de klant fysiek in handen heeft). Er wordt
--   dus GEEN brede SELECT-policy/-grant op orders toegevoegd.
--
-- SCOPE (bewust beperkt)
--   * Alleen order_type = 'customer' AND channel = 'qr'.
--   * Beide parameters moeten exact matchen; anders 0 rijen.
--   * Retourneert NOOIT customer_name, customer_phone, e-mail, bedragen,
--     payment_url, sessie-id's, timestamps of andere interne metadata.
-- =============================================================================

create or replace function public.get_customer_order_by_reference(
  p_order_number text,
  p_pickup_code  text
)
returns table (
  id             uuid,
  order_number   text,
  pickup_code    text,
  status         text,
  payment_status text
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    o.id,
    o.order_number::text,
    o.pickup_code::text,
    o.status::text,
    o.payment_status::text
  from public.orders o
  where o.order_type = 'customer'
    and o.channel    = 'qr'
    and p_order_number is not null
    and p_pickup_code  is not null
    and o.order_number = p_order_number
    and o.pickup_code  = p_pickup_code
  limit 1
$$;


-- Geen PUBLIC-rechten; alleen de twee browser-rollen mogen deze recovery-RPC
-- aanroepen. (Geen enkele extra grant op public.orders zelf.)
revoke all
  on function public.get_customer_order_by_reference(text, text)
  from public;

grant execute
  on function public.get_customer_order_by_reference(text, text)
  to anon, authenticated;
