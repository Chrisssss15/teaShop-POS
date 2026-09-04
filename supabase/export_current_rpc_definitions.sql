-- Alleen-lezen exporthulp. Dit script verandert niets in de database.
-- Voer het uit in de Supabase SQL Editor en exporteer het resultaat als CSV.

select
  p.oid::regprocedure::text as function_signature,
  pg_get_functiondef(p.oid) as function_definition
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in (
    'create_customer_order',
    'get_customer_order_status_v2',
    'consume_edge_rate_limit'
  )
order by p.proname, p.oid::regprocedure::text;
